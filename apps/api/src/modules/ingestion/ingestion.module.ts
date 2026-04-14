import { Module } from "@nestjs/common";
import { IngestionService } from "./ingestion.service.js";
import { IngestionController } from "./ingestion.controller.js";
import { ParserModule } from "../parser/parser.module.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";
import { SyncModule } from "../sync/sync.module.js";
import { ArchitectureModule } from "../architecture/architecture.module.js";

@Module({
  imports: [ParserModule, EmbeddingsModule, SyncModule, ArchitectureModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService]
})
export class IngestionModule {}
