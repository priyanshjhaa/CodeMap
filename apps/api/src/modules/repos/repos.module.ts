import { Module } from "@nestjs/common";
import { ReposController } from "./repos.controller.js";
import { ReposService } from "./repos.service.js";
import { GithubModule } from "../github/github.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({
  imports: [GithubModule, WorkspacesModule, AuditModule],
  controllers: [ReposController],
  providers: [ReposService]
})
export class ReposModule {}
