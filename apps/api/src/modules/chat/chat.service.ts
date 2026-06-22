import { Injectable } from "@nestjs/common";
import type { ChatAnswer, ChatRequest } from "@codemap/shared";
import { RetrievalService } from "../retrieval/retrieval.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { WorkspacesService } from "../workspaces/workspaces.service.js";
import type { Prisma } from "@prisma/client";

@Injectable()
export class ChatService {
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async answerQuestion(userId: string, workspaceId: string | undefined, request: ChatRequest) {
    const repository = await this.workspacesService.assertRepositoryAccess(userId, request.repositoryId, workspaceId);
    const retrieval = this.retrievalService.retrieve(request.question);
    const answer: ChatAnswer = {
      answer:
        "Authentication is centered in `AuthService`, with route registration happening in `auth.routes.ts`. The current flow starts in the HTTP layer, delegates token/session work to the auth module, and then persists identity state through shared repositories.",
      confidence: "medium",
      intent: retrieval.intent,
      citations: retrieval.citations,
      followUps: [
        "Show me the login flow from route to database",
        "Which modules import the auth service?",
        "What files should a new engineer read first for authentication?"
      ]
    };
    const session = request.sessionId
      ? await this.prisma.chatSession.findFirst({ where: { id: request.sessionId, repositoryId: repository.id, userId } })
      : null;
    const activeSession = session ?? await this.prisma.chatSession.create({
      data: { repositoryId: repository.id, userId, title: request.question.slice(0, 80) }
    });
    const now = new Date();
    await this.prisma.chatMessage.createMany({
      data: [
        { chatSessionId: activeSession.id, role: "user", content: request.question },
        {
          chatSessionId: activeSession.id,
          role: "assistant",
          content: answer.answer,
          citations: JSON.parse(JSON.stringify(answer.citations)) as Prisma.InputJsonValue
        }
      ]
    });
    const messages = await this.prisma.chatMessage.findMany({ where: { chatSessionId: activeSession.id }, orderBy: { createdAt: "asc" } });
    return {
      session: {
        id: activeSession.id,
        repositoryId: repository.id,
        title: activeSession.title,
        lastQuestion: request.question,
        lastUpdatedAt: now.toISOString(),
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          answer: message.role === "assistant" ? answer : undefined
        }))
      },
      selectedCitations: answer.citations.map((citation) => ({ ...citation, excerpt: "Source excerpts will be available after indexing." }))
    };
  }

  async listSessions(userId: string, workspaceId: string | undefined, repositoryId: string) {
    await this.workspacesService.assertRepositoryAccess(userId, repositoryId, workspaceId);
    const sessions = await this.prisma.chatSession.findMany({
      where: { repositoryId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
    return sessions.map((session) => ({
      id: session.id,
      repositoryId: session.repositoryId,
      title: session.title,
      lastQuestion: session.messages.filter((message) => message.role === "user").at(-1)?.content ?? "No question yet",
      lastUpdatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
        createdAt: message.createdAt.toISOString()
      }))
    }));
  }
}
