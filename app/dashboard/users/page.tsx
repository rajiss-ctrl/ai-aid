// app/dashboard/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  X,
  Save,
  RotateCcw,
} from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  niche: string;
  tokens: number;
  cost: number;
  lastActive: string;
  messageCount: number;
};

// ── Shared glass card ────────────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Niche badge colours ──────────────────────────────────────────────────────
const NICHE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  law:      { bg: "rgba(239,68,68,0.15)",   text: "#fca5a5", border: "rgba(239,68,68,0.30)"   },
  business: { bg: "rgba(59,130,246,0.15)",  text: "#93c5fd", border: "rgba(59,130,246,0.30)"  },
  medical:  { bg: "rgba(16,185,129,0.15)",  text: "#6ee7b7", border: "rgba(16,185,129,0.30)"  },
  default:  { bg: "rgba(255,255,255,0.08)", text: "#d1d5db", border: "rgba(255,255,255,0.15)" },
};

function nicheStyle(niche: string) {
  return NICHE_STYLES[niche?.toLowerCase()] ?? NICHE_STYLES.default;
}

// ── Quota bar ────────────────────────────────────────────────────────────────
const QUOTA = 10_000_000;
function QuotaBar({ tokens }: { tokens: number }) {
  const pct = Math.min((tokens / QUOTA) * 100, 100);
  const exceeded = tokens >= QUOTA;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-white/60 whitespace-nowrap tabular-nums">
        {tokens.toLocaleString()}/{(QUOTA / 1_000_000).toFixed(0)}M
      </span>
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: exceeded
              ? "linear-gradient(90deg,#ef4444,#f87171)"
              : "linear-gradient(90deg,#3b82f6,#818cf8)",
          }}
        />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviting, setInviting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const itemsPerPage = 10;
  const niches = ["All", "Law", "Business", "Medical", "Default"];

  useEffect(() => {
    Promise.all([
      fetch("/api/usage/admin/users").then((r) => r.json()),
      fetch("/api/user/role").then((r) => r.json()),
    ])
      .then(([usersData, roleData]) => {
        setUsers(usersData.users || []);
        setIsAdmin(roleData.role === "admin");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche =
      selectedNiche === "All" || u.niche?.toLowerCase() === selectedNiche.toLowerCase();
    return matchesSearch && matchesNiche;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (data.inviteUrl) {
        setInviteUrl(data.inviteUrl);
        setInviteEmail("");
      }
    } catch (err) {
      console.error("Invite failed:", err);
    } finally {
      setInviting(false);
    }
  };

  const updateNiche = async (userId: string, niche: string) => {
    try {
      await fetch("/api/admin/users/niche", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, niche }),
      });
      const res = await fetch("/api/usage/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to update niche:", err);
    }
  };

  const resetQuota = async (userId: string) => {
    try {
      await fetch("/api/admin/users/reset-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error("Failed to reset quota:", err);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-white/40 text-sm">Loading users…</p>
      </div>
    );
  }

  // ── Access denied ──
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <GlassCard className="max-w-sm w-full p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-white font-semibold mb-2">Access Denied</h2>
          <p className="text-white/40 text-sm">You don't have permission to view this page.</p>
        </GlassCard>
      </div>
    );
  }

  const totalTokens = users.reduce((s, u) => s + u.tokens, 0);
  const adminCount = users.filter((u) => u.role === "ADMIN" || u.role === "OWNER").length;
  const memberCount = users.filter((u) => u.role === "MEMBER").length;

  // Stat card accent configs
  const statCards = [
    { label: "Total Users",    value: users.length,               accent: "rgba(139,92,246,0.25)",  border: "rgba(139,92,246,0.35)"  },
    { label: "Admins",         value: adminCount,                  accent: "rgba(16,185,129,0.20)",  border: "rgba(16,185,129,0.35)"  },
    { label: "Regular Users",  value: memberCount,                 accent: "rgba(56,189,248,0.20)",  border: "rgba(56,189,248,0.35)"  },
    { label: "Total Tokens",   value: totalTokens.toLocaleString(), accent: "rgba(244,114,182,0.20)", border: "rgba(244,114,182,0.35)" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Users</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage team members and their access</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
        >
          <UserPlus size={15} />
          Invite User
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-4"
            style={{
              background: c.accent,
              border: `1px solid ${c.border}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <p className="text-white/50 text-xs mb-1">{c.label}</p>
            <p className="text-white text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters row ── */}
      <GlassCard className="mb-5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <Search size={15} className="text-white/30 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-white/80 placeholder-white/25 text-sm outline-none flex-1"
            />
          </div>

          {/* Niche pills */}
          <div className="flex gap-1.5 flex-wrap">
            {niches.map((n) => {
              const active = selectedNiche === n;
              const ns = nicheStyle(n.toLowerCase());
              return (
                <button
                  key={n}
                  onClick={() => { setSelectedNiche(n); setCurrentPage(1); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    active
                      ? { background: ns.bg, color: ns.text, border: `1px solid ${ns.border}` }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* Export */}
          <button
            onClick={() => {
              const csv = users.map((u) => `${u.email},${u.niche},${u.tokens},${u.cost}`).join("\n");
              const blob = new Blob([`Email,Niche,Tokens,Cost\n${csv}`], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "users_export.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </GlassCard>

      {/* ── Table ── */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["User Email", "Niche", "Total Tokens Used", "Est. Cost", "Last Active", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, idx) => {
                const ns = nicheStyle(user.niche);
                const isOwner = user.role === "OWNER";
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: idx < paginatedUsers.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                    className="group transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Email + role */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                        >
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white/85 text-sm leading-tight">{user.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-white/35 text-xs">Role: {user.role?.charAt(0) + user.role?.slice(1).toLowerCase()}</span>
                            {isOwner && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}
                              >
                                Super Admin
                              </span>
                            )}
                            {user.role === "ADMIN" && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}
                              >
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Niche selector */}
                    <td className="px-5 py-3.5">
                      <select
                        value={user.niche?.toLowerCase() || "default"}
                        onChange={(e) => updateNiche(user.id, e.target.value)}
                        className="text-xs px-2.5 py-1 rounded-full outline-none cursor-pointer transition-all"
                        style={{
                          background: ns.bg,
                          color: ns.text,
                          border: `1px solid ${ns.border}`,
                        }}
                      >
                        <option value="law">Law</option>
                        <option value="business">Business</option>
                        <option value="medical">Medical</option>
                        <option value="default">Default</option>
                      </select>
                    </td>

                    {/* Token usage */}
                    <td className="px-5 py-3.5">
                      <QuotaBar tokens={user.tokens} />
                    </td>

                    {/* Cost */}
                    <td className="px-5 py-3.5">
                      <span className="text-white/70 text-sm tabular-nums">${user.cost.toFixed(4)}</span>
                    </td>

                    {/* Last active */}
                    <td className="px-5 py-3.5">
                      <span className="text-white/50 text-sm">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {/* Save niche */}
                        <button
                          onClick={() => updateNiche(user.id, user.niche?.toLowerCase() || "default")}
                          title="Save niche"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                          style={{ color: "rgba(255,255,255,0.40)" }}
                        >
                          <Save size={13} />
                        </button>

                        {/* Reset quota */}
                        {!isOwner && (
                          <button
                            onClick={() => resetQuota(user.id)}
                            title="Reset quota"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                            style={{ color: "rgba(255,255,255,0.40)" }}
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}

                        {/* Remove */}
                        {!isOwner && (
                          <button
                            title="Remove user"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20"
                            style={{ color: "rgba(255,255,255,0.40)" }}
                          >
                            <X size={13} />
                          </button>
                        )}

                        {/* Owner badge */}
                        {isOwner && (
                          <span
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ background: "rgba(139,92,246,0.18)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.28)" }}
                          >
                            Organization Owner
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs text-white/30">
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) pg = i + 1;
                  else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i;
                  else pg = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className="w-7 h-7 rounded-lg text-xs font-medium transition-all"
                    style={
                      currentPage === pg
                        ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
                    }
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Invite modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "rgba(20,20,50,0.90)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-base">Invite Team Member</h2>
              <button
                onClick={() => { setShowInviteModal(false); setInviteUrl(""); setInviteEmail(""); }}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <option value="MEMBER">Member (Regular User)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
              >
                {inviting ? "Sending…" : "Send Invite"}
              </button>
            </form>

            {inviteUrl && (
              <div
                className="mt-4 p-3 rounded-xl text-xs break-all"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}
              >
                <p className="font-medium mb-1">Invite link created:</p>
                <p className="opacity-80">{inviteUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
