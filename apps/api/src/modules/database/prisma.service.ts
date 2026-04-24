import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async healthcheck() {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        database: "connected",
        vector: "pgvector-enabled",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }
}
