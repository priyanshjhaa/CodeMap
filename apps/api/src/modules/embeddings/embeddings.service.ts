import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";
import { env } from "../../config/env.js";

export const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 96;

@Injectable()
export class EmbeddingsService {
  private client: OpenAI | null = null;

  private getClient() {
    if (!env.openAiApiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is required for embeddings.");
    }

    this.client ??= new OpenAI({ apiKey: env.openAiApiKey });
    return this.client;
  }

  async embedText(input: string): Promise<number[]> {
    const [embedding] = await this.embedTexts([input]);
    return embedding;
  }

  async embedTexts(inputs: string[]): Promise<number[][]> {
    if (!inputs.length) {
      return [];
    }

    const client = this.getClient();
    const embeddings: number[][] = [];

    for (let start = 0; start < inputs.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = inputs.slice(start, start + EMBEDDING_BATCH_SIZE);
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS
      });

      const ordered = response.data
        .slice()
        .sort((left, right) => left.index - right.index)
        .map((item) => item.embedding);

      embeddings.push(...ordered);
    }

    return embeddings;
  }
}
