# CodeMap Deployment Guide

## Target Topology

- Web: Vercel project for `apps/web`.
- API: container from `apps/api/Dockerfile`, command `node apps/api/dist/main.js`.
- Worker: same container image, command `node apps/api/dist/worker.js`.
- Database: managed PostgreSQL with `pgvector` enabled.
- Redis: managed Redis for BullMQ sync jobs.
- Storage: persistent writable volume or object-storage-backed path for `REPO_STORAGE_PATH`.

## Required Environment

API and worker:

- `DATABASE_URL`
- `REDIS_URL`
- `SYNC_QUEUE_NAME`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_WEBHOOK_SECRET`
- `ENCRYPTION_KEY`
- `API_INTERNAL_SECRET`
- `REPO_STORAGE_PATH`
- `EMBEDDINGS_PROVIDER`
- `CHAT_PROVIDER`
- `OPENAI_API_KEY` when OpenAI is selected
- `GROQ_API_KEY` when Groq is selected

Recommended defaults:

- `EMBEDDINGS_PROVIDER=local` unless you intentionally want OpenAI-backed retrieval vectors.
- `CHAT_PROVIDER=groq` when OpenAI quota/billing is unavailable.
- Repository sync and deterministic architecture generation should complete without OpenAI. Remote embedding failures are recorded as sync warnings instead of blocking file/chunk persistence.

Web:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `API_BASE_URL`
- `API_INTERNAL_SECRET`
- `NEXT_PUBLIC_USE_LIVE_API=true`
- `NEXT_PUBLIC_DEMO_MODE=false`

## Release Steps

1. Run `npm run typecheck --workspaces`.
2. Run `npm run test --workspaces --if-present`.
3. Run `npm run build --workspaces`.
4. Build the API image with `docker build -f apps/api/Dockerfile -t codemap-api:<version> .`.
5. Apply migrations with `npm --workspace @codemap/api run prisma:deploy`.
6. Deploy API container and verify `GET /api/health`.
7. Deploy worker container and verify it connects to Redis queue `SYNC_QUEUE_NAME`.
8. Deploy web on Vercel and verify GitHub OAuth callback.
9. Configure GitHub webhook URL: `https://<api-host>/api/github/webhooks`.
10. Smoke test repository connect, sync, chat citation, architecture, sync cancel, and repository deletion.

## Operational Notes

- Use separate API and worker processes. Do not run sync work inside the web process.
- Keep API and worker on the same image version.
- Use Node `22.x` everywhere and install dependencies from the committed `package-lock.json`.
- Rotate `API_INTERNAL_SECRET`, `NEXTAUTH_SECRET`, and `ENCRYPTION_KEY` through the platform secret manager.
- Do not log source code, retrieved excerpts, GitHub tokens, OpenAI/Groq keys, or raw prompt context.
- Monitor API 5xx rate, queue failures, sync duration, GitHub 403/429, and provider quota errors.
