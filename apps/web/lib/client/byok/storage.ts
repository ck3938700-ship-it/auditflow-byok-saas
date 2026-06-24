import { decryptJson, encryptJson, type EncryptedPayload } from "./crypto";
import type { ByokConfig } from "./types";

const storageKey = "auditflow.byok.config.v1";

export function hasStoredByokConfig() {
  return typeof window !== "undefined" && Boolean(localStorage.getItem(storageKey));
}

export async function saveByokConfig(config: ByokConfig, passphrase: string) {
  requirePassphrase(passphrase);
  const encrypted = await encryptJson(config, passphrase);
  localStorage.setItem(storageKey, JSON.stringify(encrypted));
}

export async function loadByokConfig(passphrase: string) {
  requirePassphrase(passphrase);
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  return decryptJson<ByokConfig>(JSON.parse(raw) as EncryptedPayload, passphrase);
}

export function clearByokConfig() {
  localStorage.removeItem(storageKey);
}

function requirePassphrase(passphrase: string) {
  if (passphrase.trim().length < 8) {
    throw new Error("Use a local passphrase with at least 8 characters.");
  }
}

