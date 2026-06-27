import { Module } from "@nestjs/common";
import { IngestionService } from "./ingestion.service.js";
import { IngestionController } from "./ingestion.controller.js";
import { ParserModule } from "../parser/parser.module.js";
import { ArchitectureModule } from "../architecture/architecture.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { GithubModule } from "../github/github.module.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";

@Module({
  imports: [ParserModule, ArchitectureModule, WorkspacesModule, GithubModule, EmbeddingsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService]
})
export class IngestionModule {}
