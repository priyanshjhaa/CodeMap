import { Injectable, Logger } from "@nestjs/common";
import type { Prisma, RepositorySync } from "@prisma/client";
import type { RepositoryDetail, RepositorySummary, SyncStatus } from "@codemap/shared";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { ArchitectureService } from "../architecture/architecture.service.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { GithubService } from "../github/github.service.js";
import { ParserService, type ParsedFile, type RepositorySourceFile } from "../parser/parser.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";
import { env } from "../../config/env.js";

const MAX_ELIGIBLE_FILES = 2_000;
const MAX_TOTAL_TEXT_BYTES = 25 * 1024 * 1024;
const MAX_FILE_BYTES = 1024 * 1024;

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "__generated__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "tmp",
  "vendor"
]);

const IGNORED_FILES = new Set([
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
]);

const LANGUAGE_BY_EXTENSION = new Map<string, string>([
  [".ts", "typescript"],
  [".tsx", "tsx"],
  [".js", "javascript"],
  [".jsx", "jsx"],
  [".mjs", "mjs"],
  [".cjs", "cjs"],
  [".md", "markdown"],
  [".mdx", "mdx"],
  [".json", "json"],
  [".yml", "yaml"],
  [".yaml", "yaml"],
  [".toml", "toml"],
  [".prisma", "prisma"]
]);

type SyncSummary = {
  filesIndexed?: number;
  chunksCreated?: number;
  symbolsExtracted?: number;
  languages?: string[];
  filesSkipped?: number;
  parseFailures?: number;
  currentStep?: string;
  percentComplete?: number;
  error?: string;
};

function normalizePath(path: string) {
  return path.split(sep).join("/");
}

