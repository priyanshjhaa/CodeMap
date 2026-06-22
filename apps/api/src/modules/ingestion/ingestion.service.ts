import { Injectable } from "@nestjs/common";
import type { RepositoryDetail, RepositorySummary } from "@codemap/shared";
import { ArchitectureService } from "../architecture/architecture.service.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { ParserService } from "../parser/parser.service.js";
import { SyncService } from "../sync/sync.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";

@Injectable()
export class IngestionService {
  constructor(
    private readonly parserService: ParserService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly syncService: SyncService,
    private readonly architectureService: ArchitectureService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async queueSync(repoId: string, userId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repoId, workspaceId);
    const syncRecord = await this.prisma.repositorySync.create({
      data: { repositoryId: repository.id, status: "queued" }
    });
    const sync = this.syncService.queueSync();
    const analysis = await this.parserService.analyzeRepository();
    const embeddings = await this.embeddingsService.createEmbeddings(analysis.chunksCreated);

    return {
      repoId: repository.id,
      syncId: syncRecord.id,
      sync,
      analysis,
      embeddings,
      nextStep: "poll /api/repos/:id/sync-status until status becomes ready"
    };
  }

  async getSyncStatus(repoId: string, userId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repoId, workspaceId);
    const latestSync = await this.prisma.repositorySync.findFirst({
      where: { repositoryId: repository.id },
      orderBy: { startedAt: "desc" }
    });
    return {
      repositoryId: repository.id,
      state: latestSync?.status === "ready" ? "ready" : latestSync?.status === "failed" ? "failed" : latestSync ? "indexing" : "empty",
      stageLabel: latestSync?.status === "ready" ? "Repository ready" : latestSync ? "Sync queued" : "Ready to index",
      percentComplete: latestSync?.status === "ready" ? 100 : 0,
      currentStep: latestSync ? "Repository sync has been queued for processing." : "Start a sync to prepare repository context.",
      steps: ["GitHub connected", "Repository linked", latestSync ? "Sync queued" : "Indexing not started"]
    };
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
      syncStatus: latestSync?.status === "ready" ? "ready" : latestSync?.status === "failed" ? "failed" : latestSync ? "indexing" : "idle",
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
      syncHistory: syncs.map((sync) => ({
        id: sync.id,
        status: sync.status as "idle" | "queued" | "indexing" | "ready" | "failed",
        startedAt: sync.startedAt.toISOString(),
        completedAt: sync.completedAt?.toISOString(),
        commitSha: sync.commitSha ?? undefined,
        summary: sync.summary as { filesIndexed: number; chunksCreated: number; languages: string[] } | undefined
      }))
    };
  }
}
