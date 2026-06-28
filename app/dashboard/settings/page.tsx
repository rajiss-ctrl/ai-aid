// app/dashboard/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

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

// ── Shared glass input ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  outline: "none",
};

export default function SettingsPage() {
  const [orgName, setOrgName]           = useState("");
  const [quota, setQuota]               = useState(10000000);
  const [defaultNiche, setDefaultNiche] = useState("default");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [isAdmin, setIsAdmin]           = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/user/role").then((r) => r.json()).catch(() => ({ role: "user" })),
    ]).then(([settingsData, roleData]) => {
      setOrgName(settingsData.orgName || "My Organization");
      setQuota(settingsData.tokenLimit || 10000000);
      setDefaultNiche(settingsData.defaultNiche || "default");
      setIsAdmin(roleData.role === "admin");
      setLoading(false);
    });
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
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-white/40 text-sm">Loading settings…</p>
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
          <p className="text-white/40 text-sm">Only admins can access settings.</p>
        </GlassCard>
      </div>
    );
  }

  // Slider fill percentage
  const sliderMin = 10_000;
  const sliderMax = 100_000_000;
  const sliderPct = ((quota - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings / Billing</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your organization settings</p>
      </div>

      {/* ── Organization Settings card ── */}
      <GlassCard className="mb-5 p-6">
        <h2 className="text-white font-semibold text-base mb-5">Organization Settings</h2>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Org name */}
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

          {/* Monthly token quota */}
          <div>
            <label className="block text-white/50 text-xs mb-1.5">Monthly Token Quota</label>
            <div className="flex items-center gap-3">
              {/* Number box */}
              <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                className="w-36 px-4 py-2.5 rounded-xl text-sm tabular-nums"
                style={inputStyle}
              />
              {/* Custom-styled range slider */}
              <div className="flex-1 relative h-5 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
                {/* Filled portion */}
                <div
                  className="absolute left-0 h-1.5 rounded-full"
                  style={{ width: `${sliderPct}%`, background: "linear-gradient(90deg,#4f46e5,#818cf8)" }}
                />
                {/* Native range (transparent, sits on top) */}
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={10000}
                  value={quota}
                  onChange={(e) => setQuota(Number(e.target.value))}
                  className="absolute inset-x-0 w-full opacity-0 cursor-pointer h-5"
                  style={{ WebkitAppearance: "none" }}
                />
                {/* Thumb dot */}
                <div
                  className="absolute w-4 h-4 rounded-full pointer-events-none"
                  style={{
                    left: `calc(${sliderPct}% - 8px)`,
                    background: "linear-gradient(135deg,#6366f1,#a78bfa)",
                    boxShadow: "0 0 8px rgba(99,102,241,0.7)",
                  }}
                />
              </div>
            </div>
            <p className="text-white/25 text-xs mt-1.5">Tokens allowed per month for your organization</p>
          </div>

          {/* Default niche */}
          <div>
            <label className="block text-white/50 text-xs mb-1.5">Default Niche for New Users</label>
            <select
              value={defaultNiche}
              onChange={(e) => setDefaultNiche(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            >
              <option value="default" style={{ background: "#1e1e4a" }}>General Assistant</option>
              <option value="law"     style={{ background: "#1e1e4a" }}>Legal Assistant</option>
              <option value="business" style={{ background: "#1e1e4a" }}>Business Strategy</option>
              <option value="medical" style={{ background: "#1e1e4a" }}>Medical Information</option>
            </select>
          </div>

          {/* Save button */}
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

      {/* ── Danger Zone card ── */}
      <GlassCard
        className="p-6"
        style={{
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.20)",
        }}
      >
        <h2 className="text-red-400 font-semibold text-base mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Delete All Data</p>
            <p className="text-white/35 text-xs mt-0.5">This action cannot be undone</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 text-sm font-medium transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.30)",
            }}
          >
            <AlertTriangle size={14} />
            Delete All Data
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
