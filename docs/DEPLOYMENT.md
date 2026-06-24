# Deployment

This project is designed for self-hosting and open-source reuse.

Public showcase demo:

```text
https://auditflow-byok-saas.pages.dev
```

This Cloudflare Pages deployment is a public showcase. The full SaaS app needs a
Node-compatible runtime for Next.js route handlers and a PostgreSQL database for
persisted workflows, documents, approvals, and audit logs.

## Requirements

- Node.js 20.11 or newer.
- PostgreSQL.
- Prisma-supported database connection.
- Optional pgvector extension for production vector search.
- Optional R2/S3 bucket for file storage.

## Environment

Copy the example file:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auditflow_byok"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"
```

Do not add LLM provider API keys to `.env` for the hosted backend.

## Local Run

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## Production Build

```bash
npm run verify
npm run build
```

## Cloudflare Pages Note

The current app uses Next.js server routes and Prisma. For Cloudflare Pages deployment, use an adapter and a database setup compatible with the selected runtime, or deploy the app to a Node-compatible platform first.

Recommended first production path:

- Vercel, Render, Railway, Fly.io, or a Node server.
- Managed Postgres.
- R2/S3 for uploaded files.
- pgvector or Supabase vector for retrieval.
