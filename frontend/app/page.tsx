"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import SummaryView from "@/components/SummaryView";
import ChatView, { ChatMessage } from "@/components/ChatView";
import { FileText, MessageSquare, AlertCircle } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function Home() {
  const [provider, setProvider] = useState<string>("Google Gemini");
  const [modelName, setModelName] = useState<string>("gemini-3.6-flash");
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  
  const [docStats, setDocStats] = useState<any>(null);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [summaryMarkdown, setSummaryMarkdown] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Process PDF Files Action
  const handleProcessFiles = async (files: File[]) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const uploadRes = await fetch(
        `${BACKEND_URL}/api/upload?provider=${encodeURIComponent(provider)}&model_name=${encodeURIComponent(modelName)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({ detail: "Failed to connect to backend server." }));
        throw new Error(errorData.detail || "Failed to process PDF.");
      }

      const data = await uploadRes.json();
      setDocStats(data.stats);
      setUploadedFileNames(data.filename_list || []);
      setChatHistory([]);

      // Auto-generate initial summary
      await handleGenerateSummary();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setErrorMessage("⚠️ Backend server is offline! Please start the FastAPI backend on port 8000.");
      } else {
        setErrorMessage(err.message || "An unexpected error occurred during PDF processing.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Generate Executive Summary Action
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/summary`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to connect to backend server." }));
        throw new Error(errData.detail || "Failed to generate summary.");
      }

      const data = await res.json();
      setSummaryMarkdown(data.summary_markdown);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setErrorMessage("⚠️ Backend server is offline! Please start the FastAPI backend on port 8000.");
      } else {
        setErrorMessage(err.message || "Failed to generate summary.");
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 3. Send Q&A Question Action
  const handleSendMessage = async (userQuestion: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userQuestion,
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          provider: provider,
          model_name: modelName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Failed to connect to backend server." }));
        throw new Error(errData.detail || "Failed to answer question.");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setErrorMessage("⚠️ Backend server is offline! Please start the FastAPI backend on port 8000.");
      } else {
        setErrorMessage(err.message || "Failed to get answer from AI.");
      }
    } finally {
      setIsThinking(false);
    }
  };

  // 4. Reset Session Action
  const handleResetSession = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/reset`, { method: "POST" });
    } catch (err) {
      // Backend might be offline; silently handle network notice
      console.warn("Backend reset skipped - server offline");
    }
    setDocStats(null);
    setUploadedFileNames([]);
    setSummaryMarkdown(null);
    setChatHistory([]);
    setErrorMessage(null);
    setActiveTab("summary");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onReset={handleResetSession} backendUrl={BACKEND_URL} />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[100rem] w-full mx-auto">
        <Sidebar
          provider={provider}
          setProvider={setProvider}
          modelName={modelName}
          setModelName={setModelName}
          onProcessFiles={handleProcessFiles}
          isProcessing={isProcessing}
          docStats={docStats}
          uploadedFileNames={uploadedFileNames}
        />

        <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="glass border-rose-200/60 text-rose-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 font-semibold text-xs hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Navigation Workspace Tabs */}
          <div className="glass-subtle inline-flex items-center gap-1 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-lg transition-all ${
                activeTab === "summary"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-700 hover:bg-white/50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-lg transition-all ${
                activeTab === "chat"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-700 hover:bg-white/50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
              {chatHistory.length > 0 && (
                <span className="bg-orange-200/80 text-orange-900 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                  {chatHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Workspace Tab Panels */}
          {activeTab === "summary" ? (
            <SummaryView
              summaryMarkdown={summaryMarkdown}
              onGenerateSummary={handleGenerateSummary}
              isGenerating={isGeneratingSummary}
            />
          ) : (
            <ChatView
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          )}
        </main>
      </div>
    </div>
  );
}
