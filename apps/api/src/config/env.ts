export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  syncQueueName: process.env.SYNC_QUEUE_NAME ?? "codemap-sync",
  githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  apiInternalSecret: process.env.API_INTERNAL_SECRET ?? "",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  embeddingsProvider: process.env.EMBEDDINGS_PROVIDER ?? "local",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  chatProvider: process.env.CHAT_PROVIDER ?? "groq",
  openAiChatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-5.4-mini",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqChatModel: process.env.GROQ_CHAT_MODEL ?? "openai/gpt-oss-120b",
  repoStoragePath: process.env.REPO_STORAGE_PATH ?? "./tmp/repos"
};

export function validateEnv() {
  const missing: string[] = [];
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (!env.redisUrl) missing.push("REDIS_URL");
  if (!env.apiInternalSecret) missing.push("API_INTERNAL_SECRET");
  if (!env.repoStoragePath) missing.push("REPO_STORAGE_PATH");

  if (!/^[a-f0-9]{64}$/i.test(env.encryptionKey)) {
    missing.push("ENCRYPTION_KEY (64 hex characters)");
  }

  if (!["local", "openai"].includes(env.embeddingsProvider)) {
    throw new Error("EMBEDDINGS_PROVIDER must be either local or openai.");
  }

  if (!["openai", "groq"].includes(env.chatProvider)) {
    throw new Error("CHAT_PROVIDER must be either openai or groq.");
  }

  if (env.embeddingsProvider === "openai" && !env.openAiApiKey) {
    missing.push("OPENAI_API_KEY for EMBEDDINGS_PROVIDER=openai");
  }

  if (env.chatProvider === "openai" && !env.openAiApiKey) {
    missing.push("OPENAI_API_KEY for CHAT_PROVIDER=openai");
  }

  if (env.chatProvider === "groq" && !env.groqApiKey) {
    missing.push("GROQ_API_KEY for CHAT_PROVIDER=groq");
  }

  if (missing.length) {
    throw new Error(`Missing or invalid API environment: ${missing.join(", ")}`);
  }
}
