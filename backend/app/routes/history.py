import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import io

from app.database import get_db
from app.models.db_models import DBAnalysis
from app.models.schemas import AnalysisResponse
from app.services.exporter import ExportService

router = APIRouter(prefix="/analyses", tags=["History & Exports"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Calculates aggregated metrics for the top dashboard statistics cards.
    """
    total = db.query(DBAnalysis).count()
    
    text_count = db.query(DBAnalysis).filter(DBAnalysis.source_type == "text").count()
    pdf_count = db.query(DBAnalysis).filter(DBAnalysis.source_type == "pdf").count()
    image_count = db.query(DBAnalysis).filter(DBAnalysis.source_type == "image").count()
    
    # Calculate PDFs page sums
    pdf_pages_sum = db.query(func.sum(DBAnalysis.pages_processed)).filter(DBAnalysis.source_type == "pdf").scalar() or 0
    
    # Average processing time
    avg_processing = db.query(func.avg(DBAnalysis.processing_time_ms)).scalar() or 0
    
    # Weekly/Monthly counts
    now = datetime.datetime.utcnow()
    one_week_ago = now - datetime.timedelta(days=7)
    one_month_ago = now - datetime.timedelta(days=30)
    
    weekly_count = db.query(DBAnalysis).filter(DBAnalysis.created_at >= one_week_ago).count()
    monthly_count = db.query(DBAnalysis).filter(DBAnalysis.created_at >= one_month_ago).count()
    
    # Recent activity: last 10 records
    recent_activity = []
    recent_records = db.query(DBAnalysis).order_by(DBAnalysis.created_at.desc()).limit(10).all()
    for rec in recent_records:
        recent_activity.append({
            "id": rec.id,
            "title": rec.title,
            "source_type": rec.source_type,
            "created_at": rec.created_at.isoformat()
        })
        
    return {
        "total_analyses": total,
        "text_analyses": text_count,
        "pdf_analyses": pdf_count,
        "image_analyses": image_count,
        "pages_processed_sum": pdf_pages_sum,
        "average_processing_time_ms": int(avg_processing),
        "analyses_this_week": weekly_count,
        "analyses_this_month": monthly_count,
        "recent_activity": recent_activity
    }

@router.get("")
def list_analyses(
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    """
    Returns lists of analysis summaries sorted by creation time.
    """
    records = db.query(DBAnalysis).order_by(DBAnalysis.created_at.desc()).offset(offset).limit(limit).all()
    summaries = []
    for r in records:
        summaries.append({
            "id": r.id,
            "title": r.title,
            "source_type": r.source_type,
            "created_at": r.created_at.isoformat(),
            "scenarios_count": r.scenarios_count,
            "test_cases_count": r.test_cases_count
        })
    return summaries

@router.get("/search")
def search_analyses(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Searches previous analyses by title, requirement text, or source type.
    """
    records = db.query(DBAnalysis).filter(
        or_(
            DBAnalysis.title.ilike(f"%{q}%"),
            DBAnalysis.input_text.ilike(f"%{q}%"),
            DBAnalysis.source_type.ilike(f"%{q}%")
        )
    ).order_by(DBAnalysis.created_at.desc()).limit(50).all()
    
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "title": r.title,
            "source_type": r.source_type,
            "created_at": r.created_at.isoformat(),
            "scenarios_count": r.scenarios_count,
            "test_cases_count": r.test_cases_count
        })
    return results

@router.get("/{analysis_id}")
def get_analysis_detail(analysis_id: int, db: Session = Depends(get_db)):
    """
    Returns the complete analysis JSON payload for rendering in the tabs.
    """
    record = db.query(DBAnalysis).filter(DBAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    
    # We return the saved JSON directly
    response_payload = dict(record.analysis_json)
    
    # Ensure ID and metrics are mapped
    response_payload["id"] = record.id
    response_payload["source_type"] = record.source_type
    response_payload["confidence_score"] = record.confidence_score
    response_payload["pages_processed"] = record.pages_processed
    response_payload["characters_extracted"] = record.characters_extracted
    
    return response_payload

@router.delete("/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """
    Deletes an analysis record.
    """
    record = db.query(DBAnalysis).filter(DBAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    
    db.delete(record)
    db.commit()
    return {"status": "success", "message": "Analysis deleted."}

@router.get("/{analysis_id}/export/pdf")
def export_pdf(analysis_id: int, db: Session = Depends(get_db)):
    """
    Generates and returns ReportLab PDF. Increments counter.
    """
    record = db.query(DBAnalysis).filter(DBAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    
    # Increment PDF export counter
    record.pdf_exports_count = (record.pdf_exports_count or 0) + 1
    db.commit()
    
    pdf_bytes = ExportService.generate_pdf_report(record.analysis_json)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=QA_Analysis_Report_{analysis_id}.pdf"}
    )

@router.get("/{analysis_id}/export/excel")
def export_excel(analysis_id: int, db: Session = Depends(get_db)):
    """
    Generates and returns OpenPyXL workbook. Increments counter.
    """
    record = db.query(DBAnalysis).filter(DBAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    
    # Increment Excel export counter
    record.excel_exports_count = (record.excel_exports_count or 0) + 1
    db.commit()
    
    excel_bytes = ExportService.generate_excel_report(record.analysis_json)
    
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=QA_Analysis_Report_{analysis_id}.xlsx"}
    )
