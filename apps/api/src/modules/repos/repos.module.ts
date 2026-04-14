import { Module } from "@nestjs/common";
import { ReposController } from "./repos.controller.js";
import { ReposService } from "./repos.service.js";
import { GithubModule } from "../github/github.module.js";
import { IngestionModule } from "../ingestion/ingestion.module.js";

@Module({
  imports: [GithubModule, IngestionModule],
  controllers: [ReposController],
  providers: [ReposService]
})
export class ReposModule {}
