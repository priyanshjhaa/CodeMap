import { Controller, Get } from "@nestjs/common";
import { env } from "../../config/env.js";
import { PrismaService } from "../database/prisma.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    const database = await this.prisma.healthcheck();

    return {
      status: "ok",
      database,
      providers: {
        embeddings: env.embeddingsProvider,
        chat: env.chatProvider,
        chatModel: env.chatProvider === "groq" ? env.groqChatModel : env.openAiChatModel
      },
      timestamp: new Date().toISOString()
    };
  }
}
