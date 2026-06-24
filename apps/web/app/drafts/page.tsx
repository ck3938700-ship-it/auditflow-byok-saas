"use client";

import { FormEvent, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";

type WorkflowItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  approvalRequired: boolean;
};

export default function DraftsPage() {
  const [tenantId, setTenantId] = useState("demo-tenant");
  const [userId, setUserId] = useState("demo-user");
  const [title, setTitle] = useState("Policy draft request");
  const [type, setType] = useState("DRAFT_GENERATION");
  const [prompt, setPrompt] = useState("");
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [status, setStatus] = useState("Create a workflow request before BYOK generation.");
  const [busy, setBusy] = useState(false);

  async function loadWorkflows() {
    setBusy(true);
    setStatus("Loading workflows...");

    try {
      const response = await fetch("/api/workflows", {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-id": userId
        }
      });

      if (!response.ok) {
        throw new Error("Could not load workflows.");
      }

      const payload = (await response.json()) as { workflows?: WorkflowItem[] };
      setWorkflows(payload.workflows ?? []);
      setStatus(`Loaded ${payload.workflows?.length ?? 0} workflows.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Creating workflow and scoring risk...");

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId
        },
        body: JSON.stringify({
          title,
          type,
          prompt
        })
      });

      if (!response.ok) {
        throw new Error("Could not create workflow.");
      }

      const payload = (await response.json()) as { workflow?: WorkflowItem };
      const workflow = payload.workflow;
      setStatus(
        workflow?.approvalRequired
          ? `Workflow created and sent to approvals. Risk: ${workflow.riskLevel} ${workflow.riskScore}.`
          : `Workflow created. Risk: ${workflow?.riskLevel ?? "LOW"} ${workflow?.riskScore ?? 0}.`
      );
      await loadWorkflows();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-layout">
      <AppSidebar currentPath="/drafts" />
      <section className="content">
        <div className="page-head">
          <div>
            <p className="eyebrow">Drafts</p>
            <h1>Workflow requests</h1>
          </div>
          <span className="badge">Risk scored</span>
        </div>

        <form className="form-panel" onSubmit={createDraft}>
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

          <div className="two-col">
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Workflow type
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="DRAFT_GENERATION">Draft generation</option>
                <option value="HR_REVIEW">HR review</option>
                <option value="LEGAL_REVIEW">Legal review</option>
                <option value="FINANCE_REVIEW">Finance review</option>
                <option value="COMPLIANCE_REVIEW">Compliance review</option>
              </select>
            </label>
          </div>

          <label>
            Request
            <textarea
              rows={7}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the draft or workflow you want to create..."
            />
          </label>

          <div className="toolbar">
            <button disabled={busy || !prompt.trim()} type="submit">
              Create Workflow
            </button>
            <button disabled={busy} type="button" onClick={loadWorkflows}>
              Load Workflows
            </button>
          </div>
        </form>

        <section className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow.id}>
                  <td>{workflow.title}</td>
                  <td>{workflow.type}</td>
                  <td>{workflow.status}</td>
                  <td>
                    {workflow.riskLevel} {workflow.riskScore}
                  </td>
                </tr>
              ))}
              {!workflows.length ? (
                <tr>
                  <td colSpan={4}>No workflows loaded.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <p className="status-line">{status}</p>
      </section>
    </main>
  );
}

