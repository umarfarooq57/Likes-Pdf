# DocuForge - Enterprise PDF Platform

A production-grade, enterprise-level SaaS platform for PDF processing with 70+ features including AI-powered analysis, OCR, document scanning, and comprehensive security options.

## ✨ Features

### PDF Core Operations (15+ Features)
- ✅ Merge PDFs - Combine multiple PDFs
- ✅ Split PDF - Split by pages or ranges
- ✅ Rotate Pages - Any angle rotation
- ✅ Reorder Pages - Drag and drop
- ✅ Delete/Extract Pages
- ✅ Compress PDF - Multiple quality levels
- ✅ PDF ↔ Images, Word, Excel, PowerPoint
- ✅ HTML/Markdown to PDF

### Security Features (8+ Features)
- ✅ Password Protect (AES-256)
- ✅ Unlock PDF
- ✅ Text/Image Watermarks
- ✅ Page Numbers
- ✅ Digital Signatures
- ✅ Metadata Editor

### AI-Powered Features (8+ Features)
- ✅ AI Summarization
- ✅ Chat with PDF
- ✅ Document Classification
- ✅ Keyword Extraction
- ✅ Resume/Contract Analysis

### Scanner Module (20+ Features)
- ✅ Document Scanner
- ✅ Edge Detection & Auto Crop
- ✅ Perspective Correction
- ✅ Image Enhancement
- ✅ OCR (100+ languages)
- ✅ Searchable PDF Creation

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower (Task Monitor)**: http://localhost:5555

### Local Development

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

#### Start Celery Worker
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📁 Project Structure

```
docuforge/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Config, DB, Security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── engines/       # PDF processing
│   │   └── workers/       # Celery tasks
│   ├── migrations/        # Alembic migrations
│   └── tests/             # Pytest tests
│
├── frontend/              # Next.js Frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # Utilities & API client
│
└── docker-compose.yml     # Development stack
```

## 🛠️ Available Tools

### Document Editing
- ✅ Merge PDFs
- ✅ Split PDF
- ✅ Rotate Pages
- ✅ Reorder Pages
- ✅ Delete Pages
- ✅ Extract Pages

### Conversions
- ✅ PDF → Images (PNG, JPG)
- ✅ Images → PDF
- ✅ Word → PDF
- ✅ Excel → PDF
- ✅ PowerPoint → PDF
- ✅ HTML → PDF
- ✅ Markdown → PDF

### Optimization
- ✅ Compress PDF
- ✅ Linearize (Web Optimize)
- ✅ Repair Corrupt PDF

## 🔒 Security Features

- JWT Authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting ready
- CORS protection
- File validation

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

When the backend is running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔧 Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 📦 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL
- **Queue**: Redis + Celery
- **PDF Processing**: PyMuPDF, WeasyPrint

## 📄 License

MIT License
