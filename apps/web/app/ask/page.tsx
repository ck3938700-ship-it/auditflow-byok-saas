"use client";

import { FormEvent, useState } from "react";
import { callLlm, loadByokConfig } from "@/lib/client/byok";
import { buildRagPrompt, type Citation } from "@auditflow/rag";
import { AppSidebar } from "@/components/app-sidebar";

export default function AskPage() {
  const [tenantId, setTenantId] = useState("demo-tenant");
  const [userId, setUserId] = useState("demo-user");
  const [passphrase, setPassphrase] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [status, setStatus] = useState("Unlock your local BYOK key to ask.");
  const [busy, setBusy] = useState(false);

  async function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAnswer("");
    setCitations([]);
    setStatus("Loading local provider key...");

    try {
      const config = await loadByokConfig(passphrase);
      if (!config) {
        setStatus("No BYOK config found. Configure Settings first.");
        return;
      }

      setStatus("Retrieving tenant-scoped context...");
      const retrievalResponse = await fetch("/api/retrieval/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId
        },
        body: JSON.stringify({
          query: question,
          limit: 5
        })
      });

      const retrieval = retrievalResponse.ok
        ? ((await retrievalResponse.json()) as { citations?: Citation[] })
        : { citations: [] };
      const retrievedCitations = retrieval.citations ?? [];
      setCitations(retrievedCitations);

      setStatus("Calling LLM provider directly from browser...");
      const result = await callLlm(config, {
        messages: [
          {
            role: "system",
            content:
              "You are an enterprise workflow assistant. Answer carefully, cite retrieved sources, and mention when human approval may be required."
          },
          {
            role: "user",
            content: buildRagPrompt(question, retrievedCitations)
          }
        ],
        temperature: 0.2,
        maxTokens: 1200
      });

      setAnswer(result.output);
      setStatus("Answer generated. Recording audit event...");

      const auditResponse = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId
        },
        body: JSON.stringify({
          eventType: "AI_OUTPUT_RECORDED",
          payload: {
            userInput: question,
            model: result.model,
            provider: result.provider,
            aiOutput: result.output,
            retrievedContext: retrievedCitations.map((citation) => ({
              documentId: citation.documentId,
              documentTitle: citation.documentTitle,
              chunkIndex: citation.chunkIndex,
              score: citation.score,
              citationText: citation.citationText
            }))
          }
        })
      });

      setStatus(
        auditResponse.ok
          ? "Answer generated and audit event recorded."
          : "Answer generated. Audit backend is not connected yet."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ask failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-layout">
      <AppSidebar currentPath="/ask" />
      <section className="content">
        <div className="page-head">
          <div>
            <p className="eyebrow">Ask AI</p>
            <h1>Client-side BYOK execution</h1>
          </div>
          <span className="badge">No backend LLM call</span>
        </div>

        <form className="form-panel" onSubmit={onAsk}>
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

          <label>
            Local passphrase
            <input
              autoComplete="off"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
            />
          </label>

          <label>
            Question
            <textarea
              rows={7}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask an HR, legal, finance, or compliance workflow question..."
            />
          </label>

          <div className="toolbar">
            <button disabled={busy || !question.trim()} type="submit">
              Ask With Local Key
            </button>
          </div>
        </form>

        <p className="status-line">{status}</p>

        {answer ? (
          <section className="answer-panel">
            <h2>Answer</h2>
            <p>{answer}</p>
          </section>
        ) : null}

        {citations.length ? (
          <section className="answer-panel">
            <h2>Citations</h2>
            <ol>
              {citations.map((citation) => (
                <li key={`${citation.documentId}-${citation.chunkIndex}`}>
                  <strong>
                    {citation.documentTitle} #{citation.chunkIndex}
                  </strong>
                  <p>{citation.citationText}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </section>
    </main>
  );
}
