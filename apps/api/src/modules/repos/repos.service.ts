import { Injectable } from "@nestjs/common";
import { GithubService } from "../github/github.service.js";

@Injectable()
export class ReposService {
  constructor(private readonly githubService: GithubService) {}

  async listRepositories() {
    return this.githubService.listRepositories();
  }

  getCitation(repoId: string, path: string) {
    return {
      repositoryId: repoId,
      filePath: path,
      excerpts: [
        {
          symbol: "AuthService",
          lineStart: 12,
          lineEnd: 28,
          snippet:
            "class AuthService { async login(credentials) { return this.tokenFactory.issue(credentials); } }"
        }
      ]
    };
  }
}
