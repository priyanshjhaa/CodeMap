# CodeMap Architecture Notes

## Services

- `apps/web`: user-facing experience for onboarding, repository selection, chat, and architecture views
- `apps/api`: source of truth for repository metadata, sync orchestration, retrieval contracts, and chat generation
- `PostgreSQL + pgvector`: repository metadata and vector storage
- `OpenAI embeddings`: required indexing backbone using `text-embedding-3-small`
- `Grounded chat provider`: configurable between OpenAI and Groq after retrieval

## MVP flow

1. User authenticates with GitHub OAuth.
2. A repository connection is created and bound to a workspace.
3. Sync jobs fetch repository content, parse TS/JS files, chunk code, and store OpenAI embeddings in pgvector.
4. Retrieval embeds the question, searches only the selected repository, and returns cited chunks.
5. Chat generation uses the retrieved chunks only; OpenAI or Groq can produce the final grounded answer.

## Deferred items

- Multi-repository graphing
- Redis/BullMQ worker execution for repository sync
- Webhook-based incremental sync
- IDE and chat-tool integrations
- Enterprise SSO and audit logs
