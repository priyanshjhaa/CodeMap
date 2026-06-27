import { Injectable } from "@nestjs/common";
import type { QueryIntent } from "@codemap/shared";
import { PrismaService } from "../database/prisma.service.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";

const TOP_K = 8;
const LOW_CONFIDENCE_DISTANCE = 0.42;

type ChunkMetadata = {
  filePath?: string;
  symbol?: string;
  lineStart?: number;
  lineEnd?: number;
  symbolKind?: string;
  chunkType?: string;
};

type RetrievedChunkRow = {
  id: string;
  content: string;
  summary: string | null;
  language: string;
  metadata: unknown;
  filePath: string | null;
  distance: number;
};

export type RetrievedChunk = {
  id: string;
  filePath: string;
  symbol?: string;
  lineStart?: number;
  lineEnd?: number;
  reason: string;
  excerpt: string;
  score: number;
  metadata: ChunkMetadata;
};

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService
  ) {}

  classify(question: string): QueryIntent {
    const normalized = question.toLowerCase();
    if (normalized.includes("where") || normalized.includes("which file")) {
      return "location_lookup";
    }
    if (normalized.includes("architecture") || normalized.includes("overview") || normalized.includes("main modules")) {
      return "architecture_overview";
    }
    if (normalized.includes("how") || normalized.includes("flow")) {
      return "flow_explanation";
    }
    return "symbol_explanation";
  }

  async retrieve(repositoryId: string, question: string) {
    const intent = this.classify(question);
    const queryEmbedding = await this.embeddingsService.embedText(question);
    const vector = `[${queryEmbedding.join(",")}]`;
    const rows = await this.prisma.$queryRawUnsafe<RetrievedChunkRow[]>(
      `
        SELECT
          c.id,
          c.content,
          c.summary,
          c.language,
          c.metadata,
          f.path AS "filePath",
          c.embedding <=> $2::vector AS distance
        FROM "CodeChunk" c
        LEFT JOIN "CodeFile" f ON f.id = c."fileId"
        WHERE c."repositoryId" = $1
          AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> $2::vector
        LIMIT $3
      `,
      repositoryId,
      vector,
      TOP_K
    );

    const chunks = rows.map((row) => this.mapRow(row));
    return {
      intent,
      chunks,
      lowConfidence: !chunks.length || (rows[0]?.distance ?? 1) > LOW_CONFIDENCE_DISTANCE
    };
  }

  private mapRow(row: RetrievedChunkRow): RetrievedChunk {
    const metadata = this.normalizeMetadata(row.metadata);
    const filePath = metadata.filePath ?? row.filePath ?? "Unknown file";
    const symbol = typeof metadata.symbol === "string" ? metadata.symbol : undefined;
    const lineStart = typeof metadata.lineStart === "number" ? metadata.lineStart : undefined;
    const lineEnd = typeof metadata.lineEnd === "number" ? metadata.lineEnd : undefined;
    const score = Math.max(0, 1 - Number(row.distance));

    return {
      id: row.id,
      filePath,
      symbol,
      lineStart,
      lineEnd,
      reason: row.summary ?? `${metadata.chunkType ?? "Code"} context matched the question.`,
      excerpt: row.content.slice(0, 1400),
      score,
      metadata
    };
  }

  private normalizeMetadata(metadata: unknown): ChunkMetadata {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return {};
    }

    return metadata as ChunkMetadata;
  }
}
