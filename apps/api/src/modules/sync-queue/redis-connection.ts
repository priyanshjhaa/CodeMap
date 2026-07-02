import type { RedisOptions } from "ioredis";
import { env } from "../../config/env.js";

export function redisConnectionOptions(): RedisOptions {
  const redisUrl = new URL(env.redisUrl);

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || 0) : 0,
    maxRetriesPerRequest: null
  };
}
