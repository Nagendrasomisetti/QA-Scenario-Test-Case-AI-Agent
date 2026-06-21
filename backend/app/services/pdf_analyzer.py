import io
import logging
import pdfplumber
from pypdf import PdfReader

logger = logging.getLogger("QA_Agent_PDF_Analyzer")

class PdfAnalyzer:
    @staticmethod
    def extract_text(pdf_bytes: bytes) -> tuple[str, int, int]:
        """
        Extracts text from PDF bytes.
        Returns a tuple of (extracted_text, page_count, character_count).
        """
        text_content = []
        page_count = 0
        char_count = 0
        
        # Method A: Try pdfplumber
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
                    else:
                        logger.warning(f"pdfplumber extracted empty text on page {i+1}")
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {str(e)}. Falling back to PyPDF...")
            text_content = []
            
        # Method B: Fallback/Alternative using PyPDF
        if not text_content:
            try:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                page_count = len(reader.pages)
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
            except Exception as e:
                logger.error(f"PyPDF extraction failed: {str(e)}")
                raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")
                
        # Clean and join text
        raw_text = "\n\n".join(text_content).strip()
        
        # Basic cleanup: remove double spacing, normalize line breaks
        cleaned_lines = []
        for line in raw_text.splitlines():
            line_stripped = line.strip()
            if line_stripped:
                cleaned_lines.append(line_stripped)
        
        final_text = "\n".join(cleaned_lines)
        char_count = len(final_text)
        
        logger.info(f"PDF extraction complete: {page_count} pages, {char_count} characters extracted.")
        return final_text, page_count, char_count
