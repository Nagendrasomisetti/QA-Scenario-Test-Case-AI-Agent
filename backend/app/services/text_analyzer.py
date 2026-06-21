import logging

logger = logging.getLogger("QA_Agent_Text_Analyzer")

class TextAnalyzer:
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Cleans and normalizes text requirement inputs.
        """
        if not text:
            return ""
        
        # Clean double blank spaces/lines
        lines = [line.strip() for line in text.splitlines()]
        cleaned_lines = [line for line in lines if line]
        
        final_text = "\n".join(cleaned_lines)
        logger.info(f"Text requirements prepared. Character length: {len(final_text)}")
        return final_text
