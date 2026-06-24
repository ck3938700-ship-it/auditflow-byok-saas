const secretKeyPatterns = [
  "apiKey",
  "api_key",
  "apikey",
  "authorization",
  "bearer",
  "token",
  "secret",
  "password"
];

export function assertNoProviderSecrets(value: unknown, path = "payload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProviderSecrets(item, `${path}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    const looksSecret = secretKeyPatterns.some((pattern) =>
      normalized.includes(pattern.toLowerCase())
    );

    if (looksSecret) {
      throw new Error(`Provider secrets are not allowed in backend payloads: ${path}.${key}`);
    }

    assertNoProviderSecrets(nestedValue, `${path}.${key}`);
  }
}

