import { Injectable } from "@nestjs/common";

@Injectable()
export class EmbeddingsService {
  async createEmbeddings(chunkCount: number) {
    return {
      provider: "openai",
      vectorsStored: chunkCount
    };
  }
}
