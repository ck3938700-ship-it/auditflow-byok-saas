"use client";

import { FormEvent, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";

type DocumentResponse = {
  document?: {
    id: string;
    title: string;
  };
};

export default function KnowledgePage() {
  const [tenantId, setTenantId] = useState("demo-tenant");
  const [userId, setUserId] = useState("demo-user");
  const [title, setTitle] = useState("Policy note");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Paste text to create a searchable knowledge document.");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Creating document metadata...");

    try {
      const checksum = await sha256(text);
      const documentResponse = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId
        },
        body: JSON.stringify({
          title,
          sourceType: "paste",
          storageKey: `local-paste/${checksum}.txt`,
          mimeType: "text/plain",
          sizeBytes: text.length,
          checksumSha256: checksum
        })
      });

      if (!documentResponse.ok) {
        throw new Error("Could not create document metadata.");
      }

      const documentPayload = (await documentResponse.json()) as DocumentResponse;
      const documentId = documentPayload.document?.id;

      if (!documentId) {
        throw new Error("Document ID missing from backend response.");
      }

      setStatus("Chunking document...");
      const chunkResponse = await fetch(`/api/documents/${documentId}/chunks`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId
        },
        body: JSON.stringify({
          text,
          maxChars: 1400,
          overlapChars: 160
        })
      });

      if (!chunkResponse.ok) {
        throw new Error("Could not chunk document.");
      }

      const chunkPayload = (await chunkResponse.json()) as { chunkCount?: number };
      setStatus(`Knowledge document ready with ${chunkPayload.chunkCount ?? 0} chunks.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Knowledge upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-layout">
      <AppSidebar currentPath="/knowledge" />
      <section className="content">
        <div className="page-head">
          <div>
            <p className="eyebrow">Knowledge Base</p>
            <h1>Paste, chunk, retrieve</h1>
          </div>
          <span className="badge">Tenant scoped</span>
        </div>

        <form className="form-panel" onSubmit={onSubmit}>
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
            Document title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label>
            Document text
            <textarea
              rows={12}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste policy, legal, finance, HR, or compliance text..."
            />
          </label>

          <div className="toolbar">
            <button disabled={busy || !text.trim()} type="submit">
              Save And Chunk
            </button>
          </div>
        </form>

        <p className="status-line">{status}</p>
      </section>
    </main>
  );
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
