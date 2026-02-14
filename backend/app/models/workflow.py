"""
Workflow Model
Database model for multi-step document workflows
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Workflow(Base):
    """Custom document workflow model"""
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Workflow definition
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    steps = Column(JSON, nullable=False)  # List of step definitions
    
    # Settings
    is_public = Column(Boolean, default=False, nullable=False)
    is_template = Column(Boolean, default=False, nullable=False)
    
    # Usage stats
    run_count = Column(Integer, default=0, nullable=False)
    last_run = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="workflows")
    runs = relationship("WorkflowRun", back_populates="workflow", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workflow {self.name}>"


class WorkflowRun(Base):
    """Workflow execution record"""
    __tablename__ = "workflow_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    
    # Status
    status = Column(String(50), default="pending", nullable=False)
    current_step = Column(Integer, default=0, nullable=False)
    
    # Input/Output
    input_document_id = Column(String(36), nullable=True)
    output_document_id = Column(String(36), nullable=True)
    
    # Step results
    step_results = Column(JSON, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    workflow = relationship("Workflow", back_populates="runs")

    def __repr__(self):
        return f"<WorkflowRun {self.id} step={self.current_step}>"
