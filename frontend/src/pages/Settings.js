import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { getSettings, getHealth } from "../utils/api";
import { patternLabel, patternIcon } from "../utils/helpers";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState({ safe: 30, medium: 65 });

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: s }, { data: h }] = await Promise.all([getSettings(), getHealth()]);
      setSettings(s);
      setHealth(h);
      setThresholds({ safe: s.risk_thresholds.safe, medium: s.risk_thresholds.medium });
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Settings" subtitle="Configuration and model status" icon={SettingsIcon} />
        <div className="p-6 flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/10 border-t-[#F59E0B] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Settings" subtitle="Configuration and model status" icon={SettingsIcon} />
      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Model Status */}
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">AI Model Status</h3>
            <button onClick={load} className="text-white/30 hover:text-white/70 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-white/40 text-xs mb-2">Model</p>
              <p className="font-mono text-sm text-white/80">{settings?.model}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-white/40 text-xs mb-2">Status</p>
              <div className="flex items-center gap-2">
                {health?.model_loaded
                  ? <><CheckCircle size={15} className="text-[#10B981]" /><span className="text-[#10B981] text-sm font-medium">Loaded</span></>
                  : <><XCircle size={15} className="text-[#FF6B6B]" /><span className="text-[#FF6B6B] text-sm font-medium">Not loaded</span></>
                }
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-white/40 text-xs mb-2">Total Scans (session)</p>
              <p className="text-white font-semibold">{health?.scan_count ?? 0}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-white/40 text-xs mb-2">Supported Formats</p>
              <p className="text-white/70 text-sm">{settings?.supported_formats?.join(", ").toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="glass p-6 space-y-5">
          <h3 className="font-semibold text-white">Risk Thresholds</h3>
          <p className="text-white/40 text-sm">Configure the score boundaries for each risk level. These are display settings only.</p>
          <div className="space-y-5">
            {[
              { label: "Safe / Medium boundary", key: "safe", color: "#10B981", description: "Scores below this → Safe" },
              { label: "Medium / Critical boundary", key: "medium", color: "#F59E0B", description: "Scores below this (and above Safe) → Medium Risk" },
            ].map(({ label, key, color, description }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-white font-medium">{label}</p>
                    <p className="text-xs text-white/30">{description}</p>
                  </div>
                  <span className="font-mono font-bold text-lg" style={{ color }}>{thresholds[key]}</span>
                </div>
                <input type="range" min={5} max={95} value={thresholds[key]}
                  onChange={(e) => setThresholds({ ...thresholds, [key]: Number(e.target.value) })}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>
          <button onClick={() => toast.success("Thresholds saved (local only — restart backend to apply)")}
            className="btn-primary text-sm">
            Save Thresholds
          </button>
        </div>

        {/* Pattern Configuration */}
        <div className="glass p-6 space-y-4">
          <h3 className="font-semibold text-white">Active Detection Patterns</h3>
          <p className="text-white/40 text-sm">All patterns are active. Edit <code className="font-mono text-[#F59E0B]/80 text-xs">PATTERNS</code> in <code className="font-mono text-[#F59E0B]/80 text-xs">app.py</code> to customize.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(settings?.patterns_enabled || []).map((p) => (
              <div key={p} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl p-3">
                <span>{patternIcon(p)}</span>
                <div>
                  <p className="text-sm text-white/80">{patternLabel(p)}</p>
                  <p className="text-xs text-[#10B981] font-medium">Active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="glass p-5 text-center space-y-1">
          <p className="text-white/60 text-sm font-medium">SensitiveAI v1.0.0</p>
          <p className="text-white/25 text-xs">React · Flask · DistilBERT · Recharts · ReportLab</p>
        </div>
      </div>
    </div>
  );
}
