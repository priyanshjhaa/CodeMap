import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { GithubModule } from "../github/github.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({
  imports: [GithubModule, WorkspacesModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
