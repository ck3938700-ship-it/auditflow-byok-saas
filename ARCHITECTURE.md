# AuditFlow BYOK SaaS Boilerplate Architecture

> Production-ready BYOK AI SaaS boilerplate for enterprise knowledge workflows, approvals, audit logs, and multi-tenant governance.

## 1. BYOK SaaS Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────┐
│                           User Browser                              │
│                                                                    │
│  ┌──────────────────────┐      ┌────────────────────────────────┐  │
│  │ Next.js / React UI    │      │ BYOK AI Execution Layer        │  │
│  │                      │      │                                │  │
│  │ Dashboard            │      │ Provider adapters              │  │
│  │ Knowledge Base       │─────▶│ - OpenAI                       │  │
│  │ Ask AI               │      │ - DeepSeek                     │  │
│  │ Draft Generator      │      │ - Claude                       │  │
│  │ Approvals            │      │                                │  │
│  │ Audit Logs           │      │ API key source                 │  │
│  │ Settings             │      │ - localStorage encrypted blob  │  │
│  └──────────┬───────────┘      │ - local env in self-host mode  │  │
│             │                  └───────────────┬────────────────┘  │
│             │                                  │                   │
│             │                                  ▼                   │
│             │                        Mode A: direct browser call     │
│             │                        OpenAI / DeepSeek / Claude      │
│             │                        User-owned API key only         │
└─────────────┼──────────────────────────────────────────────────────┘
              │
              │ Authenticated app API calls
              │ No LLM API key is sent to hosted backend
              ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Backend / Cloud Service                       │
│                                                                    │
│  ┌─────────────────────┐   ┌─────────────────────┐                 │
│  │ Auth + Tenant Guard │   │ Workflow Engine      │                 │
│  │ Sessions / roles    │   │ Risk / approvals     │                 │
│  └──────────┬──────────┘   └──────────┬──────────┘                 │
│             │                         │                            │
│  ┌──────────▼──────────┐   ┌──────────▼──────────┐                 │
│  │ Document Metadata   │   │ Audit Log API        │                 │
│  │ chunks / citations  │   │ input / context /    │                 │
│  │ no API keys         │   │ output / model        │                 │
│  └──────────┬──────────┘   └──────────┬──────────┘                 │
│             │                         │                            │
│             ▼                         ▼                            │
│        Postgres + pgvector / Supabase Vector                        │
│        Tenant-isolated relational data and vector chunks             │
│                                                                    │
│        R2 / S3 object storage for uploaded documents                 │
└────────────────────────────────────────────────────────────────────┘

Optional enterprise deployment:

