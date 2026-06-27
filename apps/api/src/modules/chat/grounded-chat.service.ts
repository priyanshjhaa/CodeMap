import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ChatAnswer, Citation, QueryIntent } from "@codemap/shared";
import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { RetrievedChunk } from "../retrieval/retrieval.service.js";

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

    const messages = this.buildMessages(input);
    const raw = env.chatProvider === "groq"
      ? await this.completeWithGroq(messages)
      : await this.completeWithOpenAi(messages);
    const parsed = JSON.parse(raw || "{}") as GroundedAnswerPayload;
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

  private buildMessages(input: {
    question: string;
    intent: QueryIntent;
    retrievedChunks: RetrievedChunk[];
    lowConfidence: boolean;
  }): ChatMessage[] {
    const context = input.retrievedChunks.map((chunk, index) => ({
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
    ];
  }

  private async completeWithOpenAi(messages: ChatMessage[]) {
    if (!env.openAiApiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is required for OpenAI grounded chat.");
    }

    this.openAiClient ??= new OpenAI({ apiKey: env.openAiApiKey });
    const completion = await this.openAiClient.chat.completions.create({
      model: env.openAiChatModel,
      response_format: { type: "json_object" },
      messages
    });

    return completion.choices[0]?.message.content ?? "{}";
  }

  private async completeWithGroq(messages: ChatMessage[]) {
    if (!env.groqApiKey) {
      throw new ServiceUnavailableException("GROQ_API_KEY is required when CHAT_PROVIDER=groq.");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.groqChatModel,
        response_format: { type: "json_object" },
        messages
      })
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(`Groq chat completion failed with status ${response.status}.`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content ?? "{}";
  }
}
