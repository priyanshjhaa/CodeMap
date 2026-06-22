import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { ChatRequest } from "@codemap/shared";
import { ChatService } from "./chat.service.js";
import { AuthGuard } from "../../common/guards/auth.guard.js";

@UseGuards(AuthGuard)
@Controller("repos/:repoId/chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  ask(
    @Param("repoId") repoId: string,
    @Req() request: { user: { id: string } },
    @Headers("x-workspace-id") workspaceId: string | undefined,
    @Body() payload: ChatRequest
  ) {
    return this.chatService.answerQuestion(request.user.id, workspaceId, { ...payload, repositoryId: repoId });
  }

  @Get("sessions")
  listSessions(
    @Param("repoId") repoId: string,
    @Req() request: { user: { id: string } },
    @Headers("x-workspace-id") workspaceId?: string
  ) {
    return this.chatService.listSessions(request.user.id, workspaceId, repoId);
  }
}
