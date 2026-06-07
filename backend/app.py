
import os
import re
import json
import uuid
import shutil
import logging
from datetime import datetime
from io import BytesIO, StringIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import torch
from transformers import pipeline
import PyPDF2
import docx
from PIL import Image
import pytesseract
import csv
import reportlab.lib.pagesizes as pagesizes
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
 
# ── Tesseract: auto-detect path (Linux server vs Windows local) ────────────────
_tesseract = shutil.which("tesseract")
if _tesseract:
    pytesseract.pytesseract.tesseract_cmd = _tesseract
else:
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
 
# ── Poppler: only required on Windows (Linux has it via apt) ───────────────────
POPPLER_PATH = r"C:\poppler\Library\bin" if os.name == "nt" else None
 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
 
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
 
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "SensitiveAI Backend Running",
        "health_check": "/api/health"
    })
 
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
 
# In-memory scan history
scan_history = []
 
# ── Sensitive data regex patterns ─────────────────────────────────────────────
PATTERNS = {
    "email":        r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
    "phone":        r"(?:\+91[\-\s]?)?[6-9]\d{9}\b",
    "aadhaar":      r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b",
    "pan":          r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
    "credit_card":  r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
    "password":     r"(?i)(?:password|passwd|pwd)\s*[:=]\s*\S+",
    "api_key":      r"(?i)(?:api[_\-]?key|apikey|token|secret)\s*[:=]\s*[A-Za-z0-9\-_]{16,}",
    "bank_account": r"\b\d{9,18}\b(?=.*(?:account|acc|bank))",
    "ip_address":   r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "ssn":          r"\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b",
}
 
PATTERN_RISK = {
    "email": 10, "phone": 15, "aadhaar": 35, "pan": 30,
    "credit_card": 40, "password": 45, "api_key": 40,
    "bank_account": 35, "ip_address": 8, "ssn": 35,
}
 
CLASSIFICATION_LABELS = ["Public", "Internal", "Confidential", "Highly Sensitive"]
 
# ── DistilBERT lazy loader ─────────────────────────────────────────────────────
_classifier = None
 
def get_classifier():
    global _classifier
    if _classifier is None:
        try:
            _classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                return_all_scores=True,
                truncation=True,
                max_length=512,
            )
            logger.info("DistilBERT model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load DistilBERT: {e}")
            _classifier = None
    return _classifier
 
 
# ── Text extraction with OCR fallback ─────────────────────────────────────────
def extract_text_from_file(file_path: str, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    text = ""
    try:
        if ext == "pdf":
            # Attempt native text extraction first
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
 
            # Fallback: image-based PDF → OCR via pdf2image + Tesseract
            if not text.strip():
                logger.info(f"Image-based PDF detected, switching to OCR: {filename}")
                try:
                    from pdf2image import convert_from_path
                    images = convert_from_path(
                        file_path, dpi=200,
                        poppler_path=POPPLER_PATH
                    )
                    for img in images:
                        text += pytesseract.image_to_string(img) + "\n"
                except ImportError:
                    logger.warning("pdf2image not installed — run: pip install pdf2image")
                except Exception as e:
                    logger.warning(f"OCR failed for image PDF: {e}")
 
        elif ext == "docx":
            doc = docx.Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])
 
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
 
        elif ext in ("jpg", "jpeg", "png"):
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
 
    except Exception as e:
        logger.error(f"Text extraction error for {filename}: {e}")
 
    return text.strip()
 
 
# ── Pattern detection ──────────────────────────────────────────────────────────
def detect_sensitive_data(text: str) -> dict:
    findings = {}
    for name, pattern in PATTERNS.items():
        matches = re.findall(pattern, text)
        if matches:
            masked = []
            for m in set(matches):
                if len(m) > 6:
                    masked.append(m[:3] + "*" * (len(m) - 6) + m[-3:])
                else:
                    masked.append("***")
            findings[name] = {"count": len(matches), "samples": masked[:3]}
    return findings
 
 
# ── Risk scoring ───────────────────────────────────────────────────────────────
def calculate_risk_score(findings: dict, text_length: int) -> int:
    if not findings:
        return 0
    raw = sum(PATTERN_RISK.get(k, 10) * v["count"] for k, v in findings.items())
    score = min(100, int((raw / max(text_length / 100, 1)) * 2 + raw * 0.4))
    return min(score, 100)
 
 
