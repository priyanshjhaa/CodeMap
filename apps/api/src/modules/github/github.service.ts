import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { EncryptionService } from "../encryption/encryption.service.js";
import { env } from "../../config/env.js";

export type GithubRepository = {
  id: number;
  name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  updated_at: string;
  pushed_at: string | null;
};

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService
  ) {}

  buildOAuthUrl() {
    return {
      provider: "github",
      url: `https://github.com/login/oauth/authorize?client_id=${env.githubClientId}&scope=repo,read:org`
    };
  }

  async listRepositories(userId: string): Promise<GithubRepository[]> {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: { userId_provider: { userId, provider: "github" } }
    });

    if (!connection) {
      throw new UnauthorizedException("GitHub connection not found");
    }

    const accessToken = this.encryption.decrypt(connection.accessToken);
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (!response.ok) {
      throw new UnauthorizedException("GitHub token is unavailable or does not have repository access");
    }

    return response.json() as Promise<GithubRepository[]>;
  }
}
