FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PDF processing, OCR, and image handling
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    # Tesseract OCR
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    tesseract-ocr-por \
    tesseract-ocr-chi-sim \
    tesseract-ocr-jpn \
    tesseract-ocr-ara \
    # Poppler for PDF utilities
    poppler-utils \
    # LibreOffice for document conversion
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    # Image processing
    libmagickwand-dev \
    ghostscript \
    imagemagick \
    # Fonts
    fonts-liberation \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Configure ImageMagick to allow PDF processing
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml 2>/dev/null || true

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create storage directories
RUN mkdir -p storage/uploads storage/processed storage/temp static

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
