export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  repoStoragePath: process.env.REPO_STORAGE_PATH ?? "./tmp/repos"
};
