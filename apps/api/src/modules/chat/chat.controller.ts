import { Body, Controller, Post } from "@nestjs/common";
import type { ChatRequest } from "@codemap/shared";
import { ChatService } from "./chat.service.js";

@Controller("repos/:repoId/chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  ask(@Body() payload: ChatRequest) {
    return this.chatService.answerQuestion(payload);
  }
}
