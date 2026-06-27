from typing import Optional
from abc import ABC, abstractmethod
from app.models.schemas import AnalysisResponse

class BaseLLMAnalyzer(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @abstractmethod
    async def analyze_requirements(
        self,
        requirement: str = "",
        pdf_bytes: Optional[bytes] = None,
        image_bytes: Optional[bytes] = None,
        image_mime_type: Optional[str] = "image/png"
    ) -> AnalysisResponse:
        """
        Analyzes the given requirements, PDF, or image and returns an AnalysisResponse.
        """
        pass
