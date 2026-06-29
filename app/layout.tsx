import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-AID",
  description: "Multi-tenant AI SaaS platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