function extensionForPath(path: string) {
  if (path.endsWith(".env.example")) return ".env.example";
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function languageForPath(path: string) {
  if (path.endsWith(".env.example")) return "dotenv";
  return LANGUAGE_BY_EXTENSION.get(extensionForPath(path)) ?? null;
}

function checksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function syncSteps(status: string) {
  if (status === "ready") {
    return ["GitHub archive fetched", "Files filtered", "Symbols parsed", "Chunks stored", "Repository ready"];
  }

  if (status === "failed") {
    return ["GitHub archive fetched", "Files filtered", "Sync failed before completion"];
  }

  if (status === "indexing") {
    return ["GitHub archive fetch", "File filtering", "Symbol parsing", "Chunk persistence"];
  }

  return ["Queued", "Waiting to fetch GitHub archive", "Indexing not started"];
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly architectureService: ArchitectureService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly githubService: GithubService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async queueSync(repoId: string, userId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repoId, workspaceId);
    const syncRecord = await this.prisma.repositorySync.create({
      data: {
        repositoryId: repository.id,
        status: "queued",
        summary: toJson({
          currentStep: "Repository sync is queued.",
          percentComplete: 5
        } satisfies SyncSummary)
      }
    });

    void this.runSyncTask(syncRecord.id, userId).catch((error) => {
      this.logger.error(`Unhandled sync failure for ${syncRecord.id}`, error instanceof Error ? error.stack : String(error));
    });

    return this.toProgress(syncRecord);
  }

  private async runSyncTask(syncId: string, userId: string) {
    const syncRecord = await this.prisma.repositorySync.findUnique({
      where: { id: syncId },
      include: { repository: true }
    });

    if (!syncRecord) return;

    const repository = syncRecord.repository;
    const syncPath = join(env.repoStoragePath, repository.id, syncId);

    try {
      await this.updateSync(syncId, "indexing", {
        currentStep: "Preparing repository archive download.",
        percentComplete: 15
      });

      await rm(syncPath, { recursive: true, force: true });
      await mkdir(syncPath, { recursive: true });
      await this.githubService.downloadRepositoryArchive({
        userId,
        owner: repository.owner,
        name: repository.name,
        defaultBranch: repository.defaultBranch,
        destinationPath: syncPath
      });

      await this.updateSync(syncId, "indexing", {
        currentStep: "Filtering repository files.",
        percentComplete: 35
      });

      const sourceFiles = await this.collectEligibleFiles(syncPath);

      await this.updateSync(syncId, "indexing", {
        currentStep: `Parsing ${sourceFiles.length} eligible files.`,
        percentComplete: 60
      });

      const parsedFiles = this.parserService.parseFiles(sourceFiles);
      const summary = this.buildSuccessSummary(parsedFiles);

      await this.updateSync(syncId, "indexing", {
        ...summary,
        currentStep: "Creating embeddings for indexed chunks.",
        percentComplete: 85
      });

      const chunkEmbeddings = await this.embedParsedChunks(parsedFiles);

      await this.updateSync(syncId, "indexing", {
        ...summary,
        currentStep: "Persisting indexed files, chunks, and embeddings.",
        percentComplete: 92
      });

      await this.persistParsedFiles(repository.id, parsedFiles, chunkEmbeddings);

      await this.prisma.repository.update({
        where: { id: repository.id },
        data: { lastIndexedAt: new Date() }
      });

      await this.prisma.repositorySync.update({
        where: { id: syncId },
        data: {
          status: "ready",
          completedAt: new Date(),
          summary: toJson({
            ...summary,
            currentStep: "Repository is indexed and ready.",
            percentComplete: 100
          })
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Repository sync failed.";
      await this.prisma.repositorySync.update({
        where: { id: syncId },
        data: {
          status: "failed",
          completedAt: new Date(),
          summary: toJson({
            currentStep: message,
            percentComplete: 100,
            error: message
          } satisfies SyncSummary)
        }
      });
    } finally {
      await rm(syncPath, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  async getSyncStatus(repoId: string, userId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repoId, workspaceId);
    const latestSync = await this.prisma.repositorySync.findFirst({
      where: { repositoryId: repository.id },
      orderBy: { startedAt: "desc" }
    });

    if (!latestSync) {
      return {
        repositoryId: repository.id,
        state: "empty",
        stageLabel: "Ready to index",
        percentComplete: 0,
        currentStep: "Start a sync to prepare repository context.",
        steps: ["GitHub connected", "Repository linked", "Indexing not started"]
      };
    }

    return this.toProgress(latestSync);
  }

  async getOverview(repoId: string, userId: string, workspaceId?: string): Promise<RepositoryDetail> {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repoId, workspaceId);
    const syncs = await this.prisma.repositorySync.findMany({
      where: { repositoryId: repository.id },
      orderBy: { startedAt: "desc" },
      take: 10
    });
    const latestSync = syncs[0];
    const summary: RepositorySummary = {
      id: repository.id,
      name: repository.name,
      owner: repository.owner,
      defaultBranch: repository.defaultBranch,
      visibility: repository.visibility as "public" | "private",
      syncStatus: this.toSyncStatus(latestSync?.status),
      lastIndexedAt: repository.lastIndexedAt?.toISOString(),
      description: `${repository.owner}/${repository.name} connected through GitHub.`,
      starterQuestions: [
        `Where should a new engineer start in ${repository.name}?`,
        `What are the core modules in ${repository.name}?`,
        "What should I review before making a change?"
      ]
    };

    return {
      ...summary,
      architecture: this.architectureService.getArchitecture(repository.id, repository.name),
      syncHistory: syncs.map((sync) => {
        const syncSummary = this.readSummary(sync);
        return {
          id: sync.id,
          status: sync.status as SyncStatus,
          startedAt: sync.startedAt.toISOString(),
          completedAt: sync.completedAt?.toISOString(),
          commitSha: sync.commitSha ?? undefined,
          summary: {
            filesIndexed: syncSummary.filesIndexed ?? 0,
            chunksCreated: syncSummary.chunksCreated ?? 0,
            languages: syncSummary.languages ?? [],
            error: syncSummary.error
          }
        };
      })
    };
  }

  private async collectEligibleFiles(rootPath: string): Promise<RepositorySourceFile[]> {
    const sourceFiles: RepositorySourceFile[] = [];
    let totalBytes = 0;
    let skipped = 0;

    const visit = async (directory: string) => {
      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!IGNORED_DIRECTORIES.has(entry.name)) {
            await visit(join(directory, entry.name));
          }
          continue;
        }

        if (!entry.isFile() || IGNORED_FILES.has(entry.name)) {
          skipped += 1;
          continue;
        }

        const absolutePath = join(directory, entry.name);
        const relativePath = normalizePath(relative(rootPath, absolutePath));
        const language = languageForPath(relativePath);
        if (!language) {
          skipped += 1;
          continue;
        }

        const contentBuffer = await readFile(absolutePath);
        if (contentBuffer.byteLength > MAX_FILE_BYTES) {
          skipped += 1;
          continue;
        }

        if (sourceFiles.length + 1 > MAX_ELIGIBLE_FILES) {
          throw new Error(`Repository exceeds the MVP limit of ${MAX_ELIGIBLE_FILES} eligible files.`);
        }

        if (totalBytes + contentBuffer.byteLength > MAX_TOTAL_TEXT_BYTES) {
          throw new Error("Repository exceeds the MVP limit of 25 MB eligible text.");
        }

        const content = contentBuffer.toString("utf8");
        totalBytes += contentBuffer.byteLength;
        sourceFiles.push({
          path: relativePath,
          language,
          content,
          checksum: checksum(content),
          sizeBytes: contentBuffer.byteLength
        });
      }
    };

    await visit(rootPath);

    if (!sourceFiles.length) {
      throw new Error(`No eligible source files found. Skipped ${skipped} ignored or unsupported files.`);
    }

    return sourceFiles;
  }

  private async persistParsedFiles(
    repositoryId: string,
    parsedFiles: ParsedFile[],
    chunkEmbeddings: Map<string, number[]>
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.codeChunk.deleteMany({ where: { repositoryId } });
      await tx.codeFile.deleteMany({ where: { repositoryId } });

      for (const file of parsedFiles) {
        const createdFile = await tx.codeFile.create({
          data: {
            repositoryId,
            path: file.path,
            language: file.language,
            checksum: file.checksum,
            sizeBytes: file.sizeBytes,
            symbols: {
              create: file.symbols.map((symbol) => ({
                name: symbol.name,
                kind: symbol.kind,
                lineStart: symbol.lineStart,
                lineEnd: symbol.lineEnd,
                exported: symbol.exported,
                metadata: toJson(symbol.metadata)
              }))
            }
          },
          select: { id: true }
        });

        if (file.chunks.length) {
          const chunksWithIds = file.chunks.map((chunk) => ({
            ...chunk,
            id: randomUUID()
          }));

          await tx.codeChunk.createMany({
            data: chunksWithIds.map((chunk) => ({
              id: chunk.id,
              repositoryId,
              fileId: createdFile.id,
              chunkIndex: chunk.chunkIndex,
              content: chunk.content,
              summary: chunk.summary,
              language: chunk.language,
              tokenCount: chunk.tokenCount,
              metadata: toJson(chunk.metadata)
            }))
          });

          for (const chunk of chunksWithIds) {
            const embedding = chunkEmbeddings.get(this.chunkEmbeddingKey(file.path, chunk.chunkIndex));
            if (!embedding) continue;

            await tx.$executeRawUnsafe(
              `UPDATE "CodeChunk" SET embedding = $1::vector WHERE id = $2`,
              `[${embedding.join(",")}]`,
              chunk.id
            );
          }
        }
      }
    });
  }

  private async embedParsedChunks(parsedFiles: ParsedFile[]) {
    const chunkInputs: { key: string; content: string }[] = [];

    for (const file of parsedFiles) {
      for (const chunk of file.chunks) {
        chunkInputs.push({
          key: this.chunkEmbeddingKey(file.path, chunk.chunkIndex),
          content: [
            `File: ${file.path}`,
            `Language: ${file.language}`,
            `Metadata: ${JSON.stringify(chunk.metadata)}`,
            chunk.content
          ].join("\n")
        });
      }
    }

    const embeddings = await this.embeddingsService.embedTexts(chunkInputs.map((chunk) => chunk.content));
    return new Map<string, number[]>(
      chunkInputs.map((chunk, index) => [chunk.key, embeddings[index]])
    );
  }

  private chunkEmbeddingKey(filePath: string, chunkIndex: number) {
    return `${filePath}:${chunkIndex}`;
  }

  private buildSuccessSummary(parsedFiles: ParsedFile[]): SyncSummary {
    const languages = Array.from(new Set(parsedFiles.map((file) => file.language))).sort();
    return {
      filesIndexed: parsedFiles.length,
      chunksCreated: parsedFiles.reduce((count, file) => count + file.chunks.length, 0),
      symbolsExtracted: parsedFiles.reduce((count, file) => count + file.symbols.length, 0),
      languages,
      parseFailures: 0
    };
  }

  private async updateSync(syncId: string, status: string, summary: SyncSummary) {
    await this.prisma.repositorySync.update({
      where: { id: syncId },
      data: {
        status,
        summary: toJson(summary)
      }
    });
  }

  private toProgress(sync: RepositorySync) {
    const summary = this.readSummary(sync);
    const state = this.toFrontendState(sync.status);
    return {
      repositoryId: sync.repositoryId,
      state,
      stageLabel: this.stageLabel(sync.status),
      percentComplete: summary.percentComplete ?? this.defaultPercent(sync.status),
      currentStep: summary.currentStep ?? this.defaultStep(sync.status),
      steps: syncSteps(sync.status)
    };
  }

  private readSummary(sync: RepositorySync): SyncSummary {
    if (!sync.summary || typeof sync.summary !== "object" || Array.isArray(sync.summary)) {
      return {};
    }

    return sync.summary as SyncSummary;
  }

  private toFrontendState(status?: string) {
    if (status === "ready") return "ready";
    if (status === "failed") return "failed";
    if (status === "queued") return "queued";
    if (status === "indexing") return "indexing";
    return "empty";
  }

  private toSyncStatus(status?: string): SyncStatus {
    if (status === "ready" || status === "failed" || status === "queued" || status === "indexing") {
      return status;
    }

    return "idle";
  }

  private stageLabel(status: string) {
    if (status === "ready") return "Repository ready";
    if (status === "failed") return "Sync failed";
    if (status === "indexing") return "Indexing repository";
    if (status === "queued") return "Sync queued";
    return "Ready to index";
  }

  private defaultStep(status: string) {
    if (status === "ready") return "Repository is indexed and ready.";
    if (status === "failed") return "Repository sync failed.";
    if (status === "indexing") return "Repository indexing is in progress.";
    if (status === "queued") return "Repository sync is queued.";
    return "Start a sync to prepare repository context.";
  }

  private defaultPercent(status: string) {
    if (status === "ready" || status === "failed") return 100;
    if (status === "indexing") return 50;
    if (status === "queued") return 5;
    return 0;
  }
}
