"""
AI Tasks
Background tasks for AI-powered document processing
"""

import time
from pathlib import Path
from typing import Dict, Any, Optional, List

from celery import shared_task
from celery.utils.log import get_task_logger

from app.core.config import settings
from app.engines.ai_engine import AIEngine, AIEngineLocal
from app.engines.ocr_engine import OCREngine


logger = get_task_logger(__name__)


def update_progress(task, progress: int, step: str):
    """Update task progress"""
    task.update_state(
        state='PROGRESS',
        meta={'progress': progress, 'step': step}
    )


def get_ai_engine():
    """Get appropriate AI engine based on configuration"""
    if settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY:
        return AIEngine()
    return AIEngineLocal()


@shared_task(bind=True, name="ai.summarize_document")
def summarize_document_task(
    self,
    input_path: str,
    max_length: int = 500,
    style: str = "professional",
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Generate AI-powered document summary"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        # Extract text from PDF or read text file
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Generating summary")
        
        engine = get_ai_engine()
        summary = engine.summarize_document(text, max_length=max_length, style=style)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "summary": summary,
            "source_characters": len(text),
            "summary_characters": len(summary),
            "compression_ratio": round(len(text) / max(len(summary), 1), 2),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Document summarization failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.classify_document")
def classify_document_task(
    self,
    input_path: str,
    categories: Optional[List[str]] = None,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Classify document into categories"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Classifying document")
        
        engine = get_ai_engine()
        result = engine.classify_document(text, categories=categories)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "classification": result,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Document classification failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.extract_keywords")
def extract_keywords_task(
    self,
    input_path: str,
    max_keywords: int = 20,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Extract keywords from document"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Extracting keywords")
        
        engine = get_ai_engine()
        keywords = engine.extract_keywords(text, max_keywords=max_keywords)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "keywords": keywords,
            "keyword_count": len(keywords),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Keyword extraction failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.analyze_resume")
def analyze_resume_task(
    self,
    input_path: str,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Analyze resume document and extract structured data"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading resume")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Analyzing resume")
        
        engine = get_ai_engine()
        analysis = engine.analyze_resume(text)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "analysis": analysis,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Resume analysis failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.analyze_contract")
def analyze_contract_task(
    self,
    input_path: str,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Analyze contract document for key terms and clauses"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading contract")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Analyzing contract")
        
        engine = get_ai_engine()
        analysis = engine.analyze_contract(text)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "analysis": analysis,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Contract analysis failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.ocr_document")
def ocr_document_task(
    self,
    input_path: str,
    output_path: Optional[str] = None,
    language: str = "eng",
    create_searchable_pdf: bool = False,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Perform OCR on document"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Performing OCR")
        
        if input_file.suffix.lower() == ".pdf":
            result = OCREngine.ocr_pdf(input_file, language=language)
            
            if create_searchable_pdf and output_path:
                update_progress(self, 70, "Creating searchable PDF")
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)
                OCREngine.create_searchable_pdf(input_file, output_file, language=language)
        else:
            result = OCREngine.ocr_image(input_file, language=language)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Calculate word count
        word_count = len(result.get("text", "").split())
        
        response = {
            "status": "completed",
            "text": result.get("text", ""),
            "confidence": result.get("confidence"),
            "word_count": word_count,
            "language_detected": result.get("language"),
            "processing_time_ms": processing_time,
        }
        
        if create_searchable_pdf and output_path:
            response["searchable_pdf"] = output_path
        
        return response
        
    except Exception as e:
        logger.error(f"OCR failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.extract_entities")
