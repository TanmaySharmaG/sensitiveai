import React, { useState } from "react";
import { ScanSearch, Zap, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import DropZone from "../components/DropZone";
import RiskGauge from "../components/RiskGauge";
import FindingsCard from "../components/FindingsCard";
import { ClassificationBadge, ClassificationChart } from "../components/ClassificationChart";
import { uploadFile, scanFile, downloadReport } from "../utils/api";
import { formatDate } from "../utils/helpers";

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [scanMeta, setScanMeta] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await uploadFile(file, setProgress);
      setScanMeta(data);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async () => {
    if (!scanMeta) return toast.error("Upload the file first");
    setScanning(true);
    try {
      const { data } = await scanFile(scanMeta.scan_id, scanMeta.filename);
      setResult(data);
      toast.success("Scan complete!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const reset = () => { setFile(null); setScanMeta(null); setResult(null); setProgress(0); };

  return (
    <div className="min-h-screen">
      <PageHeader title="Document Scanner" subtitle="Upload and scan files for sensitive data" icon={ScanSearch} />
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Upload panel */}
        <div className="glass p-6 space-y-5">
          <DropZone onFile={setFile} file={file} disabled={uploading || scanning} />

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-white/40 text-right">{progress}% uploaded</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!scanMeta ? (
              <button onClick={handleUpload} disabled={!file || uploading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Zap size={15} />}
                {uploading ? "Uploading…" : "Upload File"}
              </button>
            ) : (
              <button onClick={handleScan} disabled={scanning}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {scanning ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <ScanSearch size={15} />}
                {scanning ? "Scanning…" : "Scan Document"}
              </button>
            )}
            <button onClick={reset} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          {scanMeta && !result && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              File ready: {scanMeta.filename}
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">
            {/* Meta row */}
            <div className="glass p-4 flex flex-wrap gap-4 text-sm">
              <span className="text-white/40">File: <span className="text-white">{result.filename}</span></span>
              <span className="text-white/40">Words: <span className="text-white">{result.word_count.toLocaleString()}</span></span>
              <span className="text-white/40">Scanned: <span className="text-white">{formatDate(result.timestamp)}</span></span>
              <span className="text-white/40">Patterns: <span className="text-[#FF6B6B]">{result.finding_count}</span></span>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Risk */}
              <div className="glass p-6 flex flex-col items-center justify-center gap-2">
                <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">Risk Score</h3>
                <RiskGauge score={result.risk_score} />
              </div>
              {/* Classification */}
              <div className="glass p-6">
                <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">AI Classification</h3>
                <ClassificationBadge label={result.classification.label} confidence={result.classification.confidence} />
                <div className="mt-4">
                  <ClassificationChart scores={result.classification.scores} />
                </div>
              </div>
            </div>

            {/* Findings */}
            <FindingsCard findings={result.findings} />

            {/* Download */}
            <div className="glass p-5">
              <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">Download Report</h3>
              <div className="flex flex-wrap gap-3">
                {["pdf", "csv", "json"].map((fmt) => (
                  <button key={fmt} onClick={() => downloadReport(result.scan_id, fmt)}
                    className="btn-secondary uppercase text-xs tracking-wider">
                    ↓ {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
