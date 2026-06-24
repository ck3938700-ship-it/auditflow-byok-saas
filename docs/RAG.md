# RAG Design

AuditFlow uses a hybrid RAG model.

## Backend Responsibilities

- Document metadata.
- Chunk storage.
- Tenant-scoped retrieval.
- Citation mapping.
- Audit events for retrieval.

## Client Responsibilities

- Read BYOK provider config from local encrypted storage.
- Build the final prompt with retrieved citations.
- Call the LLM provider directly.
- Submit AI output to backend audit logging.

## Current Implementation

The current retrieval implementation uses tenant-scoped text search over stored chunks. It returns citation objects:

```ts
type Citation = {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  citationText: string;
  score: number;
};
```

## Production Upgrade Path

Replace text search with:

- pgvector in Postgres.
- Supabase Vector.
- Another tenant-filtered vector store.

Keep the citation response shape stable so the client prompt builder does not need to change.

