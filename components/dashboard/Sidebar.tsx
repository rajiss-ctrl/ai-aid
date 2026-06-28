// components/dashboard/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  isAdmin: boolean;
}

export function Sidebar({ userName, userEmail, userRole, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const displayName = userName || userEmail?.split("@")[0] || "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const navItems = [
    { href: "/dashboard",          label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    { href: "/dashboard/chat",     label: "Chat",       icon: MessageSquare,   adminOnly: false },
    { href: "/dashboard/usage",    label: "Usage",      icon: BarChart3,       adminOnly: false },
    { href: "/dashboard/users",    label: "Users",      icon: Users,           adminOnly: true  },
    { href: "/dashboard/settings", label: "Settings",   icon: Settings,        adminOnly: true  },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <aside
      className={`relative flex flex-col border-r border-white/10 transition-all duration-300 overflow-hidden ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        background: "rgba(10, 10, 30, 0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* ── Decorative triangle / geometric shape ── */}
      {/* Large triangle pointing right, centered vertically */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Primary triangle — bright purple-blue */}
        <svg
          className="absolute"
          style={{ bottom: "10%", left: "-30%", width: "160%", height: "60%" }}
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,400 400,200 0,0"
            fill="url(#triGrad)"
            opacity="0.18"
          />
          <defs>
            <linearGradient id="triGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="60%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Secondary smaller triangle — teal accent */}
        <svg
          className="absolute"
          style={{ top: "5%", left: "-10%", width: "80%", height: "40%" }}
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,300 300,150 0,0"
            fill="url(#triGrad2)"
            opacity="0.10"
          />
          <defs>
            <linearGradient id="triGrad2" x1="0" y1="0" x2="1" y2="0.5">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Soft radial glow behind nav area */}
        <div
          className="absolute"
          style={{
            top: "30%",
            left: "-40%",
            width: "180%",
            height: "40%",
            background:
              "radial-gradient(ellipse at 40% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Logo ── */}
      <div className="relative flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 0 12px rgba(99,102,241,0.5)",
              }}
            >
              <span className="text-white text-sm font-bold">AID</span>
            </div>
            <span className="text-white font-semibold text-base tracking-wide">AI-AID</span>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 0 12px rgba(99,102,241,0.5)",
              }}
            >
              <span className="text-white text-sm font-bold">AID</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/40 hover:text-white transition-colors p-0.5 rounded"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── Subtitle ── */}
      {!collapsed && (
        <div className="relative px-4 py-3">
          <p className="text-white/30 text-xs tracking-wider">Comprehensive control</p>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="relative flex-1 py-3 px-2 space-y-0.5">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
              style={
                isActive
                  ? {
                      background: "rgba(99,102,241,0.25)",
                      boxShadow:
                        "inset 0 0 0 1px rgba(99,102,241,0.35), 0 2px 8px rgba(99,102,241,0.15)",
                    }
                  : {}
              }
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── User section ── */}
      <div className="relative px-3 py-4 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 0 10px rgba(99,102,241,0.4)",
              }}
            >
              {displayInitial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{displayName}</p>
              <p className="text-white/40 text-xs truncate leading-tight">{userEmail}</p>
            </div>

            <Link
              href="/api/auth/signout"
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 0 10px rgba(99,102,241,0.4)",
              }}
            >
              {displayInitial}
            </div>
            <Link
              href="/api/auth/signout"
              className="text-white/30 hover:text-white/70 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
