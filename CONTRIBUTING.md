# Contributing

Thanks for helping improve AuditFlow BYOK SaaS Boilerplate.

## Project Principles

- Do not add hosted backend LLM calls.
- Do not store OpenAI, DeepSeek, Claude, or other provider API keys in the database.
- Keep every business table tenant-scoped.
- Audit AI activity without logging provider secrets.
- Prefer small, reviewable changes.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run verify
```

On Windows PowerShell:

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run db:generate
npm.cmd run verify
```

## Pull Request Checklist

- TypeScript passes.
- Next.js production build passes.
- Prisma schema validates.
- Smoke test passes.
- README or docs are updated when behavior changes.
- No LLM API keys are added to backend payloads, logs, schemas, or examples.

## Suggested Contribution Areas

- Real authentication provider wiring.
- R2/S3 upload flow.
- pgvector or Supabase vector search.
- Optional customer-hosted secure proxy package.
- Audit chain verification UI.
- Better workflow templates for HR, legal, finance, and compliance.

