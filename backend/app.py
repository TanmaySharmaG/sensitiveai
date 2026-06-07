import os
import re
import json
import uuid
import time
import base64
import hashlib
import logging
from datetime import datetime
from io import BytesIO, StringIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import torch
from transformers import pipeline, DistilBertTokenizer, DistilBertForSequenceClassification
import PyPDF2
import docx
from PIL import Image
import pytesseract
import csv
import reportlab.lib.pagesizes as pagesizes
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

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
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory scan history store
scan_history = []

# Sensitive data regex patterns
PATTERNS = {
    "email": r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
    "phone": r"(?:\+91[\-\s]?)?[6-9]\d{9}\b",
    "aadhaar": r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b",
    "pan": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
    "credit_card": r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
    "password": r"(?i)(?:password|passwd|pwd)\s*[:=]\s*\S+",
    "api_key": r"(?i)(?:api[_\-]?key|apikey|token|secret)\s*[:=]\s*[A-Za-z0-9\-_]{16,}",
    "bank_account": r"\b\d{9,18}\b(?=.*(?:account|acc|bank))",
    "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "ssn": r"\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b",
}

# Risk weights per pattern
PATTERN_RISK = {
    "email": 10,
    "phone": 15,
    "aadhaar": 35,
    "pan": 30,
    "credit_card": 40,
    "password": 45,
    "api_key": 40,
    "bank_account": 35,
    "ip_address": 8,
    "ssn": 35,
}

# Classification labels
CLASSIFICATION_LABELS = ["Public", "Internal", "Confidential", "Highly Sensitive"]

# Load DistilBERT model (lazy, cached after first load)
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


