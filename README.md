# CodeMap

CodeMap is a hosted onboarding assistant for engineering teams. This repository contains the MVP monorepo scaffold:

- `apps/web`: Next.js application for repository connection, chat, sync history, and architecture views.
- `apps/api`: NestJS API for GitHub connectivity, repository ingestion, retrieval, chat orchestration, and architecture summaries.
- `packages/shared`: Shared contracts used by both frontend and backend.
- `prisma`: Prisma schema for PostgreSQL + pgvector-backed metadata storage.
- `infra/docker`: Local infrastructure for PostgreSQL and Redis.

## Quick start

1. Copy `.env.example` to `.env`.
2. Install workspace dependencies with `npm install`.
3. Start infrastructure from `infra/docker/docker-compose.yml`.
4. Run `npm run dev:api` and `npm run dev:web`.

## MVP capabilities

- GitHub OAuth connection flow
- Single-repository onboarding dashboard
- Manual sync and sync-status tracking
- Retrieval-backed chat contracts with citations
- Lightweight architecture overview and dependency map
