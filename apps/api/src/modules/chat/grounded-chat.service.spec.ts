import { describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import { GroundedChatService } from "./grounded-chat.service.js";

describe("GroundedChatService", () => {
  it("falls back to grounded citations when provider JSON is invalid", async () => {
    const previousProvider = env.chatProvider;
    env.chatProvider = "groq";
    const service = new GroundedChatService();
    (service as unknown as { completeWithGroq: () => Promise<string> }).completeWithGroq = async () => "not-json";

    const answer = await service.answer({
      question: "Where is auth implemented?",
      intent: "location_lookup",
      lowConfidence: false,
      retrievedChunks: [
        {
          id: "chunk_1",
          filePath: "src/auth/auth.service.ts",
          symbol: "AuthService",
          lineStart: 10,
          lineEnd: 42,
          reason: "Authentication service matched the question.",
          excerpt: "export class AuthService {}",
          score: 0.91,
          metadata: { filePath: "src/auth/auth.service.ts", symbol: "AuthService" }
        }
      ]
    });

    env.chatProvider = previousProvider;

    expect(answer.confidence).toBe("medium");
    expect(answer.citations).toEqual([
      {
        filePath: "src/auth/auth.service.ts",
        symbol: "AuthService",
        lineStart: 10,
        lineEnd: 42,
        reason: "Authentication service matched the question."
      }
    ]);
    expect(answer.followUps).toHaveLength(3);
  });
});
