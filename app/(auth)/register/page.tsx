// app/(auth)/register/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Scale, Briefcase, Stethoscope, Cpu } from "lucide-react";

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.90)",
  outline: "none",
};

const niches = [
  {
    value: "default",
    label: "General Assistant",
    icon: Cpu,
    description: "General purpose AI for everyday tasks",
    color: "#818cf8",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.30)",
  },
  {
    value: "law",
    label: "Legal Assistant",
    icon: Scale,
    description: "Legal research, contracts, and case law",
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.30)",
  },
  {
    value: "business",
    label: "Business Strategy",
    icon: Briefcase,
    description: "Growth, operations, and financial planning",
    color: "#93c5fd",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.30)",
  },
  {
    value: "medical",
    label: "Medical Information",
    icon: Stethoscope,
    description: "Healthcare info (educational only)",
    color: "#6ee7b7",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.30)",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    niche: "default",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/login?registered=true");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #0f0f2e 0%, #16213e 40%, #0f3460 75%, #1a1a4e 100%)" }}
    >
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,0.07)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(139,92,246,0.07)", filter: "blur(80px)" }} />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-wide">AI-AID</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Create your workspace</h1>
          <p className="text-white/40 text-sm mt-1">Start your free AI assistant today</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {error && (
            <div
              className="rounded-xl px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Your name</label>
                <input
                  name="name" type="text" value={form.name} onChange={handleChange}
                  placeholder="John Doe" required
                  className="w-full px-4 py-2.5 rounded-xl text-sm placeholder-white/20"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Email</label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-2.5 rounded-xl text-sm placeholder-white/20"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password + Org row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Password</label>
                <input
                  name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="Min 6 characters" required
                  className="w-full px-4 py-2.5 rounded-xl text-sm placeholder-white/20"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1.5">Organization name</label>
                <input
                  name="orgName" type="text" value={form.orgName} onChange={handleChange}
                  placeholder="Acme Inc." required
                  className="w-full px-4 py-2.5 rounded-xl text-sm placeholder-white/20"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Niche selection */}
            <div>
              <label className="block text-white/50 text-xs mb-3">AI Assistant Niche</label>
              <div className="grid grid-cols-2 gap-2.5">
                {niches.map((n) => {
                  const Icon = n.icon;
                  const active = form.niche === n.value;
                  return (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, niche: n.value }))}
                      className="flex flex-col gap-2 p-3.5 rounded-xl text-left transition-all hover:brightness-110"
                      style={{
                        background: active ? n.bg : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? n.border : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <Icon size={16} style={{ color: n.color }} />
                      <div>
                        <p className="text-white text-xs font-medium leading-tight">{n.label}</p>
                        <p className="text-white/35 text-xs mt-0.5 leading-tight">{n.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
