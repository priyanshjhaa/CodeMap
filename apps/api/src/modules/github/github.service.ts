import { Injectable, UnauthorizedException } from "@nestjs/common";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { extract } from "tar";
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

  private async getAccessToken(userId: string) {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: { userId_provider: { userId, provider: "github" } }
    });

    if (!connection) {
      throw new UnauthorizedException("GitHub connection not found");
    }

    return this.encryption.decrypt(connection.accessToken);
  }

  async listRepositories(userId: string): Promise<GithubRepository[]> {
    const accessToken = await this.getAccessToken(userId);
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

  async downloadRepositoryArchive(input: {
    userId: string;
    owner: string;
    name: string;
    defaultBranch: string;
    destinationPath: string;
  }) {
    const accessToken = await this.getAccessToken(input.userId);
    const archiveUrl = `https://api.github.com/repos/${input.owner}/${input.name}/tarball/${input.defaultBranch}`;
    const response = await fetch(archiveUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    if (!response.ok) {
      throw new UnauthorizedException(
        response.status === 404
          ? "Repository archive was not found or is not accessible with this GitHub token"
          : "Could not download repository archive from GitHub"
      );
    }

    await mkdir(input.destinationPath, { recursive: true });
    const archivePath = join(input.destinationPath, "repository.tar.gz");
    const archive = Buffer.from(await response.arrayBuffer());
    await writeFile(archivePath, archive);
    await extract({
      file: archivePath,
      cwd: input.destinationPath,
      strip: 1
    });

    return {
      archivePath,
      extractedPath: input.destinationPath,
      bytesDownloaded: archive.byteLength
    };
  }
}
