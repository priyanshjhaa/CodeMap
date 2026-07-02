import { Module } from "@nestjs/common";
import { SyncQueueService } from "./sync-queue.service.js";

@Module({
  providers: [SyncQueueService],
  exports: [SyncQueueService]
})
export class SyncQueueModule {}
