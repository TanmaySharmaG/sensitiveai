export const riskColor = (score) => {
  if (score < 30) return "#10B981";
  if (score < 65) return "#F59E0B";
  return "#FF6B6B";
};

export const riskLabel = (score) => {
  if (score < 30) return "Safe";
  if (score < 65) return "Medium Risk";
  return "Critical Risk";
};

export const classificationColor = (label) => {
  const map = {
    "Public": "#10B981",
    "Internal": "#F59E0B",
    "Confidential": "#FF6B6B",
    "Highly Sensitive": "#EF4444",
  };
  return map[label] || "#888";
};

export const patternLabel = (key) => {
  const map = {
    email: "Email Address",
    phone: "Phone Number",
    aadhaar: "Aadhaar Number",
    pan: "PAN Card",
    credit_card: "Credit Card",
    password: "Password",
    api_key: "API Key / Token",
    bank_account: "Bank Account",
    ip_address: "IP Address",
    ssn: "SSN",
  };
  return map[key] || key;
};

export const patternIcon = (key) => {
  const map = {
    email: "📧",
    phone: "📞",
    aadhaar: "🪪",
    pan: "📋",
    credit_card: "💳",
    password: "🔐",
    api_key: "🔑",
    bank_account: "🏦",
    ip_address: "🌐",
    ssn: "🔒",
  };
  return map[key] || "⚠️";
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const highlightText = (text, findings) => {
  if (!findings || Object.keys(findings).length === 0) return [{ type: "text", content: text }];
  const PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
phone: /(?:\+91[-\s]?)?[6-9]\d{9}\b/g,
aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g,
password: /(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
api_key: /(?:api[_-]?key|apikey|token|secret)\s*[:=]\s*[A-Za-z0-9_-]{16,}/gi,
  };
  const active = Object.keys(findings).filter((k) => PATTERNS[k]);
  if (!active.length) return [{ type: "text", content: text }];

  let spans = [];
  active.forEach((k) => {
    let m;
    const re = new RegExp(PATTERNS[k].source, PATTERNS[k].flags.replace("g", "") + "g");
    while ((m = re.exec(text)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, type: k, match: m[0] });
    }
  });
  spans.sort((a, b) => a.start - b.start);
  // Deduplicate overlapping
  const deduped = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start >= cursor) { deduped.push(s); cursor = s.end; }
  }
  const result = [];
  cursor = 0;
  for (const s of deduped) {
    if (cursor < s.start) result.push({ type: "text", content: text.slice(cursor, s.start) });
    result.push({ type: "highlight", patternType: s.type, content: s.match });
    cursor = s.end;
  }
  if (cursor < text.length) result.push({ type: "text", content: text.slice(cursor) });
  return result;
};
