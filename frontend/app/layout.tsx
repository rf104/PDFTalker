import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuMind — PDF Intelligence Studio",
  description: "AI-powered PDF ingestion, executive summarization, and RAG Q&A grounded strictly in document context with verifiable page citations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
