# CodeMap

CodeMap is a hosted onboarding assistant for engineering teams. This repository contains the MVP monorepo scaffold:

- `apps/web`: Next.js application for repository connection, chat, sync history, and architecture views.
- `apps/api`: NestJS API for GitHub connectivity, repository ingestion, retrieval, chat orchestration, and architecture summaries.
- `packages/shared`: Shared contracts used by both frontend and backend.
- `prisma`: Prisma schema for PostgreSQL + pgvector-backed metadata storage.
- `infra/docker`: Local infrastructure for PostgreSQL and Redis.

## Quick start

1. Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env`.
2. Install workspace dependencies with `npm install`.
3. Start infrastructure from `infra/docker/docker-compose.yml`.
4. Generate Prisma and apply migrations:

```bash
npm --workspace @codemap/api run prisma:generate
npm --workspace @codemap/api run prisma:migrate
```

For deployment, use `npm --workspace @codemap/api run prisma:deploy` instead.

5. Run `npm run dev:api` and `npm run dev:web`.

## Authentication and API setup

- NextAuth owns the browser GitHub OAuth session and forwards the OAuth callback to Nest.
- Nest persists users, backend OAuth sessions, workspaces, memberships, encrypted GitHub connections, and connected repositories in PostgreSQL.
- `API_INTERNAL_SECRET` must match in both apps. It protects the authenticated Next.js-to-Nest proxy headers.
- Set `NEXT_PUBLIC_DEMO_MODE=true` only when intentionally running the client against its demo fallback.
- Set `NEXT_PUBLIC_USE_LIVE_API=true` with `API_BASE_URL` when running the full Nest/Postgres backend flow.
- Without `API_BASE_URL`, onboarding can still list GitHub repositories directly from the signed-in NextAuth session, but backend-backed sync/chat/architecture data stays mocked.
- `OPENAI_API_KEY` is required for live sync embeddings and grounded chat. Sync uses `text-embedding-3-small`; chat uses `gpt-5.4-mini`.

Run the web app locally:

```bash
npm install
npm run dev:web
```

If Next.js reports missing chunks or stale build files, stop the dev server and clear the local cache:

```bash
rm -rf apps/web/.next
npm run dev:web
```

Verify the frontend before moving to backend integration:

```bash
npm run typecheck --workspace @codemap/web
npm run build --workspace @codemap/web
```

## MVP capabilities

- GitHub OAuth connection flow
- Single-repository onboarding dashboard
- Manual sync and sync-status tracking
- Retrieval-backed chat contracts with citations
- Lightweight architecture overview and dependency map
