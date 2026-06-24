# AuditFlow BYOK SaaS

![BYOK](https://img.shields.io/badge/AI-BYOK-blue)
![Type](https://img.shields.io/badge/Type-SaaS_Infrastructure-green)
![Audit](https://img.shields.io/badge/Audit-Hash_Chain-red)
![Multi Tenant](https://img.shields.io/badge/Multi--Tenant-Supported-purple)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![CI](https://github.com/ck3938700-ship-it/auditflow-byok-saas/actions/workflows/ci.yml/badge.svg)

Audit every AI decision. Own every API call. Trust nothing blindly.

AI answers you can trust, trace, and audit, powered by your own API key.

AuditFlow is a production-oriented BYOK AI SaaS boilerplate for building enterprise knowledge workflows, document Q&A, approval systems, and audit-compliant AI products.

## What Is This?

AuditFlow is an AI infrastructure starter for teams building:

- AI knowledge assistants.
- Document Q&A systems.
- Audit-compliant AI workflows.
- Multi-tenant enterprise SaaS products.
- Human-in-the-loop approval flows.

The core idea:

> ChatGPT-style enterprise knowledge workflows, but BYOK-controlled, source-cited, and audit-ready.

## Why This Exists

Most AI SaaS demos assume the platform owns the model key.

That creates problems:

- The platform controls AI cost.
- Users cannot easily audit every AI output.
- Sources are often hidden or weakly connected.
- AI activity is rarely designed for compliance review.

AuditFlow takes a different stance:

- Users bring their own OpenAI, DeepSeek, or Claude key.
- The hosted backend does not call LLM providers.
- The hosted backend does not store provider API keys.
- Every workflow can be traced through retrieval, approval, and audit logs.

## Demo Flow

This is the intended product loop:

```text
1. Open Settings.
2. Add your provider key locally.
3. Paste a policy or compliance document into Knowledge Base.
4. Ask a question:
   "Can I terminate an employee during probation?"
5. AuditFlow retrieves relevant citations.
6. The browser calls your BYOK model provider.
7. The answer is shown with sources.
8. The output and retrieved context are recorded in audit logs.
9. High-risk workflows can be routed to human approval.
```

## Key Features

### BYOK AI Execution

- OpenAI-compatible adapter.
- DeepSeek adapter.
- Claude adapter.
- Browser-only encrypted localStorage vault.
- No hosted backend LLM endpoint.

### Audit-First Workflow

- Every AI output can be logged.
- Retrieved context is included in audit payloads.
- Audit logs include sequence, previous hash, and entry hash.
- Hash-chain fields support tamper-evidence workflows.

### Multi-Tenant SaaS Foundation

- Tenant-scoped Prisma schema.
- Users, roles, memberships, workflows, documents, chunks, approvals, and audit logs.
- Service-layer tenant filters.
- Header-based auth placeholder ready to replace with a real auth provider.

### RAG Knowledge Engine

- Paste text into Knowledge Base.
- Create document metadata.
- Chunk knowledge text with overlap.
- Retrieve tenant-scoped citations.
- Build final prompts client-side.

### Human Approval Gate

- Draft workflow requests.
- Risk scoring.
- Approval queue.
- Approve or reject high-risk workflows.
- Decision events are audit logged.

## Architecture

```mermaid
flowchart TD
  User["User Browser"] --> Settings["Settings: local BYOK vault"]
  User --> Ask["Ask AI page"]
  Ask --> Retrieval["Hosted backend retrieval API"]
  Retrieval --> Chunks["Tenant-scoped document chunks"]
  Retrieval --> AuditRetrieval["Audit: retrieval performed"]
  Ask --> Prompt["Client builds prompt with citations"]
  Settings --> Prompt
  Prompt --> Provider["OpenAI / DeepSeek / Claude"]
  Provider --> Answer["Answer with citations"]
  Answer --> AuditOutput["Hosted backend audit log"]
  Drafts["Draft workflow request"] --> Risk["Risk scoring"]
  Risk --> Approvals["Human approval queue"]
  Approvals --> AuditApproval["Audit: approval decision"]
  AuditRetrieval --> Chain["Append-only audit hash chain"]
  AuditOutput --> Chain
  AuditApproval --> Chain
```

Full design: [ARCHITECTURE.md](ARCHITECTURE.md)

## Security Model

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

More detail:

- [BYOK model](docs/BYOK.md)
- [Security policy](SECURITY.md)

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

## Perfect For

- HR policy assistants.
- Legal document review tools.
- Finance compliance workflows.
- Internal enterprise AI systems.
- Audit-ready AI workflow products.
- SaaS founders who want BYOK instead of platform-hosted model keys.

## Not For

- Casual chatbot demos.
- Apps that need the platform to centrally own all LLM API keys.
- Products that do not need auditability, citations, or workflow review.

## Tech Stack

- Next.js / React.
- TypeScript.
- Next.js API routes.
- Prisma.
- PostgreSQL.
- Web Crypto API.
- BYOK client execution layer.
- pgvector-ready RAG architecture.
- R2/S3-ready document storage path.

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
git clone https://github.com/ck3938700-ship-it/auditflow-byok-saas.git
cd auditflow-byok-saas
npm install
cp .env.example .env
npm run db:generate
npm run verify
npm run dev
```

Windows PowerShell:

```powershell
git clone https://github.com/ck3938700-ship-it/auditflow-byok-saas.git
cd auditflow-byok-saas
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

## Current Status

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

## Project Philosophy

We do not build opaque AI chatbots.

We build AI systems you can cite, approve, trace, and audit.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

