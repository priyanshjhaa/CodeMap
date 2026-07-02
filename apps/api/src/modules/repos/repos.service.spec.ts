import { describe, expect, it, vi } from "vitest";
import { ReposService } from "./repos.service.js";

describe("ReposService", () => {
  it("audits repository deletion before removing app data", async () => {
    const repository = {
      id: "repo_1",
      workspaceId: "workspace_1",
      provider: "github",
      owner: "acme",
      name: "platform"
    };
    const prisma = {
      repository: {
        delete: vi.fn().mockResolvedValue(repository)
      }
    };
    const workspaces = {
      assertRepositoryAccess: vi.fn().mockResolvedValue(repository)
    };
    const audit = {
      record: vi.fn().mockResolvedValue(undefined)
    };
    const service = new ReposService({} as never, prisma as never, workspaces as never, audit as never);

    await expect(service.deleteRepository("user_1", "repo_1", "workspace_1")).resolves.toEqual({
      id: "repo_1",
      deleted: true
    });
    expect(audit.record).toHaveBeenCalledWith({
      action: "repository.deleted",
      actorUserId: "user_1",
      workspaceId: "workspace_1",
      repositoryId: "repo_1",
      metadata: { provider: "github", owner: "acme", name: "platform" }
    });
    expect(prisma.repository.delete).toHaveBeenCalledWith({ where: { id: "repo_1" } });
  });
});
