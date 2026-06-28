// app/dashboard/usage/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { Search, Download, ChevronLeft, ChevronRight, X } from "lucide-react";

type AdminView = {
  role: "admin";
  summary: { totalTokens: number; totalCost: number; activeUsers: number; avgTokensPerUser: number };
  users: Array<{ id: string; email: string; niche: string; tokens: number; cost: number; lastActive: string; messageCount: number }>;
  dailyTrend: Array<{ date: string; tokens: number }>;
  nicheBreakdown: Array<{ name: string; value: number; color: string }>;
};

type UserView = {
  role: "user";
  myUsage: {
    myTokens: number; myCost: number; quotaTotal: number; quotaRemainingPercent: number; plan?: string;
    dailyHistory: Array<{ date: string; tokens: number }>;
    recentActivity: Array<{ date: string; messages: number; tokens: number; avgPerMessage: number }>;
  };
};

// ── Shared glass card ────────────────────────────────────────────────────────
function GlassCard({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", ...style }}>
      {children}
    </div>
  );
}

// ── Niche badge ──────────────────────────────────────────────────────────────
const NICHE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  law:      { bg: "rgba(239,68,68,0.15)",   text: "#fca5a5", border: "rgba(239,68,68,0.30)"   },
  business: { bg: "rgba(59,130,246,0.15)",  text: "#93c5fd", border: "rgba(59,130,246,0.30)"  },
  medical:  { bg: "rgba(16,185,129,0.15)",  text: "#6ee7b7", border: "rgba(16,185,129,0.30)"  },
  default:  { bg: "rgba(255,255,255,0.08)", text: "#d1d5db", border: "rgba(255,255,255,0.15)" },
};
function NicheBadge({ niche }: { niche: string }) {
  const s = NICHE_STYLES[niche?.toLowerCase()] ?? NICHE_STYLES.default;
  return (
    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {niche}
    </span>
  );
}

// ── Chart tooltip ────────────────────────────────────────────────────────────
const glassTooltip = { backgroundColor: "rgba(20,20,50,0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#e2e8f0", fontSize: 12 };

