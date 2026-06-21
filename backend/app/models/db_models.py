import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from app.database import Base

class DBAnalysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)  # SaaS ready placeholder
    title = Column(String, index=True, nullable=False)
    source_type = Column(String, index=True, nullable=False)  # "text" | "pdf" | "image"
    input_text = Column(Text, nullable=True)
    analysis_json = Column(JSON, nullable=False)
    
    # Metadata metrics
    processing_time_ms = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    pages_processed = Column(Integer, default=0)
    characters_extracted = Column(Integer, default=0)
    
    # Quality metrics
    scenarios_count = Column(Integer, default=0)
    test_cases_count = Column(Integer, default=0)
    risks_count = Column(Integer, default=0)
    missing_requirements_count = Column(Integer, default=0)
    
    # Export counters
    pdf_exports_count = Column(Integer, default=0)
    excel_exports_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
