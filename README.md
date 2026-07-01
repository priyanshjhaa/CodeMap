# CodeMap

CodeMap is a hosted onboarding assistant for engineering teams. The MVP lets a developer connect one GitHub repository, sync/index source files, chat with indexed code, view citations, and read lightweight architecture insights.

## Repository Layout

- `apps/web`: Next.js app for auth, onboarding, dashboard, chat, sync history, and architecture views.
- `apps/api`: NestJS API for GitHub access, repository ingestion, retrieval, chat, and architecture snapshots.
- `packages/shared`: Shared frontend/API contracts.
- `packages/ui`: Shared UI package placeholder.
- `infra/docker`: Local PostgreSQL with pgvector and Redis.

## Local Requirements

- Node.js `22.x` (`nvm use` reads `.nvmrc`).
- Docker Desktop or another Docker-compatible runtime.
- A GitHub OAuth app for live private/public repo access.
- Optional Groq/OpenAI keys for live chat providers. Local embeddings are the default for development.

## Fresh Clone Setup

1. Install dependencies.

```bash
npm install
```

2. Copy env files.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Set required env values.

- `DATABASE_URL`: for the default compose file, use `postgresql://postgres:postgres@localhost:5432/codemap?schema=public`.
- `ENCRYPTION_KEY`: generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `API_INTERNAL_SECRET`: use the same random value in `apps/api/.env` and `apps/web/.env`.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: required for live GitHub OAuth.
- `EMBEDDINGS_PROVIDER=local`: recommended for local development.
- `CHAT_PROVIDER=groq` plus `GROQ_API_KEY`, or `CHAT_PROVIDER=openai` plus `OPENAI_API_KEY`.

4. Start local infrastructure.

```bash
npm run dev:infra
```

5. Generate Prisma, apply migrations, and seed demo data.

```bash
npm run setup:local
```

6. Run web and API together.

```bash
npm run dev
```

The API runs on `http://localhost:4000`, and the web app runs on `http://localhost:3000`.

## Health Check

```bash
curl http://localhost:4000/api/health
```

The health endpoint reports database connectivity and configured provider names only. It never returns secrets.

## Demo Mode vs Live Mode

Demo mode is mock-driven and does not require the Nest API:

```env
NEXT_PUBLIC_DEMO_MODE="true"
CODEMAP_DEMO_MODE="true"
NEXT_PUBLIC_USE_LIVE_API="false"
```

Live mode requires the Next.js proxy to reach the Nest API:

```env
NEXT_PUBLIC_DEMO_MODE="false"
CODEMAP_DEMO_MODE="false"
NEXT_PUBLIC_USE_LIVE_API="true"
API_BASE_URL="http://localhost:4000"
```

In live mode, backend failures are shown as errors instead of silently falling back to partial GitHub-only behavior.

## Common Commands

```bash
npm run dev              # API + web together
npm run dev:web          # Next.js only
npm run dev:api          # NestJS only
npm run dev:infra        # Postgres + Redis
npm run setup:local      # Prisma generate + deploy + seed
npm run typecheck        # all workspaces
npm run build            # all workspaces
npm run test             # all workspace tests
```

If Next.js reports missing chunks or stale build files:

```bash
rm -rf apps/web/.next
npm run dev:web
```

## Current MVP Capabilities

- GitHub OAuth through NextAuth and Nest-backed token persistence.
- Workspace creation and repository connection.
- Manual repository sync from GitHub default-branch tarballs.
- TS/JS-first parsing, chunking, local/OpenAI embeddings, and pgvector retrieval.
- Grounded chat through Groq or OpenAI with citations.
- Lightweight architecture snapshots generated from indexed metadata.
- Repository disconnect/data deletion from CodeMap app storage.

## Notes

- Redis is included in local infra for future queue work, but Phase 6 still uses in-process sync tasks.
- Repository disconnect deletes CodeMap data only; it does not revoke the user's GitHub OAuth grant.
- Generated files such as `.next`, `dist`, `coverage`, logs, temp repos, `.DS_Store`, and `*.tsbuildinfo` should not be tracked.
