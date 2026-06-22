from pydantic import BaseModel
from typing import List, Optional

class Scenario(BaseModel):
    id: str
    title: str
    description: str

class TestCase(BaseModel):
    id: str
    scenario_id: str
    title: str
    preconditions: str
    steps: List[str]
    expected_result: str

class PositiveCase(BaseModel):
    id: str
    title: str
    steps: List[str]
    expected_result: str

class NegativeCase(BaseModel):
    id: str
    title: str
    steps: List[str]
    expected_result: str

class EdgeCase(BaseModel):
    id: str
    title: str
    steps: List[str]
    expected_result: str

class Risk(BaseModel):
    id: str
    description: str
    impact: str  # High, Medium, Low
    mitigation: str

class MissingRequirement(BaseModel):
    id: str
    description: str
    impact: str  # High, Medium, Low

class GeminiAnalysisResponse(BaseModel):
    source_type: str  # "text" | "pdf" | "image"
    confidence_score: float  # e.g., 0.92
    pages_processed: int  # 0 if not PDF
    characters_extracted: int  # 0 if not PDF or text
    visual_observations: List[str]  # Empty if not image
    scenarios: List[Scenario]
    test_cases: List[TestCase]
    positive_cases: List[PositiveCase]
    negative_cases: List[NegativeCase]
    edge_cases: List[EdgeCase]
    risks: List[Risk]
    missing_requirements: List[MissingRequirement]

class AnalysisResponse(BaseModel):
    id: Optional[int] = None  # Database primary key (populated when persisted)
    source_type: str  # "text" | "pdf" | "image"
    confidence_score: float  # e.g., 0.92
    pages_processed: int  # 0 if not PDF
    characters_extracted: int  # 0 if not PDF or text
    visual_observations: List[str]  # Empty if not image
    scenarios: List[Scenario]
    test_cases: List[TestCase]
    positive_cases: List[PositiveCase]
    negative_cases: List[NegativeCase]
    edge_cases: List[EdgeCase]
    risks: List[Risk]
    missing_requirements: List[MissingRequirement]
