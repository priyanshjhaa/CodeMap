import { Injectable } from '@nestjs/common';
import { PrismaService } from "../database/prisma.service.js";
import { EncryptionService } from "../encryption/encryption.service.js";
import { GithubService } from "../github/github.service.js";
import { AuditService } from "../audit/audit.service.js";

interface GithubCallbackDto {
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  account: {
    provider_account_id?: string;
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
    private readonly githubService: GithubService,
    private readonly auditService: AuditService
  ) {}

  async handleGithubCallback(dto: GithubCallbackDto) {
    const { user, account } = dto;
    const githubAccountId = account.provider_account_id?.trim();
    const email = user.email?.trim() || (githubAccountId ? `github-${githubAccountId}@users.codemap.local` : null);
    const displayName = user.name?.trim() || (githubAccountId ? `GitHub User ${githubAccountId}` : "GitHub User");

    if (!email) {
      throw new Error("GitHub account did not include an email or provider account id.");
    }

    // Create or update user
    const dbUser = await this.prisma.user.upsert({
      where: { email },
      update: {
        name: displayName,
        avatarUrl: user.image ?? null
      },
      create: {
        email,
        name: displayName,
        avatarUrl: user.image ?? null
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
      const workspaceSlugBase = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "user";

      workspace = await this.prisma.workspace.create({
        data: {
          name: `${displayName}'s Workspace`,
          slug: `${workspaceSlugBase}-${Date.now()}`,
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

    await this.prisma.authSession.upsert({
      where: { userId_provider: { userId: dbUser.id, provider: "github" } },
      update: { expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null },
      create: {
        userId: dbUser.id,
        provider: "github",
        expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null
      }
    });

    return { userId: dbUser.id, workspaceId: workspace.id };
  }

  async disconnectGithub(userId: string) {
    await this.prisma.repositoryConnection.deleteMany({
      where: { userId, provider: "github" }
    });
    await this.prisma.authSession.deleteMany({
      where: { userId, provider: "github" }
    });
    await this.auditService.record({
      action: "github.disconnected",
      actorUserId: userId,
      metadata: { provider: "github" }
    });

    return { disconnected: true };
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
