import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { OpenAiChatService } from "./openai-chat.service.js";
import { RetrievalModule } from "../retrieval/retrieval.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";

@Module({
  imports: [RetrievalModule, WorkspacesModule],
  controllers: [ChatController],
  providers: [ChatService, OpenAiChatService]
})
export class ChatModule {}
