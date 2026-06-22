import { Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../common/guards/auth.guard.js";
import { IngestionService } from "./ingestion.service.js";

@UseGuards(AuthGuard)
@Controller("repos/:repoId")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("sync")
  queueSync(@Param("repoId") repoId: string, @Req() request: { user: { id: string } }, @Headers("x-workspace-id") workspaceId?: string) {
    return this.ingestionService.queueSync(repoId, request.user.id, workspaceId);
  }

  @Get("sync-status")
  getSyncStatus(@Param("repoId") repoId: string, @Req() request: { user: { id: string } }, @Headers("x-workspace-id") workspaceId?: string) {
    return this.ingestionService.getSyncStatus(repoId, request.user.id, workspaceId);
  }

  @Get("overview")
  getOverview(@Param("repoId") repoId: string, @Req() request: { user: { id: string } }, @Headers("x-workspace-id") workspaceId?: string) {
    return this.ingestionService.getOverview(repoId, request.user.id, workspaceId);
  }
}
