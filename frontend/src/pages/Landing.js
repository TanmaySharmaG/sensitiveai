import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ScanSearch,
  FileText,
  Lock,
  BarChart3,
  GitCompare,
  Settings,
  ShieldAlert,
  ArrowRight,
  Zap,
  CheckCircle,
  Mail,
  Phone
} from "lucide-react";
const FEATURES = [
  { icon: ScanSearch, title: "Document Scanner", desc: "Upload PDFs, DOCX, TXT, and images. AI extracts and analyzes every character for sensitive data exposure.", color: "#F59E0B" },
  { icon: FileText, title: "Text Analysis", desc: "Paste any text and get instant pattern detection with color-coded highlights for each data category.", color: "#10B981" },
  { icon: Lock, title: "AI Classification", desc: "DistilBERT classifies documents into Public, Internal, Confidential, or Highly Sensitive with confidence scores.", color: "#FF6B6B" },
  { icon: BarChart3, title: "Risk Scoring", desc: "0–100 risk scores with Safe / Medium / Critical thresholds. Gauge visualization lets you act fast.", color: "#818CF8" },
  { icon: GitCompare, title: "Document Compare", desc: "Upload two documents side-by-side and compare risk levels, classifications, and detected patterns.", color: "#F97316" },
  { icon: Settings, title: "Configurable Rules", desc: "Tune risk thresholds and toggle detection patterns to match your organization's compliance needs.", color: "#06B6D4" },
];

const STATS = [
  { value: "10+", label: "Pattern Types Detected" },
  { value: "4", label: "Classification Levels" },
  { value: "5", label: "File Formats Supported" },
  { value: "100", label: "Risk Score Scale" },
];

const TEAM = [
  { name: "Priya Nair", role: "AI / ML Engineer", avatar: "PN" },
  { name: "Arjun Mehta", role: "Backend Developer", avatar: "AM" },
  { name: "Sneha Rao", role: "Frontend Engineer", avatar: "SR" },
  { name: "Kiran Das", role: "Security Analyst", avatar: "KD" },
];

