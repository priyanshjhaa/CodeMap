import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ChatAnswer, Citation, QueryIntent } from "@codemap/shared";
import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { RetrievedChunk } from "../retrieval/retrieval.service.js";

const CHAT_MODEL = "gpt-5.4-mini";

type GroundedAnswerPayload = {
  answer?: string;
  confidence?: "low" | "medium" | "high";
  citations?: Citation[];
  followUps?: string[];
};

@Injectable()
export class OpenAiChatService {
  private client: OpenAI | null = null;

  private getClient() {
    if (!env.openAiApiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is required for grounded chat.");
    }

    this.client ??= new OpenAI({ apiKey: env.openAiApiKey });
    return this.client;
  }

  async answer(input: {
    question: string;
    intent: QueryIntent;
    retrievedChunks: RetrievedChunk[];
    lowConfidence: boolean;
  }): Promise<ChatAnswer> {
    if (!input.retrievedChunks.length) {
      return {
        answer:
          "I could not find indexed repository context for that question yet. Run a repository sync, then ask again with a specific feature, symbol, or flow name.",
        confidence: "low",
        intent: input.intent,
        citations: [],
        followUps: [
          "What files were indexed in this repository?",
          "Where should I start reading this codebase?",
          "Can you explain the main modules after sync completes?"
        ]
      };
    }

    const client = this.getClient();
    const context = input.retrievedChunks.map((chunk, index) => ({
      index,
      filePath: chunk.filePath,
      symbol: chunk.symbol,
      lineStart: chunk.lineStart,
      lineEnd: chunk.lineEnd,
      reason: chunk.reason,
      excerpt: chunk.excerpt
    }));

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are CodeMap, a careful codebase onboarding assistant.",
            "Answer only from the provided repository context.",
            "If context is weak, say what is uncertain and do not invent files or behavior.",
            "Return JSON with keys: answer, confidence, citations, followUps.",
            "Citations must use only provided filePath, symbol, lineStart, lineEnd values."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            question: input.question,
            intent: input.intent,
            lowConfidence: input.lowConfidence,
            context
          })
        }
      ]
    });

    const raw = completion.choices[0]?.message.content ?? "{}";
    const parsed = JSON.parse(raw) as GroundedAnswerPayload;
    const allowed = new Map(input.retrievedChunks.map((chunk) => [chunk.filePath, chunk]));
    const citations = (parsed.citations ?? [])
      .filter((citation) => allowed.has(citation.filePath))
      .slice(0, 5)
      .map((citation) => {
        const source = allowed.get(citation.filePath);
        return {
          filePath: citation.filePath,
          symbol: citation.symbol ?? source?.symbol,
          lineStart: citation.lineStart ?? source?.lineStart,
          lineEnd: citation.lineEnd ?? source?.lineEnd,
          reason: citation.reason || source?.reason || "Relevant retrieved repository context."
        };
      });

    return {
      answer:
        parsed.answer ??
        "I found related repository context, but could not produce a confident answer from it.",
      confidence: input.lowConfidence ? "low" : parsed.confidence ?? "medium",
      intent: input.intent,
      citations,
      followUps: (parsed.followUps ?? []).slice(0, 3)
    };
  }
}