┌────────────────────────────────────────────────────────────────────┐
│                   User-hosted Secure Proxy Mode                     │
│                                                                    │
│  Browser ──▶ Customer-owned proxy ──▶ LLM provider                  │
│             Customer env secrets      OpenAI / DeepSeek / Claude    │
│                                                                    │
│  The public SaaS backend still never receives or stores API keys.    │
└────────────────────────────────────────────────────────────────────┘
```

Core rule:

- The hosted backend never receives, stores, logs, proxies, or calls with a user's LLM API key.
- Mode A uses browser-side BYOK calls.
- Mode B uses a user-hosted secure proxy controlled by the customer.
- Backend APIs manage tenants, users, workflows, approvals, document metadata, chunks, retrieval, and audit logs.

## 2. System Modules Breakdown

### Frontend Application

- GitHub-style SaaS shell with sidebar navigation.
- Responsible for all LLM calls in BYOK mode.
- Stores the user's provider, model, and encrypted API key locally.
- Sends AI results and evidence metadata to backend audit APIs.

Main modules:

- Dashboard
- Knowledge Base
- Ask AI
- Draft Generator
- Approval Queue
- Audit Logs
- Settings

### BYOK AI Execution Layer

- Provider-neutral TypeScript adapters.
- Supports OpenAI, DeepSeek, and Claude.
- Supports two execution modes:
  - Mode A: client-side BYOK direct provider calls.
  - Mode B: optional user-hosted secure proxy.
- Reads API key only from user-controlled client storage or customer-owned self-host environment.
- Normalizes message input and model output.
- Adds client-side risk scoring before workflow submission.

### Backend Application

- Multi-tenant API server.
- Auth, sessions, roles, tenant membership.
- Workflow lifecycle management.
- Human approval state machine.
- Audit log persistence.
- Document metadata and chunk management.
- Object storage signed upload URLs.
- Retrieval API filtered by tenant.
- Hash-chain audit integrity checks.

Strictly forbidden:

- Hosted SaaS backend calling OpenAI / DeepSeek / Claude.
- Hosted SaaS backend accepting API keys in request bodies.
- Hosted SaaS backend storing API keys in database, logs, traces, or audit events.

Allowed only in user-hosted enterprise mode:

- A customer-owned proxy may call LLM providers using customer-managed secrets.
- The proxy must live outside the hosted SaaS trust boundary.
- The proxy should expose a narrow `/proxy/llm` API and enforce tenant/customer auth locally.

### Database

- Relational multi-tenant schema.
- Every business table includes `tenant_id`.
- Uses database constraints and application middleware to enforce tenant isolation.
- Optional row-level security for Postgres/Supabase deployments.

### Storage

- R2 or S3 for original files.
- Database stores metadata and object key only.
- Tenant-specific object prefix:

```text
tenants/{tenant_id}/documents/{document_id}/{filename}
```

### Vector Store

- pgvector or Supabase Vector.
- Stores embeddings for document chunks.
- Embeddings are created client-side in strict BYOK mode, or by a self-host worker in local mode.
- Backend may store vectors, but never sees the API key used to create them.

## 3. Repo File Structure

```text
auditflow-byok-saas/
  README.md
  LICENSE
  .env.example
  .gitignore
  package.json
  pnpm-workspace.yaml
  turbo.json

  apps/
    web/
      app/
        layout.tsx
        page.tsx
        dashboard/page.tsx
        knowledge/page.tsx
        ask/page.tsx
        drafts/page.tsx
        approvals/page.tsx
        audit/page.tsx
        settings/page.tsx
        api/
          auth/[...route]/route.ts
          tenants/route.ts
          workflows/route.ts
          documents/route.ts
          audit/route.ts
      components/
        app-sidebar.tsx
        page-header.tsx
        metric-card.tsx
        workflow-status.tsx
        citation-card.tsx
        approval-card.tsx
        api-key-settings.tsx
      lib/
        server/
          auth.ts
          tenant-context.ts
          api-guard.ts
        client/
          use-local-api-key.ts
          browser-crypto.ts
      styles/
        globals.css

  packages/
    ai-client/
      src/
        index.ts
        types.ts
        providers/
          openai.ts
          deepseek.ts
          claude.ts
        risk.ts
        citations.ts
        local-key-store.ts
        secure-proxy-client.ts
      package.json

    secure-proxy/
      src/
        index.ts
        auth.ts
        providers/
          openai.ts
          deepseek.ts
          claude.ts
        redaction.ts
      package.json

    db/
      prisma/
        schema.prisma
        migrations/
      src/
        client.ts
        tenant.ts
      package.json

    workflow/
      src/
        workflow-engine.ts
        risk-rules.ts
        approvals.ts
        audit-events.ts
      package.json

    rag/
      src/
        chunking.ts
        pdf-extract.ts
        embeddings-client.ts
        vector-search.ts
        citation-map.ts
        retrieval-api.ts
      package.json

    audit/
      src/
        hash-chain.ts
        append-only-log.ts
        verify-chain.ts
      package.json

    ui/
      src/
        button.tsx
        card.tsx
        table.tsx
        badge.tsx
        dialog.tsx
      package.json

  docs/
    architecture.md
    byok-security.md
    secure-proxy-mode.md
    api.md
    database-schema.md
    audit-hash-chain.md
    deployment.md
    contributing.md
