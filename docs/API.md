# Backend API

The backend manages tenants, workflow state, documents, retrieval, approvals, and audit logs.

It does not expose an LLM route.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/session` | Header-based auth placeholder |
| `GET` | `/api/tenants` | List user tenants |
| `POST` | `/api/tenants` | Create tenant and default roles |
| `GET` | `/api/workflows` | List tenant workflows |
| `POST` | `/api/workflows` | Create workflow and risk score |
| `GET` | `/api/documents` | List tenant documents |
| `POST` | `/api/documents` | Create document metadata |
| `POST` | `/api/documents/[documentId]/chunks` | Replace document chunks |
| `POST` | `/api/retrieval/search` | Retrieve tenant-scoped citations |
| `GET` | `/api/approvals` | List pending approvals |
| `POST` | `/api/approvals` | Approve or reject workflow |
| `GET` | `/api/audit` | List audit logs |
| `POST` | `/api/audit` | Append audit event |

## Temporary Auth Headers

Until a real auth provider is wired:

```http
x-tenant-id: tenant-id
x-user-id: user-id
```

Replace this boundary in `apps/web/lib/server/request-context.ts`.

