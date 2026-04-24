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
import { SyncModule } from "../sync/sync.module.js";
import { EncryptionModule } from "../encryption/encryption.module.js";

@Module({
  imports: [
    EncryptionModule,
    DatabaseModule,
    WorkspacesModule,
    GithubModule,
    ParserModule,
    EmbeddingsModule,
    RetrievalModule,
    IngestionModule,
    SyncModule,
    ArchitectureModule,
    ChatModule,
    AuthModule,
    ReposModule
  ]
})
export class AppModule {}
