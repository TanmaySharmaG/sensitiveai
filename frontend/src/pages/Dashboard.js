import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, RefreshCw, Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { getHistory, deleteScan } from "../utils/api";
import { formatDate, riskColor, classificationColor } from "../utils/helpers";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e5e5e5", fontSize: 12 },
};

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getHistory(100);
      setHistory(data.history || []);
    } catch {
      toast.error("Failed to load scan history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try {
      await deleteScan(id);
      setHistory((h) => h.filter((s) => s.scan_id !== id));
      toast.success("Scan deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Aggregations
  const riskDist = [
    { name: "Safe", value: history.filter((s) => s.risk_score < 30).length, color: "#10B981" },
    { name: "Medium", value: history.filter((s) => s.risk_score >= 30 && s.risk_score < 65).length, color: "#F59E0B" },
    { name: "Critical", value: history.filter((s) => s.risk_score >= 65).length, color: "#FF6B6B" },
  ];
  const classMap = {};
  history.forEach((s) => { const l = s.classification?.label; if (l) classMap[l] = (classMap[l] || 0) + 1; });
  const classDist = Object.entries(classMap).map(([name, value]) => ({ name, value, color: classificationColor(name) }));
  const avgRisk = history.length ? Math.round(history.reduce((a, b) => a + b.risk_score, 0) / history.length) : 0;
  const totalFindings = history.reduce((a, b) => a + (b.finding_count || 0), 0);

  const StatCard = ({ label, value, color = "#F59E0B" }) => (
    <div className="glass p-5">
      <p className="text-white/40 text-sm mb-1">{label}</p>
      <p className="font-display text-4xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <PageHeader title="Dashboard" subtitle="Analytics and scan history overview" icon={LayoutDashboard} />
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Scans" value={history.length} />
          <StatCard label="Avg Risk Score" value={`${avgRisk}`} color={riskColor(avgRisk)} />
          <StatCard label="Total Findings" value={totalFindings} color="#FF6B6B" />
          <StatCard label="Critical Docs" value={riskDist[2].value} color="#FF6B6B" />
        </div>

        {/* Charts row */}
        {history.length > 0 && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Risk distribution pie */}
            <div className="glass p-5">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDist} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                    {riskDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Classification bar */}
            <div className="glass p-5">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">AI Classification</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={classDist} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {classDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History table */}
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-white/80 font-medium">Scan History</h3>
            <button onClick={load} className="text-white/40 hover:text-white/80 transition-colors">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          {loading ? (
            <div className="py-16 text-center text-white/30">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#F59E0B] rounded-full animate-spin mx-auto mb-3" />
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-white/30">
              <p className="text-4xl mb-3">📋</p>
              <p>No scans yet. Upload a document to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3">File</th>
                    <th className="text-left px-4 py-3">Risk</th>
                    <th className="text-left px-4 py-3">Level</th>
                    <th className="text-left px-4 py-3">Classification</th>
                    <th className="text-left px-4 py-3">Findings</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {history.map((s) => (
                    <tr key={s.scan_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white/70 max-w-[160px] truncate">{s.filename}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold" style={{ color: riskColor(s.risk_score) }}>
                          {s.risk_score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="label-tag text-[10px]" style={{ background: `${riskColor(s.risk_score)}22`, color: riskColor(s.risk_score) }}>
                          {s.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{s.classification?.label}</td>
                      <td className="px-4 py-3 text-[#FF6B6B]">{s.finding_count}</td>
                      <td className="px-4 py-3 text-white/30 text-xs">{formatDate(s.timestamp)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(s.scan_id)}
                          className="text-white/20 hover:text-[#FF6B6B] transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
