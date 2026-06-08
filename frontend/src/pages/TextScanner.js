import React, { useState } from "react";
import { FileText, Zap, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import RiskGauge from "../components/RiskGauge";
import FindingsCard from "../components/FindingsCard";
import { ClassificationBadge } from "../components/ClassificationChart";
import { predictText } from "../utils/api";
import { highlightText, patternLabel } from "../utils/helpers";
 
const SAMPLES = [
  { label: "Clean Text", text: "This is a general business report discussing market trends and quarterly performance indicators for the fiscal year." },
  { label: "With PII", text: "Contact John at john.doe@company.com or +91 9876543210. His Aadhaar is 1234 5678 9012 and PAN is ABCDE1234F." },
  { label: "API Leak", text: "DB_PASSWORD=s3cr3t123! AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY STRIPE_TOKEN=sk_live_abcd1234efgh5678" },
];
 
function HighlightedText({ tokens }) {
  return (
    <p className="text-sm text-white/70 leading-relaxed font-mono whitespace-pre-wrap break-words">
      {tokens.map((t, i) => {
        if (t.type === "text") return <span key={i}>{t.content}</span>;
        return (
          <span key={i} className={`highlight-${t.patternType} mx-0.5 cursor-help`} title={patternLabel(t.patternType)}>
            {t.content}
          </span>
        );
      })}
    </p>
  );
}
 
export default function TextScanner() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
 
  const handleScan = async () => {
    if (!text.trim()) return toast.error("Enter some text to analyze");
    setScanning(true);
    try {
      const { data } = await predictText(text);
      setResult(data);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Analysis failed");
    } finally {
      setScanning(false);
    }
  };
 
  const reset = () => { setText(""); setResult(null); };
 
  const tokens = result ? highlightText(text, result.findings) : [];
 
  return (
    <div className="min-h-screen">
      <PageHeader title="Text Scanner" subtitle="Paste text for instant sensitive data analysis" icon={FileText} />
      <div className="p-6 max-w-5xl mx-auto space-y-5">
 
        {/* Quick samples */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-white/30 self-center">Quick samples:</span>
          {SAMPLES.map((s) => (
            <button key={s.label} onClick={() => { setText(s.text); setResult(null); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:border-white/25 hover:text-white/80 transition-all">
              {s.label}
            </button>
          ))}
        </div>
 
        {/* Input */}
        <div className="glass p-5 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste any text here — emails, documents, config files, logs…"
            rows={8}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm
                       placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/50 transition-all
                       resize-none font-mono leading-relaxed"
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-white/25">{text.length.toLocaleString()} characters</p>
            <div className="flex gap-3">
              <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm">
                <RotateCcw size={13} /> Clear
              </button>
              <button onClick={handleScan} disabled={scanning || !text.trim()}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {scanning ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Zap size={14} />}
                {scanning ? "Analyzing…" : "Analyze Text"}
              </button>
            </div>
          </div>
        </div>
 
        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="glass p-5 flex flex-col items-center justify-center">
                <RiskGauge score={result.risk_score} size={150} />
              </div>
              <div className="glass p-5 flex flex-col items-center justify-center">
                <ClassificationBadge label={result.classification.label} confidence={result.classification.confidence} />
              </div>
              <div className="glass p-5 flex flex-col justify-center gap-3">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#FF6B6B]">{result.finding_count}</p>
                  <p className="text-white/40 text-sm mt-1">Sensitive findings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white/80">{result.categories_found.length}</p>
                  <p className="text-white/40 text-sm mt-1">Pattern categories</p>
                </div>
              </div>
            </div>
 
            {/* Highlighted text */}
            {tokens.length > 0 && (
              <div className="glass p-5">
                <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-3">Highlighted Sensitive Data</h3>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] max-h-60 overflow-y-auto">
                  <HighlightedText tokens={tokens} />
                </div>
                {result.categories_found.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.categories_found.map((c) => (
                      <span key={c} className={`highlight-${c} text-xs px-2 py-0.5 rounded font-medium`}>
                        {c.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
 
            <FindingsCard findings={result.findings} classification={result.classification} />
          </div>
        )}
      </div>
    </div>
  );
}
