"""
AI Feature Models
Database models for AI-powered document analysis
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class AITaskType(str, enum.Enum):
    """AI task types"""
    CHAT = "chat"
    SUMMARIZE = "summarize"
    OCR = "ocr"
    CLASSIFY = "classify"
    EXTRACT_KEYWORDS = "extract_keywords"
    ANALYZE_RESUME = "analyze_resume"
    ANALYZE_CONTRACT = "analyze_contract"
    SUGGEST_FILENAME = "suggest_filename"


class AITaskStatus(str, enum.Enum):
    """AI task status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentClassification(str, enum.Enum):
    """Document classification categories"""
    INVOICE = "invoice"
    RECEIPT = "receipt"
    CONTRACT = "contract"
    RESUME = "resume"
    REPORT = "report"
    FORM = "form"
    LETTER = "letter"
    PRESENTATION = "presentation"
    LEGAL = "legal"
    FINANCIAL = "financial"
    MEDICAL = "medical"
    TECHNICAL = "technical"
    OTHER = "other"


class AITask(Base):
    """AI processing task"""
    __tablename__ = "ai_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    # Task details
    task_type = Column(String(50), nullable=False)
    status = Column(String(50), default=AITaskStatus.PENDING.value, nullable=False)
    
    # Input
    input_data = Column(JSON, nullable=True)  # Additional parameters
    
    # Output
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metrics
    processing_time_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Celery
    celery_task_id = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    document = relationship("Document")

    def __repr__(self):
        return f"<AITask {self.id} - {self.task_type}>"


class ChatConversation(Base):
    """Chat with PDF conversation"""
    __tablename__ = "chat_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Conversation info
    title = Column(String(255), nullable=True)
    
    # Document context (extracted text, embeddings reference)
    context_extracted = Column(Boolean, default=False, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    document = relationship("Document")

    def __repr__(self):
        return f"<ChatConversation {self.id}>"


class ChatMessage(Base):
    """Individual chat message"""
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False)
    
    # Message content
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    
    # Metadata
    tokens_used = Column(Integer, default=0, nullable=False)
    referenced_pages = Column(JSON, nullable=True)  # Pages cited in response
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage {self.id}>"


class DocumentAnalysis(Base):
    """Cached document analysis results"""
    __tablename__ = "document_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Classification
    classification = Column(String(50), nullable=True)
    classification_confidence = Column(Float, nullable=True)
    
    # Summary
    summary_short = Column(Text, nullable=True)  # 1-2 sentences
    summary_detailed = Column(Text, nullable=True)  # Full summary
    
    # Extracted information
    keywords = Column(JSON, nullable=True)  # List of keywords with weights
    entities = Column(JSON, nullable=True)  # Named entities (people, orgs, dates)
    key_points = Column(JSON, nullable=True)  # Main points/findings
    
    # Language
    detected_language = Column(String(10), nullable=True)
    
    # Suggested filename
    suggested_filename = Column(String(255), nullable=True)
    
    # Full text (for search)
    full_text = Column(Text, nullable=True)
    
    # Contract-specific
    contract_parties = Column(JSON, nullable=True)
    contract_dates = Column(JSON, nullable=True)
    contract_terms = Column(JSON, nullable=True)
    
    # Resume-specific
    resume_skills = Column(JSON, nullable=True)
    resume_experience = Column(JSON, nullable=True)
    resume_education = Column(JSON, nullable=True)
    resume_contact = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document")

    def __repr__(self):
        return f"<DocumentAnalysis {self.document_id}>"


class OCRResult(Base):
    """OCR extraction result"""
    __tablename__ = "ocr_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # OCR settings
    language = Column(String(50), default="eng", nullable=False)
    engine = Column(String(50), default="tesseract", nullable=False)
    
    # Results per page
    page_results = Column(JSON, nullable=False)  # {page_num: {text, confidence, boxes}}
    
    # Full document text
    full_text = Column(Text, nullable=True)
    average_confidence = Column(Float, nullable=True)
    
    # Output document (searchable PDF)
    output_document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    
    processing_time_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    source_document = relationship("Document", foreign_keys=[document_id])
    output_document = relationship("Document", foreign_keys=[output_document_id])

    def __repr__(self):
        return f"<OCRResult {self.document_id}>"
