# Final Pre-Deployment Checklist

## Product Smoke Test

- GitHub OAuth sign-in works.
- Workspace creation works.
- Repository list shows public/private repos.
- Repository connect stores the backend repository id, not the GitHub provider id.
- Manual sync transitions through queued/indexing/ready.
- Sync cancellation works for queued or indexing jobs.
- Chat answer cites real indexed files/symbols.
- Architecture page renders the latest live snapshot.
- Repository delete removes CodeMap app data and redirects to the connect flow.
- GitHub access revoked state is visible when GitHub listing fails.

## Security And Data Controls

- GitHub tokens are encrypted at rest.
- `API_INTERNAL_SECRET` is required and shared only between web proxy and API.
- Repo-scoped endpoints check workspace membership.
- Audit events are recorded for repo connect/delete, sync request/cancel/complete/fail, chat ask, and GitHub disconnect.
- Repository disconnect deletes CodeMap data only.
- GitHub disconnect removes stored GitHub connection/session data.
- App logs do not include source code, retrieved excerpts, prompts, or secrets.

## Infrastructure

- Postgres has `pgvector` enabled.
- Redis is reachable from API and worker.
- API health endpoint returns `status: ok`.
- Worker process is running separately from API.
- `REPO_STORAGE_PATH` is writable and cleaned after sync tasks.
- GitHub webhook secret is configured before enabling webhooks.

## Verification Commands

```bash
npm run typecheck --workspaces
npm run test --workspaces --if-present
npm run build --workspaces
npm --workspace @codemap/api run prisma:deploy
```

## Deployment Gate

Do not deploy until every item above is confirmed in the target environment.
