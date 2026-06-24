# Security Policy

## BYOK Boundary

The hosted backend must never receive or store LLM provider API keys.

Provider keys are allowed only in:

- Browser local encrypted storage.
- User-controlled local environment variables.
- Optional customer-hosted secure proxy mode.

Provider keys are not allowed in:

- Prisma schema fields.
- Database rows.
- Audit log payloads.
- Backend request logs.
- Hosted backend environment variables.

## Reporting a Vulnerability

Open a private security advisory or contact the maintainers through the repository owner account.

Please include:

- Affected commit or release.
- Reproduction steps.
- Expected and actual behavior.
- Whether any tenant isolation, audit integrity, or provider key boundary is affected.

## Security Design Notes

- Tenant isolation is enforced through `tenantId` on business tables and service-layer filters.
- Audit logs are append-only at the application layer and linked with a hash chain.
- Backend payload guards reject fields that look like provider secrets.
- Client-side BYOK mode exposes keys to the user's browser by design. Enterprise deployments should use the optional secure proxy mode in their own environment when browser exposure is unacceptable.

