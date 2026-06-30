"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0f2e 0%, #16213e 40%, #0f3460 75%, #1a1a4e 100%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "rgba(239,68,68,0.07)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.07)", filter: "blur(60px)" }} />
      </div>

      <div className="relative text-center">
        <div className="inline-flex items-center gap-2.5 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">AI-AID</span>
        </div>

        <div
          className="text-7xl font-bold mb-4 leading-none"
          style={{
            background: "linear-gradient(135deg,#fca5a5,#f87171)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          500
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">Something went wrong</h1>
        <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
          An unexpected error occurred. Try refreshing the page or go back to the dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            <RotateCcw size={14} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-xl text-white/70 text-sm font-medium transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
