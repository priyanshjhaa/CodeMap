import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { RetrievalModule } from "../retrieval/retrieval.module.js";

@Module({
  imports: [RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService]
})
export class ChatModule {}
