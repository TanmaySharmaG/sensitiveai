import React, { useState, useEffect } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { getHistory, downloadReport } from "../utils/api";
import { formatDate, riskColor } from "../utils/helpers";

export default function Reports() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getHistory(200);
      setHistory(data.history || []);
    } catch { toast.error("Failed to load scans"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (scanId, fmt) => {
    const key = `${scanId}-${fmt}`;
    setDownloading((d) => ({ ...d, [key]: true }));
    try {
      await downloadReport(scanId, fmt);
      toast.success(`${fmt.toUpperCase()} report downloaded`);
    } catch { toast.error("Download failed"); }
    finally { setDownloading((d) => ({ ...d, [key]: false })); }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Reports" subtitle="Download scan reports in multiple formats" icon={BarChart3} />
      <div className="p-6 max-w-5xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <p className="text-white/40 text-sm">{history.length} scans available</p>
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-white/30">
            <div className="w-8 h-8 border-2 border-white/10 border-t-[#F59E0B] rounded-full animate-spin mx-auto mb-3" />
            Loading reports…
          </div>
        ) : history.length === 0 ? (
          <div className="glass py-20 text-center text-white/30">
            <p className="text-4xl mb-3">📊</p>
            <p>No scans found. Run a document scan to generate reports.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((s) => (
              <div key={s.scan_id} className="glass p-5 flex flex-wrap items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white truncate max-w-xs">{s.filename}</p>
                    <span className="label-tag text-[10px]"
                      style={{ background: `${riskColor(s.risk_score)}22`, color: riskColor(s.risk_score) }}>
                      {s.risk_level}
                    </span>
                    <span className="label-tag text-[10px] bg-white/5 text-white/40">
                      {s.classification?.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    {formatDate(s.timestamp)} · Risk {s.risk_score}/100 · {s.finding_count} findings
                  </p>
                </div>
                {/* Download buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {["pdf", "csv", "json"].map((fmt) => {
                    const key = `${s.scan_id}-${fmt}`;
                    return (
                      <button key={fmt} onClick={() => handleDownload(s.scan_id, fmt)}
                        disabled={downloading[key]}
                        className="flex items-center gap-1.5 text-xs border border-white/10 text-white/50
                                   px-3 py-1.5 rounded-lg hover:border-[#F59E0B]/40 hover:text-[#F59E0B]
                                   transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase font-medium tracking-wider">
                        {downloading[key]
                          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : <Download size={11} />}
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
