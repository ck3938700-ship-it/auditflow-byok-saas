# AuditFlow BYOK SaaS Boilerplate

Production-ready starter for building enterprise AI workflow products without hosting customer LLM API keys.

AuditFlow is designed for teams building AI systems for HR, legal, finance, compliance, and knowledge operations. It combines multi-tenant workflow management, BYOK AI execution, RAG citations, approval gates, and audit-ready logging.

## Why This Exists

Most AI SaaS demos assume the platform owns the model key. That is not always acceptable for enterprise users.

AuditFlow takes a different stance:

- Users bring their own OpenAI, DeepSeek, or Claude key.
- The hosted backend does not call LLM providers.
- The hosted backend does not store provider API keys.
- Workflow, retrieval, approvals, and audit logs still run in a normal SaaS backend.

## Features

- Multi-tenant workspace data model.
- BYOK settings page with encrypted browser localStorage.
- OpenAI-compatible, DeepSeek, and Claude client adapters.
- Hybrid RAG flow with backend retrieval and client-side prompt construction.
- Knowledge Base page for text ingestion and chunking.
- Draft workflow requests with risk scoring.
- Human approval queue for high-risk workflows.
- Append-only audit logs with hash-chain integrity fields.
- GitHub-style enterprise UI.
- Prisma/Postgres schema for tenant-scoped data.
- GitHub Actions CI.

## BYOK Security Boundary

The hosted backend must never receive or store LLM provider API keys.

Allowed key locations:

- Browser encrypted localStorage.
- User local environment.
- Customer-hosted secure proxy controlled by the customer.

Disallowed key locations:

- Hosted backend environment variables.
- Prisma schema fields.
- Database rows.
- Audit log payloads.
- Backend request logs.

See [docs/BYOK.md](docs/BYOK.md) and [SECURITY.md](SECURITY.md).

## Architecture

```text
Browser
  Settings: encrypted BYOK localStorage
  Ask AI: retrieval -> prompt with citations -> provider call
       |
       | no provider key sent to hosted backend
       v
Hosted Backend
  tenants
  workflows
  documents
  chunks
  retrieval
  approvals
  append-only audit logs
       |
       v
Postgres / Prisma
  tenant-scoped tables
  audit hash chain
  document chunks
  optional pgvector upgrade path
```

Full design: [ARCHITECTURE.md](ARCHITECTURE.md)

## App Pages

| Page | Purpose |
| --- | --- |
| `/` | Dashboard overview |
| `/knowledge` | Paste text, create document metadata, chunk content |
| `/ask` | Retrieve citations and call the BYOK provider in the browser |
| `/drafts` | Create workflow requests and risk score them |
| `/approvals` | Approve or reject high-risk workflows |
| `/audit-logs` | Inspect append-only audit log entries |
| `/settings` | Configure local BYOK provider settings |

## Backend API

The backend manages workflow infrastructure only. It does not expose an LLM endpoint.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/session` | Header-based auth placeholder |
| `GET` | `/api/tenants` | List user tenants |
| `POST` | `/api/tenants` | Create tenant and default roles |
| `GET` | `/api/workflows` | List workflows |
| `POST` | `/api/workflows` | Create workflow and risk score |
| `GET` | `/api/documents` | List document metadata |
| `POST` | `/api/documents` | Create document metadata |
| `POST` | `/api/documents/[documentId]/chunks` | Replace chunks |
| `POST` | `/api/retrieval/search` | Return tenant-scoped citations |
| `GET` | `/api/approvals` | List pending approvals |
| `POST` | `/api/approvals` | Record approval decision |
| `GET` | `/api/audit` | List audit logs |
| `POST` | `/api/audit` | Append audit event |

More detail: [docs/API.md](docs/API.md)

## Tech Stack

- Next.js / React
- TypeScript
- Prisma
- PostgreSQL
- Web Crypto API
- BYOK provider adapters
- Optional pgvector or Supabase Vector upgrade path
- Optional R2/S3 storage path

## Repository Structure

```text
apps/web
  app
    api
    approvals
    ask
    audit-logs
    drafts
    knowledge
    settings
  components
  lib
packages
  audit
  db
  rag
  workflow
docs
scripts
.github/workflows
```

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:generate
npm run verify
npm run dev
```

Windows PowerShell:

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run db:generate
npm.cmd run verify
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auditflow_byok"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"
```

Do not put provider API keys in backend env vars.

## Verification

```bash
npm run verify
```

This runs:

- Prisma schema validation.
- TypeScript strict check.
- Audit/risk/secret smoke test.
- Next.js production build.

## Current Implementation Status

Implemented:

- Multi-tenant Prisma schema.
- Tenant/auth request boundary.
- Append-only audit hash chain.
- Workflow risk scoring.
- Approval queue.
- Document metadata and chunk storage.
- Tenant-scoped citation retrieval.
- BYOK settings and client provider calls.
- Dashboard, Knowledge Base, Ask AI, Drafts, Approvals, Audit Logs, Settings.

Still recommended before production:

- Replace header-based auth placeholder with a real auth provider.
- Run migrations against a real Postgres database.
- Add pgvector or Supabase Vector for semantic retrieval.
- Add R2/S3 file upload and parsing.
- Add audit-chain verification endpoint/UI.
- Add optional customer-hosted secure proxy package.
- Review npm audit output before a stable release.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Recommended first deployment target: a Node-compatible platform with managed Postgres.

Cloudflare Pages can be supported with the right Next.js adapter and database/runtime choices, but the current Prisma + route-handler setup is simplest on a Node-compatible host first.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