```

## 4. Frontend Design

### Pages

#### `/dashboard`

Purpose:

- Executive overview for the tenant workspace.

Components:

- Metric cards: documents, active workflows, pending approvals, high-risk items.
- Recent AI activity.
- Workflow funnel: AI generated → risk scored → approval required → final output.
- Tenant usage summary.

#### `/knowledge`

Purpose:

- Manage documents and document chunks.

Components:

- Document upload panel.
- Document table.
- Chunk indexing status.
- Citation preview.
- Re-index button.

#### `/ask`

Purpose:

- BYOK AI Q&A with citations.

Components:

- Provider/model indicator.
- Question input.
- Retrieved context preview.
- AI answer panel.
- Citation cards.
- "Create workflow" action.
- "Send to approval" action.

#### `/drafts`

Purpose:

- Generate controlled business drafts.

Components:

- Template selector.
- Context form.
- Risk rules preview.
- Generated draft.
- Submit for approval button.

#### `/approvals`

Purpose:

- Human-in-the-loop review.

Components:

- Approval queue.
- Risk badges.
- Evidence panel.
- Approve / request changes / reject actions.
- Final output timeline.

#### `/audit`

Purpose:

- Immutable operational record.

Components:

- Filter by user, workflow, model, risk level, timestamp.
- Audit event table.
- Context and output detail drawer.
- Export JSON / CSV.

#### `/settings`

Purpose:

- Configure BYOK provider and local API key.

Components:

- Provider selector: OpenAI / DeepSeek / Claude.
- Model selector.
- API key input.
- Local encrypted storage toggle.
- Test connection button.
- "Clear local key" button.
- Warning that backend never receives the key.

### Component Principles

- GitHub-style layout.
- Plain enterprise UI.
- Dense, scannable tables.
- No decorative hero page for the app itself.
- Clear risk and approval states.
- Every AI output shows evidence and audit state.

## 5. Backend API Design

Backend APIs are tenant-scoped and authenticated.

No API accepts LLM API keys.

### `/api/auth`

Responsibilities:

- Sign in.
- Sign out.
- Session.
- Invite acceptance.

Example endpoints:

```text
POST /api/auth/sign-in
POST /api/auth/sign-out
GET  /api/auth/session
POST /api/auth/invitations/accept
```

### `/api/tenants`

Responsibilities:

- Tenant workspace management.
- Membership.
- Roles.

Example endpoints:

```text
GET  /api/tenants/current
POST /api/tenants
GET  /api/tenants/:tenantId/members
POST /api/tenants/:tenantId/members
PATCH /api/tenants/:tenantId/members/:userId
```

### `/api/documents`

Responsibilities:

- Document metadata.
- Signed upload URL.
- Chunk records.
- Citation mapping.

Example endpoints:

```text
GET  /api/documents
POST /api/documents
POST /api/documents/:documentId/upload-url
POST /api/documents/:documentId/chunks
GET  /api/documents/:documentId/chunks
PATCH /api/documents/:documentId/status
```

### `/api/retrieval`

Responsibilities:

- Tenant-filtered retrieval over document chunks.
- Vector search or keyword fallback.
- Returns citation-ready chunks.
- Does not call LLM providers.
- Does not accept or store LLM API keys.

Example endpoints:

```text
POST /api/retrieval/search
POST /api/retrieval/vector-search
GET  /api/retrieval/chunks/:chunkId
```

Search payload:

```json
{
  "query": "What should a probation termination notice include?",
  "query_vector": [0.012, -0.034],
  "mode": "vector",
  "limit": 8
}
```

Search response:

```json
{
  "matches": [
    {
      "document_id": "doc_123",
      "document_title": "Employee Handbook 2026",
      "chunk_id": "chunk_456",
      "chunk_index": 8,
      "citation_label": "Section 3.1",
      "citation_text": "Employment conditions must be disclosed...",
      "score": 0.84
    }
  ]
}
```

### `/api/workflows`

Responsibilities:

- Workflow lifecycle.
- Risk state.
- AI output record reference.
- Final output.

Example endpoints:

```text
GET  /api/workflows
POST /api/workflows
GET  /api/workflows/:workflowId
PATCH /api/workflows/:workflowId
POST /api/workflows/:workflowId/submit-for-approval
POST /api/workflows/:workflowId/finalize
```

### `/api/approvals`

Responsibilities:

- Approval queue.
- Reviewer actions.

Example endpoints:

```text
GET  /api/approvals
POST /api/approvals
POST /api/approvals/:approvalId/approve
POST /api/approvals/:approvalId/request-changes
POST /api/approvals/:approvalId/reject
```

### `/api/audit`

Responsibilities:

- Store audit events after client-side AI execution.
- Retrieve audit trail.
- Export events.

Example endpoints:

```text
GET  /api/audit
POST /api/audit
GET  /api/audit/:auditLogId
GET  /api/audit/export
```

Audit create payload:

```json
{
  "tenant_id": "tenant_123",
  "workflow_id": "workflow_123",
  "event_type": "ai.output.generated",
  "user_input": "What should a probation termination notice include?",
  "retrieved_context": [
    {
      "document_id": "doc_123",
      "chunk_id": "chunk_456",
      "chunk_index": 8,
      "citation_text": "Employment conditions must be disclosed..."
    }
  ],
  "ai_output": "The notice should include...",
  "model_provider": "openai",
  "model_name": "gpt-4.1-mini",
  "risk_score": 0.82
}
```

Forbidden fields:

```text
api_key
secret
provider_token
authorization
```

## 6. Database Schema

Every business table contains `tenant_id`.

Recommended database:

- Postgres
- Prisma
- pgvector extension for vector search

### `tenants`

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `users`

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `roles`

```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);
```

### `tenant_memberships`

```sql
create table tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
```

### `workflows`

```sql
create table workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  created_by uuid not null references users(id),
  title text not null,
  workflow_type text not null,
  status text not null default 'draft',
  risk_score numeric(5,4),
  approval_required boolean not null default false,
  final_output text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `documents`

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  uploaded_by uuid not null references users(id),
  title text not null,
  file_name text not null,
  mime_type text,
  storage_provider text not null default 'r2',
  storage_key text not null,
  status text not null default 'uploaded',
  checksum text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `document_chunks`

