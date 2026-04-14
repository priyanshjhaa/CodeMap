import { Injectable } from "@nestjs/common";
import type { RepositoryDetail, RepositorySummary } from "@codemap/shared";
import { ArchitectureService } from "../architecture/architecture.service.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { ParserService } from "../parser/parser.service.js";
import { SyncService } from "../sync/sync.service.js";

@Injectable()
export class IngestionService {
  constructor(
    private readonly parserService: ParserService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly syncService: SyncService,
    private readonly architectureService: ArchitectureService
  ) {}

  async queueSync(repoId: string) {
    const sync = this.syncService.queueSync();
    const analysis = await this.parserService.analyzeRepository();
    const embeddings = await this.embeddingsService.createEmbeddings(analysis.chunksCreated);

    return {
      repoId,
      sync,
      analysis,
      embeddings,
      nextStep: "poll /api/repos/:id/sync-status until status becomes ready"
    };
  }

  getSyncStatus(repoId: string) {
    return {
      repositoryId: repoId,
      status: "ready",
      syncHistory: this.syncService.listSyncs()
    };
  }

  getOverview(repoId: string): RepositoryDetail {
    const repository: RepositorySummary = {
      id: repoId,
      name: "payments-platform",
      owner: "acme",
      defaultBranch: "main",
      visibility: "private",
      syncStatus: "ready",
      lastIndexedAt: "2026-04-12T10:02:10.000Z",
      description:
        "A TypeScript service platform that handles auth, billing, orchestration, and reporting.",
      starterQuestions: [
        "Where is authentication implemented?",
        "How does the billing flow work?",
        "What are the main modules in this repository?"
      ]
    };

    return {
      ...repository,
      architecture: this.architectureService.getArchitecture(repoId),
      syncHistory: this.syncService.listSyncs()
    };
  }
}