def extract_entities_task(
    self,
    input_path: str,
    entity_types: Optional[List[str]] = None,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Extract named entities from document"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Extracting entities")
        
        engine = get_ai_engine()
        entities = engine.extract_entities(text, entity_types=entity_types)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Count entities by type
        entity_counts = {}
        for entity in entities:
            etype = entity.get("type", "unknown")
            entity_counts[etype] = entity_counts.get(etype, 0) + 1
        
        return {
            "status": "completed",
            "entities": entities,
            "entity_count": len(entities),
            "entity_counts_by_type": entity_counts,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Entity extraction failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.chat_with_document")
def chat_with_document_task(
    self,
    input_path: str,
    question: str,
    conversation_history: Optional[List[Dict]] = None,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Answer questions about document content"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Processing question")
        
        engine = get_ai_engine()
        response = engine.chat_with_document(
            document_text=text,
            question=question,
            conversation_history=conversation_history or []
        )
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "answer": response.get("answer", ""),
            "confidence": response.get("confidence"),
            "sources": response.get("sources", []),
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Document chat failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task(bind=True, name="ai.batch_ocr")
def batch_ocr_task(
    self,
    input_paths: List[str],
    output_dir: str,
    language: str = "eng",
    create_searchable_pdfs: bool = True,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Perform OCR on multiple documents"""
    start_time = time.time()
    results = []
    
    try:
        output_directory = Path(output_dir)
        output_directory.mkdir(parents=True, exist_ok=True)
        
        total = len(input_paths)
        
        for i, input_path in enumerate(input_paths):
            progress = int(10 + (80 * i / total))
            update_progress(self, progress, f"Processing document {i + 1} of {total}")
            
            input_file = Path(input_path)
            
            try:
                if input_file.suffix.lower() == ".pdf":
                    result = OCREngine.ocr_pdf(input_file, language=language)
                    
                    if create_searchable_pdfs:
                        output_file = output_directory / f"searchable_{input_file.name}"
                        OCREngine.create_searchable_pdf(input_file, output_file, language=language)
                        results.append({
                            "input": str(input_file),
                            "output": str(output_file),
                            "success": True,
                            "word_count": len(result.get("text", "").split()),
                            "confidence": result.get("confidence"),
                        })
                    else:
                        results.append({
                            "input": str(input_file),
                            "success": True,
                            "text": result.get("text", ""),
                            "word_count": len(result.get("text", "").split()),
                            "confidence": result.get("confidence"),
                        })
                else:
                    result = OCREngine.ocr_image(input_file, language=language)
                    results.append({
                        "input": str(input_file),
                        "success": True,
                        "text": result.get("text", ""),
                        "word_count": len(result.get("text", "").split()),
                        "confidence": result.get("confidence"),
                    })
                    
            except Exception as e:
                results.append({
                    "input": str(input_file),
                    "success": False,
                    "error": str(e),
                })
        
        update_progress(self, 95, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        successful = sum(1 for r in results if r.get("success"))
        
        return {
            "status": "completed",
            "total_documents": total,
            "successful": successful,
            "failed": total - successful,
            "results": results,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Batch OCR failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "results": results,
        }


@shared_task(bind=True, name="ai.suggest_filename")
def suggest_filename_task(
    self,
    input_path: str,
    task_id: Optional[str] = None
) -> Dict[str, Any]:
    """Generate AI-suggested filename based on document content"""
    start_time = time.time()
    
    try:
        update_progress(self, 10, "Loading document")
        
        input_file = Path(input_path)
        
        update_progress(self, 30, "Extracting text")
        
        if input_file.suffix.lower() == ".pdf":
            from app.engines.pdf_engine import PDFEngine
            text = PDFEngine.extract_text(input_file)
        else:
            text = input_file.read_text(encoding="utf-8", errors="ignore")
        
        update_progress(self, 50, "Analyzing content")
        
        engine = get_ai_engine()
        suggested_name = engine.suggest_filename(text)
        
        update_progress(self, 90, "Finalizing")
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "completed",
            "original_name": input_file.name,
            "suggested_name": suggested_name,
            "processing_time_ms": processing_time,
        }
        
    except Exception as e:
        logger.error(f"Filename suggestion failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
        }
