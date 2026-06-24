"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  clearByokConfig,
  defaultModels,
  hasStoredByokConfig,
  loadByokConfig,
  saveByokConfig,
  testLlmConnection,
  type LlmProvider
} from "@/lib/client/byok";
import { AppSidebar } from "@/components/app-sidebar";

export default function SettingsPage() {
  const [provider, setProvider] = useState<LlmProvider>("openai");
  const [model, setModel] = useState(defaultModels.openai);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [status, setStatus] = useState("Not configured");
  const [busy, setBusy] = useState(false);

  const stored = useMemo(
    () => (typeof window === "undefined" ? false : hasStoredByokConfig()),
    []
  );

  function onProviderChange(nextProvider: LlmProvider) {
    setProvider(nextProvider);
    setModel(defaultModels[nextProvider]);
    setBaseUrl("");
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Encrypting key locally...");

    try {
      await saveByokConfig(
        {
          provider,
          model,
          baseUrl: baseUrl.trim() || undefined,
          apiKey
        },
        passphrase
      );
      setStatus("Saved locally. The backend never received the API key.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock() {
    setBusy(true);
    setStatus("Unlocking local config...");

    try {
      const config = await loadByokConfig(passphrase);
      if (!config) {
        setStatus("No local BYOK config found.");
        return;
      }

      setProvider(config.provider);
      setModel(config.model);
      setBaseUrl(config.baseUrl ?? "");
      setApiKey(config.apiKey);
      setStatus("Unlocked from local encrypted storage.");
    } catch {
      setStatus("Could not unlock. Check your local passphrase.");
    } finally {
      setBusy(false);
    }
  }

  async function onTestConnection() {
    setBusy(true);
    setStatus("Calling provider directly from this browser...");

    try {
      const result = await testLlmConnection({
        provider,
        model,
        baseUrl: baseUrl.trim() || undefined,
        apiKey
      });
      setStatus(`Connection works: ${result.output || "OK"}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    clearByokConfig();
    setApiKey("");
    setStatus("Local BYOK config cleared.");
  }

  return (
    <main className="app-layout">
      <AppSidebar currentPath="/settings" />
      <section className="content">
        <div className="page-head">
          <div>
            <p className="eyebrow">BYOK Settings</p>
            <h1>Local provider key</h1>
          </div>
          <span className="badge">{stored ? "Stored locally" : "Not stored"}</span>
        </div>

        <form className="form-panel" onSubmit={onSave}>
          <label>
            Provider
            <select
              value={provider}
              onChange={(event) => onProviderChange(event.target.value as LlmProvider)}
            >
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="claude">Claude</option>
            </select>
          </label>

          <label>
            Model
            <input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>

          <label>
            API Key
            <input
              autoComplete="off"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Stored only in encrypted localStorage"
            />
          </label>

          <label>
            Local passphrase
            <input
              autoComplete="off"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Used only in this browser"
            />
          </label>

          <label>
            Custom base URL
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="Optional, for compatible gateways"
            />
          </label>

          <div className="toolbar">
            <button disabled={busy} type="submit">
              Save Locally
            </button>
            <button disabled={busy} type="button" onClick={onUnlock}>
              Unlock
            </button>
            <button disabled={busy || !apiKey} type="button" onClick={onTestConnection}>
              Test Connection
            </button>
            <button disabled={busy} type="button" onClick={onClear}>
              Clear
            </button>
          </div>
        </form>

        <p className="status-line">{status}</p>
      </section>
    </main>
  );
}
