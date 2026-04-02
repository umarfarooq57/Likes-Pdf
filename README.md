# PDF Platform - Free Self-Hosted Edition

Production-ready PDF conversion and editing platform. 100% free, self-hosted.

## Quick Start

### Recommended: Docker Compose

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Windows one-command start

```powershell
.\start-project.ps1
```

### Local development

```bash
# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Features (Phase 0)

- ✅ PDF → Word (.docx)
- ✅ PDF → Images (PNG, ZIP)
- ✅ Images → PDF
- ✅ Office → PDF (Word, Excel, PowerPoint)
- ✅ HTML → PDF

## System Requirements

**For development**:
- Python 3.11+
- System packages: `wkhtmltopdf`, `libreoffice`, `poppler-utils`
- Python packages: `pymupdf` for full PDF editing, `pypdf` for merge/split fallback

**For production (Docker)**:
- Docker & Docker Compose
- 2GB RAM minimum
- 20GB storage

## Installation

### Ubuntu/Debian

```bash
# Install system dependencies
sudo apt update
sudo apt install -y wkhtmltopdf libreoffice-nogui poppler-utils python3-magic

# Install Python dependencies
pip install -r requirements.txt
```

### Windows

1. Install Python 3.11+
2. Install wkhtmltopdf from https://wkhtmltopdf.org/downloads.html
3. Install LibreOffice from https://www.libreoffice.org/download
4. Install poppler: Download from https://github.com/oschwartz10612/poppler-windows/releases
5. Add all to PATH
6. `pip install -r requirements.txt`
7. If merge/split fails, install `pymupdf` or `pypdf` explicitly:

```bash
pip install pymupdf
# or
pip install pypdf
```

## Usage

### Start Server

```bash
python -m app.main
```

### API Examples

**Upload file**:
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -F "file=@document.pdf"
```

**Merge PDFs**:
```bash
curl -X POST http://localhost:8000/api/v1/edit/merge \
  -H "Content-Type: application/json" \
  -d '{
    "document_ids": ["id-1", "id-2"]
  }'
```

**Download result**:
```bash
curl http://localhost:8000/api/v1/convert/output-file-id/download \
  -o result.docx
```

## Docker Deployment

The repository is ready to run with Docker Compose.

```bash
docker compose up --build
```

For Windows PowerShell, use `start-project.ps1`.

## Project Structure

```
app/
├── main.py              # FastAPI application
├── config.py            # Configuration
├── api/
│   └── routes/          # API endpoints
├── core/
│   └── conversion/      # Conversion engine
└── utils/               # Utilities
```

## Documentation

- **QUICKSTART.md** - 5-minute setup guide
- **implementation_plan.md** - Development roadmap
- **deployment_guide.md** - Production deployment
- **architecture_review.md** - Technical deep dive

## License

MIT License - Free for personal and commercial use

## Support

For issues and questions, see documentation files.
