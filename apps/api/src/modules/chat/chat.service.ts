import { Injectable } from "@nestjs/common";
import type { ChatAnswer, ChatRequest } from "@codemap/shared";
import { RetrievalService } from "../retrieval/retrieval.service.js";

@Injectable()
export class ChatService {
  constructor(private readonly retrievalService: RetrievalService) {}

  answerQuestion(request: ChatRequest): ChatAnswer {
    const retrieval = this.retrievalService.retrieve(request.question);

    return {
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
  }
}
