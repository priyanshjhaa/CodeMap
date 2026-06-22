import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function encryptSeedToken(token: string) {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be set before running the database seed");
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

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

  const encryptedSeedToken = encryptSeedToken("seed-token-placeholder");

  const connection = await prisma.repositoryConnection.upsert({
    where: {
      userId_provider: {
        userId: user.id,
        provider: "github"
      }
    },
    update: {
      providerRepoId: "demo-github-account",
      accessToken: encryptedSeedToken,
      refreshToken: null,
      installationId: null
    },
    create: {
      provider: "github",
      providerRepoId: "demo-github-account",
      accessToken: encryptedSeedToken,
      userId: user.id
    }
  });

  await prisma.authSession.upsert({
    where: { userId_provider: { userId: user.id, provider: "github" } },
    update: { expiresAt: null },
    create: { userId: user.id, provider: "github" }
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
