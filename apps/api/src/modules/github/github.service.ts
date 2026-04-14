import { Injectable } from "@nestjs/common";

@Injectable()
export class GithubService {
  buildOAuthUrl() {
    return {
      provider: "github",
      url: "https://github.com/login/oauth/authorize?client_id=replace-me&scope=repo,read:org"
    };
  }

  async listRepositories() {
    return [
      {
        providerRepoId: "repo_1",
        owner: "acme",
        name: "payments-platform",
        visibility: "private",
        defaultBranch: "main",
        description: "Internal payment orchestration monolith"
      }
    ];
  }
}
