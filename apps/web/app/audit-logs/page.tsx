"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";

type AuditLogItem = {
  id: string;
  sequence: string;
  eventType: string;
  entryHash: string;
  previousHash?: string | null;
  createdAt: string;
  payload: unknown;
};

export default function AuditLogsPage() {
  const [tenantId, setTenantId] = useState("demo-tenant");
  const [userId, setUserId] = useState("demo-user");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [status, setStatus] = useState("Load append-only audit logs for a tenant.");
  const [busy, setBusy] = useState(false);

  async function loadLogs() {
    setBusy(true);
    setStatus("Loading audit logs...");

    try {
      const response = await fetch("/api/audit", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-id": userId
        }
      });

      if (!response.ok) {
        throw new Error("Could not load audit logs.");
      }

      const payload = (await response.json()) as { auditLogs?: AuditLogItem[] };
      setLogs(payload.auditLogs ?? []);
      setStatus(`Loaded ${payload.auditLogs?.length ?? 0} audit log entries.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-layout">
      <AppSidebar currentPath="/audit-logs" />
      <section className="content">
        <div className="page-head">
          <div>
            <p className="eyebrow">Audit Logs</p>
            <h1>Append-only hash chain</h1>
          </div>
          <span className="badge">No API keys logged</span>
        </div>

        <section className="form-panel">
          <div className="two-col">
            <label>
              Tenant ID
              <input value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
            </label>
            <label>
              User ID
              <input value={userId} onChange={(event) => setUserId(event.target.value)} />
            </label>
          </div>
          <div className="toolbar">
            <button disabled={busy} type="button" onClick={loadLogs}>
              Load Audit Logs
            </button>
          </div>
        </section>

        <section className="log-list">
          {logs.map((log) => (
            <article className="log-entry" key={log.id}>
              <div className="log-entry-head">
                <strong>
                  #{log.sequence} {log.eventType}
                </strong>
                <span>{formatDate(log.createdAt)}</span>
              </div>
              <dl>
                <dt>Entry hash</dt>
                <dd>{log.entryHash}</dd>
                <dt>Previous hash</dt>
                <dd>{log.previousHash ?? "Genesis entry"}</dd>
                <dt>Payload</dt>
                <dd>
                  <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                </dd>
              </dl>
            </article>
          ))}
          {!logs.length ? <section className="panel">No audit logs loaded.</section> : null}
        </section>

        <p className="status-line">{status}</p>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

