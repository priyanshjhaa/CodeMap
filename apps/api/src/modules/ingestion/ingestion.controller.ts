import { Controller, Get, Param, Post } from "@nestjs/common";
import { IngestionService } from "./ingestion.service.js";

@Controller("repos/:repoId")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("sync")
  queueSync(@Param("repoId") repoId: string) {
    return this.ingestionService.queueSync(repoId);
  }

  @Get("sync-status")
  getSyncStatus(@Param("repoId") repoId: string) {
    return this.ingestionService.getSyncStatus(repoId);
  }

  @Get("overview")
  getOverview(@Param("repoId") repoId: string) {
    return this.ingestionService.getOverview(repoId);
  }
}
