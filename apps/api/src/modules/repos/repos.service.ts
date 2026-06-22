import { BadRequestException, Injectable } from "@nestjs/common";
import { GithubService } from "../github/github.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";

type ConnectRepositoryInput = { providerRepoId: string; workspaceId?: string };

@Injectable()
export class ReposService {
  constructor(
    private readonly githubService: GithubService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async listRepositories(userId: string, workspaceId?: string) {
    const [githubRepositories, currentWorkspace] = await Promise.all([
      this.githubService.listRepositories(userId),
      this.workspacesService.getCurrentWorkspace(userId, workspaceId)
    ]);
    const connected = await this.prisma.repository.findMany({
      where: { workspaceId: currentWorkspace.id },
      select: { providerRepoId: true, id: true, lastIndexedAt: true, syncs: { orderBy: { startedAt: "desc" }, take: 1 } }
    });
    const connectedByProviderId = new Map(connected.map((repository) => [repository.providerRepoId, repository]));

    return githubRepositories.map((repository) => {
      const existing = connectedByProviderId.get(String(repository.id));
      const latestSync = existing?.syncs[0];
      return {
        id: existing?.id ?? String(repository.id),
        providerRepoId: String(repository.id),
        owner: repository.owner.login,
        name: repository.name,
        description: repository.description ?? "No description provided.",
        visibility: repository.private ? "private" : "public",
        defaultBranch: repository.default_branch || "main",
        language: repository.language ?? "Unknown",
        lastActivity: repository.pushed_at ?? repository.updated_at,
        fileCount: 0,
        health: latestSync?.status === "ready" ? "ready" : existing ? "empty" : "empty"
      };
    });
  }

  async connectRepository(userId: string, input: ConnectRepositoryInput, requestedWorkspaceId?: string) {
    const workspace = await this.workspacesService.getCurrentWorkspace(userId, input.workspaceId ?? requestedWorkspaceId);
    const [connection, repositories] = await Promise.all([
      this.prisma.repositoryConnection.findUnique({ where: { userId_provider: { userId, provider: "github" } } }),
      this.githubService.listRepositories(userId)
    ]);

    if (!connection) {
      throw new BadRequestException("GitHub connection not found");
    }

    const source = repositories.find((repository) => String(repository.id) === input.providerRepoId);
    if (!source) {
      throw new BadRequestException("Repository is not available to this GitHub account");
    }

    return this.prisma.repository.upsert({
      where: { providerRepoId: String(source.id) },
      update: {
        name: source.name,
        owner: source.owner.login,
        defaultBranch: source.default_branch || "main",
        visibility: source.private ? "private" : "public",
        workspaceId: workspace.id,
        connectionId: connection.id
      },
      create: {
        name: source.name,
        owner: source.owner.login,
        defaultBranch: source.default_branch || "main",
        visibility: source.private ? "private" : "public",
        providerRepoId: String(source.id),
        workspaceId: workspace.id,
        connectionId: connection.id
      }
    });
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

  async listCitationPreviews(userId: string, repositoryId: string, workspaceId?: string) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, repositoryId, workspaceId);
    return [
      {
        filePath: "README.md",
        reason: `Repository ${repository.name} has not been indexed yet; README is the initial orientation source.`,
        excerpt: "Source excerpts will appear after the first completed repository sync.",
        lineStart: 1,
        lineEnd: 1
      }
    ];
  }
}
