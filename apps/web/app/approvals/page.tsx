"use client";

import { FormEvent, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";

type ApprovalItem = {
  id: string;
  workflowId: string;
  status: string;
  reason?: string | null;
  createdAt?: string;
  workflow?: {
    title: string;
    type: string;
    riskScore: number;
    riskLevel: string;
  };
};

export default function ApprovalsPage() {
  const [tenantId, setTenantId] = useState("demo-tenant");
  const [userId, setUserId] = useState("demo-user");
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [status, setStatus] = useState("Load pending approvals for a tenant.");
  const [busy, setBusy] = useState(false);

  async function loadApprovals() {
    setBusy(true);
    setStatus("Loading approvals...");

    try {
      const response = await fetch("/api/approvals", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-id": userId
        }
      });

      if (!response.ok) {
        throw new Error("Could not load approvals.");
      }

      const payload = (await response.json()) as { approvals?: ApprovalItem[] };
      setApprovals(payload.approvals ?? []);
      setSelectedId(payload.approvals?.[0]?.id ?? "");
      setStatus(`Loaded ${payload.approvals?.length ?? 0} pending approvals.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDecision(decision: "APPROVED" | "REJECTED") {
    if (!selectedId) return;

    setBusy(true);
    setStatus(`${decision === "APPROVED" ? "Approving" : "Rejecting"} workflow...`);

    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId
        },
        body: JSON.stringify({
          approvalId: selectedId,
          decision,
          decisionNote
        })
      });

      if (!response.ok) {
        throw new Error("Could not record approval decision.");
      }

      setStatus(`Decision recorded: ${decision}.`);
      await loadApprovals();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Decision failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-layout">
      <AppSidebar currentPath="/approvals" />
      <section className="content">
        <div className="page-head">
          <div>
            <p className="eyebrow">Approvals</p>
            <h1>Human review queue</h1>
          </div>
          <span className="badge">High risk gate</span>
        </div>

        <section className="form-panel">
          <div className="two-col">
            <label>
              Tenant ID
              <input value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
            </label>
            <label>
              Reviewer User ID
              <input value={userId} onChange={(event) => setUserId(event.target.value)} />
            </label>
          </div>
          <div className="toolbar">
            <button disabled={busy} type="button" onClick={loadApprovals}>
              Load Queue
            </button>
          </div>
        </section>

        <section className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr
                  className={selectedId === approval.id ? "selected-row" : undefined}
                  key={approval.id}
                  onClick={() => setSelectedId(approval.id)}
                >
                  <td>{approval.workflow?.title ?? approval.workflowId}</td>
                  <td>
                    {approval.workflow?.riskLevel ?? "UNKNOWN"}{" "}
                    {approval.workflow?.riskScore ?? ""}
                  </td>
                  <td>{approval.status}</td>
                  <td>{approval.reason ?? "No reason provided"}</td>
                </tr>
              ))}
              {!approvals.length ? (
                <tr>
                  <td colSpan={4}>No approvals loaded.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <form
          className="form-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void submitDecision("APPROVED");
          }}
        >
          <label>
            Decision note
            <textarea
              rows={4}
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder="Why this workflow is approved or rejected..."
            />
          </label>
          <div className="toolbar">
            <button disabled={busy || !selectedId} type="submit">
              Approve
            </button>
            <button
              className="danger-button"
              disabled={busy || !selectedId}
              type="button"
              onClick={() => void submitDecision("REJECTED")}
            >
              Reject
            </button>
          </div>
        </form>

        <p className="status-line">{status}</p>
      </section>
    </main>
  );
}
