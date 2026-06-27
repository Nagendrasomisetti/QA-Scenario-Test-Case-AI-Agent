import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analyze, history
from app.database import engine, Base
from app.services.analyzer_factory import AnalyzerFactory

# Create all database tables on application startup
# In production with PostgreSQL, Alembic is used for migrations.
# This ensures SQLite / Postgres DB schemas auto-generate out-of-the-box.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QA Scenario & Test Case AI Agent API",
    version="1.0.0",
    description="Backend API for automatically generating QA scenarios, test cases, risks, and missing requirements."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QA_Agent_Backend")

# Include Routers
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History & Exports"])

@app.on_event("startup")
def startup_event():
    logger.info("Backend startup: QA Scenario & Test Case AI Agent API is starting up...")
    provider_chain = os.getenv("LLM_PROVIDER_CHAIN", "gemini")
    logger.info(f"LLM Provider Chain configured as: {provider_chain}")
    
    if "gemini" in provider_chain.lower():
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            logger.info(f"Gemini SDK readiness check: GEMINI_API_KEY is configured (length: {len(gemini_key)})")
        else:
            logger.warning("Gemini SDK readiness check: GEMINI_API_KEY is NOT set in environment variables!")
            
    if "bluesminds" in provider_chain.lower():
        llm_key = os.getenv("LLM_API_KEY")
        if llm_key:
            logger.info(f"BluesMinds SDK readiness check: LLM_API_KEY is configured (length: {len(llm_key)})")
        else:
            logger.warning("BluesMinds SDK readiness check: LLM_API_KEY is NOT set in environment variables!")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "QA Scenario & Test Case AI Agent API is running."
    }

@app.get("/api/health/llm")
def llm_health_check():
    provider_chain_str = os.getenv("LLM_PROVIDER_CHAIN", "gemini")
    chain = [p.strip().lower() for p in provider_chain_str.split(",") if p.strip()]
    
    providers = AnalyzerFactory.get_providers()
    active_provider = providers[0].provider_name if providers else "none"
    model = providers[0].model_name if providers else "none"
    status = "healthy" if providers else "unhealthy"
    
    return {
        "provider_chain": chain,
        "active_provider": active_provider,
        "model": model,
        "status": status
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
