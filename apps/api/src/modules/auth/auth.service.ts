import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { GithubService } from "../github/github.service.js";

interface GithubCallbackDto {
  user: {
    email: string;
    name: string;
    image: string;
  };
  account: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private readonly githubService: GithubService
  ) {}

  async handleGithubCallback(dto: GithubCallbackDto) {
    const { user, account } = dto;

    // Create or update user
    const dbUser = await this.prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        avatarUrl: user.image
      },
      create: {
        email: user.email,
        name: user.name,
        avatarUrl: user.image
      }
    });

    // Check if user has a default workspace, create one if not
    let workspace = await this.prisma.workspace.findFirst({
      where: {
        memberships: {
          some: {
            userId: dbUser.id,
            role: 'owner'
          }
        }
      }
    });

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          name: `${dbUser.name}'s Workspace`,
          slug: `${dbUser.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}-${Date.now()}`,
          memberships: {
            create: {
              userId: dbUser.id,
              role: 'owner'
            }
          }
        }
      });
    }

    // Encrypt and store GitHub token
    await this.prisma.repositoryConnection.upsert({
      where: {
        userId_provider: {
          userId: dbUser.id,
          provider: 'github'
        }
      },
      update: {
        accessToken: this.encryption.encrypt(account.access_token),
        refreshToken: account.refresh_token ? this.encryption.encrypt(account.refresh_token) : null,
      },
      create: {
        userId: dbUser.id,
        provider: 'github',
        providerRepoId: dbUser.id.toString(),
        accessToken: this.encryption.encrypt(account.access_token),
        refreshToken: account.refresh_token ? this.encryption.encrypt(account.refresh_token) : null,
      }
    });

    return { userId: dbUser.id, workspaceId: workspace.id };
  }

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
