import { createHash } from "node:crypto";
import { canonicalJson, type JsonValue } from "./canonical-json";

export type AuditHashInput = {
  tenantId: string;
  eventType: string;
  sequence: number | bigint;
  payload: JsonValue;
  previousHash?: string | null;
  createdAt: string;
};

export type AuditHashResult = {
  canonicalPayload: string;
  entryHash: string;
};

export function buildAuditHash(input: AuditHashInput): AuditHashResult {
  const canonicalPayload = canonicalJson({
    tenantId: input.tenantId,
    eventType: input.eventType,
    sequence: String(input.sequence),
    payload: input.payload,
    previousHash: input.previousHash ?? null,
    createdAt: input.createdAt
  });

  return {
    canonicalPayload,
    entryHash: sha256Hex(canonicalPayload)
  };
}

export type AuditChainEntry = AuditHashInput & {
  entryHash: string;
};

export function verifyAuditHashChain(entries: AuditChainEntry[]) {
  let expectedPreviousHash: string | null = null;

  for (const entry of entries) {
    if ((entry.previousHash ?? null) !== expectedPreviousHash) {
      return {
        valid: false,
        failedSequence: entry.sequence,
        reason: "previous_hash_mismatch"
      } as const;
    }

    const { entryHash } = buildAuditHash(entry);

    if (entryHash !== entry.entryHash) {
      return {
        valid: false,
        failedSequence: entry.sequence,
        reason: "entry_hash_mismatch"
      } as const;
    }

    expectedPreviousHash = entry.entryHash;
  }

  return {
    valid: true,
    checked: entries.length
  } as const;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

