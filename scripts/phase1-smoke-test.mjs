import { createHash } from "node:crypto";
import assert from "node:assert/strict";

function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortValue(value[key]);
        return accumulator;
      }, {});
  }
  return value;
}

function buildHash(entry) {
  const canonicalPayload = canonicalJson({
    tenantId: entry.tenantId,
    eventType: entry.eventType,
    sequence: String(entry.sequence),
    payload: entry.payload,
    previousHash: entry.previousHash ?? null,
    createdAt: entry.createdAt
  });

  return createHash("sha256").update(canonicalPayload).digest("hex");
}

function assertNoProviderSecrets(value, path = "payload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProviderSecrets(item, `${path}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    const looksSecret = [
      "apikey",
      "api_key",
      "authorization",
      "token",
      "secret",
      "password"
    ].some((pattern) => normalized.includes(pattern));

    if (looksSecret) {
      throw new Error(`Provider secrets are not allowed: ${path}.${key}`);
    }

    assertNoProviderSecrets(nestedValue, `${path}.${key}`);
  }
}

function assessWorkflowRisk(input) {
  const text = input.toLowerCase();
  let score = 10;

  for (const term of ["terminate employee", "解雇", "辞退", "合同修改", "财务处理"]) {
    if (text.includes(term.toLowerCase())) score += 60;
  }

  score = Math.min(score, 100);

  return {
    score,
    approvalRequired: score >= 60
  };
}

const first = {
  tenantId: "tenant-1",
  eventType: "WORKFLOW_CREATED",
  sequence: 1,
  payload: { input: "Generate a contract review draft" },
  previousHash: null,
  createdAt: "2026-06-24T00:00:00.000Z"
};

const firstHash = buildHash(first);
const second = {
  tenantId: "tenant-1",
  eventType: "WORKFLOW_RISK_SCORED",
  sequence: 2,
  payload: { score: 60, level: "HIGH" },
  previousHash: firstHash,
  createdAt: "2026-06-24T00:01:00.000Z"
};

assert.equal(firstHash.length, 64);
assert.equal(buildHash(second).length, 64);
assert.notEqual(firstHash, buildHash(second));

const highRisk = assessWorkflowRisk("请帮我生成一份解雇员工的处理意见");
assert.equal(highRisk.approvalRequired, true);

assert.throws(() =>
  assertNoProviderSecrets({
    payload: {
      providerApiKey: "sk-test"
    }
  })
);

console.log(
  "Phase 1 smoke test passed: audit hashes, risk approval, and secret rejection work."
);
