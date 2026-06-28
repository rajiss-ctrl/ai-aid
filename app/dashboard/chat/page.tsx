"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Paperclip,
  Upload,
  Settings2,
  Sparkles,
  BarChart2,
  Mail,
  Search,
  Cpu,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tokens?: number;
};

const SUGGESTIONS = [
  {
    icon: <BarChart2 size={22} className="text-pink-400" />,
    label: "Generate a data insights report",
    prompt: "Generate a detailed data insights report for our SaaS business.",
  },
  {
    icon: <Mail size={22} className="text-yellow-400" />,
    label: "Draft a marketing email",
    prompt: "Draft a compelling marketing email to re-engage inactive users.",
  },
  {
    icon: <Search size={22} className="text-white/60" />,
    label: "Analyze user metrics",
    prompt: "Analyze our user metrics and suggest areas for improvement.",
  },
  {
    icon: <Cpu size={22} className="text-white/60" />,
    label: "Configure a new AI model",
    prompt: "Help me configure and compare AI model options for my use case.",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("there");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user's first name
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => { if (d.firstName) setFirstName(d.firstName); })
      .catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  async function sendMessage(promptOverride?: string) {
    const text = (promptOverride ?? input).trim();
    if (!text || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setError(null);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.status === 429) {
        setError("Token quota exceeded. Please upgrade your plan.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.text }
                    : m
                )
              );
            }
            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, tokens: data.usage?.completionTokens }
                    : m
                )
              );
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Main scrollable area ── */}
      <div className="flex-1 overflow-y-auto">
        {showWelcome ? (
          /* ── Welcome / suggestion cards screen ── */
          <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
            <h1 className="text-4xl font-light text-white mb-10 text-center tracking-tight">
              How can I help you today,{" "}
              <span className="font-semibold">{firstName}?</span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    {s.icon}
                  </div>
                  <span className="text-white/80 text-sm font-medium leading-snug group-hover:text-white transition-colors">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Conversation thread ── */
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <Sparkles size={14} className="text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm text-white/90"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #4f46e5, #6366f1)" }
                      : {
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }
                  }
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5 opacity-60">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                  {msg.tokens && msg.role === "assistant" && (
                    <p className="text-xs opacity-30 mt-1.5">{msg.tokens} tokens</p>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-red-300 mx-auto max-w-lg text-center"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="px-4 pb-5 pt-3">
        <div
          className="max-w-3xl mx-auto flex items-end gap-2 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Left icons */}
          <div className="flex items-center gap-1 pb-0.5 flex-shrink-0">
            <button
              type="button"
              aria-label="Voice input"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
            >
              <Mic size={17} />
            </button>
            <button
              type="button"
              aria-label="Attach file"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
            >
              <Paperclip size={17} />
            </button>
            <button
              type="button"
              aria-label="Upload"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
            >
              <Upload size={17} />
            </button>
            <button
              type="button"
              aria-label="Settings"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
            >
              <Settings2 size={17} />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or use a shortcut (/) ..."
            disabled={isStreaming}
            className="flex-1 bg-transparent text-white/90 placeholder-white/30 text-sm resize-none outline-none leading-relaxed py-1 min-h-[28px] max-h-40"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