def extract_text_from_file(file_path: str, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    text = ""
    try:
        if ext == "pdf":
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
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


def detect_sensitive_data(text: str) -> dict:
    findings = {}
    for name, pattern in PATTERNS.items():
        matches = re.findall(pattern, text)
        if matches:
            # Mask matches for privacy
            masked = []
            for m in set(matches):
                if len(m) > 6:
                    masked.append(m[:3] + "*" * (len(m) - 6) + m[-3:])
                else:
                    masked.append("***")
            findings[name] = {"count": len(matches), "samples": masked[:3]}
    return findings


def calculate_risk_score(findings: dict, text_length: int) -> int:
    if not findings:
        return 0
    raw = sum(PATTERN_RISK.get(k, 10) * v["count"] for k, v in findings.items())
    # Normalize: cap at 100
    score = min(100, int((raw / max(text_length / 100, 1)) * 2 + raw * 0.4))
    return min(score, 100)


def classify_document(text: str) -> dict:
    clf = get_classifier()
    if not clf or not text.strip():
        return _heuristic_classify(text)
    try:
        snippet = text[:512]
        result = clf(snippet)[0]
        # Map SST2 scores to our 4-class system with heuristic overlay
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
        label, conf = "Highly Sensitive", round(0.8 + sensitive_keywords * 0.04, 3)
    elif sensitive_keywords == 1 or pos_score < 0.5:
        label, conf = "Confidential", round(0.72 + (1 - pos_score) * 0.1, 3)
    elif pos_score < 0.7:
        label, conf = "Internal", round(0.65 + pos_score * 0.1, 3)
    else:
        label, conf = "Public", round(pos_score, 3)
    conf = min(conf, 0.99)
    scores = {l: round(0.03, 3) for l in CLASSIFICATION_LABELS}
    scores[label] = conf
    return {"label": label, "confidence": conf, "scores": scores}

def build_scan_result(text: str, filename: str, scan_id: str) -> dict:
    findings = detect_sensitive_data(text)
    risk_score = calculate_risk_score(findings, max(len(text), 1))
    
    high_sensitivity_patterns = {"aadhaar", "pan", "credit_card", "password", "api_key", "bank_account", "ssn"}
    medium_sensitivity_patterns = {"email", "phone"}
    found_keys = set(findings.keys())

    if found_keys & high_sensitivity_patterns:
        classification = {
            "label": "Highly Sensitive",
            "confidence": 0.97,
            "scores": {"Public": 0.01, "Internal": 0.01, "Confidential": 0.01, "Highly Sensitive": 0.97}
        }
    elif found_keys & medium_sensitivity_patterns and risk_score >= 30:
        classification = {
            "label": "Confidential",
            "confidence": 0.88,
            "scores": {"Public": 0.02, "Internal": 0.06, "Confidential": 0.88, "Highly Sensitive": 0.04}
        }
    elif found_keys & medium_sensitivity_patterns:
        classification = {
            "label": "Internal",
            "confidence": 0.85,
            "scores": {"Public": 0.05, "Internal": 0.85, "Confidential": 0.08, "Highly Sensitive": 0.02}
        }
    elif not findings:
        # No patterns at all → always Public
        classification = {
            "label": "Public",
            "confidence": 0.92,
            "scores": {"Public": 0.92, "Internal": 0.05, "Confidential": 0.02, "Highly Sensitive": 0.01}
        }
    else:
        classification = classify_document(text)

    risk_level = "Safe" if risk_score < 30 else "Medium Risk" if risk_score < 65 else "Critical Risk"
    result = {
        "scan_id": scan_id,
        "filename": filename,
        "timestamp": datetime.utcnow().isoformat(),
        "text_length": len(text),
        "word_count": len(text.split()),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "classification": classification,
        "findings": findings,
        "finding_count": sum(v["count"] for v in findings.values()),
        "categories_found": list(findings.keys()),
    }
    scan_history.append(result)
    if len(scan_history) > 500:
        scan_history.pop(0)
    return result


@app.route("/api/health", methods=["GET"])
def health():
    clf = get_classifier()
    return jsonify({
        "status": "ok",
        "model_loaded": clf is not None,
        "model_name": "distilbert-base-uncased-finetuned-sst-2-english",
        "timestamp": datetime.utcnow().isoformat(),
        "scan_count": len(scan_history),
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
    scan_id = str(uuid.uuid4())
    safe_name = f"{scan_id}_{file.filename}"
    save_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(save_path)
    return jsonify({"scan_id": scan_id, "filename": file.filename, "saved_path": safe_name, "status": "uploaded"})


@app.route("/api/scan", methods=["POST"])
def scan():
    data = request.get_json(silent=True) or {}
    scan_id = data.get("scan_id")
    filename = data.get("filename")
    if not scan_id or not filename:
        return jsonify({"error": "scan_id and filename required"}), 400
    # Find saved file
    saved_name = None
    for f in os.listdir(UPLOAD_FOLDER):
        if f.startswith(scan_id):
            saved_name = f
            break
    if not saved_name:
        return jsonify({"error": "File not found. Upload first."}), 404
    file_path = os.path.join(UPLOAD_FOLDER, saved_name)
    text = extract_text_from_file(file_path, filename)
    if not text:
        return jsonify({"error": "Could not extract text from file. Ensure file is not empty or image-only PDF."}), 422
    result = build_scan_result(text, filename, scan_id)
    return jsonify(result)


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "text field required"}), 400
    if len(text) > 50000:
        text = text[:50000]
    scan_id = str(uuid.uuid4())
    result = build_scan_result(text, "text_input", scan_id)
    return jsonify(result)


@app.route("/api/compare", methods=["POST"])
def compare():
    data = request.get_json(silent=True) or {}
    scan_id_a = data.get("scan_id_a")
    scan_id_b = data.get("scan_id_b")
    filename_a = data.get("filename_a")
    filename_b = data.get("filename_b")
    if not all([scan_id_a, scan_id_b, filename_a, filename_b]):
        return jsonify({"error": "scan_id_a, scan_id_b, filename_a, filename_b required"}), 400

    def load_scan(sid, fname):
        for f in os.listdir(UPLOAD_FOLDER):
            if f.startswith(sid):
                fp = os.path.join(UPLOAD_FOLDER, f)
                t = extract_text_from_file(fp, fname)
                return build_scan_result(t, fname, sid)
        return None

    result_a = load_scan(scan_id_a, filename_a)
    result_b = load_scan(scan_id_b, filename_b)
    if not result_a:
        return jsonify({"error": f"File A not found for scan_id: {scan_id_a}"}), 404
    if not result_b:
        return jsonify({"error": f"File B not found for scan_id: {scan_id_b}"}), 404

    risk_diff = result_a["risk_score"] - result_b["risk_score"]
    riskier = filename_a if risk_diff > 0 else filename_b if risk_diff < 0 else "Tie"
    return jsonify({
        "document_a": result_a,
        "document_b": result_b,
        "comparison": {
            "risk_difference": abs(risk_diff),
            "higher_risk_document": riskier,
            "same_classification": result_a["classification"]["label"] == result_b["classification"]["label"],
            "combined_findings": list(set(result_a["categories_found"] + result_b["categories_found"])),
        },
    })


@app.route("/api/report", methods=["POST"])
def report():
    data = request.get_json(silent=True) or {}
    scan_id = data.get("scan_id")
    report_format = data.get("format", "json").lower()
    scan_data = None
    for s in reversed(scan_history):
        if s["scan_id"] == scan_id:
            scan_data = s
            break
    if not scan_data:
        return jsonify({"error": "Scan not found. Run a scan first."}), 404

    if report_format == "json":
        buf = BytesIO(json.dumps(scan_data, indent=2).encode())
        buf.seek(0)
        return send_file(buf, mimetype="application/json",
                         download_name=f"sensitiveai_report_{scan_id[:8]}.json", as_attachment=True)

    elif report_format == "csv":
        buf = StringIO()
        writer = csv.writer(buf)
        writer.writerow(["Field", "Value"])
        writer.writerow(["Scan ID", scan_data["scan_id"]])
        writer.writerow(["Filename", scan_data["filename"]])
        writer.writerow(["Timestamp", scan_data["timestamp"]])
        writer.writerow(["Risk Score", scan_data["risk_score"]])
        writer.writerow(["Risk Level", scan_data["risk_level"]])
        writer.writerow(["Classification", scan_data["classification"]["label"]])
        writer.writerow(["Confidence", scan_data["classification"]["confidence"]])
        writer.writerow(["Word Count", scan_data["word_count"]])
        writer.writerow([])
        writer.writerow(["Pattern", "Count", "Samples"])
        for k, v in scan_data["findings"].items():
            writer.writerow([k, v["count"], "; ".join(v["samples"])])
        bytes_buf = BytesIO(buf.getvalue().encode())
        bytes_buf.seek(0)
        return send_file(bytes_buf, mimetype="text/csv",
                         download_name=f"sensitiveai_report_{scan_id[:8]}.csv", as_attachment=True)

    elif report_format == "pdf":
        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=pagesizes.A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
        styles = getSampleStyleSheet()
        story = []
        title_style = styles["Title"]
        story.append(Paragraph("SensitiveAI — Scan Report", title_style))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"<b>Scan ID:</b> {scan_data['scan_id']}", styles["Normal"]))
        story.append(Paragraph(f"<b>File:</b> {scan_data['filename']}", styles["Normal"]))
        story.append(Paragraph(f"<b>Timestamp:</b> {scan_data['timestamp']}", styles["Normal"]))
        story.append(Paragraph(f"<b>Risk Score:</b> {scan_data['risk_score']}/100 — {scan_data['risk_level']}", styles["Normal"]))
        story.append(Paragraph(f"<b>Classification:</b> {scan_data['classification']['label']} ({scan_data['classification']['confidence']*100:.1f}% confidence)", styles["Normal"]))
        story.append(Spacer(1, 18))
        story.append(Paragraph("Sensitive Data Findings", styles["Heading2"]))
        if scan_data["findings"]:
            table_data = [["Pattern", "Occurrences", "Sample (masked)"]]
            for k, v in scan_data["findings"].items():
                table_data.append([k.replace("_", " ").title(), str(v["count"]), v["samples"][0] if v["samples"] else "—"])
            t = Table(table_data, colWidths=[2.2*inch, 1.5*inch, 3.3*inch])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F59E0B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9F9F9")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(t)
        else:
            story.append(Paragraph("No sensitive data patterns detected.", styles["Normal"]))
        doc.build(story)
        buf.seek(0)
        return send_file(buf, mimetype="application/pdf",
                         download_name=f"sensitiveai_report_{scan_id[:8]}.pdf", as_attachment=True)
    else:
        return jsonify({"error": "format must be json, csv, or pdf"}), 400


@app.route("/api/history", methods=["GET"])
def history():
    limit = min(int(request.args.get("limit", 50)), 200)
    return jsonify({"history": list(reversed(scan_history))[:limit], "total": len(scan_history)})


@app.route("/api/history/<scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    global scan_history
    before = len(scan_history)
    scan_history = [s for s in scan_history if s["scan_id"] != scan_id]
    if len(scan_history) < before:
        return jsonify({"status": "deleted"})
    return jsonify({"error": "Scan not found"}), 404


@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify({
        "risk_thresholds": {"safe": 30, "medium": 65, "critical": 100},
        "patterns_enabled": list(PATTERNS.keys()),
        "model": "distilbert-base-uncased-finetuned-sst-2-english",
        "max_file_size_mb": 16,
        "supported_formats": ["pdf", "docx", "txt", "jpg", "jpeg", "png"],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
