import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analyze, history
from app.database import engine, Base

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
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        logger.info(f"Gemini SDK readiness check: GEMINI_API_KEY is configured (length: {len(gemini_key)})")
    else:
        logger.warning("Gemini SDK readiness check: GEMINI_API_KEY is NOT set in environment variables!")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "QA Scenario & Test Case AI Agent API is running."
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
