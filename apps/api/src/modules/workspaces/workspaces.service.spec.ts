import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service.js";

describe("WorkspacesService", () => {
  it("rejects repository access when requested workspace does not match", async () => {
    const prisma = {
      repository: {
        findUnique: vi.fn().mockResolvedValue({
          id: "repo_1",
          workspaceId: "workspace_a",
          workspace: { id: "workspace_a" },
          connection: { id: "connection_1" }
        })
      },
      membership: {
        findUnique: vi.fn()
      }
    };
    const service = new WorkspacesService(prisma as never);

    await expect(
      service.assertRepositoryAccess("user_1", "repo_1", "workspace_b")
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.membership.findUnique).not.toHaveBeenCalled();
  });

  it("requires membership before granting repository access", async () => {
    const prisma = {
      repository: {
        findUnique: vi.fn().mockResolvedValue({
          id: "repo_1",
          workspaceId: "workspace_a",
          workspace: { id: "workspace_a" },
          connection: { id: "connection_1" }
        })
      },
      membership: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };
    const service = new WorkspacesService(prisma as never);

    await expect(
      service.assertRepositoryAccess("user_1", "repo_1", "workspace_a")
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
