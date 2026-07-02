import { Body, Controller, Headers, Post, Req, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { PrismaService } from "../database/prisma.service.js";
import { IngestionService } from "../ingestion/ingestion.service.js";

type GitHubPushPayload = {
  ref?: string;
  after?: string;
  repository?: {
    id?: number;
    default_branch?: string;
    full_name?: string;
  };
};

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller("github/webhooks")
export class GithubWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestionService: IngestionService
  ) {}

  @Post()
  async handleWebhook(
    @Headers("x-github-event") event: string | undefined,
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Body() payload: GitHubPushPayload,
    @Req() request: RawBodyRequest
  ) {
    this.verifySignature(signature, request.rawBody);

    if (event !== "push") {
      return { accepted: true, ignored: true, reason: "Only push events trigger repository sync." };
    }

    const providerRepoId = payload.repository?.id ? String(payload.repository.id) : "";
    const defaultBranch = payload.repository?.default_branch ?? "main";
    const pushedBranch = payload.ref?.replace("refs/heads/", "");

    if (!providerRepoId) {
      return { accepted: true, ignored: true, reason: "Payload did not include a repository id." };
    }

    if (pushedBranch && pushedBranch !== defaultBranch) {
      return { accepted: true, ignored: true, reason: "Push was not for the default branch." };
    }

    const repository = await this.prisma.repository.findUnique({
      where: { providerRepoId },
      include: { connection: true }
    });

    if (!repository) {
      return { accepted: true, ignored: true, reason: "Repository is not connected in CodeMap." };
    }

    const progress = await this.ingestionService.queueWebhookSync({
      repositoryId: repository.id,
      userId: repository.connection.userId,
      commitSha: payload.after
    });

    return {
      accepted: true,
      ignored: false,
      repositoryId: repository.id,
      sync: progress
    };
  }

  private verifySignature(signature: string | undefined, rawBody: Buffer | undefined) {
    if (!env.githubWebhookSecret) {
      return;
    }

    if (!signature || !rawBody) {
      throw new UnauthorizedException("Missing GitHub webhook signature.");
    }

    const expected = `sha256=${createHmac("sha256", env.githubWebhookSecret)
      .update(rawBody)
      .digest("hex")}`;
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new UnauthorizedException("Invalid GitHub webhook signature.");
    }
  }
}
