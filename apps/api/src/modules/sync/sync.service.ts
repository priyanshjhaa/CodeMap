import { Injectable } from "@nestjs/common";
import type { SyncRun } from "@codemap/shared";

@Injectable()
export class SyncService {
  private readonly syncs: SyncRun[] = [
    {
      id: "sync_02",
      status: "ready",
      startedAt: "2026-04-12T10:00:00.000Z",
      completedAt: "2026-04-12T10:02:10.000Z",
      commitSha: "2f4ce1a",
      summary: {
        filesIndexed: 148,
        chunksCreated: 514,
        languages: ["TypeScript", "JavaScript", "Markdown"]
      }
    },
    {
      id: "sync_01",
      status: "failed",
      startedAt: "2026-04-11T16:12:00.000Z",
      completedAt: "2026-04-11T16:15:00.000Z",
      summary: {
        filesIndexed: 33,
        chunksCreated: 70,
        languages: ["TypeScript"]
      }
    }
  ];

  listSyncs() {
    return this.syncs;
  }

  queueSync() {
    const sync: SyncRun = {
      id: `sync_${Date.now()}`,
      status: "queued",
      startedAt: new Date().toISOString()
    };

    this.syncs.unshift(sync);
    return sync;
  }
}
