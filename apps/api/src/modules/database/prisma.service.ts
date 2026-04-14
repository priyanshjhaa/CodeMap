import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaService {
  async healthcheck() {
    return {
      database: "configured",
      vector: "pgvector-enabled",
      timestamp: new Date().toISOString()
    };
  }
}
