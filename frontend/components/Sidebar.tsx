"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, Cpu, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

interface SidebarProps {
  provider: string;
  setProvider: (p: string) => void;
  modelName: string;
  setModelName: (m: string) => void;
  onProcessFiles: (files: File[]) => Promise<void>;
  isProcessing: boolean;
  docStats: {
    pages?: number;
    chunks?: number;
    words?: number;
    tokens_approx?: number;
  } | null;
  uploadedFileNames: string[];
}

export default function Sidebar({
  provider,
  setProvider,
  modelName,
  setModelName,
  onProcessFiles,
  isProcessing,
  docStats,
  uploadedFileNames,
}: SidebarProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-collapse on mobile once a document has been processed, so the
  // summary/chat tabs are immediately reachable without extra scrolling.
  useEffect(() => {
    if (docStats) setOpen(false);
  }, [docStats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files).filter((f) => f.type === "application/pdf");
      setSelectedFiles(filesArr);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArr = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
      setSelectedFiles(filesArr);
    }
  };

  const handleUploadSubmit = () => {
    if (selectedFiles.length > 0) {
      onProcessFiles(selectedFiles);
    }
  };

  return (
    <aside className="glass lg:w-80 m-4 lg:mr-2 rounded-2xl p-5 flex flex-col gap-5 shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden flex items-center justify-between gap-2 text-slate-900 font-semibold text-sm"
      >
        <span className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-orange-600" />
          Workspace Settings
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`${open ? "flex" : "hidden"} lg:flex flex-col gap-6`}>
      {/* 1. Model Configuration */}
      <div className="flex flex-col gap-3">
        <div className="hidden lg:flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Cpu className="w-4 h-4 text-orange-600" />
          <span>Model Settings</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              if (e.target.value === "Google Gemini") {
                setModelName("gemini-3.6-flash");
              } else {
                setModelName("gpt-4o-mini");
              }
            }}
            className="w-full glass-subtle rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="Google Gemini">Google Gemini (Recommended)</option>
            <option value="OpenAI">OpenAI</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600">Model</label>
          <select
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full glass-subtle rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {provider === "Google Gemini" ? (
              <>
                <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Advanced Reasoning)</option>
              </>
            ) : (
              <>
                <option value="gpt-4o-mini">gpt-4o-mini (Lightweight)</option>
                <option value="gpt-4o">gpt-4o (Flagship Model)</option>
              </>
            )}
          </select>
        </div>
      </div>

      <hr className="border-white/40" />

      {/* 2. PDF Upload Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Upload className="w-4 h-4 text-orange-600" />
          <span>Upload Documents</span>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-orange-300/60 hover:border-orange-500 glass-subtle hover:bg-orange-50/40 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
        >
          <FileText className="w-7 h-7 text-orange-500" />
          <div className="text-xs text-slate-700 font-medium">
            <span className="text-orange-600 font-semibold">Click to browse</span> or drag PDF files here
          </div>
          <p className="text-[11px] text-slate-500">Supports single or multiple files</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="application/pdf"
            className="hidden"
          />
        </div>

        {/* Selected File Badge List */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs font-medium text-slate-600">Selected files</span>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 glass-subtle text-slate-800 text-xs px-2.5 py-1.5 rounded-lg truncate font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-[10px] text-slate-500 ml-auto shrink-0">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleUploadSubmit}
          disabled={selectedFiles.length === 0 || isProcessing}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all ${
            selectedFiles.length === 0 || isProcessing
              ? "bg-slate-400/50 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99]"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Processing…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Process Document</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Document Statistics */}
      {docStats && (
        <>
          <hr className="border-white/40" />
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Document Stats
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-subtle border-l-2 border-l-orange-500 rounded-lg p-2.5">
                <div className="text-base font-bold text-orange-600">
                  {docStats.pages ?? 0}
                </div>
                <div className="text-[11px] font-medium text-slate-600">Pages</div>
              </div>
              <div className="glass-subtle border-l-2 border-l-orange-500 rounded-lg p-2.5">
                <div className="text-base font-bold text-orange-600">
                  {docStats.chunks ?? 0}
                </div>
                <div className="text-[11px] font-medium text-slate-600">Text Chunks</div>
              </div>
              <div className="glass-subtle border-l-2 border-l-orange-500 rounded-lg p-2.5">
                <div className="text-base font-bold text-orange-600">
                  {(docStats.words ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-slate-600">Total Words</div>
              </div>
              <div className="glass-subtle border-l-2 border-l-orange-500 rounded-lg p-2.5">
                <div className="text-base font-bold text-orange-600">
                  ~{(docStats.tokens_approx ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-slate-600">Est. Tokens</div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </aside>
  );
}
