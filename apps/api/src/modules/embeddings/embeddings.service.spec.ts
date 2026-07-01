import { describe, expect, it } from "vitest";
import { EmbeddingsService } from "./embeddings.service.js";

describe("EmbeddingsService", () => {
  it("creates deterministic local embeddings with the expected dimensions", async () => {
    process.env.EMBEDDINGS_PROVIDER = "local";
    const service = new EmbeddingsService();

    const first = await service.embedText("auth service token");
    const second = await service.embedText("auth service token");

    expect(first).toHaveLength(1536);
    expect(first).toEqual(second);
  });
});
