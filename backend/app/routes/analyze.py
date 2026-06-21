import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import DBAnalysis
from app.models.schemas import AnalysisResponse
from app.services.gemini_analyzer import GeminiAnalyzerService
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

router = APIRouter()
logger = logging.getLogger("QA_Agent_Routes")

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 Megabytes

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    requirement: Optional[str] = Form(None),
    pdf_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    
    req_text = requirement or ""
    pdf_bytes = None
    image_bytes = None
    image_mime = "image/png"
    doc_title = ""

    # Validation & Extraction: PDF
    if pdf_file:
        doc_title = pdf_file.filename
        try:
            pdf_bytes = await pdf_file.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")
            
        if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400, 
                detail="PDF file size exceeds maximum limit of 10MB."
            )
            
        filename = pdf_file.filename.lower()
        if not filename.endswith(".pdf") and pdf_file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Invalid PDF file. Only standard PDF formats are allowed.")

    # Validation & Extraction: Image
    if image_file:
        if not doc_title:
            doc_title = image_file.filename
        try:
            image_bytes = await image_file.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read image file: {str(e)}")
            
        if len(image_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400, 
                detail="Image file size exceeds maximum limit of 10MB."
            )
            
        filename = image_file.filename.lower()
        supported_img_extensions = (".png", ".jpg", ".jpeg", ".webp")
        if not filename.endswith(supported_img_extensions) and not image_file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image file. Supported formats: PNG, JPG, JPEG, WEBP.")
            
        image_mime = image_file.content_type or "image/png"

    # Fallback/Empty check
    if not req_text.strip() and not pdf_bytes and not image_bytes:
        raise HTTPException(
            status_code=400, 
            detail="Empty request. Please enter a text requirement or upload a specification document/image."
        )

    # Perform analysis
    try:
        response = await GeminiAnalyzerService.analyze_requirements(
            requirement=req_text,
            pdf_bytes=pdf_bytes,
            image_bytes=image_bytes,
            image_mime_type=image_mime
        )
        
        # Calculate processing time in milliseconds
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Determine Title
        analysis_title = ""
        if response.scenarios and len(response.scenarios) > 0:
            analysis_title = response.scenarios[0].title
        elif doc_title:
            analysis_title = f"Doc: {doc_title}"
        else:
            analysis_title = req_text[:40].strip() + ("..." if len(req_text) > 40 else "")
            
        if not analysis_title:
            analysis_title = "Untitled QA Analysis"
            
        # Serialize response model to dict
        dumped_json = response.model_dump()
        
        # Save analysis to database
        db_analysis = DBAnalysis(
            title=analysis_title,
            source_type=response.source_type,
            input_text=req_text,
            analysis_json=dumped_json,
            processing_time_ms=processing_time_ms,
            confidence_score=response.confidence_score,
            pages_processed=response.pages_processed,
            characters_extracted=response.characters_extracted,
            scenarios_count=len(response.scenarios),
            test_cases_count=len(response.test_cases),
            risks_count=len(response.risks),
            missing_requirements_count=len(response.missing_requirements),
            pdf_exports_count=0,
            excel_exports_count=0
        )
        
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        # Set database id in response payload
        response.id = db_analysis.id
        
        logger.info(f"Auto-saved analysis record ID: {db_analysis.id} to database. Title: '{analysis_title}'")
        return response
        
    except Exception as e:
        logger.error(f"Error during requirements analysis flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"QA Analysis failed: {str(e)}")
