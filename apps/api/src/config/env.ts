export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  apiInternalSecret: process.env.API_INTERNAL_SECRET ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  chatProvider: process.env.CHAT_PROVIDER ?? "openai",
  openAiChatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-5.4-mini",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqChatModel: process.env.GROQ_CHAT_MODEL ?? "openai/gpt-oss-120b",
  repoStoragePath: process.env.REPO_STORAGE_PATH ?? "./tmp/repos"
};
