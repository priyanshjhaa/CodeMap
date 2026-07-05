import { Injectable } from "@nestjs/common";
import type { QueryIntent } from "@codemap/shared";
import { PrismaService } from "../database/prisma.service.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";

const TOP_K = 8;
const CANDIDATE_LIMIT = 24;
const LOW_CONFIDENCE_SCORE = 0.34;
const MAX_EXCERPT_CHARS = 1_000;
const MAX_QUERY_TERMS = 12;

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
  lexicalRank?: number;
  rankScore?: number;
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
    const vectorRows = await this.prisma.$queryRawUnsafe<RetrievedChunkRow[]>(
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
      CANDIDATE_LIMIT
    );

    const lexicalRows = await this.retrieveLexicalCandidates(repositoryId, question);
    const rows = this.mergeAndRankRows(vectorRows, lexicalRows, question).slice(0, TOP_K);
    const chunks = rows.map((row) => this.mapRow(row));
    return {
      intent,
      chunks,
      lowConfidence: !chunks.length || (chunks[0]?.score ?? 0) < LOW_CONFIDENCE_SCORE
    };
  }

  private async retrieveLexicalCandidates(repositoryId: string, question: string) {
    const terms = this.queryTerms(question);
    if (!terms.length) {
      return [];
    }

    const clauses = terms.map((_, index) => {
      const param = `$${index + 2}`;
      return `(LOWER(c.content) LIKE ${param} OR LOWER(COALESCE(c.summary, '')) LIKE ${param} OR LOWER(f.path) LIKE ${param})`;
    });

    return this.prisma.$queryRawUnsafe<RetrievedChunkRow[]>(
      `
        SELECT
          c.id,
          c.content,
          c.summary,
          c.language,
          c.metadata,
          f.path AS "filePath",
          1::float AS distance,
          (
            ${clauses.map((clause) => `CASE WHEN ${clause} THEN 1 ELSE 0 END`).join(" + ")}
          ) AS "lexicalRank"
        FROM "CodeChunk" c
        LEFT JOIN "CodeFile" f ON f.id = c."fileId"
        WHERE c."repositoryId" = $1
          AND (${clauses.join(" OR ")})
        ORDER BY "lexicalRank" DESC, c."chunkIndex" ASC
        LIMIT ${CANDIDATE_LIMIT}
      `,
      repositoryId,
      ...terms.map((term) => `%${term}%`)
    );
  }

  private mergeAndRankRows(vectorRows: RetrievedChunkRow[], lexicalRows: RetrievedChunkRow[], question: string) {
    const merged = new Map<string, RetrievedChunkRow>();

    for (const row of vectorRows) {
      merged.set(row.id, row);
    }

    for (const row of lexicalRows) {
      const existing = merged.get(row.id);
      if (!existing) {
        merged.set(row.id, row);
        continue;
      }

      merged.set(row.id, {
        ...existing,
        lexicalRank: Math.max(existing.lexicalRank ?? 0, row.lexicalRank ?? 0)
      });
    }

    return Array.from(merged.values())
      .map((row) => ({ ...row, rankScore: this.combinedScore(row, question) }))
      .sort((left, right) => (right.rankScore ?? 0) - (left.rankScore ?? 0));
  }

  private combinedScore(row: RetrievedChunkRow, question: string) {
    const metadata = this.normalizeMetadata(row.metadata);
    const vectorScore = Number.isFinite(row.distance) ? Math.max(0, 1 - Number(row.distance)) : 0;
    const lexicalScore = Math.min(0.3, (row.lexicalRank ?? 0) * 0.08);
    const normalizedQuestion = question.toLowerCase();
    const filePath = (metadata.filePath ?? row.filePath ?? "").toLowerCase();
    const symbol = (metadata.symbol ?? "").toLowerCase();
    const pathBoost = this.queryTerms(question).some((term) => filePath.includes(term)) ? 0.12 : 0;
    const symbolBoost = symbol && normalizedQuestion.includes(symbol) ? 0.18 : 0;
    const symbolChunkBoost = metadata.chunkType === "symbol" ? 0.04 : 0;

    return vectorScore + lexicalScore + pathBoost + symbolBoost + symbolChunkBoost;
  }

  private mapRow(row: RetrievedChunkRow): RetrievedChunk {
    const metadata = this.normalizeMetadata(row.metadata);
    const filePath = metadata.filePath ?? row.filePath ?? "Unknown file";
    const symbol = typeof metadata.symbol === "string" ? metadata.symbol : undefined;
    const lineStart = typeof metadata.lineStart === "number" ? metadata.lineStart : undefined;
    const lineEnd = typeof metadata.lineEnd === "number" ? metadata.lineEnd : undefined;
    const score = row.rankScore ?? Math.max(0, 1 - Number(row.distance));

    return {
      id: row.id,
      filePath,
      symbol,
      lineStart,
      lineEnd,
      reason: row.summary ?? `${metadata.chunkType ?? "Code"} context matched the question.`,
      excerpt: row.content.slice(0, MAX_EXCERPT_CHARS),
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

  private queryTerms(question: string) {
    return Array.from(
      new Set(
        question
          .toLowerCase()
          .replace(/[^a-z0-9_./-]+/g, " ")
          .split(/\s+/)
          .filter((term) => term.length >= 3)
          .filter((term) => !["where", "which", "what", "how", "does", "this", "that", "with", "from", "into", "implemented", "implementation"].includes(term))
      )
    ).slice(0, MAX_QUERY_TERMS);
  }
}
