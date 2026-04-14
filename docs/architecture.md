# CodeMap Architecture Notes

## Services

- `apps/web`: user-facing experience for onboarding, repository selection, chat, and architecture views
- `apps/api`: source of truth for repository metadata, sync orchestration, retrieval contracts, and chat generation
- `PostgreSQL + pgvector`: repository metadata and vector storage
- `Redis`: sync queueing and transient cache

## MVP flow

1. User authenticates with GitHub OAuth.
2. A repository connection is created and bound to a workspace.
3. Sync jobs fetch repository content, parse TS/JS files, chunk code, and generate embeddings.
4. Retrieval combines vector matches with metadata and structure-aware citations.
5. Chat answers and architecture views are returned to the dashboard.

## Deferred items

- Multi-repository graphing
- Webhook-based incremental sync
- IDE and chat-tool integrations
- Enterprise SSO and audit logs
