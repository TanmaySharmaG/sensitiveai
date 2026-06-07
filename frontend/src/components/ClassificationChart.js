import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { classificationColor } from "../utils/helpers";

export function ClassificationBadge({ label, confidence }) {
  const color = classificationColor(label);
  return (
    <div className="flex flex-col items-center gap-2 p-5 glass rounded-2xl text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{ background: `${color}22`, border: `2px solid ${color}44` }}>
        {label === "Public" ? "🌐" : label === "Internal" ? "🏢" : label === "Confidential" ? "🔒" : "⛔"}
      </div>
      <div>
        <p className="font-semibold text-white text-lg">{label}</p>
        <p className="text-sm mt-0.5" style={{ color }}>
          {(confidence * 100).toFixed(1)}% confidence
        </p>
      </div>
    </div>
  );
}

export function ClassificationChart({ scores }) {
  if (!scores) return null;
  const data = Object.entries(scores).map(([label, value]) => ({
    subject: label,
    score: Math.round(value * 100),
    fullMark: 100,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
        <Radar name="Score" dataKey="score" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} />
        <Tooltip
          contentStyle={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e5e5e5" }}
          formatter={(v) => [`${v}%`, "Confidence"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
