import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@codemap.dev" },
    update: {
      name: "Demo Engineer",
      avatarUrl: null
    },
    create: {
      email: "demo@codemap.dev",
      name: "Demo Engineer"
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-engineering" },
    update: {
      name: "Demo Engineering"
    },
    create: {
      name: "Demo Engineering",
      slug: "demo-engineering"
    }
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id
      }
    },
    update: {
      role: "owner"
    },
    create: {
      role: "owner",
      userId: user.id,
      workspaceId: workspace.id
    }
  });

  const connection = await prisma.repositoryConnection.upsert({
    where: {
      userId_provider: {
        userId: user.id,
        provider: "github"
      }
    },
    update: {
      providerRepoId: "demo-github-account",
      accessToken: "seed-token-placeholder",
      refreshToken: null,
      installationId: null
    },
    create: {
      provider: "github",
      providerRepoId: "demo-github-account",
      accessToken: "seed-token-placeholder",
      userId: user.id
    }
  });

  const repository = await prisma.repository.upsert({
    where: { providerRepoId: "demo/payments-platform" },
    update: {
      name: "payments-platform",
      owner: "demo",
      defaultBranch: "main",
      visibility: "private",
      workspaceId: workspace.id,
      connectionId: connection.id
    },
    create: {
      name: "payments-platform",
      owner: "demo",
      defaultBranch: "main",
      visibility: "private",
      providerRepoId: "demo/payments-platform",
      workspaceId: workspace.id,
      connectionId: connection.id
    }
  });

  await prisma.repositorySync.create({
    data: {
      repositoryId: repository.id,
      status: "ready",
      completedAt: new Date(),
      commitSha: "seed-demo",
      summary: {
        filesIndexed: 24,
        chunksCreated: 96,
        languages: ["TypeScript", "JavaScript"]
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
