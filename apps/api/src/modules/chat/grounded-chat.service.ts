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
const VAGUE_ANSWER_PATTERNS = [
  /\blikely\b/i,
  /\btypically\b/i,
  /\bgenerally\b/i,
  /\busually\b/i,
  /\bprobably\b/i,
  /\bmight be\b/i,
  /\bmay be\b/i,
  /\bcommon pattern\b/i,
  /\bnot shown in the excerpt\b/i
];
const GROQ_GROUNDED_ANSWER_SCHEMA = {
  name: "codemap_grounded_answer",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      answer: {
        type: "string",
        description: "A concise, repository-specific answer grounded only in the supplied excerpts. No generic framework advice."
      },
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
            reason: {
              type: "string",
              description: "A short explanation of the exact evidence this citation provides."
            }
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
    const answerNeedsFallback =
      !parsed.answer ||
      !fallbackCitations.length ||
      this.isVagueAnswer(parsed.answer);
    const deterministicFallback = this.fallbackAnswer(input.question, input.lowConfidence, boundedChunks);
    const answerText = answerNeedsFallback
      ? deterministicFallback
      : parsed.answer ?? deterministicFallback;

    return {
      answer: answerText,
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
          "You are CodeMap, a strict codebase navigation assistant for engineers.",
          "Your job is to answer with precise repository facts, not generic software-engineering advice.",
          "Use ONLY the supplied context array. Every factual claim about code location, behavior, dependency, or flow must be supported by a citation from that context.",
          "Do not infer from framework conventions. Do not use words like likely, probably, typically, generally, usually, may be, or might be.",
          "If the context does not prove the answer, say exactly: I do not have enough indexed context to answer that precisely.",
          "For location questions, start with the exact file path and symbol when present, then explain why that citation is relevant.",
          "For flow questions, describe only steps visible in the excerpts. If a step is missing, name the gap instead of filling it in.",
          "Keep the answer concise: 2-5 short bullets or one short paragraph. Prefer file paths over broad module names.",
          "Return valid JSON with keys: answer, confidence, citations, followUps.",
          "Citations must use only provided filePath, symbol, lineStart, lineEnd values.",
          "Citation reasons must be specific evidence, not generic phrases like relevant context."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          question: input.question,
          intent: input.intent,
          lowConfidence: input.lowConfidence,
          responseRules: {
            format: "Precise, cited, repository-specific.",
            avoid: ["generic explanations", "framework assumptions", "uncited location guesses"],
            requireCitationForEveryClaim: true
          },
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
      .map((chunk, index) => `${index + 1}. ${chunk.filePath}${chunk.symbol ? ` (${chunk.symbol})` : ""}${chunk.lineStart ? ` L${chunk.lineStart}-${chunk.lineEnd}` : ""}`)
      .join("\n");

    if (lowConfidence) {
      return `I do not have enough indexed context to answer "${question}" precisely.\n\nClosest retrieved starting points:\n${locations || "No close indexed files were retrieved."}`;
    }

    return `Strongest indexed matches for "${question}":\n${locations || "No close indexed files were retrieved."}\n\nUse the citations to verify the exact implementation details.`;
  }

  private isVagueAnswer(answer: string) {
    return VAGUE_ANSWER_PATTERNS.some((pattern) => pattern.test(answer));
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
