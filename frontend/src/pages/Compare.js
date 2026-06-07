import React, { useState } from "react";
import { GitCompare, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import DropZone from "../components/DropZone";
import RiskGauge from "../components/RiskGauge";
import FindingsCard from "../components/FindingsCard";
import { uploadFile, compareDocuments } from "../utils/api";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e5e5e5", fontSize: 12 },
};

function DocColumn({ label, file, setFile, meta, uploading, onUpload, result }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="label-tag bg-[#F59E0B]/15 text-[#F59E0B]">{label}</span>
      </div>
      <DropZone onFile={setFile} file={file} disabled={uploading} />
      {!meta && (
        <button onClick={onUpload} disabled={!file || uploading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
          {uploading ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Zap size={13} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
      )}
      {meta && !result && (
        <p className="text-xs text-emerald-400 text-center flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready: {meta.filename}
        </p>
      )}
      {result && (
        <div className="space-y-4">
          <div className="glass p-4 flex justify-center">
            <RiskGauge score={result.risk_score} size={150} />
          </div>
          <div className="glass p-4 text-center">
            <p className="text-white/40 text-xs mb-1">Classification</p>
            <p className="text-white font-semibold">{result.classification?.label}</p>
            <p className="text-xs text-[#F59E0B]">{((result.classification?.confidence || 0) * 100).toFixed(1)}% confidence</p>
          </div>
          <FindingsCard findings={result.findings} />
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [metaA, setMetaA] = useState(null);
  const [metaB, setMetaB] = useState(null);
  const [upA, setUpA] = useState(false);
  const [upB, setUpB] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);

  const upload = async (file, setMeta, setUploading) => {
    setUploading(true);
    try {
      const { data } = await uploadFile(file, null);
      setMeta(data);
      toast.success("Uploaded: " + data.filename);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCompare = async () => {
    if (!metaA || !metaB) return toast.error("Upload both documents first");
    setComparing(true);
    try {
      const { data } = await compareDocuments(metaA.scan_id, metaA.filename, metaB.scan_id, metaB.filename);
      setResult(data);
      toast.success("Comparison complete!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Comparison failed");
    } finally {
      setComparing(false);
    }
  };

  const chartData = result ? [
    { name: "Risk Score", "Document A": result.document_a.risk_score, "Document B": result.document_b.risk_score },
    { name: "Findings", "Document A": result.document_a.finding_count, "Document B": result.document_b.finding_count },
    { name: "Word Count", "Document A": Math.min(result.document_a.word_count, 9999), "Document B": Math.min(result.document_b.word_count, 9999) },
  ] : [];

  return (
    <div className="min-h-screen">
      <PageHeader title="Compare Documents" subtitle="Analyze two documents side by side" icon={GitCompare} />
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Upload columns */}
        <div className="grid md:grid-cols-2 gap-6">
          <DocColumn label="Document A" file={fileA} setFile={setFileA} meta={metaA} uploading={upA}
            onUpload={() => upload(fileA, setMetaA, setUpA)} result={result?.document_a} />
          <DocColumn label="Document B" file={fileB} setFile={setFileB} meta={metaB} uploading={upB}
            onUpload={() => upload(fileB, setMetaB, setUpB)} result={result?.document_b} />
        </div>

        {/* Compare button */}
        {metaA && metaB && (
          <div className="flex justify-center">
            <button onClick={handleCompare} disabled={comparing}
              className="btn-primary flex items-center gap-2.5 px-8 disabled:opacity-50 disabled:cursor-not-allowed">
              {comparing ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <GitCompare size={16} />}
              {comparing ? "Comparing…" : "Compare Documents"}
            </button>
          </div>
        )}

        {/* Comparison results */}
        {result && (
          <div className="space-y-5 animate-slide-up">
            {/* Summary verdict */}
            <div className="glass p-5">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Comparison Summary</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-white/40 text-xs mb-1">Higher Risk</p>
                  <p className="text-[#FF6B6B] font-semibold">{result.comparison.higher_risk_document}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Risk Difference</p>
                  <p className="text-white font-semibold">{result.comparison.risk_difference} points</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Same Classification?</p>
                  <p className={result.comparison.same_classification ? "text-emerald-400 font-semibold" : "text-[#FF6B6B] font-semibold"}>
                    {result.comparison.same_classification ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="glass p-5">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Side-by-Side Metrics</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                  <Bar dataKey="Document A" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Document B" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
