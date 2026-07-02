import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ReposModule } from "../repos/repos.module.js";
import { ChatModule } from "../chat/chat.module.js";
import { ArchitectureModule } from "../architecture/architecture.module.js";
import { IngestionModule } from "../ingestion/ingestion.module.js";
import { GithubModule } from "../github/github.module.js";
import { RetrievalModule } from "../retrieval/retrieval.module.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";
import { ParserModule } from "../parser/parser.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { EncryptionModule } from "../encryption/encryption.module.js";
import { HealthModule } from "../health/health.module.js";
import { WebhooksModule } from "../webhooks/webhooks.module.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({
  imports: [
    EncryptionModule,
    AuditModule,
    HealthModule,
    DatabaseModule,
    WorkspacesModule,
    GithubModule,
    ParserModule,
    EmbeddingsModule,
    RetrievalModule,
    IngestionModule,
    WebhooksModule,
    ArchitectureModule,
    ChatModule,
    AuthModule,
    ReposModule
  ]
})
export class AppModule {}
