// app/not-found.tsx
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0f2e 0%, #16213e 40%, #0f3460 75%, #1a1a4e 100%)" }}
    >
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "rgba(99,102,241,0.08)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(139,92,246,0.08)", filter: "blur(60px)" }} />
      </div>

      <div className="relative text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-2.5 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">AI-AID</span>
        </div>

        {/* 404 */}
        <div
          className="text-8xl font-bold mb-4 leading-none"
          style={{
            background: "linear-gradient(135deg,#818cf8,#a78bfa,#c4b5fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">Page not found</h1>
        <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/chat"
            className="px-6 py-2.5 rounded-xl text-white/70 text-sm font-medium transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Open Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
