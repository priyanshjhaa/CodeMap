import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Worker } from "bullmq";
import { validateEnv, env } from "./config/env.js";
import { AppModule } from "./modules/common/app.module.js";
import { IngestionService } from "./modules/ingestion/ingestion.service.js";
import { redisConnectionOptions } from "./modules/sync-queue/redis-connection.js";
import type { SyncJobData } from "./modules/sync-queue/sync-queue.service.js";

async function bootstrapWorker() {
  validateEnv();
  const logger = new Logger("SyncWorker");
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn"]
  });
  const ingestionService = app.get(IngestionService);
  const worker = new Worker<SyncJobData>(
    env.syncQueueName,
    async (job) => {
      logger.log(`Processing sync job ${job.id} for repository ${job.data.repositoryId}`);
      await ingestionService.processQueuedSync(job.data.syncId, job.data.userId);
    },
    {
      connection: redisConnectionOptions(),
      concurrency: 1
    }
  );

  worker.on("completed", (job) => {
    logger.log(`Completed sync job ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    logger.error(`Failed sync job ${job?.id ?? "unknown"}: ${error.message}`, error.stack);
  });

  const shutdown = async () => {
    logger.log("Shutting down sync worker");
    await worker.close();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  logger.log(`Sync worker listening on queue ${env.syncQueueName}`);
}

void bootstrapWorker();
