import { PrismaClient } from "@prisma/client";
import { createCipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const EMBEDDING_DIMENSIONS = 1536;

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

function toVector(input: string) {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens.length ? tokens : ["demo"]) {
    const digest = createHash("sha256").update(`codemap-local-embedding-v1:${token}`).digest();
    const index = digest.readUInt32BE(0) % EMBEDDING_DIMENSIONS;
    vector[index] += digest[4] % 2 === 0 ? 1 : -1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return `[${vector.map((value) => Number((value / magnitude).toFixed(8))).join(",")}]`;
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

  await prisma.codeChunk.deleteMany({ where: { repositoryId: repository.id } });
  await prisma.codeFile.deleteMany({ where: { repositoryId: repository.id } });
  await prisma.architectureSnapshot.deleteMany({ where: { repositoryId: repository.id } });
  await prisma.chatSession.deleteMany({ where: { repositoryId: repository.id } });

  const authFile = await prisma.codeFile.create({
    data: {
      repositoryId: repository.id,
      path: "src/auth/auth.service.ts",
      language: "typescript",
      checksum: createHash("sha256").update("auth service").digest("hex"),
      sizeBytes: 842,
      symbols: {
        create: [
          {
            name: "AuthService",
            kind: "class",
            lineStart: 8,
            lineEnd: 42,
            exported: true,
            metadata: { imports: ["TokenService"], exports: ["AuthService"] }
          },
          {
            name: "validateSession",
            kind: "function",
            lineStart: 18,
            lineEnd: 31,
            exported: true,
            metadata: { purpose: "session validation" }
          }
        ]
      }
    }
  });

  const billingFile = await prisma.codeFile.create({
    data: {
      repositoryId: repository.id,
      path: "src/billing/billing.service.ts",
      language: "typescript",
      checksum: createHash("sha256").update("billing service").digest("hex"),
      sizeBytes: 960,
      symbols: {
        create: [
          {
            name: "BillingService",
            kind: "class",
            lineStart: 6,
            lineEnd: 58,
            exported: true,
            metadata: { imports: ["StripeClient", "InvoiceRepository"] }
          }
        ]
      }
    }
  });

  const routeFile = await prisma.codeFile.create({
    data: {
      repositoryId: repository.id,
      path: "src/routes/index.ts",
      language: "typescript",
      checksum: createHash("sha256").update("routes").digest("hex"),
      sizeBytes: 516,
      symbols: {
        create: [
          {
            name: "registerRoutes",
            kind: "function",
            lineStart: 4,
            lineEnd: 28,
            exported: true,
            metadata: { imports: ["AuthService", "BillingService"] }
          }
        ]
      }
    }
  });

  const chunks = [
    {
      id: randomUUID(),
      fileId: authFile.id,
      chunkIndex: 0,
      language: "typescript",
      content: "export class AuthService validates sessions, reads GitHub identity, and delegates token creation to TokenService.",
      summary: "Authentication implementation and session validation.",
      metadata: { filePath: "src/auth/auth.service.ts", symbol: "AuthService", lineStart: 8, lineEnd: 42, chunkType: "symbol" }
    },
    {
      id: randomUUID(),
      fileId: billingFile.id,
      chunkIndex: 0,
      language: "typescript",
      content: "BillingService coordinates checkout, Stripe webhook handling, invoice persistence, and billing status reads.",
      summary: "Billing flow implementation.",
      metadata: { filePath: "src/billing/billing.service.ts", symbol: "BillingService", lineStart: 6, lineEnd: 58, chunkType: "symbol" }
    },
    {
      id: randomUUID(),
      fileId: routeFile.id,
      chunkIndex: 0,
      language: "typescript",
      content: "registerRoutes wires HTTP routes to AuthService and BillingService so requests flow from routes into services.",
      summary: "Application entry point and request flow.",
      metadata: { filePath: "src/routes/index.ts", symbol: "registerRoutes", lineStart: 4, lineEnd: 28, chunkType: "symbol" }
    }
  ];

  await prisma.codeChunk.createMany({
    data: chunks.map((chunk) => ({
      id: chunk.id,
      repositoryId: repository.id,
      fileId: chunk.fileId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      summary: chunk.summary,
      language: chunk.language,
      tokenCount: chunk.content.split(/\s+/).length,
      metadata: chunk.metadata
    }))
  });

  for (const chunk of chunks) {
    await prisma.$executeRawUnsafe(
      `UPDATE "CodeChunk" SET embedding = $1::vector WHERE id = $2`,
      toVector(`${chunk.summary}\n${chunk.content}`),
      chunk.id
    );
  }

  await prisma.architectureSnapshot.create({
    data: {
      repositoryId: repository.id,
      summary: "Demo payments platform with route, auth, and billing service layers.",
      diagram: "flowchart LR\n  routes[src/routes] --> auth[src/auth]\n  routes --> billing[src/billing]\n  billing --> database[(database)]",
      moduleMap: {
        readiness: "complete",
        entryPoints: ["src/routes/index.ts", "src/auth/auth.service.ts"],
        majorFlows: ["Request flow: routes -> service -> database", "Authentication flow: routes -> AuthService -> TokenService"],
        moduleNodes: [
          { id: "routes", label: "src/routes", kind: "module" },
          { id: "auth", label: "src/auth", kind: "service" },
          { id: "billing", label: "src/billing", kind: "service" }
        ],
        moduleEdges: [
          { from: "routes", to: "auth", type: "imports" },
          { from: "routes", to: "billing", type: "imports" }
        ],
        recommendedReads: ["src/routes/index.ts", "src/auth/auth.service.ts", "src/billing/billing.service.ts"],
        sections: [
          {
            title: "Start here",
            body: "Read routes first, then follow service calls into auth and billing.",
            bullets: ["src/routes/index.ts", "src/auth/auth.service.ts", "src/billing/billing.service.ts"]
          }
        ],
        stats: { filesIndexed: 3, chunksCreated: 3, symbolsExtracted: 4 }
      }
    }
  });

  const chatSession = await prisma.chatSession.create({
    data: {
      repositoryId: repository.id,
      userId: user.id,
      title: "Where is authentication implemented?",
      messages: {
        create: [
          {
            role: "user",
            content: "Where is authentication implemented?"
          },
          {
            role: "assistant",
            content: "Authentication is centered in AuthService, with route wiring in src/routes/index.ts.",
            citations: [
              {
                filePath: "src/auth/auth.service.ts",
                symbol: "AuthService",
                lineStart: 8,
                lineEnd: 42,
                reason: "Primary authentication service in the demo repository."
              }
            ]
          }
        ]
      }
    }
  });

  await prisma.chatSession.update({
    where: { id: chatSession.id },
    data: { updatedAt: new Date() }
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
