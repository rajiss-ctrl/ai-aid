"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Settings, BarChart2 } from "lucide-react";

// ── Sparkline (tiny SVG path from data points) ──────────────────────────────
function Sparkline({ color = "#34d399" }: { color?: string }) {
  // Static decorative wave — matches the green sparkline in the mockup
  const points = [0,18,8,10,16,14,22,6,30,12,38,4,46,16,54,8,62,14,70,2,78,10,86,6,94,12,100,8];
  const coords: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    coords.push(`${points[i]},${20 - points[i + 1]}`);
  }
  return (
    <svg viewBox="0 0 100 22" preserveAspectRatio="none" className="w-full h-10 mt-3">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

// ── Circular progress ring ───────────────────────────────────────────────────
function QuotaRing({ percent }: { percent: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="flex items-center justify-center mt-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          {/* Track */}
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          {/* Progress */}
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-lg font-semibold">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Glass card wrapper ───────────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/role").then((r) => r.json()),
      fetch("/api/usage").then((r) => r.json()),
    ])
      .then(([roleData, usageData]) => {
        setIsAdmin(roleData.role === "admin");
        setStats(usageData);
      })
      .finally(() => setLoading(false));
  }, []);

  const tokens: number = stats?.thisMonth?.tokens ?? 0;
  const cost: string = stats?.thisMonth?.costUsd?.toFixed(2) ?? "0.00";
  const quotaPercent: number = Math.min(stats?.quota?.percent ?? 0, 100);

  return (
    <div className="p-6 md:p-8 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Tokens */}
        <GlassCard>
          <p className="text-white/50 text-sm mb-1">Total Tokens</p>
          <p
            className="text-4xl font-bold mt-2"
            style={{ color: "#60a5fa" /* blue-400 */ }}
          >
            {loading ? "—" : tokens.toLocaleString()}
          </p>
          {/* Small blue progress bar */}
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(quotaPercent, 100)}%`,
                background: "linear-gradient(90deg, #3b82f6, #818cf8)",
              }}
            />
          </div>
        </GlassCard>

        {/* Estimated Cost */}
        <GlassCard>
          <p className="text-white/50 text-sm mb-1">Estimated Cost</p>
          <p
            className="text-4xl font-bold mt-2"
            style={{ color: "#34d399" /* emerald-400 */ }}
          >
            {loading ? "—" : `$${cost}`}
          </p>
          <Sparkline color="#34d399" />
        </GlassCard>

        {/* Quota Used */}
        <GlassCard className="flex flex-col">
          <p className="text-white/50 text-sm mb-1">Quota Used</p>
          <QuotaRing percent={loading ? 0 : quotaPercent} />
        </GlassCard>
      </div>

      {/* ── Admin Controls ── */}
      {isAdmin && (
        <GlassCard>
          <h2 className="text-white text-base font-semibold mb-4">Admin Controls</h2>
          <div className="flex gap-3 flex-wrap">
            {/* Manage Users — blue gradient */}
            <a
              href="/dashboard/users"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              <Users size={16} />
              Manage Users
            </a>

            {/* Organization Settings — dark glass */}
            <a
              href="/dashboard/settings"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Settings size={16} />
              Organization Settings
            </a>

            {/* View Usage Analytics — green gradient */}
            <a
              href="/dashboard/usage"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}
            >
              <BarChart2 size={16} />
              View Usage Analytics
            </a>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