```sql
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  heading text,
  content text not null,
  token_count integer,
  citation_label text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);
```

### `embeddings`

```sql
create extension if not exists vector;

create table embeddings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_chunk_id uuid not null references document_chunks(id) on delete cascade,
  provider text not null,
  model text not null,
  dimensions integer not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_chunk_id, provider, model)
);
```

Note:

- Dimensions depend on embedding model.
- In production, use the correct vector dimension for selected embedding provider.

### `audit_logs`

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references users(id),
  workflow_id uuid references workflows(id),
  sequence bigint not null,
  event_type text not null,
  user_input text,
  retrieved_context jsonb not null default '[]',
  ai_output text,
  model_provider text,
  model_name text,
  risk_score numeric(5,4),
  previous_hash text,
  entry_hash text not null,
  hash_algorithm text not null default 'sha256',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (tenant_id, sequence)
);
```

Must not store:

- API keys
- Authorization headers
- Raw provider tokens
- Browser local key material

### `approvals`

```sql
create table approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  workflow_id uuid not null references workflows(id) on delete cascade,
  requested_by uuid not null references users(id),
  reviewer_id uuid references users(id),
  status text not null default 'pending',
  risk_score numeric(5,4),
  request_note text,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended indexes:

```sql
create index idx_workflows_tenant_status on workflows (tenant_id, status);
create index idx_documents_tenant_status on documents (tenant_id, status);
create index idx_chunks_tenant_document on document_chunks (tenant_id, document_id);
create index idx_audit_tenant_created on audit_logs (tenant_id, created_at desc);
create index idx_approvals_tenant_status on approvals (tenant_id, status);
```

## 7. BYOK AI Execution Design

### Local API Key Storage

Settings page stores:

- Provider
- Model
- Encrypted API key
- Last test status
- Execution mode: `client` or `secure_proxy`

Storage location:

```text
localStorage["auditflow.byok.settings"]
```

Suggested shape:

```ts
type LocalByokSettings = {
  provider: "openai" | "deepseek" | "claude";
  model: string;
  mode: "client" | "secure_proxy";
  encryptedApiKey: string;
  iv: string;
  secureProxyUrl?: string;
  updatedAt: string;
};
```

Encryption:

- Use Web Crypto API.
- Derive a key from a user-provided local passphrase, or use a browser session key for convenience mode.
- Be explicit that localStorage is device-local and user-controlled.
- Enterprise users should prefer Secure Proxy Mode when browser-side key exposure is not acceptable.

### Execution Modes

#### Mode A: Client-side BYOK

The browser calls the LLM provider directly.

