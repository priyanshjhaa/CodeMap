import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import { env } from "../../config/env.js";

export const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_BATCH_SIZE = 96;
const LOCAL_EMBEDDING_NAMESPACE = "codemap-local-embedding-v1";

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

    if (env.embeddingsProvider === "local") {
      return inputs.map((input) => this.createLocalEmbedding(input));
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

  private createLocalEmbedding(input: string): number[] {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const tokens = input
      .toLowerCase()
      .replace(/[^a-z0-9_./-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const features = tokens.length ? tokens : [input.slice(0, 256) || "empty"];

    for (const feature of features) {
      const digest = createHash("sha256")
        .update(`${LOCAL_EMBEDDING_NAMESPACE}:${feature}`)
        .digest();
      const index = digest.readUInt32BE(0) % EMBEDDING_DIMENSIONS;
      const sign = digest[4] % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => Number((value / magnitude).toFixed(8)));
  }
}
