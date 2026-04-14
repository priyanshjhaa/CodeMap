import { Controller, Get, Param } from "@nestjs/common";
import { ArchitectureService } from "./architecture.service.js";

@Controller("repos/:repoId/architecture")
export class ArchitectureController {
  constructor(private readonly architectureService: ArchitectureService) {}

  @Get()
  getArchitecture(@Param("repoId") repoId: string) {
    return this.architectureService.getArchitecture(repoId);
  }
}
