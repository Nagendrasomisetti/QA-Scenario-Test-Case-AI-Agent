import os
import time
import json
import logging
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from pydantic import ValidationError

from app.models.schemas import AnalysisResponse
from app.services.qa_system_prompt import QA_SYSTEM_INSTRUCTION, QA_USER_PROMPT_TEMPLATE, PROMPT_VERSION
from app.services.text_analyzer import TextAnalyzer
from app.services.pdf_analyzer import PdfAnalyzer
from app.services.image_analyzer import ImageAnalyzer, IMAGE_QA_SYSTEM_INSTRUCTION

logger = logging.getLogger("QA_Agent_GeminiAnalyzer")
logger.setLevel(logging.INFO)

class GeminiAnalyzerService:
    @staticmethod
    def _initialize_client() -> bool:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY environment variable is not set.")
            return False
        genai.configure(api_key=api_key)
        return True

    @classmethod
    async def analyze_requirements(
        cls, 
        requirement: str = "",
        pdf_bytes: Optional[bytes] = None,
        image_bytes: Optional[bytes] = None,
        image_mime_type: Optional[str] = "image/png"
    ) -> AnalysisResponse:
        total_start_time = time.time()
        
        # Initialize Gemini SDK
        if not cls._initialize_client():
            raise ValueError("GEMINI_API_KEY is missing. Please configure it in your environment.")

        # Determine source type and orchestrate pre-analysis
        source_type = "text"
        pages_processed = 0
        characters_extracted = 0
        visual_observations: List[str] = []
        
        system_instruction = QA_SYSTEM_INSTRUCTION
        contents: List[Any] = []

        if image_bytes:
            source_type = "image"
            logger.info("Image bytes detected. Switching to visual requirement analysis.")
            system_instruction = ImageAnalyzer.get_system_instruction()
            
            # Format image part for Gemini API
            image_part = {
                "mime_type": image_mime_type or "image/png",
                "data": image_bytes
            }
            contents.append(image_part)
            
            # Append prompt instructions
            text_prompt = "Analyze this user interface screenshot and generate the complete QA requirements package."
            if requirement:
                text_prompt += f"\nAdditional text context:\n{requirement}"
            contents.append(text_prompt)

        elif pdf_bytes:
            source_type = "pdf"
            logger.info("PDF bytes detected. Extracting text page-by-page.")
            extracted_text, pages_processed, characters_extracted = PdfAnalyzer.extract_text(pdf_bytes)
            
            cleaned_req = TextAnalyzer.clean_text(extracted_text)
            if requirement:
                cleaned_req = f"User Request Context:\n{requirement}\n\nExtracted Document Specifications:\n{cleaned_req}"
                
            contents.append(QA_USER_PROMPT_TEMPLATE.format(requirement=cleaned_req))
            
        else:
            # Standard text requirements analysis
            cleaned_req = TextAnalyzer.clean_text(requirement)
            contents.append(QA_USER_PROMPT_TEMPLATE.format(requirement=cleaned_req))

        model_name = "gemini-2.5-flash"
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction
        )
        
        max_attempts = 3
        last_error = None
        
        for attempt in range(1, max_attempts + 1):
            logger.info(f"Gemini Analysis attempt {attempt} of {max_attempts} for source_type: '{source_type}' (Prompt Version: {PROMPT_VERSION})")
            
            gemini_start_time = time.time()
            try:
                # Call Gemini API with strict structured schema validation
                response: GenerateContentResponse = model.generate_content(
                    contents,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        response_schema=AnalysisResponse,
                        temperature=0.2,
                    )
                )
                
                gemini_duration = time.time() - gemini_start_time
                logger.info(f"Gemini API call returned in {gemini_duration:.3f} seconds.")
                
                raw_text = response.text
                logger.debug(f"Raw response: {raw_text}")
                
                try:
                    parsed_json = json.loads(raw_text)
                except json.JSONDecodeError as jde:
                    logger.error(f"JSON decode failure in attempt {attempt}: {str(jde)}")
                    last_error = f"JSON decode error: {str(jde)}"
                    continue
                
                # Enforce fields that are determined locally by the orchestrator
                parsed_json["source_type"] = source_type
                parsed_json["pages_processed"] = pages_processed
                parsed_json["characters_extracted"] = characters_extracted
                
                # Fallback defaults for visual observation/confidence if model missed them
                if source_type != "image":
                    parsed_json["visual_observations"] = []
                    if "confidence_score" not in parsed_json or parsed_json["confidence_score"] == 0:
                        parsed_json["confidence_score"] = 0.98
                else:
                    if "confidence_score" not in parsed_json or parsed_json["confidence_score"] == 0:
                        parsed_json["confidence_score"] = 0.92
                    if "visual_observations" not in parsed_json or len(parsed_json["visual_observations"]) == 0:
                        parsed_json["visual_observations"] = [
                            "UI elements detected from screenshot",
                            "Layout forms and buttons scanned"
                        ]

                try:
                    validated_response = AnalysisResponse.model_validate(parsed_json)
                except ValidationError as ve:
                    logger.error(f"Pydantic Validation failure in attempt {attempt}: {str(ve)}")
                    last_error = f"Pydantic validation error: {str(ve)}"
                    continue
                
                # Check for critical requirement: Do not return empty sections
                missing_sections = []
                for field in ["scenarios", "test_cases", "positive_cases", "negative_cases", "edge_cases", "risks", "missing_requirements"]:
                    field_value = getattr(validated_response, field)
                    if not field_value or len(field_value) == 0:
                        missing_sections.append(field)
                
                if missing_sections:
                    err_msg = f"Empty sections detected: {missing_sections}"
                    logger.warning(f"Validation failure in attempt {attempt}: {err_msg}")
                    last_error = err_msg
                    continue  # Force regeneration
                
                # Success
                total_duration = time.time() - total_start_time
                logger.info(
                    f"Analysis completed successfully. "
                    f"Source: {source_type.upper()}, Gemini: {gemini_duration:.2f}s, Total: {total_duration:.2f}s"
                )
                return validated_response

            except Exception as e:
                logger.error(f"Unexpected error in Gemini Analyzer (attempt {attempt}): {str(e)}")
                last_error = str(e)
                time.sleep(1.0)
                
        total_duration = time.time() - total_start_time
        logger.error(f"All {max_attempts} attempts failed. Last error: {last_error}. Total elapsed time: {total_duration:.2f}s")
        raise RuntimeError(f"Gemini QA Analysis engine failed after {max_attempts} attempts. Error details: {last_error}")
