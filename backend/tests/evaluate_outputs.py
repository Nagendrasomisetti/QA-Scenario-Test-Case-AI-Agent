import os
import sys
import asyncio
import time
from dotenv import load_dotenv

# Add backend app directory to path so imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.analyzer_factory import AnalyzerFactory
from app.models.schemas import AnalysisResponse

# Load environment variables
load_dotenv()

TEST_CASES = {
    "Login System": (
        "Implement a login system requiring username/password validation. "
        "Passwords must be at least 8 characters with one special character. "
        "Lock accounts temporarily for 15 minutes after 5 consecutive failed logins."
    )
}

async def run_evaluation():
    print("=" * 70)
    print("           QA SCENARIO & TEST CASE AI AGENT EVALUATION RUN (PHASE 3)")
    print("=" * 70)
    
    provider_chain = os.getenv("LLM_PROVIDER_CHAIN", "gemini")
    print(f"[+] Provider chain configured as: {provider_chain}")
    print("[+] Running test suite...")
    
    all_passed = True
    
    for name, requirement in TEST_CASES.items():
        print(f"\n[~] Testing System: {name}")
        print(f"    Requirement: {requirement[:80]}...")
        
        start_time = time.time()
        try:
            # Call analyzer
            result: AnalysisResponse = await AnalyzerFactory.analyze_requirements(requirement)
            duration = time.time() - start_time
            
            print(f"    [+] Response received in {duration:.2f}s")
            
            # Validation assertions
            errors = []
            
            # Phase 3 schema checks
            if result.source_type != "text":
                errors.append(f"Expected source_type 'text', got '{result.source_type}'")
            if result.confidence_score <= 0.0 or result.confidence_score > 1.0:
                errors.append(f"Invalid confidence score: {result.confidence_score}")
            if result.pages_processed != 0:
                errors.append(f"Expected pages_processed to be 0 for text, got {result.pages_processed}")
            if result.characters_extracted != 0:
                errors.append(f"Expected characters_extracted to be 0 for text, got {result.characters_extracted}")
            if len(result.visual_observations) > 0:
                errors.append(f"Expected empty visual_observations for text, got {result.visual_observations}")
                
            # 1. Check sections
            sections = {
                "Scenarios": result.scenarios,
                "Test Cases": result.test_cases,
                "Positive Cases": result.positive_cases,
                "Negative Cases": result.negative_cases,
                "Edge Cases": result.edge_cases,
                "Risks": result.risks,
                "Missing Requirements": result.missing_requirements
            }
            
            for section_name, items in sections.items():
                if not items:
                    errors.append(f"Section '{section_name}' is empty")
                else:
                    print(f"        - {section_name}: {len(items)} items")
            
            # 2. Check IDs prefixes
            id_prefixes = {
                "scenarios": ("TS-", "SC-"),
                "test_cases": ("TC-",),
                "positive_cases": ("PC-",),
                "negative_cases": ("NC-",),
                "edge_cases": ("EC-",),
                "risks": ("RK-", "RS-"),
                "missing_requirements": ("MR-",)
            }
            
            for list_name, prefixes in id_prefixes.items():
                items = getattr(result, list_name)
                for idx, item in enumerate(items):
                    item_id = str(item.id)
                    if not any(item_id.upper().startswith(p) for p in prefixes):
                        errors.append(f"ID mismatch in {list_name}[{idx}]: ID '{item_id}' does not start with {prefixes}")
            
            if not errors:
                print(f"    [✔] PASSED - {name} meets all validation criteria.")
            else:
                all_passed = False
                print(f"    [❌] FAILED - {name} has validation issues:")
                for err in errors:
                    print(f"        * {err}")
                    
        except Exception as e:
            all_passed = False
            duration = time.time() - start_time
            print(f"    [❌] FAILED - Exception raised: {str(e)} (Time: {duration:.2f}s)")
            
    print("\n" + "=" * 70)
    if all_passed:
        print("    EVALUATION SUCCESS: All test systems successfully validated!")
    else:
        print("    EVALUATION FAILURE: Some systems failed validation checks.")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_evaluation())
