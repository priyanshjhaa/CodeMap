import { Injectable } from "@nestjs/common";
import { GithubService } from "../github/github.service.js";

@Injectable()
export class AuthService {
  constructor(private readonly githubService: GithubService) {}

  getGithubConnection() {
    return {
      mode: "oauth",
      ...this.githubService.buildOAuthUrl(),
      scopes: ["repo", "read:org"],
      securityNotes: [
        "Encrypt tokens at rest before persisting repository connections.",
        "Bind repository access to the current workspace and user membership."
      ]
    };
  }
}