# ── AI classification helpers ──────────────────────────────────────────────────
def classify_document(text: str) -> dict:
    clf = get_classifier()
    if not clf or not text.strip():
        return _heuristic_classify(text)
    try:
        result = clf(text[:512])[0]
        pos_score = next((r["score"] for r in result if r["label"] == "POSITIVE"), 0.5)
        return _map_to_classification(pos_score, text)
    except Exception as e:
        logger.warning(f"Model classification failed, using heuristic: {e}")
        return _heuristic_classify(text)
 
 
def _heuristic_classify(text: str) -> dict:
    lower = text.lower()
    if any(w in lower for w in ["confidential", "restricted", "secret", "private", "internal only"]):
        label, conf = "Highly Sensitive", 0.91
    elif any(w in lower for w in ["internal", "not for distribution", "employee"]):
        label, conf = "Confidential", 0.82
    elif any(w in lower for w in ["draft", "review", "internal use"]):
        label, conf = "Internal", 0.75
    else:
        label, conf = "Public", 0.88
    scores = {l: round(0.03 + (0.6 if l == label else 0.1), 3) for l in CLASSIFICATION_LABELS}
    scores[label] = round(conf, 3)
    return {"label": label, "confidence": conf, "scores": scores}
 
 
def _map_to_classification(pos_score: float, text: str) -> dict:
    lower = text.lower()
    sensitive_keywords = sum(1 for w in ["password", "ssn", "secret", "aadhaar", "pan", "credit"] if w in lower)
    if sensitive_keywords >= 2 or pos_score < 0.3:
        label, conf = "Highly Sensitive", round(min(0.8 + sensitive_keywords * 0.04, 0.99), 3)
    elif sensitive_keywords == 1 or pos_score < 0.5:
        label, conf = "Confidential", round(min(0.72 + (1 - pos_score) * 0.1, 0.99), 3)
    elif pos_score < 0.7:
        label, conf = "Internal", round(min(0.65 + pos_score * 0.1, 0.99), 3)
    else:
        label, conf = "Public", round(min(pos_score, 0.99), 3)
    scores = {l: round(0.03, 3) for l in CLASSIFICATION_LABELS}
    scores[label] = conf
    return {"label": label, "confidence": conf, "scores": scores}
 
 
# ── Core scan builder ──────────────────────────────────────────────────────────
def build_scan_result(text: str, filename: str, scan_id: str) -> dict:
    findings   = detect_sensitive_data(text)
    risk_score = calculate_risk_score(findings, max(len(text), 1))
    found_keys = set(findings.keys())
 
    HIGH   = {"aadhaar", "pan", "credit_card", "password", "api_key", "bank_account", "ssn"}
    MEDIUM = {"email", "phone"}
 
    if found_keys & HIGH:
        classification = {
            "label": "Highly Sensitive",
            "confidence": 0.97,
            "scores": {"Public": 0.01, "Internal": 0.01, "Confidential": 0.01, "Highly Sensitive": 0.97},
        }
    elif (found_keys & MEDIUM) and risk_score >= 30:
        classification = {
            "label": "Confidential",
            "confidence": 0.88,
            "scores": {"Public": 0.02, "Internal": 0.06, "Confidential": 0.88, "Highly Sensitive": 0.04},
        }
    elif found_keys & MEDIUM:
        classification = {
            "label": "Internal",
            "confidence": 0.85,
            "scores": {"Public": 0.05, "Internal": 0.85, "Confidential": 0.08, "Highly Sensitive": 0.02},
        }
    elif not findings:
        classification = {
            "label": "Public",
            "confidence": 0.92,
            "scores": {"Public": 0.92, "Internal": 0.05, "Confidential": 0.02, "Highly Sensitive": 0.01},
        }
    else:
        classification = classify_document(text)
 
    risk_level = "Safe" if risk_score < 30 else "Medium Risk" if risk_score < 65 else "Critical Risk"
 
    result = {
        "scan_id":          scan_id,
        "filename":         filename,
        "timestamp":        datetime.utcnow().isoformat(),
        "text_length":      len(text),
        "word_count":       len(text.split()),
        "risk_score":       risk_score,
        "risk_level":       risk_level,
        "classification":   classification,
        "findings":         findings,
        "finding_count":    sum(v["count"] for v in findings.values()),
        "categories_found": list(findings.keys()),
    }
    scan_history.append(result)
    if len(scan_history) > 500:
        scan_history.pop(0)
    return result
 
 
