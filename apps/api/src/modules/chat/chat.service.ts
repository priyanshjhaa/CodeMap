import { Injectable } from "@nestjs/common";
import type { ChatAnswer, ChatRequest, CitationPreview } from "@codemap/shared";
import { RetrievalService, type RetrievedChunk } from "../retrieval/retrieval.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";
import type { Prisma } from "@prisma/client";
import { OpenAiChatService } from "./openai-chat.service.js";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function answerFromMessage(message: { content: string; citations: Prisma.JsonValue | null }): ChatAnswer | undefined {
  if (!message.citations || typeof message.citations !== "object" || Array.isArray(message.citations)) {
    return undefined;
  }

  const payload = message.citations as unknown as Partial<ChatAnswer>;
  if (!payload.intent || !payload.confidence || !payload.citations) {
    return undefined;
  }

  return {
    answer: message.content,
    confidence: payload.confidence,
    intent: payload.intent,
    citations: payload.citations,
    followUps: payload.followUps ?? []
  } as ChatAnswer;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly openAiChatService: OpenAiChatService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async answerQuestion(userId: string, workspaceId: string | undefined, request: ChatRequest) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, request.repositoryId, workspaceId);
    const retrieval = await this.retrievalService.retrieve(repository.id, request.question);
    const answer = await this.openAiChatService.answer({
      question: request.question,
      intent: retrieval.intent,
      retrievedChunks: retrieval.chunks,
      lowConfidence: retrieval.lowConfidence
    });

    const session = request.sessionId
      ? await this.prisma.chatSession.findFirst({ where: { id: request.sessionId, repositoryId: repository.id, userId } })
      : null;
    const activeSession = session ?? await this.prisma.chatSession.create({
      data: { repositoryId: repository.id, userId, title: request.question.slice(0, 80) }
    });

    await this.prisma.chatMessage.create({
      data: { chatSessionId: activeSession.id, role: "user", content: request.question }
    });
    await this.prisma.chatMessage.create({
      data: {
        chatSessionId: activeSession.id,
        role: "assistant",
        content: answer.answer,
        citations: toJson(answer)
      }
    });

    const updatedSession = await this.prisma.chatSession.update({
      where: { id: activeSession.id },
      data: { updatedAt: new Date() },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });

    return {
      session: this.mapSession(updatedSession, request.question),
      selectedCitations: this.toCitationPreviews(answer, retrieval.chunks)
    };
  }

  async listSessions(userId: string, workspaceId: string | undefined, repositoryId: string) {
    await this.workspacesService.assertRepositoryAccess(userId, repositoryId, workspaceId);
    const sessions = await this.prisma.chatSession.findMany({
      where: { repositoryId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
    return sessions.map((session) => this.mapSession(session));
  }

  private mapSession(session: {
    id: string;
    repositoryId: string;
    title: string;
    updatedAt: Date;
    messages: Array<{ id: string; role: string; content: string; createdAt: Date; citations: Prisma.JsonValue | null }>;
  }, fallbackLastQuestion = "No question yet") {
    return {
      id: session.id,
      repositoryId: session.repositoryId,
      title: session.title,
      lastQuestion: session.messages.filter((message) => message.role === "user").at(-1)?.content ?? fallbackLastQuestion,
      lastUpdatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        answer: message.role === "assistant" ? answerFromMessage(message) : undefined
      }))
    };
  }

  private toCitationPreviews(answer: ChatAnswer, chunks: RetrievedChunk[]): CitationPreview[] {
    const chunksByPath = new Map(chunks.map((chunk) => [chunk.filePath, chunk]));
    return answer.citations.map((citation) => {
      const chunk = chunksByPath.get(citation.filePath);
      return {
        ...citation,
        excerpt: chunk?.excerpt ?? "Retrieved source excerpt is no longer available."
      };
    });
  }
}
