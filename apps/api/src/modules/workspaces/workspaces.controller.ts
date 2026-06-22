import { Body, Controller, Get, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../common/guards/auth.guard.js";
import { WorkspacesService } from "./workspaces.service.js";

@UseGuards(AuthGuard)
@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get("current")
  async current(@Req() request: { user: { id: string } }, @Headers("x-workspace-id") workspaceId?: string) {
    const workspace = await this.workspacesService.getCurrentWorkspace(request.user.id, workspaceId);
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      teamSize: workspace.teamSize,
      goal: workspace.goal,
      activeRepositoryId: workspace.repositories[0]?.id ?? ""
    };
  }

  @Post()
  create(
    @Req() request: { user: { id: string } },
    @Body() body: { name: string; teamSize?: number; goal?: string }
  ) {
    return this.workspacesService.createWorkspace(request.user.id, body);
  }
}
