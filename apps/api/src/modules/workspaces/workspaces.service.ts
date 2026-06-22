import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

type WorkspaceCreateInput = {
  name: string;
  teamSize?: number;
  goal?: string;
};

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(userId: string, input: WorkspaceCreateInput) {
    const baseSlug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace";

    return this.prisma.workspace.create({
      data: {
        name: input.name.trim(),
        slug: `${baseSlug}-${Date.now().toString(36)}`,
        teamSize: input.teamSize ?? 1,
        goal: input.goal,
        memberships: { create: { userId, role: "owner" } }
      }
    });
  }

  async getCurrentWorkspace(userId: string, requestedWorkspaceId?: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        ...(requestedWorkspaceId ? { workspaceId: requestedWorkspaceId } : {})
      },
      include: {
        workspace: {
          include: { repositories: { orderBy: { updatedAt: "desc" }, take: 1 } }
        }
      },
      orderBy: { workspace: { updatedAt: "desc" } }
    });

    if (!membership) {
      throw new NotFoundException("No workspace membership found");
    }

    return membership.workspace;
  }

  async assertWorkspaceMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } }
    });

    if (!membership) {
      throw new NotFoundException("Workspace not found");
    }

    return membership;
  }

  async assertRepositoryAccess(userId: string, repositoryId: string, requestedWorkspaceId?: string) {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      include: { workspace: true, connection: true }
    });

    if (!repository || (requestedWorkspaceId && repository.workspaceId !== requestedWorkspaceId)) {
      throw new NotFoundException("Repository not found");
    }

    await this.assertWorkspaceMembership(userId, repository.workspaceId);
    return repository;
  }
}