// ── Main page ────────────────────────────────────────────────────────────────
export default function UsagePage() {
  const [view, setView] = useState<AdminView | UserView | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminView["users"][0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchRoleAndData(); }, []);

  const fetchRoleAndData = async () => {
    try {
      const roleRes = await fetch("/api/user/role");
      const { role } = await roleRes.json();
      if (role === "admin") {
        const [summaryRes, usersRes, trendsRes] = await Promise.all([
          fetch("/api/usage/admin/summary"),
          fetch("/api/usage/admin/users"),
          fetch("/api/usage/admin/trends"),
        ]);
        const [summary, usersData, trends] = await Promise.all([summaryRes.json(), usersRes.json(), trendsRes.json()]);
        setView({ role: "admin", summary: { totalTokens: summary.totalTokens, totalCost: summary.totalCost, activeUsers: summary.activeUsers, avgTokensPerUser: summary.avgTokensPerUser }, users: usersData?.users || [], dailyTrend: trends?.daily || [], nicheBreakdown: trends?.byNiche || [] });
      } else {
        const usageRes = await fetch("/api/usage/me");
        const myUsage = await usageRes.json();
        setView({ role: "user", myUsage: { myTokens: myUsage.myTokens || 0, myCost: myUsage.myCost || 0, quotaTotal: myUsage.quotaTotal || 10000, quotaRemainingPercent: myUsage.quotaRemainingPercent || 100, plan: myUsage.plan || "FREE", dailyHistory: myUsage.dailyHistory || [], recentActivity: myUsage.recentActivity || [] } });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-full"><p className="text-white/40 text-sm">Loading usage data…</p></div>;
  }

  // ── Admin view ───────────────────────────────────────────────────────────
  if (view?.role === "admin") {
    const { summary, users, dailyTrend, nicheBreakdown } = view;
    const niches = ["all", "law", "business", "medical", "default"];
    const filteredUsers = (users || []).filter((u) => {
      const ms = u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const mn = nicheFilter === "all" || u.niche === nicheFilter;
      return ms && mn;
    });
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statCards = [
      { label: "Total Tokens (Month)", value: summary.totalTokens.toLocaleString(), accent: "rgba(99,102,241,0.20)",  border: "rgba(99,102,241,0.30)"  },
      { label: "Estimated Cost",       value: `$${summary.totalCost.toFixed(4)}`,    accent: "rgba(16,185,129,0.20)", border: "rgba(16,185,129,0.30)"  },
      { label: "Active Users",         value: summary.activeUsers,                   accent: "rgba(56,189,248,0.20)", border: "rgba(56,189,248,0.30)"  },
      { label: "Avg Tokens / User",    value: summary.avgTokensPerUser.toLocaleString(), accent: "rgba(244,114,182,0.20)", border: "rgba(244,114,182,0.30)" },
    ];

    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Usage Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5">Organization-wide token usage and cost tracking</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((c) => (
            <div key={c.label} className="rounded-2xl p-5" style={{ background: c.accent, border: `1px solid ${c.border}`, backdropFilter: "blur(12px)" }}>
              <p className="text-white/50 text-xs mb-1">{c.label}</p>
              <p className="text-white text-2xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Line chart */}
          <GlassCard className="p-5">
            <h2 className="text-white font-semibold mb-4">Daily Token Usage</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyTrend}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5)} stroke="rgba(255,255,255,0.25)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} />
                <Tooltip contentStyle={glassTooltip} />
                <Line type="monotone" dataKey="tokens" stroke="#818cf8" strokeWidth={2} dot={{ fill: "#818cf8", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Donut chart */}
          <GlassCard className="p-5">
            <h2 className="text-white font-semibold mb-4">Usage by Niche</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={nicheBreakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={100} dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "rgba(255,255,255,0.25)" }}>
                  {nicheBreakdown.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={glassTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* User details table */}
        <GlassCard>
          {/* Table header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="text-white font-semibold">User Usage Details</h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <Search size={13} className="text-white/30" />
                <input type="text" placeholder="Search by email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="bg-transparent text-white/80 placeholder-white/25 text-xs outline-none w-36" />
              </div>
              {/* Niche filter */}
              <select value={nicheFilter} onChange={(e) => { setNicheFilter(e.target.value); setCurrentPage(1); }} className="text-xs px-3 py-1.5 rounded-xl text-white/70 outline-none" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                {niches.map((n) => <option key={n} value={n} style={{ background: "#1e1e4a" }}>{n === "all" ? "All Niches" : n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
              </select>
              {/* Export */}
              <button onClick={() => { const csv = users.map((u) => `${u.email},${u.niche},${u.tokens},${u.cost}`).join("\n"); const blob = new Blob([`Email,Niche,Tokens,Cost\n${csv}`], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "usage_report.csv"; a.click(); URL.revokeObjectURL(url); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-medium transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                <Download size={13} /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["User Email","Niche","Tokens Used","Est. Cost","Last Active",""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, idx) => (
                  <tr key={user.id} className="group hover:bg-white/[0.03] transition-colors" style={{ borderBottom: idx < paginatedUsers.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <td className="px-5 py-3.5 text-sm text-white/80">{user.email}</td>
                    <td className="px-5 py-3.5"><NicheBadge niche={user.niche} /></td>
                    <td className="px-5 py-3.5 text-sm text-white/70 tabular-nums">{user.tokens.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-white/70 tabular-nums">${user.cost.toFixed(4)}</td>
                    <td className="px-5 py-3.5 text-sm text-white/50">{new Date(user.lastActive).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelectedUser(user)} className="text-xs font-medium transition-colors" style={{ color: "#818cf8" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")} onMouseLeave={(e) => (e.currentTarget.style.color = "#818cf8")}>View</button>
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-white/30 text-sm">No users found</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-white/30">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}</p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}><ChevronLeft size={13} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pg = i + 1; if (totalPages > 5) { if (currentPage <= 3) pg = i + 1; else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i; else pg = currentPage - 2 + i; } return <button key={pg} onClick={() => setCurrentPage(pg)} className="w-7 h-7 rounded-lg text-xs font-medium" style={currentPage === pg ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff" } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{pg}</button>; })}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}><ChevronRight size={13} /></button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* User detail modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "rgba(20,20,50,0.92)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm truncate">{selectedUser.email}</h3>
                <button onClick={() => setSelectedUser(null)} className="text-white/30 hover:text-white/70"><X size={18} /></button>
              </div>
              <div className="space-y-2.5 text-sm">
                {[["Niche", selectedUser.niche], ["Total Tokens", selectedUser.tokens.toLocaleString()], ["Messages", selectedUser.messageCount], ["Estimated Cost", `$${selectedUser.cost.toFixed(4)}`], ["Last Active", new Date(selectedUser.lastActive).toLocaleString()]].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between"><span className="text-white/40">{k}</span><span className="text-white/80">{v}</span></div>
                ))}
              </div>
              <button onClick={() => setSelectedUser(null)} className="mt-5 w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Regular user view ─────────────────────────────────────────────────────
  if (view?.role === "user") {
    const { myUsage } = view;
    const usedPct = Math.min(100 - myUsage.quotaRemainingPercent, 100);
    const isCritical = myUsage.quotaRemainingPercent <= 10;
    const isWarning  = myUsage.quotaRemainingPercent <= 20;
    const isPro = myUsage.plan === "PRO";

    const handleUpgrade = async () => {
      try { const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "PRO" }) }); const { url } = await res.json(); if (url) window.location.href = url; } catch (err) { console.error(err); }
    };
    const handleManage = async () => {
      try { const res = await fetch("/api/stripe/portal", { method: "POST" }); const { url } = await res.json(); if (url) window.location.href = url; } catch (err) { console.error(err); }
    };

    return (
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">My Usage Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">{isPro ? "Pro Plan – unlimited access" : "Free Plan – limited access"}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GlassCard className="p-5">
            <p className="text-white/50 text-xs mb-2">My Tokens (this month)</p>
            <p className="text-white text-xl font-bold tabular-nums">{myUsage.myTokens.toLocaleString()} / {myUsage.quotaTotal.toLocaleString()}</p>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${usedPct}%`, background: isCritical ? "linear-gradient(90deg,#ef4444,#f87171)" : isWarning ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#3b82f6,#818cf8)" }} />
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-white/50 text-xs mb-2">My Cost</p>
            <p className="text-2xl font-bold" style={{ color: "#34d399" }}>${myUsage.myCost.toFixed(2)} USD</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-white/50 text-xs mb-2">Quota Remaining</p>
            <p className="text-white text-2xl font-bold">{Math.max(0, myUsage.quotaRemainingPercent)}%</p>
          </GlassCard>
        </div>

        {/* Plan banner */}
        {!isPro ? (
          <GlassCard className="mb-5 p-5" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-white font-semibold">Upgrade to Pro</h2>
                <p className="text-white/50 text-sm mt-1">Get 500,000 tokens/month for only $29/mo. Cancel anytime.</p>
                <div className="flex gap-4 mt-2">{["500,000 tokens","Priority support","Advanced analytics"].map((f) => <span key={f} className="text-xs text-white/40"><span className="text-emerald-400 mr-1">✓</span>{f}</span>)}</div>
              </div>
              <button onClick={handleUpgrade} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium whitespace-nowrap transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>Upgrade to Pro →</button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="mb-5 p-5" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-emerald-400 font-semibold">Pro Plan Active</h2>
                <p className="text-white/50 text-sm mt-1">You're on the Pro plan. Enjoy unlimited access to all features.</p>
              </div>
              <button onClick={handleManage} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium whitespace-nowrap transition-all hover:brightness-110" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>Manage Subscription</button>
            </div>
          </GlassCard>
        )}

        {/* Quota warning */}
        {isWarning && !isPro && (
          <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: isCritical ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${isCritical ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`, color: isCritical ? "#fca5a5" : "#fde68a" }}>
            {isCritical ? "⚠️ You've exceeded your monthly token quota. Please upgrade to continue." : "⚠️ You've used 80% of your monthly token quota. Consider upgrading to Pro."}
            {isCritical && <button onClick={handleUpgrade} className="ml-3 px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>Upgrade Now</button>}
          </div>
        )}

        {/* Activity table */}
        <GlassCard className="mb-5">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="text-white font-semibold">My Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{["Date","Messages","Tokens Used","Avg Per Message"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {myUsage.recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-white/30 text-sm">No activity yet. Start chatting to see your usage.</td></tr>
                ) : myUsage.recentActivity.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < myUsage.recentActivity.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <td className="px-5 py-3 text-sm text-white/70">{row.date}</td>
                    <td className="px-5 py-3 text-sm text-white/70">{row.messages}</td>
                    <td className="px-5 py-3 text-sm text-white/70 tabular-nums">{row.tokens.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-white/70">{row.avgPerMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Bar chart */}
        <GlassCard className="p-5">
          <h2 className="text-white font-semibold mb-4">My Token Usage (Last 30 Days)</h2>
          {myUsage.dailyHistory.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-white/30 text-sm">No usage data yet. Start chatting to see your token chart.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={myUsage.dailyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5)} stroke="rgba(255,255,255,0.25)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} />
                <Tooltip contentStyle={glassTooltip} />
                <Bar dataKey="tokens" fill="url(#barGrad)" radius={[4, 4, 0, 0]}>
                  <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>
    );
  }

  return null;
}
