"""
AI Features Endpoints
Document analysis, summarization, chat, OCR, and intelligent processing
"""

import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user_id_optional
from app.core.config import settings
from app.services.document_service import DocumentService
from app.engines.ai_engine import AIEngine, AIEngineLocal
from app.engines.ocr_engine import OCREngine


router = APIRouter()


# ============== Request/Response Schemas ==============

class SummarizeRequest(BaseModel):
    """Request to summarize a document"""
    document_id: str
    length: str = "medium"  # short, medium, long
    style: str = "bullet"  # bullet, paragraph, executive


class ClassifyRequest(BaseModel):
    """Request to classify a document"""
    document_id: str


class KeywordsRequest(BaseModel):
    """Request to extract keywords"""
    document_id: str
    max_keywords: int = 20


class ChatRequest(BaseModel):
    """Request to chat with a document"""
    document_id: str
    question: str
    conversation_id: Optional[str] = None


class ChatMessage(BaseModel):
    """Chat message"""
    role: str
    content: str


class ChatResponse(BaseModel):
    """Chat response"""
    answer: str
    conversation_id: str
    referenced_pages: List[int] = []
    tokens_used: int = 0


class AnalyzeResumeRequest(BaseModel):
    """Request to analyze a resume"""
    document_id: str


class AnalyzeContractRequest(BaseModel):
    """Request to analyze a contract"""
    document_id: str


class SuggestFilenameRequest(BaseModel):
    """Request to suggest a filename"""
    document_id: str


class OCRRequest(BaseModel):
    """Request to perform OCR"""
    document_id: str
    language: str = "eng"
    pages: Optional[List[int]] = None
    create_searchable_pdf: bool = False


class ExtractEntitiesRequest(BaseModel):
    """Request to extract named entities"""
    document_id: str


# ============== In-memory storage ==============

# Conversation storage (use Redis/DB in production)
conversations = {}


# ============== Helper Functions ==============

async def get_document_text(
    document_id: str,
    db: AsyncSession
) -> str:
    """Extract text from a document"""
    doc_service = DocumentService(db)
    document = await doc_service.get_by_id(document_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = settings.UPLOAD_DIR / document.storage_key
    
    if document.file_extension.lower() == "pdf":
        return AIEngine.extract_text_from_pdf(file_path)
    elif document.file_extension.lower() in ["txt", "md"]:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type for text extraction: {document.file_extension}"
        )


def get_ai_engine() -> AIEngine:
    """Get AI engine with configured API keys"""
    import os
    return AIEngine(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )


# ============== Endpoints ==============

