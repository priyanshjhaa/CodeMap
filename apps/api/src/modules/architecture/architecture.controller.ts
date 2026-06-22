import { Controller, Get, Headers, Param, Req, UseGuards } from "@nestjs/common";
import { ArchitectureService } from "./architecture.service.js";
import { AuthGuard } from "../../common/guards/auth.guard.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";

@UseGuards(AuthGuard)
@Controller("repos/:repoId/architecture")
export class ArchitectureController {
  constructor(
    private readonly architectureService: ArchitectureService,
    private readonly workspacesService: WorkspacesService
  ) {}

  @Get()
  async getArchitecture(
    @Param("repoId") repoId: string,
    @Req() request: { user: { id: string } },
    @Headers("x-workspace-id") workspaceId?: string
  ) {
    const repository = await this.workspacesService.assertRepositoryAccess(request.user.id, repoId, workspaceId);
    return this.architectureService.getArchitecture(repository.id, repository.name);
  }
}
