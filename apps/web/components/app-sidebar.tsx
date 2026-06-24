const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/knowledge", label: "Knowledge Base" },
  { href: "/ask", label: "Ask AI" },
  { href: "/drafts", label: "Drafts" },
  { href: "/approvals", label: "Approvals" },
  { href: "/audit-logs", label: "Audit Logs" },
  { href: "/settings", label: "Settings" }
];

export function AppSidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="sidebar">
      <strong>AuditFlow</strong>
      {navItems.map((item) => (
        <a
          aria-current={currentPath === item.href ? "page" : undefined}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </a>
      ))}
    </aside>
  );
}

