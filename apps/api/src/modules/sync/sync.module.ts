import { Module } from "@nestjs/common";
import { SyncService } from "./sync.service.js";

@Module({
  providers: [SyncService],
  exports: [SyncService]
})
export class SyncModule {}