Advantages:

- Zero platform custody of API keys.
- Clone-and-run friendly.
- Best for demos, individuals, internal pilots, and lightweight self-service.

Tradeoffs:

- API key exists in browser memory during use.
- CORS support varies by provider.
- Harder to centralize rate limits and abuse controls.
- Enterprise buyers may reject pure browser-side key handling.

#### Mode B: Optional Secure Proxy Mode

The customer self-hosts a small proxy service in their own infrastructure.

```text
Browser ──▶ Customer-owned secure proxy ──▶ LLM provider
```

Rules:

- The hosted SaaS backend still never receives API keys.
- The proxy is optional and lives in the customer's trust boundary.
- API keys are stored as customer-managed environment variables or customer secret manager entries.
- The proxy should expose only narrow AI endpoints such as `/proxy/llm` and `/proxy/embeddings`.
- The proxy must redact secrets from logs.

This mode makes the boilerplate enterprise-adoptable while preserving BYOK.

### Provider Adapter

```ts
type LLMProvider = "openai" | "deepseek" | "claude";
type LLMExecutionMode = "client" | "secure_proxy";

type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LLMCallInput = {
  provider: LLMProvider;
  mode: LLMExecutionMode;
  apiKey?: string;
  secureProxyUrl?: string;
  model: string;
  messages: LLMMessage[];
  temperature?: number;
};

type LLMCallResult = {
  text: string;
  raw?: unknown;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};
```

Unified call:

```ts
async function callLLM(input: LLMCallInput): Promise<LLMCallResult> {
  if (input.mode === "secure_proxy") return callSecureProxy(input);
  if (input.provider === "openai") return callOpenAI(input);
  if (input.provider === "deepseek") return callDeepSeek(input);
  if (input.provider === "claude") return callClaude(input);
  throw new Error("Unsupported provider");
}
```

### BYOK Flow

Mode A:

```text
1. User opens Settings.
2. User selects provider and model.
3. User enters API key.
4. Frontend encrypts and stores key locally.
5. User asks a question.
6. Frontend calls backend retrieval API for relevant chunks.
7. Frontend builds prompt with retrieved context.
8. Frontend calls LLM provider directly with user API key.
9. Frontend computes risk score.
10. Frontend sends audit payload to backend.
11. Backend appends audit log without API key.
12. If risk is high, frontend creates approval workflow.
```

Mode B:

```text
1. Enterprise admin deploys secure proxy in customer environment.
2. Admin configures provider keys in customer secret manager or env.
3. User selects Secure Proxy Mode in Settings.
4. Browser calls customer proxy for LLM / embeddings.
5. Browser sends AI output and context to hosted backend audit API.
6. Hosted backend stores workflow state and append-only audit log.
```

### Test Connection

Settings page "Test connection" should:

- In Client-side BYOK mode, make a tiny direct browser call to selected provider.
- In Secure Proxy Mode, call the customer-owned proxy health/test endpoint.
- Never send keys to the hosted backend.
- Show:
  - Provider reachable.
  - Model valid.
  - Key accepted.
  - Current execution mode.

## 8. RAG System Design

The RAG architecture is hybrid:

- Backend handles document storage, chunk records, vector database, and retrieval API.
- Client handles prompt construction and LLM execution.
- Embedding generation can be client-side BYOK or customer-proxy based.

### Document Upload

```text
1. Frontend requests signed upload URL from backend.
2. Frontend uploads file to R2/S3.
3. Backend stores document metadata.
4. Backend queues or runs document parsing and chunk creation.
5. Backend stores chunks with tenant_id and citation labels.
6. Embeddings are created by:
   - browser BYOK call, then submitted to backend, or
   - customer-hosted secure proxy, or
   - local keyword fallback in demo mode.
7. Backend stores vectors filtered by tenant_id.
8. Ask AI uses backend retrieval API to return cited chunks.
```

### Chunking

Chunking strategy:

- Preserve headings.
- Preserve clause numbers.
- Target 500-900 tokens per chunk.
- Keep overlap of 80-120 tokens.
- Store citation label.
- Run in backend or worker layer for large documents.
- Avoid relying on browser-only PDF parsing for production.

Example chunk:

