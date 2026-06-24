import { assertNoProviderSecrets } from "@auditflow/audit";

export async function readSafeJson(request: Request) {
  const payload = await request.json();
  assertNoProviderSecrets(payload);
  return payload;
}

