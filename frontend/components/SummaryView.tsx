"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileText, Sparkles, RefreshCw, Loader2 } from "lucide-react";

interface SummaryViewProps {
  summaryMarkdown: string | null;
  onGenerateSummary: () => Promise<void>;
  isGenerating: boolean;
}

export default function SummaryView({
  summaryMarkdown,
  onGenerateSummary,
  isGenerating,
}: SummaryViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (summaryMarkdown) {
      navigator.clipboard.writeText(summaryMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
            AI Analysis
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Document Summary
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            High-level overview, main topics, actionable takeaways, and key terminology extracted from your document.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {summaryMarkdown && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 glass-subtle hover:bg-white/60 text-slate-700 hover:text-orange-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onGenerateSummary}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{summaryMarkdown ? "Regenerate" : "Generate Summary"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      {isGenerating ? (
        <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-9 h-9 text-orange-500 animate-spin" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Analyzing document context…</h3>
            <p className="text-xs text-slate-500 mt-1">
              Extracting core thesis, major takeaways, key terms, and executive synthesis.
            </p>
          </div>
        </div>
      ) : summaryMarkdown ? (
        <div className="glass rounded-2xl p-8 prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {summaryMarkdown}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="glass-subtle border-2 border-dashed border-slate-300/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <FileText className="w-11 h-11 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No summary generated yet</h3>
          <p className="text-xs text-slate-500 max-w-md">
            Click <strong className="text-orange-600">Generate Summary</strong> above to analyze your document and produce an executive report.
          </p>
        </div>
      )}
    </div>
  );
}
