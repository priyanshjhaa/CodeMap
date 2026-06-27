import { Module } from "@nestjs/common";
import { RetrievalService } from "./retrieval.service.js";
import { EmbeddingsModule } from "../embeddings/embeddings.module.js";

@Module({
  imports: [EmbeddingsModule],
  providers: [RetrievalService],
  exports: [RetrievalService]
})
export class RetrievalModule {}
