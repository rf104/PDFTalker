"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, User, Bot, FileText, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: {
    file_name: string;
    page_number: number;
    snippet: string;
  }[];
}

interface ChatViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (q: string) => Promise<void>;
  isThinking: boolean;
}

const PROMPT_SUGGESTIONS = [
  "Summarize the main objective and conclusion",
  "What are the key findings or takeaways?",
  "List important terminology and definitions",
  "Explain the core methodology or process"
];

export default function ChatView({
  chatHistory,
  onSendMessage,
  isThinking,
}: ChatViewProps) {
  const [question, setQuestion] = useState("");
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isThinking) {
      onSendMessage(question.trim());
      setQuestion("");
    }
  };

  const handleChipClick = (chipText: string) => {
    if (!isThinking) {
      onSendMessage(chipText);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="glass flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto w-full rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="glass-subtle border-b border-white/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-orange-500 text-white p-2 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Chat Assistant</h3>
            <p className="text-xs text-slate-500 font-medium">
              Grounded strictly in your uploaded PDF documents
            </p>
          </div>
        </div>

        <span className="bg-emerald-100/70 text-emerald-800 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Retrieval active
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {chatHistory.length === 0 ? (
          <div className="my-auto text-center flex flex-col items-center justify-center gap-3">
            <div className="bg-orange-100/70 text-orange-600 p-4 rounded-full">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Ask anything about your PDF</h4>
            <p className="text-xs text-slate-500 max-w-md">
              Type your question below or select a quick prompt to explore document insights.
            </p>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-xl">
              {PROMPT_SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  disabled={isThinking}
                  className="glass-subtle hover:bg-orange-50/60 text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full transition-all text-left hover:scale-[1.02]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === "user"
                    ? "bg-orange-600 text-white"
                    : "bg-slate-800 text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-orange-400" />
                )}
              </div>

              {/* Bubble Body */}
              <div
                className={`flex flex-col gap-2 p-4 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "glass bg-orange-50/40 text-slate-900 rounded-tr-none"
                    : "glass text-slate-900 rounded-tl-none prose prose-slate max-w-none"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="font-medium text-slate-900 m-0">{msg.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}

                {/* Sources Accordion */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/40">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 focus:outline-none"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        Citations ({msg.sources.length} source{msg.sources.length > 1 ? "s" : ""})
                      </span>
                      {expandedSources[msg.id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedSources[msg.id] && (
                      <div className="flex flex-col gap-2 mt-2">
                        {msg.sources.map((src, idx) => (
                          <div
                            key={idx}
                            className="glass-subtle rounded-lg p-2.5 text-xs text-slate-700"
                          >
                            <div className="flex items-center justify-between font-semibold text-orange-700 mb-1">
                              <span className="truncate">{src.file_name}</span>
                              <span className="bg-orange-100/70 px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">
                                Page {src.page_number}
                              </span>
                            </div>
                            <p className="italic text-slate-600 text-[11px] leading-relaxed m-0">
                              "{src.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isThinking && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-orange-400" />
            </div>
            <div className="glass rounded-2xl p-4 flex items-center gap-2 text-xs font-medium text-slate-600">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              <span>Searching the vector index and formulating a response…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 glass-subtle border-t border-white/40 flex items-center gap-3"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your uploaded PDF document…"
          disabled={isThinking}
          className="flex-1 glass rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!question.trim() || isThinking}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
