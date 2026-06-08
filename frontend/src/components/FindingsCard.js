import React from "react";
import { patternLabel, patternIcon } from "../utils/helpers";
 
const COLORS = ["#F59E0B", "#10B981", "#FF6B6B", "#818CF8", "#34D399", "#F97316", "#EC4899", "#06B6D4"];
 
const CLASSIFICATION_MESSAGES = {
  "Highly Sensitive": {
    icon: "⛔",
    color: "#FF6B6B",
    title: "Highly Sensitive Content Detected",
    desc: "This document contains highly sensitive keywords such as 'confidential', 'secret', or 'restricted'. Handle with extreme care.",
  },
  "Confidential": {
    icon: "🔒",
    color: "#F59E0B",
    title: "Confidential Content Detected",
    desc: "This document contains confidential language indicating it is for internal or restricted use only.",
  },
  "Internal": {
    icon: "🏢",
    color: "#818CF8",
    title: "Internal Document",
    desc: "This document appears to be an internal draft or document pending approval. Not for external distribution.",
  },
};
 
export default function FindingsCard({ findings = {}, classification }) {
  const keys = Object.keys(findings);
  const label = classification?.label;
  const classInfo = CLASSIFICATION_MESSAGES[label];
 
  // No PII patterns but has sensitive classification
  if (!keys.length) {
    if (classInfo) {
      return (
        <div className="glass p-6 space-y-4">
          <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider">
            Content Analysis
          </h3>
          <div
            className="flex items-start gap-4 p-4 rounded-xl border"
            style={{ background: `${classInfo.color}10`, borderColor: `${classInfo.color}30` }}
          >
            <span className="text-3xl">{classInfo.icon}</span>
            <div>
              <p className="font-semibold text-white">{classInfo.title}</p>
              <p className="text-sm text-white/50 mt-1">{classInfo.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm text-white/70">No PII Patterns Detected</p>
              <p className="text-xs text-white/30 mt-0.5">
                No Aadhaar, PAN, email, phone, or credential patterns found — but document context is sensitive.
              </p>
            </div>
          </div>
        </div>
      );
    }
 
    // Truly clean document
    return (
      <div className="glass p-6 text-center">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-emerald-400 font-medium">No sensitive patterns detected</p>
        <p className="text-white/30 text-sm mt-1">Document appears clean</p>
      </div>
    );
  }
 
  // Has PII patterns — show them
  return (
    <div className="glass p-5 space-y-3">
      <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-4">
        Detected Patterns
      </h3>
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