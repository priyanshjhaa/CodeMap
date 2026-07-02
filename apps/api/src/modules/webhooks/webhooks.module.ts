import { Module } from "@nestjs/common";
import { IngestionModule } from "../ingestion/ingestion.module.js";
import { GithubWebhookController } from "./github-webhook.controller.js";

@Module({
  imports: [IngestionModule],
  controllers: [GithubWebhookController]
})
export class WebhooksModule {}
