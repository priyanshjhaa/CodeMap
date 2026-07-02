import { BadRequestException, Injectable } from "@nestjs/common";
import type { CitationPreview, FrontendRepoState } from "@codemap/shared";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { GithubService } from "../github/github.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";
import { env } from "../../config/env.js";

type ConnectRepositoryInput = { providerRepoId: string; workspaceId?: string };

type ChunkMetadata = {
  filePath?: string;
  symbol?: string;
  lineStart?: number;
  lineEnd?: number;
  chunkType?: string;
};

@Injectable()
export class ReposService {
  constructor(
    private readonly githubService: GithubService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async listRepositories(userId: string, workspaceId?: string) {
    const currentWorkspace = await this.workspacesService.getCurrentWorkspace(userId, workspaceId);
    const connected = await this.prisma.repository.findMany({
      where: { workspaceId: currentWorkspace.id },
      select: {
        providerRepoId: true,
        id: true,
        owner: true,
        name: true,
        visibility: true,
        defaultBranch: true,
        updatedAt: true,
        lastIndexedAt: true,
        _count: { select: { files: true } },
        syncs: { orderBy: { startedAt: "desc" }, take: 1 }
      }
    });
    const connectedByProviderId = new Map(connected.map((repository) => [repository.providerRepoId, repository]));

    let githubRepositories;
    try {
      githubRepositories = await this.githubService.listRepositories(userId);
    } catch {
      return connected.map((repository) => ({
        id: repository.id,
        providerRepoId: repository.providerRepoId,
        owner: repository.owner,
        name: repository.name,
        description: "GitHub access needs to be reconnected before CodeMap can refresh repository metadata.",
        visibility: repository.visibility === "public" ? "public" : "private",
        defaultBranch: repository.defaultBranch,
        language: "Unknown",
        lastActivity: repository.updatedAt.toISOString(),
        fileCount: repository._count.files,
        health: "access_revoked" as const
      }));
    }

    return githubRepositories.map((repository) => {
      const existing = connectedByProviderId.get(String(repository.id));
      const latestSync = existing?.syncs[0];
      return {
        id: existing?.id ?? String(repository.id),
        providerRepoId: String(repository.id),
        owner: repository.owner.login,
        name: repository.name,
        description: repository.description ?? "No description provided.",
        visibility: repository.private ? "private" : "public",
        defaultBranch: repository.default_branch || "main",
        language: repository.language ?? "Unknown",
        lastActivity: repository.pushed_at ?? repository.updated_at,
        fileCount: existing?._count.files ?? 0,
        health: this.toRepositoryHealth(existing ? latestSync?.status : undefined)
      };
    }).sort((left, right) => {
      const leftConnected = left.id !== left.providerRepoId;
      const rightConnected = right.id !== right.providerRepoId;
      if (leftConnected !== rightConnected) return leftConnected ? -1 : 1;
      if (left.health === "ready" && right.health !== "ready") return -1;
      if (right.health === "ready" && left.health !== "ready") return 1;
      return 0;
    });
  }

  async connectRepository(userId: string, input: ConnectRepositoryInput, requestedWorkspaceId?: string) {
    const workspace = await this.workspacesService.getCurrentWorkspace(userId, input.workspaceId ?? requestedWorkspaceId);
    const [connection, repositories] = await Promise.all([
      this.prisma.repositoryConnection.findUnique({ where: { userId_provider: { userId, provider: "github" } } }),
      this.githubService.listRepositories(userId)
    ]);

    if (!connection) {
      throw new BadRequestException("GitHub connection not found");
    }

    const source = repositories.find((repository) => String(repository.id) === input.providerRepoId);
    if (!source) {
      throw new BadRequestException("Repository is not available to this GitHub account");
    }

    return this.prisma.repository.upsert({
      where: { providerRepoId: String(source.id) },
      update: {
        name: source.name,
        owner: source.owner.login,
        defaultBranch: source.default_branch || "main",
        visibility: source.private ? "private" : "public",
        workspaceId: workspace.id,
        connectionId: connection.id
      },
      create: {
        name: source.name,
        owner: source.owner.login,
        defaultBranch: source.default_branch || "main",
        visibility: source.private ? "private" : "public",
        providerRepoId: String(source.id),
        workspaceId: workspace.id,
        connectionId: connection.id
      }
    });
  }

  async getCitation(userId: string, repoId: string, path: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repoId, workspaceId);
    const filePath = decodeURIComponent(path);
    const file = await this.prisma.codeFile.findUnique({
      where: { repositoryId_path: { repositoryId: repository.id, path: filePath } },
      include: {
        chunks: { orderBy: { chunkIndex: "asc" }, take: 6 }
      }
    });

    if (!file) {
      return {
        repositoryId: repoId,
        filePath,
        excerpts: []
      };
    }

    return {
      repositoryId: repoId,
      filePath: file.path,
      excerpts: file.chunks.map((chunk) => {
        const metadata = this.normalizeMetadata(chunk.metadata);
        return {
          symbol: metadata.symbol,
          lineStart: metadata.lineStart,
          lineEnd: metadata.lineEnd,
          snippet: chunk.content.slice(0, 1_200)
        };
      })
    };
  }

  async listCitationPreviews(userId: string, repositoryId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repositoryId, workspaceId);
    const chunks = await this.prisma.codeChunk.findMany({
      where: {
        repositoryId: repository.id,
        fileId: { not: null }
      },
      include: { file: true },
      orderBy: [{ file: { path: "asc" } }, { chunkIndex: "asc" }],
      take: 12
    });

    if (!chunks.length) {
      return [
        {
          filePath: "README.md",
          reason: `Repository ${repository.name} has not been indexed yet. Run a sync to generate source-backed citations.`,
          excerpt: "Source excerpts will appear after the first completed repository sync.",
          lineStart: 1,
          lineEnd: 1
        }
      ] satisfies CitationPreview[];
    }

    const seen = new Set<string>();
    const previews: CitationPreview[] = [];

    for (const chunk of chunks) {
      const metadata = this.normalizeMetadata(chunk.metadata);
      const filePath = metadata.filePath ?? chunk.file?.path ?? "Unknown file";
      const key = `${filePath}:${metadata.symbol ?? chunk.chunkIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);

      previews.push({
        filePath,
        symbol: metadata.symbol,
        lineStart: metadata.lineStart,
        lineEnd: metadata.lineEnd,
        reason: chunk.summary ?? `${metadata.chunkType ?? "Indexed"} context from ${filePath}.`,
        excerpt: chunk.content.slice(0, 1_000)
      });
    }

    return previews;
  }

  async deleteRepository(userId: string, repositoryId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repositoryId, workspaceId);
    await this.prisma.repository.delete({ where: { id: repository.id } });
    await rm(join(env.repoStoragePath, repository.id), { recursive: true, force: true }).catch(() => undefined);

    return {
      id: repository.id,
      deleted: true
    };
  }

  private toRepositoryHealth(status?: string): FrontendRepoState {
    if (status === "ready") return "ready";
    if (status === "queued") return "queued";
    if (status === "indexing") return "indexing";
    if (status === "failed") return "failed";
    return "empty";
  }

  private normalizeMetadata(metadata: unknown): ChunkMetadata {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return {};
    }

    return metadata as ChunkMetadata;
  }
}
