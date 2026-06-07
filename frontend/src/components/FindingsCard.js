import React from "react";
import { patternLabel, patternIcon } from "../utils/helpers";

const COLORS = ["#F59E0B", "#10B981", "#FF6B6B", "#818CF8", "#34D399", "#F97316", "#EC4899", "#06B6D4"];

export default function FindingsCard({ findings = {} }) {
  const keys = Object.keys(findings);
  if (!keys.length) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-emerald font-medium">No sensitive patterns detected</p>
        <p className="text-white/30 text-sm mt-1">Document appears clean</p>
      </div>
    );
  }
  return (
    <div className="glass p-5 space-y-3">
      <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-4">Detected Patterns</h3>
      {keys.map((k, i) => {
        const { count, samples } = findings[k];
        const color = COLORS[i % COLORS.length];
        return (
          <div key={k} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-xl mt-0.5">{patternIcon(k)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{patternLabel(k)}</span>
                <span className="label-tag" style={{ background: `${color}22`, color }}>
                  {count} found
                </span>
              </div>
              {samples?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {samples.slice(0, 2).map((s, j) => (
                    <code key={j} className="text-xs bg-white/5 px-2 py-0.5 rounded font-mono text-white/50">
                      {s}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
