import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { env } from "../../config/env.js";
import { redisConnectionOptions } from "./redis-connection.js";

export type SyncJobData = {
  syncId: string;
  repositoryId: string;
  userId: string;
};

@Injectable()
export class SyncQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(SyncQueueService.name);
  private readonly queue = new Queue<SyncJobData>(env.syncQueueName, {
    connection: redisConnectionOptions(),
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 }
    }
  });

  async enqueueSync(data: SyncJobData) {
    const job = await this.queue.add("repository-sync", data, {
      jobId: data.syncId
    });
    this.logger.log(`Queued repository sync ${data.syncId} as BullMQ job ${job.id}`);
    return job;
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
