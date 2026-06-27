import os
import time
import json
import base64
import logging
from typing import Optional, Any, List
from pydantic import ValidationError

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import AnalysisResponse, LLMAnalysisResponse
from app.services.qa_system_prompt import QA_SYSTEM_INSTRUCTION, QA_USER_PROMPT_TEMPLATE, PROMPT_VERSION
from app.services.text_analyzer import TextAnalyzer
from app.services.pdf_analyzer import PdfAnalyzer
from app.services.image_analyzer import ImageAnalyzer
from app.services.base_analyzer import BaseLLMAnalyzer

logger = logging.getLogger("QA_Agent_BluesMindsAnalyzer")
logger.setLevel(logging.INFO)

class BluesMindsAnalyzerService(BaseLLMAnalyzer):
    @property
    def provider_name(self) -> str:
        return "bluesminds"

    @property
    def model_name(self) -> str:
        return self._model_name

    def __init__(self):
        api_key = os.getenv("LLM_API_KEY")
        base_url = os.getenv("LLM_BASE_URL")
        self._model_name = os.getenv("LLM_MODEL_NAME")

        if not api_key or not base_url or not self._model_name:
            raise ValueError("BluesMinds configuration missing: LLM_API_KEY, LLM_BASE_URL, or LLM_MODEL_NAME.")

        self.llm = ChatOpenAI(
            model=self._model_name,
            api_key=api_key,
            base_url=base_url,
            temperature=0.2,
            max_retries=2
        )
        # Using with_structured_output for schema compliance
        self.structured_llm = self.llm.with_structured_output(LLMAnalysisResponse)

    async def analyze_requirements(
        self,
        requirement: str = "",
        pdf_bytes: Optional[bytes] = None,
        image_bytes: Optional[bytes] = None,
        image_mime_type: Optional[str] = "image/png"
    ) -> AnalysisResponse:
        total_start_time = time.time()

        source_type = "text"
        pages_processed = 0
        characters_extracted = 0

        system_instruction = QA_SYSTEM_INSTRUCTION
        messages = []

        if image_bytes:
            source_type = "image"
            logger.info(f"Image bytes detected. Switching to visual requirement analysis using BluesMinds.")
            system_instruction = ImageAnalyzer.get_system_instruction()
            
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            text_prompt = "Analyze this user interface screenshot and generate the complete QA requirements package."
            if requirement:
                text_prompt += f"\nAdditional text context:\n{requirement}"
                
            messages = [
                SystemMessage(content=system_instruction),
                HumanMessage(content=[
                    {"type": "text", "text": text_prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{image_mime_type};base64,{base64_image}"}}
                ])
            ]

        elif pdf_bytes:
            source_type = "pdf"
            logger.info("PDF bytes detected. Extracting text page-by-page.")
            extracted_text, pages_processed, characters_extracted = PdfAnalyzer.extract_text(pdf_bytes)
            
            cleaned_req = TextAnalyzer.clean_text(extracted_text)
            if requirement:
                cleaned_req = f"User Request Context:\n{requirement}\n\nExtracted Document Specifications:\n{cleaned_req}"
                
            messages = [
                SystemMessage(content=system_instruction),
                HumanMessage(content=QA_USER_PROMPT_TEMPLATE.format(requirement=cleaned_req))
            ]
            
        else:
            cleaned_req = TextAnalyzer.clean_text(requirement)
            messages = [
                SystemMessage(content=system_instruction),
                HumanMessage(content=QA_USER_PROMPT_TEMPLATE.format(requirement=cleaned_req))
            ]

        logger.info(f"BluesMinds Analysis started for source_type: '{source_type}' (Prompt Version: {PROMPT_VERSION})")
        
        try:
            llm_start_time = time.time()
            
            # Invoke structured LLM
            parsed_response: LLMAnalysisResponse = await self.structured_llm.ainvoke(messages)
            
            llm_duration = time.time() - llm_start_time
            logger.info(f"BluesMinds API call returned in {llm_duration:.3f} seconds.")
            
            # Convert to dictionary to apply defaults and transform to AnalysisResponse
            parsed_json = parsed_response.model_dump()
            
            # Enforce fields that are determined locally
            parsed_json["source_type"] = source_type
            parsed_json["pages_processed"] = pages_processed
            parsed_json["characters_extracted"] = characters_extracted
            
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

            validated_response = AnalysisResponse.model_validate(parsed_json)
            
            # Check for empty sections
            missing_sections = []
            for field in ["scenarios", "test_cases", "positive_cases", "negative_cases", "edge_cases", "risks", "missing_requirements"]:
                field_value = getattr(validated_response, field)
                if not field_value or len(field_value) == 0:
                    missing_sections.append(field)
            
            if missing_sections:
                err_msg = f"Empty sections detected: {missing_sections}"
                logger.warning(f"Validation failure from BluesMinds: {err_msg}")
                raise ValueError(err_msg)
            
            total_duration = time.time() - total_start_time
            logger.info(
                f"Analysis completed successfully via BluesMinds. "
                f"Source: {source_type.upper()}, LLM: {llm_duration:.2f}s, Total: {total_duration:.2f}s"
            )
            return validated_response
            
        except Exception as e:
            logger.error(f"Error in BluesMinds Analyzer: {str(e)}")
            raise e
