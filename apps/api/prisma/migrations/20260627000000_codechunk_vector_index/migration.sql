CREATE INDEX IF NOT EXISTS "CodeChunk_repositoryId_idx" ON "CodeChunk"("repositoryId");

CREATE INDEX IF NOT EXISTS "CodeChunk_embedding_cosine_idx"
ON "CodeChunk"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);
