// app/dashboard/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Save, AlertTriangle, User, CreditCard, Sparkles } from "lucide-react";

// ── Glass card ───────────────────────────────────────────────────────────────
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

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  outline: "none",
};

const NICHES = [
  { value: "default",  label: "General Assistant" },
  { value: "law",      label: "Legal Assistant"   },
  { value: "business", label: "Business Strategy" },
  { value: "medical",  label: "Medical Information" },
];

// ════════════════════════════════════════════════════════════════════════════
// Member view — personal preferences + plan
// ════════════════════════════════════════════════════════════════════════════
function MemberSettings() {
  const [niche, setNiche]       = useState("default");
  const [plan, setPlan]         = useState("FREE");
  const [usage, setUsage]       = useState<any>(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/usage/me").then((r) => r.json()).catch(() => ({})),
    ]).then(([usageData]) => {
      setPlan(usageData.plan || "FREE");
      setUsage(usageData);
      setLoading(false);
    });
  }, []);

  const handleSaveNiche = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update own niche via member-safe endpoint
      await fetch("/api/user/niche", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "PRO" }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    }
  };

  const handleManage = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-white/40 text-sm">Loading…</p>
      </div>
    );
  }

  const isPro = plan === "PRO" || plan === "ENTERPRISE";

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Your personal preferences</p>
      </div>

      {/* ── AI Assistant preference ── */}
      <GlassCard className="mb-5 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Sparkles size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">AI Assistant</h2>
        </div>
        <form onSubmit={handleSaveNiche} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs mb-1.5">Your Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            >
              {NICHES.map((n) => (
                <option key={n.value} value={n.value} style={{ background: "#1e1e4a" }}>
                  {n.label}
                </option>
              ))}
            </select>
            <p className="text-white/25 text-xs mt-1.5">
              Tailors the AI assistant's responses to your industry
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
            >
              <Save size={14} />
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* ── Plan & billing ── */}
      <GlassCard className="mb-5 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <CreditCard size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Plan & Billing</h2>
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">
              Current plan:{" "}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold ml-1"
                style={
                  isPro
                    ? { background: "rgba(16,185,129,0.2)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" }
                }
              >
                {plan}
              </span>
            </p>
            {usage && (
              <p className="text-white/35 text-xs mt-1">
                {usage.myTokens?.toLocaleString() ?? 0} / {usage.quotaTotal?.toLocaleString() ?? "—"} tokens used this month
              </p>
            )}
          </div>

          {isPro ? (
            <button
              onClick={handleManage}
              className="px-4 py-2 rounded-xl text-white text-xs font-medium transition-all hover:brightness-110"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Manage Subscription
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 rounded-xl text-white text-xs font-medium transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
            >
              Upgrade to Pro →
            </button>
          )}
        </div>

        {!isPro && (
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)" }}
          >
            <p className="text-white/60 text-xs leading-relaxed">
              <span className="text-blue-400 font-medium">Pro plan</span> gives you 500,000 tokens/month,
              priority support, and advanced analytics for $29/mo. Cancel anytime.
            </p>
          </div>
        )}
      </GlassCard>

      {/* ── Account info ── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <User size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold text-sm">Account</h2>
        </div>
        <p className="text-white/40 text-xs">
          To update your email or password, contact your organization admin.
        </p>
      </GlassCard>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Admin view — org settings + danger zone
// ════════════════════════════════════════════════════════════════════════════
function AdminSettings() {
  const [orgName, setOrgName]           = useState("");
  const [quota, setQuota]               = useState(10000000);
  const [defaultNiche, setDefaultNiche] = useState("default");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setOrgName(d.orgName || "My Organization");
        setQuota(d.tokenLimit || 10000000);
        setDefaultNiche(d.defaultNiche || "default");
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, tokenLimit: quota, defaultNiche }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const sliderMin = 10_000;
  const sliderMax = 100_000_000;
  const sliderPct = ((quota - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings / Billing</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your organization settings</p>
      </div>

      <GlassCard className="mb-5 p-6">
        <h2 className="text-white font-semibold text-base mb-5">Organization Settings</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-white/50 text-xs mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-1.5">Monthly Token Quota</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                className="w-36 px-4 py-2.5 rounded-xl text-sm tabular-nums"
                style={inputStyle}
              />
              <div className="flex-1 relative h-5 flex items-center">
                <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
                <div className="absolute left-0 h-1.5 rounded-full" style={{ width: `${sliderPct}%`, background: "linear-gradient(90deg,#4f46e5,#818cf8)" }} />
                <input
                  type="range" min={sliderMin} max={sliderMax} step={10000} value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  className="absolute inset-x-0 w-full opacity-0 cursor-pointer h-5"
                  style={{ WebkitAppearance: "none" }}
                />
                <div
                  className="absolute w-4 h-4 rounded-full pointer-events-none"
                  style={{ left: `calc(${sliderPct}% - 8px)`, background: "linear-gradient(135deg,#6366f1,#a78bfa)", boxShadow: "0 0 8px rgba(99,102,241,0.7)" }}
                />
              </div>
            </div>
            <p className="text-white/25 text-xs mt-1.5">Tokens allowed per month for your organization</p>
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-1.5">Default Niche for New Users</label>
            <select
              value={defaultNiche}
              onChange={(e) => setDefaultNiche(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            >
              {NICHES.map((n) => (
                <option key={n.value} value={n.value} style={{ background: "#1e1e4a" }}>{n.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
            >
              <Save size={15} />
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
            </button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-6" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)" }}>
        <h2 className="text-red-400 font-semibold text-base mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Delete All Data</p>
            <p className="text-white/35 text-xs mt-0.5">This action cannot be undone</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 text-sm font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)" }}
          >
            <AlertTriangle size={14} />
            Delete All Data
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Root — pick view based on role
// ════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user/role")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-white/40 text-sm">Loading…</p>
      </div>
    );
  }

  return isAdmin ? <AdminSettings /> : <MemberSettings />;
}
