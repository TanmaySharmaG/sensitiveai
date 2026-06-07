# SensitiveAI — Enterprise Document Intelligence

A production-ready full-stack web application for AI-powered sensitive data detection and document classification.

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Recharts, Framer Motion
- **Backend**: Python Flask, DistilBERT (HuggingFace Transformers)
- **AI**: distilbert-base-uncased-finetuned-sst-2-english
- **Reports**: ReportLab (PDF), CSV, JSON
- **OCR**: Tesseract (for image files)

---

## Project Structure

```
sensitiveai/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt       # Python dependencies
│   └── uploads/               # Auto-created, stores uploaded files
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js / index.css
│   │   ├── pages/             # Landing, Scanner, TextScanner, Dashboard, Compare, Reports, Settings
│   │   ├── components/        # Sidebar, DropZone, RiskGauge, FindingsCard, ClassificationChart, PageHeader
│   │   └── utils/             # api.js, helpers.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Tesseract OCR (for image scanning)

#### Install Tesseract
```bash
# Ubuntu / Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows: https://github.com/UB-Mannheim/tesseract/wiki
```

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
# Server runs at http://localhost:5000
```

The DistilBERT model (~250 MB) downloads automatically on first run via HuggingFace.

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# App runs at http://localhost:3000
```

---

## Environment Variables

Create `frontend/.env` for custom backend URL:
```
REACT_APP_API_URL=http://localhost:5000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Model status check |
| POST | /api/upload | Upload a file |
| POST | /api/scan | Scan uploaded file |
| POST | /api/predict | Analyze raw text |
| POST | /api/compare | Compare two documents |
| POST | /api/report | Download report (pdf/csv/json) |
| GET | /api/history | Scan history |
| DELETE | /api/history/:id | Delete a scan |
| GET | /api/settings | Current configuration |

---

## Production Deployment

### Backend (Gunicorn + Nginx)

```bash
cd backend
source venv/bin/activate
gunicorn -w 2 -b 0.0.0.0:5000 --timeout 120 app:app
```

Example Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

### Frontend Build

```bash
cd frontend
npm run build
# Serves from /build directory
```

---

## Detected Patterns

| Pattern | Examples |
|---------|---------|
| Email | user@domain.com |
| Phone | +91 9876543210 |
| Aadhaar | 1234 5678 9012 |
| PAN | ABCDE1234F |
| Credit Card | 4111111111111111 |
| Password | password=s3cr3t |
| API Key | api_key=sk_live_abc... |
| Bank Account | 123456789012 |
| IP Address | 192.168.1.1 |
| SSN | 123-45-6789 |

---

## Risk Levels

| Score | Level |
|-------|-------|
| 0–29 | ✅ Safe |
| 30–64 | ⚠️ Medium Risk |
| 65–100 | 🔴 Critical Risk |

---

## License
MIT — built for enterprise document security.
