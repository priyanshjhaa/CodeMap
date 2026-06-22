import { Module } from "@nestjs/common";
import { ArchitectureController } from "./architecture.controller.js";
import { ArchitectureService } from "./architecture.service.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";

@Module({
  imports: [WorkspacesModule],
  controllers: [ArchitectureController],
  providers: [ArchitectureService],
  exports: [ArchitectureService]
})
export class ArchitectureModule {}
