import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ScanSearch, FileText, BarChart3,
  GitCompare, Settings, ShieldAlert, X, Home,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/scanner", icon: ScanSearch, label: "Document Scanner" },
  { to: "/text", icon: FileText, label: "Text Scanner" },
  { to: "/compare", icon: GitCompare, label: "Compare Docs" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 flex flex-col h-screen
        bg-[#111111] border-r border-white/[0.06]
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-amber/20 border border-amber/30 flex items-center justify-center">
              <ShieldAlert size={16} className="text-amber" />
            </div>
            <span className="font-display font-semibold text-lg text-white group-hover:text-amber transition-colors">
              Sensitive<span className="text-amber">AI</span>
            </span>
          </button>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <Home size={16} />
            <span>Home</span>
          </NavLink>
          <div className="my-2 border-t border-white/[0.06]" />
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                ${isActive
                  ? "bg-amber/15 text-amber border border-amber/20 font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer status */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="glass p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse-slow" />
              <span className="text-xs text-white/60 font-medium">AI Model Active</span>
            </div>
            <p className="text-[10px] text-white/30 font-mono">DistilBERT SST-2</p>
          </div>
        </div>
      </aside>
    </>
  );
}
