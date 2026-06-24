# BYOK Model

AuditFlow uses Bring Your Own Key execution.

## Client-Side BYOK

The default mode stores the provider config in encrypted browser localStorage.

Flow:

1. User enters provider, model, API key, and local passphrase in `/settings`.
2. Browser encrypts the provider config with Web Crypto.
3. Browser stores the encrypted payload in localStorage.
4. `/ask` decrypts the config locally.
5. Browser calls OpenAI, DeepSeek, or Claude directly.
6. Browser sends only the AI result and audit metadata to the backend.

The backend does not receive the API key.

Browser-direct provider calls are the simplest BYOK mode, but some providers or
enterprise networks may block direct browser requests through CORS, rate limits,
or outbound policy controls. In those deployments, use the optional secure proxy
mode below.

## Optional Secure Proxy Mode

Enterprise users can deploy their own proxy in their own infrastructure.

The hosted SaaS backend still does not receive provider keys. The customer-owned proxy is responsible for:

- Provider secret storage.
- Rate limiting.
- Abuse control.
- Provider-specific network egress.
- Enterprise policy enforcement.

## What Gets Audited

Audit events may include:

- User input.
- Retrieved citations.
- Model name.
- Provider name.
- AI output.
- Workflow ID.
- Tenant ID.
- Timestamp.

Audit events must not include provider API keys.
