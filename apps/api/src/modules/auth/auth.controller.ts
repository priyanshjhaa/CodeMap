import { Controller, Get } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

@Controller("auth/github")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("connect")
  connect() {
    return this.authService.getGithubConnection();
  }
}
