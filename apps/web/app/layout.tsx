import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditFlow BYOK SaaS",
  description: "BYOK AI workflow infrastructure template"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