function FloatingOrb({ color, className }) {
  return (
    <div className={`absolute rounded-full blur-[80px] opacity-20 pointer-events-none ${className}`}
      style={{ background: color }} />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [contact, setContact] = useState({ name: "", email: "", message: "" });

  return (
    <div className="min-h-screen bg-[#151515] text-[#e5e5e5] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#151515]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber/20 border border-amber/30 flex items-center justify-center">
              <ShieldAlert size={16} className="text-[#F59E0B]" />
            </div>
            <span className="font-display font-semibold text-lg text-white">
              Sensitive<span className="text-[#F59E0B]">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
            {["Features", "Stats", "Team", "Contact"].map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`} className="hover:text-white transition-colors">{s}</a>
            ))}
          </div>
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-[#F59E0B] text-black text-sm font-semibold px-4 py-2 rounded-xl
                       hover:bg-[#FCD34D] transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20">
            Launch App <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <FloatingOrb color="#F59E0B" className="w-[500px] h-[500px] -top-40 -right-40" />
        <FloatingOrb color="#10B981" className="w-[400px] h-[400px] bottom-0 -left-20" />
        <FloatingOrb color="#FF6B6B" className="w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 py-24">
          <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-full px-4 py-1.5 mb-8">
            <Zap size={12} className="text-[#F59E0B]" />
            <span className="text-xs text-[#F59E0B] font-medium">Powered by DistilBERT AI</span>
          </div>

          <h1 className="font-display font-semibold text-5xl md:text-7xl text-white leading-tight mb-6">
            Detect Sensitive Data
            <br />
            <span className="text-[#F59E0B]">Before It Leaks</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Enterprise-grade AI document intelligence. Scan files, classify content, detect PII, Aadhaar, PAN,
            API keys and more — instantly.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate("/scanner")}
              className="flex items-center gap-2.5 bg-[#F59E0B] text-black font-semibold px-7 py-3.5 rounded-xl
                         hover:bg-[#FCD34D] transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/25 text-base">
              <ScanSearch size={18} /> Scan a Document
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 border border-white/20 text-white font-medium px-7 py-3.5 rounded-xl
                         hover:border-white/40 hover:bg-white/5 transition-all duration-200 text-base">
              <BarChart3 size={18} /> View Dashboard
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap justify-center gap-6 text-sm text-white/30">
            {["Aadhaar Detection", "PAN Detection", "API Key Scanner", "PDF & DOCX Support", "Offline AI"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-[#10B981]" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-5xl font-bold text-[#F59E0B] mb-2">{value}</p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
              Everything you need to <span className="text-[#F59E0B]">stay secure</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Six powerful modules work together to give you complete visibility into your document security posture.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/15
                           hover:bg-white/[0.05] transition-all duration-300 group cursor-default">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white/[0.01] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-white mb-3">How It Works</h2>
            <p className="text-white/40">Three steps from upload to actionable security insight.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/30 to-transparent" />
            {[
              { step: "01", title: "Upload Document", desc: "Drag & drop any PDF, DOCX, TXT, or image file. Our secure parser extracts text automatically.", icon: "📂" },
              { step: "02", title: "AI Analysis", desc: "DistilBERT classifies content while 10+ regex engines scan for PII, credentials, and sensitive data.", icon: "🧠" },
              { step: "03", title: "Act on Insights", desc: "Get a risk score, classification label, and full findings report. Download as PDF, CSV, or JSON.", icon: "📊" },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="text-center relative">
                <div className="w-20 h-20 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-3xl mx-auto mb-5">
                  {icon}
                </div>
                <p className="text-xs font-mono text-[#F59E0B]/60 mb-2">{step}</p>
                <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-white mb-3">Meet the Team</h2>
            <p className="text-white/40">Built by engineers passionate about privacy and security.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, avatar }) => (
              <div key={name} className="text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6
                                         hover:border-white/15 transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B]/30 to-[#10B981]/30 border border-white/10
                                flex items-center justify-center text-lg font-bold text-white mx-auto mb-4">
                  {avatar}
                </div>
                <p className="font-semibold text-white text-sm">{name}</p>
                <p className="text-white/40 text-xs mt-1">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-white/[0.01] border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold text-white mb-3">Get in Touch</h2>
            <p className="text-white/40">Have questions about enterprise deployment? We'd love to help.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 space-y-4">
            <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
              placeholder="Your name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
              placeholder-white/30 focus:outline-none focus:border-[#F59E0B]/50 transition-all" />
            <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="Email address" type="email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
              placeholder-white/30 focus:outline-none focus:border-[#F59E0B]/50 transition-all" />
            <textarea value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })}
              placeholder="Tell us about your use case…" rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
              placeholder-white/30 focus:outline-none focus:border-[#F59E0B]/50 transition-all resize-none" />
            <button onClick={() => { alert("Message sent! (demo mode)"); setContact({ name: "", email: "", message: "" }); }}
              className="w-full bg-[#F59E0B] text-black font-semibold py-3 rounded-xl hover:bg-[#FCD34D]
                         transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20">
              Send Message
            </button>
          </div>
          <div className="flex justify-center gap-8 mt-8 text-sm text-white/30">
            <a href="mailto:hello@sensitiveai.dev" className="flex items-center gap-2 hover:text-white/60 transition-colors">
              <Mail size={14} /> hello@sensitiveai.dev
            </a>
            <a href="tel:+91-000-000-0000" className="flex items-center gap-2 hover:text-white/60 transition-colors">
              <Phone size={14} /> +91-000-000-0000
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/[0.06] text-center text-white/25 text-sm">
        <p>© 2024 SensitiveAI. Built with React, Flask, and DistilBERT.</p>
      </footer>
    </div>
  );
}