```json
{
  "document_id": "doc_123",
  "chunk_index": 12,
  "heading": "4.2 Sick Leave Salary",
  "content": "During certified sick leave...",
  "citation_label": "Employee Handbook 2026, Section 4.2"
}
```

### Retrieval

Hybrid retrieval:

```text
1. User asks a question.
2. Query embedding is generated:
   - in browser with user key, or
   - by customer-owned secure proxy, or
   - skipped in keyword fallback mode.
3. Frontend sends query vector or query text to backend retrieval API.
4. Backend performs tenant-filtered vector / keyword search.
5. Backend returns matching chunks and citation metadata.
6. Frontend builds prompt with citations.
7. Frontend executes LLM call via selected BYOK mode.
8. Frontend posts AI output and retrieved context to audit API.
```

Demo / no-key mode:

- Use keyword search.
- Use BM25-like scoring or simple lexical search.
- Still return citation mapping.

### Citation Mapping

Each AI output should reference:

- `document_id`
- `document_title`
- `chunk_id`
- `chunk_index`
- `citation_label`
- `citation_text`

The UI should display:

```text
[1] Employee Handbook 2026, Section 4.2
Original excerpt: ...
```

## 9. Security Model

### BYOK Isolation

Rules:

- API keys live only in the user's browser or customer-owned secure proxy environment.
- Hosted backend never receives keys.
- Hosted backend logs must redact secret-like fields.
- API request validation rejects forbidden key fields.
- Secure Proxy Mode is not a platform proxy. It is a customer-hosted component.

Forbidden backend payload keys:

```text
apiKey
api_key
key
secret
token
authorization
providerToken
openaiKey
claudeKey
deepseekKey
```

### Multi-tenant Isolation

Controls:

- Every business table includes `tenant_id`.
- API middleware resolves active tenant from session.
- All queries include `tenant_id`.
- Optional Postgres RLS for hosted deployments.
- Object storage keys are tenant-prefixed.
- Vector search filters by tenant before similarity ranking.

### Audit Integrity

Audit log should capture:

- user input
- retrieved context
- AI output
- provider and model name
- risk score
- workflow ID
- tenant ID
- user ID
- timestamp
- previous hash
- current hash
- append sequence

Audit log should not capture:

- API key
- authorization header
- browser local key store
- provider raw request headers

### Append-only Hash Chain

AuditFlow should use a lightweight hash chain to make tampering detectable.

Each audit log stores:

```text
sequence
previous_hash
entry_hash
hash_algorithm
```

Hash input:

```text
canonical_json({
  tenant_id,
  user_id,
  workflow_id,
  event_type,
  user_input,
  retrieved_context,
  ai_output,
  model_provider,
  model_name,
  risk_score,
  created_at,
  previous_hash
})
```

Properties:

- Logs are append-only at the application layer.
- Updates and deletes are disallowed for audit records.
- Verification recomputes the chain per tenant.
- Any modified historical entry breaks the chain.
- This is not a full blockchain or WORM archive, but it is a strong lightweight audit upgrade for a SaaS boilerplate.

Database additions:

```sql
alter table audit_logs
  add column sequence bigint,
  add column previous_hash text,
  add column entry_hash text,
  add column hash_algorithm text not null default 'sha256';

create unique index idx_audit_tenant_sequence
  on audit_logs (tenant_id, sequence);
```

Audit write flow:

```text
1. Resolve tenant_id.
2. Fetch latest audit log sequence and entry_hash for tenant.
3. Create canonical event payload.
4. Compute entry_hash = sha256(payload + previous_hash).
5. Insert new row.
6. Never update the row after insertion.
```

### Workflow Risk Guardrails

High-risk categories:

- Termination / dismissal
- Contract modification
- Salary or finance handling
- Compliance breach
- Legal interpretation

Risk engine output:

```ts
type RiskResult = {
  score: number;
  level: "low" | "medium" | "high";
  approvalRequired: boolean;
  reasons: string[];
};
```

Rule:

- Low risk: final answer may be saved directly.
- Medium risk: user can submit for review.
- High risk: approval is required before final output.

### Authentication

Recommended:

- Auth.js or Better Auth.
- Email magic link for open-source simplicity.
- Optional SSO for enterprise.

### Authorization

