import { Controller, Get, Param } from "@nestjs/common";
import { ReposService } from "./repos.service.js";

@Controller("repos")
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  list() {
    return this.reposService.listRepositories();
  }

  @Get(":repoId/citations/:path")
  getCitation(@Param("repoId") repoId: string, @Param("path") path: string) {
    return this.reposService.getCitation(repoId, path);
  }
}
