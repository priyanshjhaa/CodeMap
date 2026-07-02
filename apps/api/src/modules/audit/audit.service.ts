import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service.js";

type AuditInput = {
  action: string;
  actorUserId: string;
  workspaceId?: string;
  repositoryId?: string;
  metadata?: Record<string, unknown>;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    try {
      await this.prisma.auditEvent.create({
        data: {
          action: input.action,
          actorUserId: input.actorUserId,
          workspaceId: input.workspaceId,
          repositoryId: input.repositoryId,
          metadata: input.metadata ? toJson(input.metadata) : undefined
        }
      });
    } catch (error) {
      this.logger.warn(`Could not record audit event ${input.action}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
