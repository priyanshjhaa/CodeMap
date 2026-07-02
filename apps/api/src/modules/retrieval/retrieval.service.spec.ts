import { describe, expect, it, vi } from "vitest";
import { RetrievalService } from "./retrieval.service.js";

describe("RetrievalService", () => {
  it("merges vector and lexical candidates with metadata-aware scoring", async () => {
    const prisma = {
      $queryRawUnsafe: vi.fn()
        .mockResolvedValueOnce([
          {
            id: "vector_auth",
            content: "class AuthService {}",
            summary: "class AuthService in src/auth/auth.service.ts",
            language: "typescript",
            metadata: {
              filePath: "src/auth/auth.service.ts",
              symbol: "AuthService",
              chunkType: "symbol",
              lineStart: 1,
              lineEnd: 8
            },
            filePath: "src/auth/auth.service.ts",
            distance: 0.24
          }
        ])
        .mockResolvedValueOnce([
          {
            id: "lexical_route",
            content: "registerRoutes wires login requests to AuthService.",
            summary: "route wiring",
            language: "typescript",
            metadata: {
              filePath: "src/routes/index.ts",
              symbol: "registerRoutes",
              chunkType: "symbol",
              lineStart: 4,
              lineEnd: 18
            },
            filePath: "src/routes/index.ts",
            distance: 1,
            lexicalRank: 2
          }
        ])
    };
    const embeddings = {
      embedText: vi.fn().mockResolvedValue(new Array(1536).fill(0))
    };
    const service = new RetrievalService(prisma as never, embeddings as never);

    const result = await service.retrieve("repo_1", "where is AuthService login implemented");

    expect(result.intent).toBe("location_lookup");
    expect(result.chunks.map((chunk) => chunk.id)).toContain("vector_auth");
    expect(result.chunks.map((chunk) => chunk.id)).toContain("lexical_route");
    expect(result.chunks[0]?.filePath).toBe("src/auth/auth.service.ts");
  });
});
