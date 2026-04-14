import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { GithubModule } from "../github/github.module.js";

@Module({
  imports: [GithubModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
