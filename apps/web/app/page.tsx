import { AppSidebar } from "@/components/app-sidebar";

const modules = [
  ["Tenant system", "Workspace isolation with tenant-scoped tables"],
  ["BYOK Settings", "Encrypted browser storage for provider keys"],
  ["Knowledge Base", "Paste text, chunk documents, retrieve citations"],
  ["Drafts", "Create workflow requests and score risk"],
  ["Approvals", "Human review for high-risk workflows"],
  ["Audit Logs", "Append-only hash chain evidence"]
];

export default function HomePage() {
  return (
    <main className="app-layout">
      <AppSidebar currentPath="/" />
      <section className="content">
        <section className="panel">
          <p className="eyebrow">AuditFlow BYOK SaaS</p>
          <h1>Enterprise AI workflow infrastructure template</h1>
          <p className="lead">
            Multi-tenant workflow, BYOK AI execution, RAG citations, approval
            queues, and audit-ready logging are now wired into one starter.
          </p>
          <div className="metric-grid">
            {modules.map(([title, description]) => (
              <article className="metric-card" key={title}>
                <strong>{title}</strong>
                <span>{description}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
