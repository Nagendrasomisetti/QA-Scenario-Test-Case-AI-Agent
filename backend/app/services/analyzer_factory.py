import os
import logging
from typing import Optional

import time
from app.models.schemas import AnalysisResponse
from app.services.base_analyzer import BaseLLMAnalyzer
from app.services.gemini_analyzer import GeminiAnalyzerService
from app.services.bluesminds_analyzer import BluesMindsAnalyzerService

logger = logging.getLogger("QA_Agent_AnalyzerFactory")
logger.setLevel(logging.INFO)

class AnalyzerFactory:
    @staticmethod
    def get_providers() -> list[BaseLLMAnalyzer]:
        provider_chain_str = os.getenv("LLM_PROVIDER_CHAIN", "gemini")
        provider_names = [p.strip().lower() for p in provider_chain_str.split(",") if p.strip()]
        
        providers = []
        for name in provider_names:
            try:
                if name == "gemini":
                    providers.append(GeminiAnalyzerService())
                elif name == "bluesminds":
                    providers.append(BluesMindsAnalyzerService())
                else:
                    logger.warning(f"Unknown provider '{name}' in LLM_PROVIDER_CHAIN. Skipping.")
            except Exception as e:
                logger.warning(f"Failed to initialize provider '{name}': {str(e)}")
                
        if not providers:
            # Fallback to Gemini if nothing else works or is misconfigured
            logger.warning("No valid providers found in chain. Defaulting to Gemini.")
            providers.append(GeminiAnalyzerService())
            
        return providers

    @classmethod
    async def analyze_requirements(
        cls,
        requirement: str = "",
        pdf_bytes: Optional[bytes] = None,
        image_bytes: Optional[bytes] = None,
        image_mime_type: Optional[str] = "image/png"
    ) -> AnalysisResponse:
        
        providers = cls.get_providers()
        
        last_error = None
        for i, provider in enumerate(providers):
            start_time = time.time()
            logger.info(
                f"[{provider.provider_name}] Starting analysis. "
                f"Model: {provider.model_name} "
                f"(Chain pos: {i+1}/{len(providers)})"
            )
            try:
                response = await provider.analyze_requirements(
                    requirement=requirement,
                    pdf_bytes=pdf_bytes,
                    image_bytes=image_bytes,
                    image_mime_type=image_mime_type
                )
                processing_time = time.time() - start_time
                logger.info(
                    f"[SUCCESS] Analysis completed. "
                    f"Provider: {provider.provider_name}, "
                    f"Model: {provider.model_name}, "
                    f"Processing_time: {processing_time:.2f}s"
                )
                return response
            except Exception as e:
                processing_time = time.time() - start_time
                last_error = e
                fallback_provider = providers[i+1].provider_name if i < len(providers) - 1 else "None"
                
                logger.error(
                    f"[FAILURE] Provider failed. "
                    f"Provider: {provider.provider_name}, "
                    f"Model: {provider.model_name}, "
                    f"Processing_time: {processing_time:.2f}s, "
                    f"Error: {str(e)}, "
                    f"Fallback_Provider: {fallback_provider}"
                )
                
                if i < len(providers) - 1:
                    logger.info(f"Falling back to next provider: {fallback_provider}")
                else:
                    logger.error("All configured LLM providers failed.")
                    
        raise RuntimeError(f"Analysis failed across all providers in chain. Last error: {str(last_error)}")