# ── API routes ─────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    clf = get_classifier()
    tesseract_available = bool(shutil.which("tesseract") or
        os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe"))
    return jsonify({
        "status":             "ok",
        "model_loaded":       clf is not None,
        "model_name":         "distilbert-base-uncased-finetuned-sst-2-english",
        "tesseract_available": tesseract_available,
        "platform":           "windows" if os.name == "nt" else "linux",
        "timestamp":          datetime.utcnow().isoformat(),
        "scan_count":         len(scan_history),
    })
 
 
@app.route("/api/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400
    allowed = {"pdf", "docx", "txt", "jpg", "jpeg", "png"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        return jsonify({"error": f"File type '{ext}' not supported. Use: {', '.join(allowed)}"}), 400
    scan_id   = str(uuid.uuid4())
    safe_name = f"{scan_id}_{file.filename}"
    file.save(os.path.join(UPLOAD_FOLDER, safe_name))
    return jsonify({
        "scan_id":    scan_id,
        "filename":   file.filename,
        "saved_path": safe_name,
        "status":     "uploaded"
    })
 
 
@app.route("/api/scan", methods=["POST"])
def scan():
    data     = request.get_json(silent=True) or {}
    scan_id  = data.get("scan_id")
    filename = data.get("filename")
    if not scan_id or not filename:
        return jsonify({"error": "scan_id and filename required"}), 400
 
    saved_name = next((f for f in os.listdir(UPLOAD_FOLDER) if f.startswith(scan_id)), None)
    if not saved_name:
        return jsonify({"error": "File not found. Upload first."}), 404
 
    text = extract_text_from_file(os.path.join(UPLOAD_FOLDER, saved_name), filename)
 
    # Graceful fallback: if OCR unavailable on server, return a partial result
    # instead of a hard error so the app still works
    if not text:
        logger.warning(f"Could not extract text from {filename} — returning OCR-unavailable result")
        text = f"[OCR unavailable on this server for file: {filename}. Install Tesseract and Poppler to enable image-based PDF scanning.]"
 
    return jsonify(build_scan_result(text, filename, scan_id))
 
 
@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "text field required"}), 400
    return jsonify(build_scan_result(text[:50000], "text_input", str(uuid.uuid4())))
 
 
@app.route("/api/compare", methods=["POST"])
def compare():
    data       = request.get_json(silent=True) or {}
    scan_id_a  = data.get("scan_id_a")
    scan_id_b  = data.get("scan_id_b")
    filename_a = data.get("filename_a")
    filename_b = data.get("filename_b")
    if not all([scan_id_a, scan_id_b, filename_a, filename_b]):
        return jsonify({"error": "scan_id_a, scan_id_b, filename_a, filename_b required"}), 400
 
    def load_scan(sid, fname):
        saved = next((f for f in os.listdir(UPLOAD_FOLDER) if f.startswith(sid)), None)
        if not saved:
            return None
        t = extract_text_from_file(os.path.join(UPLOAD_FOLDER, saved), fname)
        if not t:
            t = f"[OCR unavailable for: {fname}]"
        return build_scan_result(t, fname, sid)
 
    result_a = load_scan(scan_id_a, filename_a)
    result_b = load_scan(scan_id_b, filename_b)
    if not result_a:
        return jsonify({"error": f"File A not found for scan_id: {scan_id_a}"}), 404
    if not result_b:
        return jsonify({"error": f"File B not found for scan_id: {scan_id_b}"}), 404
 
    risk_diff = result_a["risk_score"] - result_b["risk_score"]
    return jsonify({
        "document_a": result_a,
        "document_b": result_b,
        "comparison": {
            "risk_difference":      abs(risk_diff),
            "higher_risk_document": filename_a if risk_diff > 0 else filename_b if risk_diff < 0 else "Tie",
            "same_classification":  result_a["classification"]["label"] == result_b["classification"]["label"],
            "combined_findings":    list(set(result_a["categories_found"] + result_b["categories_found"])),
        },
    })
 
 
@app.route("/api/report", methods=["POST"])
def report():
    data          = request.get_json(silent=True) or {}
    scan_id       = data.get("scan_id")
    report_format = data.get("format", "json").lower()
 
    scan_data = next((s for s in reversed(scan_history) if s["scan_id"] == scan_id), None)
    if not scan_data:
        return jsonify({"error": "Scan not found. Run a scan first."}), 404
 
    if report_format == "json":
        buf = BytesIO(json.dumps(scan_data, indent=2).encode())
        buf.seek(0)
        return send_file(buf, mimetype="application/json",
                         download_name=f"sensitiveai_report_{scan_id[:8]}.json", as_attachment=True)
 
    elif report_format == "csv":
        buf = StringIO()
        w   = csv.writer(buf)
        w.writerow(["Field", "Value"])
        for field, key in [
            ("Scan ID",     "scan_id"),
            ("Filename",    "filename"),
            ("Timestamp",   "timestamp"),
            ("Risk Score",  "risk_score"),
            ("Risk Level",  "risk_level"),
            ("Word Count",  "word_count"),
        ]:
            w.writerow([field, scan_data[key]])
        w.writerow(["Classification", scan_data["classification"]["label"]])
        w.writerow(["Confidence",     scan_data["classification"]["confidence"]])
        w.writerow([])
        w.writerow(["Pattern", "Count", "Samples"])
        for k, v in scan_data["findings"].items():
            w.writerow([k, v["count"], "; ".join(v["samples"])])
        out = BytesIO(buf.getvalue().encode())
        out.seek(0)
        return send_file(out, mimetype="text/csv",
                         download_name=f"sensitiveai_report_{scan_id[:8]}.csv", as_attachment=True)
 
    elif report_format == "pdf":
        buf  = BytesIO()
        doc  = SimpleDocTemplate(buf, pagesize=pagesizes.A4,
                                 topMargin=0.75*inch, bottomMargin=0.75*inch)
        styl = getSampleStyleSheet()
        story = [
            Paragraph("SensitiveAI — Scan Report", styl["Title"]),
            Spacer(1, 12),
            Paragraph(f"<b>Scan ID:</b> {scan_data['scan_id']}",    styl["Normal"]),
            Paragraph(f"<b>File:</b> {scan_data['filename']}",       styl["Normal"]),
            Paragraph(f"<b>Timestamp:</b> {scan_data['timestamp']}", styl["Normal"]),
            Paragraph(f"<b>Risk Score:</b> {scan_data['risk_score']}/100 — {scan_data['risk_level']}",
                      styl["Normal"]),
            Paragraph(f"<b>Classification:</b> {scan_data['classification']['label']} "
                      f"({scan_data['classification']['confidence']*100:.1f}% confidence)",
                      styl["Normal"]),
            Spacer(1, 18),
            Paragraph("Sensitive Data Findings", styl["Heading2"]),
        ]
        if scan_data["findings"]:
            rows = [["Pattern", "Occurrences", "Sample (masked)"]]
            for k, v in scan_data["findings"].items():
                rows.append([
                    k.replace("_", " ").title(),
                    str(v["count"]),
                    v["samples"][0] if v["samples"] else "—"
                ])
            t = Table(rows, colWidths=[2.2*inch, 1.5*inch, 3.3*inch])
            t.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#F59E0B")),
                ("TEXTCOLOR",     (0, 0), (-1, 0), colors.black),
                ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS",(0, 1), (-1,-1), [colors.white, colors.HexColor("#F9F9F9")]),
                ("GRID",          (0, 0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
                ("TOPPADDING",    (0, 0), (-1,-1), 6),
                ("BOTTOMPADDING", (0, 0), (-1,-1), 6),
            ]))
            story.append(t)
        else:
            story.append(Paragraph("No sensitive data patterns detected.", styl["Normal"]))
        doc.build(story)
        buf.seek(0)
        return send_file(buf, mimetype="application/pdf",
                         download_name=f"sensitiveai_report_{scan_id[:8]}.pdf", as_attachment=True)
 
    return jsonify({"error": "format must be json, csv, or pdf"}), 400
 
 
@app.route("/api/history", methods=["GET"])
def history():
    limit = min(int(request.args.get("limit", 50)), 200)
    return jsonify({
        "history": list(reversed(scan_history))[:limit],
        "total":   len(scan_history)
    })
 
 
@app.route("/api/history/<scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    global scan_history
    before       = len(scan_history)
    scan_history = [s for s in scan_history if s["scan_id"] != scan_id]
    return jsonify({"status": "deleted"}) if len(scan_history) < before \
        else (jsonify({"error": "Scan not found"}), 404)
 
 
@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify({
        "risk_thresholds":   {"safe": 30, "medium": 65, "critical": 100},
        "patterns_enabled":  list(PATTERNS.keys()),
        "model":             "distilbert-base-uncased-finetuned-sst-2-english",
        "max_file_size_mb":  16,
        "supported_formats": ["pdf", "docx", "txt", "jpg", "jpeg", "png"],
    })
 
 
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)