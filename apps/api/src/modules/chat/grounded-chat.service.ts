import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ChatAnswer, Citation, QueryIntent } from "@codemap/shared";
import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { RetrievedChunk } from "../retrieval/retrieval.service.js";
import { withTimeout } from "../../common/http/timeout.js";

type GroundedAnswerPayload = {
  answer?: string;
  confidence?: "low" | "medium" | "high";
  citations?: Citation[];
  followUps?: string[];
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const MAX_CONTEXT_CHUNKS = 6;
const GROQ_GROUNDED_ANSWER_SCHEMA = {
  name: "codemap_grounded_answer",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      answer: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      citations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            filePath: { type: "string" },
            symbol: { type: ["string", "null"] },
            lineStart: { type: ["number", "null"] },
            lineEnd: { type: ["number", "null"] },
            reason: { type: "string" }
          },
          required: ["filePath", "symbol", "lineStart", "lineEnd", "reason"]
        }
      },
      followUps: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["answer", "confidence", "citations", "followUps"]
  }
} as const;

@Injectable()
export class GroundedChatService {
  private openAiClient: OpenAI | null = null;

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

    if (input.lowConfidence && input.intent === "location_lookup") {
      const boundedChunks = input.retrievedChunks.slice(0, MAX_CONTEXT_CHUNKS);
      return {
        answer: this.fallbackAnswer(input.question, true, boundedChunks),
        confidence: "low",
        intent: input.intent,
        citations: boundedChunks.slice(0, 3).map((chunk) => ({
          filePath: chunk.filePath,
          symbol: chunk.symbol,
          lineStart: chunk.lineStart,
          lineEnd: chunk.lineEnd,
          reason: chunk.reason
        })),
        followUps: this.followUps(undefined, true)
      };
    }

    const messages = this.buildMessages(input);
    const boundedChunks = input.retrievedChunks.slice(0, MAX_CONTEXT_CHUNKS);
    const raw = env.chatProvider === "groq"
      ? await this.completeWithGroq(messages)
      : await this.completeWithOpenAi(messages);
    const parsed = this.parseGroundedPayload(raw);
    const allowed = new Map(boundedChunks.map((chunk) => [chunk.filePath, chunk]));
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
    const fallbackCitations = citations.length
      ? citations
      : boundedChunks.slice(0, 3).map((chunk) => ({
        filePath: chunk.filePath,
        symbol: chunk.symbol,
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        reason: chunk.reason
      }));

    return {
      answer:
        parsed.answer ??
        this.fallbackAnswer(input.question, input.lowConfidence, boundedChunks),
      confidence: input.lowConfidence ? "low" : parsed.confidence ?? "medium",
      intent: input.intent,
      citations: fallbackCitations,
      followUps: this.followUps(parsed.followUps, input.lowConfidence)
    };
  }

  private buildMessages(input: {
    question: string;
    intent: QueryIntent;
    retrievedChunks: RetrievedChunk[];
    lowConfidence: boolean;
  }): ChatMessage[] {
    const context = input.retrievedChunks.slice(0, MAX_CONTEXT_CHUNKS).map((chunk, index) => ({
      index,
      filePath: chunk.filePath,
      symbol: chunk.symbol,
      lineStart: chunk.lineStart,
      lineEnd: chunk.lineEnd,
      reason: chunk.reason,
      excerpt: chunk.excerpt
    }));

    return [
      {
        role: "system",
        content: [
          "You are CodeMap, a careful codebase onboarding assistant.",
          "Answer only from the provided repository context.",
          "If context is weak, say what is uncertain and do not invent files, modules, behavior, framework conventions, or typical patterns.",
          "Never say where something is likely located unless a supplied citation directly supports that location.",
          "If exact implementation details are not present in the excerpts, say that and list only the closest cited files as starting points.",
          "Prefer direct file and symbol locations when the user asks where functionality lives.",
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
    ];
  }

  private async completeWithOpenAi(messages: ChatMessage[]) {
    if (!env.openAiApiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is required for OpenAI grounded chat.");
    }

    this.openAiClient ??= new OpenAI({ apiKey: env.openAiApiKey });
    let completion;
    try {
      completion = await this.openAiClient.chat.completions.create(
        {
          model: env.openAiChatModel,
          response_format: { type: "json_object" },
          messages
        },
        { timeout: 30_000 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "OpenAI chat completion failed.";
      const quotaHint = message.includes("429") || message.toLowerCase().includes("quota")
        ? " OpenAI quota or rate limit was reached; switch CHAT_PROVIDER=groq or add billing."
        : "";
      throw new ServiceUnavailableException(`${message}${quotaHint}`);
    }

    return completion.choices[0]?.message.content ?? "{}";
  }

  private async completeWithGroq(messages: ChatMessage[]) {
    if (!env.groqApiKey) {
      throw new ServiceUnavailableException("GROQ_API_KEY is required when CHAT_PROVIDER=groq.");
    }

    const response = await withTimeout(
      (signal) => fetch("https://api.groq.com/openai/v1/chat/completions", {
        signal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.groqChatModel,
          response_format: {
            type: "json_schema",
            json_schema: GROQ_GROUNDED_ANSWER_SCHEMA
          },
          messages
        })
      }),
      30_000,
      "Groq chat completion"
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const hint = response.status === 429
        ? " Groq quota or rate limit was reached; wait and retry or switch providers."
        : "";
      const detail = body ? ` Response: ${body.slice(0, 500)}` : "";
      throw new ServiceUnavailableException(`Groq chat completion failed with status ${response.status}.${hint}${detail}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content ?? "{}";
  }

  private parseGroundedPayload(raw: string) {
    try {
      return JSON.parse(raw || "{}") as GroundedAnswerPayload;
    } catch {
      return {};
    }
  }

  private fallbackAnswer(question: string, lowConfidence: boolean, chunks: RetrievedChunk[]) {
    const locations = chunks
      .slice(0, 3)
      .map((chunk) => `${chunk.filePath}${chunk.symbol ? ` (${chunk.symbol})` : ""}`)
      .join(", ");

    if (lowConfidence) {
      return `I do not have a strong enough indexed match to answer "${question}" precisely. The closest retrieved areas are ${locations || "not available"}, so treat these only as starting points, not confirmed implementation locations.`;
    }

    return `The strongest indexed matches for "${question}" are ${locations || "not available"}. Review the cited files for the exact implementation details.`;
  }

  private followUps(modelFollowUps: string[] | undefined, lowConfidence: boolean) {
    if (modelFollowUps?.length) {
      return modelFollowUps.slice(0, 3);
    }

    return lowConfidence
      ? [
        "Can you rephrase with a specific feature, file, or symbol name?",
        "Which files are closest to this question?",
        "Should I inspect the architecture overview first?"
      ]
      : [
        "Where should I start reading this flow?",
        "Which files call into this code?",
        "What should I change carefully in this area?"
      ];
  }
}
