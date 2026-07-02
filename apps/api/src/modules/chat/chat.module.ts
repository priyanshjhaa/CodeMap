import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { GroundedChatService } from "./grounded-chat.service.js";
import { RetrievalModule } from "../retrieval/retrieval.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({
  imports: [RetrievalModule, WorkspacesModule, AuditModule],
  controllers: [ChatController],
  providers: [ChatService, GroundedChatService]
})
export class ChatModule {}
