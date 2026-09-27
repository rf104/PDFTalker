"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, RefreshCw, AlertCircle } from "lucide-react";

interface NavbarProps {
  onReset: () => void;
  backendUrl: string;
}

export default function Navbar({ onReset, backendUrl }: NavbarProps) {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [providerInfo, setProviderInfo] = useState<string>("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setStatus("online");
          if (data.gemini_api_configured) {
            setProviderInfo("Gemini");
          } else if (data.openai_api_configured) {
            setProviderInfo("OpenAI");
          } else {
            setProviderInfo("No key configured");
          }
        } else {
          setStatus("offline");
        }
      } catch (err) {
        setStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  return (
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0 rounded-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2 sm:p-2.5 rounded-xl shadow-md text-white shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none truncate">
              DocuMind
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-600 font-medium mt-0.5">
              PDF Intelligence Studio
            </p>
          </div>
        </div>

        {/* Status & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="glass-subtle flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full">
            {status === "online" ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  <span className="hidden sm:inline">Connected</span>
                  <span className="sm:hidden">Online</span>
                  {providerInfo && <span className="hidden sm:inline">{` · ${providerInfo}`}</span>}
                </span>
              </>
            ) : status === "checking" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Connecting…</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-xs font-medium text-rose-600 whitespace-nowrap">
                  <span className="hidden sm:inline">Backend offline</span>
                  <span className="sm:hidden">Offline</span>
                </span>
              </>
            )}
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-orange-600 glass-subtle hover:bg-white/60 px-2.5 sm:px-3 py-1.5 rounded-full transition-all"
            title="Reset active document session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