Roles:

- Owner
- Admin
- Reviewer
- Contributor
- Viewer

Permission examples:

- `documents:read`
- `documents:write`
- `workflows:create`
- `approvals:review`
- `audit:read`
- `settings:manage`

## 10. MVP 2-week Implementation Plan

Implementation should start with backend foundations, not UI pages.

### Phase 1: Backend Skeleton and Trust Boundary

#### Day 1

- Create monorepo.
- Add backend app skeleton.
- Add database package.
- Add environment validation.
- Add tenant-safe request context.

Deliverable:

- App runs locally.
- Backend starts locally.
- Trust boundary is documented.

#### Day 2

- Add Prisma schema.
- Add tenants, users, roles, tenant memberships.
- Add workflows and approvals tables.
- Add seed script.

Deliverable:

- Local Postgres schema works.
- Demo tenant and users created.

#### Day 3

- Add authentication.
- Add tenant context middleware.
- Add role guard helpers.
- Add forbidden-secret-field request validator.

Deliverable:

- User can sign in.
- API requests are tenant scoped.
- Backend rejects API key shaped fields.

#### Day 4

- Add append-only audit log table.
- Add hash-chain audit writer.
- Add audit verification utility.

Deliverable:

- Audit logs are append-only.
- Hash chain can be verified.

#### Day 5

- Add workflow API.
- Add risk score field and approval-required state.
- Add approval lifecycle API.

Deliverable:

- AI output can become a workflow.
- High-risk workflows require approval.

### Phase 2: BYOK Client Layer

#### Day 6

- Build Settings page.
- Add provider/model selector.
- Add local encrypted key storage.
- Add execution mode selector: Client-side BYOK / Secure Proxy.
- Add clear key action.

Deliverable:

- User can store API key locally.
- User can configure secure proxy URL.

#### Day 7

- Add AI provider adapters.
- Support OpenAI, DeepSeek, Claude.
- Add test connection.
- Add secure proxy client adapter.

Deliverable:

- Browser can call provider directly.
- Browser can call customer proxy in enterprise mode.
- Hosted backend never sees API key.

### Phase 3: Ask + RAG Minimal Loop

#### Day 8

- Add document metadata API.
- Add chunk storage API.
- Add backend keyword retrieval fallback.
- Add tenant-filtered retrieval endpoint.

Deliverable:

- Documents can be chunked and searched.
- Retrieval returns citation-ready chunks.

#### Day 9

- Build Ask AI page.
- Add retrieval context preview.
- Add cited prompt builder.
- Add AI answer display.
- Add audit submission after AI output.

Deliverable:

- User can ask a question and get cited output.
- Every answer can be audited.

#### Day 10

- Add optional embedding flow:
  - client BYOK embedding
  - secure proxy embedding
  - keyword fallback
- Add vector search interface.

Deliverable:

- RAG works with keyword fallback first.
- Vector integration path is ready.

### Phase 4: Workflow, Approval, Audit UI

#### Day 11

- Add draft generator UI.
- Add risk scoring rules.
- Add submit-for-approval flow.

Deliverable:

- Drafts become workflows.
- High-risk drafts enter approval queue.

#### Day 12

- Add approval queue.
- Add approve / reject / request changes.
- Add final output lifecycle.

Deliverable:

- Human-in-the-loop workflow is functional.

#### Day 13

- Add audit UI filters.
- Add hash-chain verification screen.
- Add tests for:
  - tenant isolation
  - forbidden key payload rejection
  - risk scoring
  - audit hash chain
  - provider adapter validation

Deliverable:

- Audit-compliant workflow can be demonstrated.

#### Day 14

- Add README.
- Add deployment docs.
- Add BYOK security docs.
- Add sample `.env.example`.
- Polish UI.
- Add demo data.
- Add one-click local setup.
- Prepare v0.1.0 release.

Deliverable:

- Clone-ready BYOK SaaS boilerplate.

## Final Product Definition

This project upgrades AuditFlow AI from:

```text
AI Demo / Mock workflow
```

to:

```text
Production-ready BYOK AI SaaS Boilerplate
Multi-tenant workflow system
Audit-compliant enterprise AI infrastructure
Open-source GitHub-ready project
```