@router.post("/summarize")
async def summarize_document(
    request: SummarizeRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a summary of a document.
    
    - **length**: short (2-3 sentences), medium (5-7 points), long (comprehensive)
    - **style**: bullet (bullet points), paragraph (prose), executive (business summary)
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.summarize_document(
                text=text,
                length=request.length,
                style=request.style
            )
        except RuntimeError:
            # Fallback to local summarization
            summary = AIEngineLocal.simple_summarize(
                text,
                num_sentences={"short": 3, "medium": 7, "long": 15}.get(request.length, 7)
            )
            result = {
                "summary": summary,
                "length": request.length,
                "style": request.style,
                "tokens_used": 0,
                "method": "local"
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/classify")
async def classify_document(
    request: ClassifyRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Classify a document into categories (invoice, contract, resume, etc.)
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.classify_document(text)
        except RuntimeError:
            # Simple keyword-based classification
            text_lower = text.lower()
            
            categories = {
                "invoice": ["invoice", "bill", "amount due", "payment", "total"],
                "receipt": ["receipt", "paid", "transaction", "purchase"],
                "contract": ["agreement", "contract", "party", "terms", "obligations"],
                "resume": ["experience", "education", "skills", "employment", "resume", "cv"],
                "report": ["report", "analysis", "findings", "conclusion", "summary"],
            }
            
            best_category = "other"
            best_score = 0
            
            for category, keywords in categories.items():
                score = sum(1 for kw in keywords if kw in text_lower)
                if score > best_score:
                    best_score = score
                    best_category = category
            
            result = {
                "category": best_category,
                "confidence": min(0.3 + (best_score * 0.15), 0.9),
                "reasoning": f"Matched {best_score} keywords for {best_category}",
                "method": "local"
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/keywords")
async def extract_keywords(
    request: KeywordsRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Extract important keywords and phrases from a document.
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.extract_keywords(text, request.max_keywords)
        except RuntimeError:
            # Use local keyword extraction
            keywords = AIEngineLocal.extract_keywords_simple(text, request.max_keywords)
            result = {"keywords": keywords, "method": "local"}
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Keyword extraction failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(
    request: ChatRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Ask questions about a document and get AI-powered answers.
    
    Maintains conversation history for follow-up questions.
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        # Get or create conversation
        conv_id = request.conversation_id or str(uuid.uuid4())
        
        if conv_id not in conversations:
            conversations[conv_id] = {
                "document_id": request.document_id,
                "messages": []
            }
        
        conversation = conversations[conv_id]
        
        # Verify document matches
        if conversation["document_id"] != request.document_id:
            raise HTTPException(
                status_code=400,
                detail="Conversation is for a different document"
            )
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.chat_with_document(
                text=text,
                question=request.question,
                conversation_history=conversation["messages"]
            )
            
            # Add to history
            conversation["messages"].append({"role": "user", "content": request.question})
            conversation["messages"].append({"role": "assistant", "content": result["answer"]})
            
            return ChatResponse(
                answer=result["answer"],
                conversation_id=conv_id,
                referenced_pages=result.get("referenced_sections", []),
                tokens_used=result.get("tokens_used", 0)
            )
            
        except RuntimeError:
            # No AI available, return helpful message
            return ChatResponse(
                answer="AI chat is not available. Please configure an OpenAI or Anthropic API key.",
                conversation_id=conv_id,
                referenced_pages=[],
                tokens_used=0
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.delete("/chat/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a chat conversation"""
    if conversation_id in conversations:
        del conversations[conversation_id]
    return {"message": "Conversation deleted"}


@router.post("/analyze-resume")
async def analyze_resume(
    request: AnalyzeResumeRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a resume/CV document and extract structured information.
    
    Returns: name, contact info, skills, experience, education, etc.
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.analyze_resume(text)
        except RuntimeError:
            # Extract what we can with regex
            emails = AIEngineLocal.extract_emails(text)
            phones = AIEngineLocal.extract_phone_numbers(text)
            
            result = {
                "email": emails[0] if emails else None,
                "phone": phones[0] if phones else None,
                "skills": [],
                "experience": [],
                "education": [],
                "method": "local",
                "note": "AI analysis unavailable. Limited extraction performed."
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")


@router.post("/analyze-contract")
async def analyze_contract(
    request: AnalyzeContractRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a contract document and extract key terms.
    
    Returns: parties, dates, obligations, payment terms, risks, etc.
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.analyze_contract(text)
        except RuntimeError:
            # Extract what we can
            dates = AIEngineLocal.extract_dates(text)
            money = AIEngineLocal.extract_monetary_values(text)
            
            result = {
                "dates_found": dates,
                "monetary_values": money,
                "method": "local",
                "note": "AI analysis unavailable. Limited extraction performed."
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract analysis failed: {str(e)}")


@router.post("/suggest-filename")
async def suggest_filename(
    request: SuggestFilenameRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Suggest a descriptive filename based on document content.
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.suggest_filename(text)
        except RuntimeError:
            # Simple filename suggestion
            dates = AIEngineLocal.extract_dates(text)
            keywords = AIEngineLocal.extract_keywords_simple(text[:2000], 3)
            
            parts = []
            if dates:
                parts.append(dates[0].replace("/", "-"))
            for kw in keywords:
                parts.append(kw["term"])
            
            suggested = "_".join(parts) if parts else "document"
            
            result = {
                "suggested_filename": suggested[:50],
                "alternatives": [],
                "method": "local"
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Filename suggestion failed: {str(e)}")


@router.post("/extract-entities")
async def extract_entities(
    request: ExtractEntitiesRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Extract named entities from a document.
    
    Returns: people, organizations, locations, dates, monetary values, etc.
    """
    try:
        text = await get_document_text(request.document_id, db)
        
        try:
            ai_engine = get_ai_engine()
            result = ai_engine.extract_entities(text)
        except RuntimeError:
            # Use local extraction
            result = {
                "emails": AIEngineLocal.extract_emails(text),
                "phone_numbers": AIEngineLocal.extract_phone_numbers(text),
                "dates": AIEngineLocal.extract_dates(text),
                "monetary_values": AIEngineLocal.extract_monetary_values(text),
                "method": "local"
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Entity extraction failed: {str(e)}")


@router.post("/ocr")
async def perform_ocr(
    request: OCRRequest,
    user_id: Optional[str] = Depends(get_current_user_id_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform OCR on a scanned document or image.
    
    Optionally creates a searchable PDF with the extracted text.
    """
    doc_service = DocumentService(db)
    document = await doc_service.get_by_id(request.document_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    input_path = settings.UPLOAD_DIR / document.storage_key
    output_dir = settings.TEMP_DIR / f"ocr_{request.document_id}"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        if document.file_extension.lower() == "pdf":
            result = OCREngine.ocr_pdf(
                pdf_path=input_path,
                output_dir=output_dir,
                language=request.language,
                pages=request.pages
            )
            
            # Create searchable PDF if requested
            if request.create_searchable_pdf:
                output_id = str(uuid.uuid4())
                output_path = settings.PROCESSED_DIR / f"{output_id}.pdf"
                
                searchable_result = OCREngine.create_searchable_pdf(
                    input_pdf=input_path,
                    output_pdf=output_path,
                    language=request.language
                )
                
                result_doc = await doc_service.create_from_processed(
                    original_name=f"searchable_{document.original_name}",
                    storage_key=f"{output_id}.pdf",
                    mime_type="application/pdf",
                    file_size=output_path.stat().st_size,
                    user_id=user_id
                )
                
                result["searchable_pdf_id"] = str(result_doc.id)
                result["download_url"] = f"/api/v1/documents/{result_doc.id}/download"
        
        else:
            # Single image OCR
            result = OCREngine.ocr_image(
                image_path=input_path,
                language=request.language
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


@router.get("/ocr/languages")
async def get_ocr_languages():
    """Get list of available OCR languages"""
    return {
        "supported": OCREngine.LANGUAGES,
        "available": OCREngine.get_available_languages()
    }

