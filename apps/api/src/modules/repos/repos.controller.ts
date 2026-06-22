import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../common/guards/auth.guard.js";
import { ReposService } from "./repos.service.js";

@UseGuards(AuthGuard)
@Controller("repos")
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  list(@Req() request: { user: { id: string } }, @Headers("x-workspace-id") workspaceId?: string) {
    return this.reposService.listRepositories(request.user.id, workspaceId);
  }

  @Post()
  connect(
    @Req() request: { user: { id: string } },
    @Headers("x-workspace-id") workspaceId: string | undefined,
    @Body() body: { providerRepoId: string; workspaceId?: string }
  ) {
    return this.reposService.connectRepository(request.user.id, body, workspaceId);
  }

  @Get(":repoId/citations/:path")
  getCitation(@Param("repoId") repoId: string, @Param("path") path: string) {
    return this.reposService.getCitation(repoId, path);
  }

  @Get(":repoId/citations")
  listCitationPreviews(
    @Param("repoId") repoId: string,
    @Req() request: { user: { id: string } },
    @Headers("x-workspace-id") workspaceId?: string
  ) {
    return this.reposService.listCitationPreviews(request.user.id, repoId, workspaceId);
  }
}
