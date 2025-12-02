"""
Text extraction from various file formats
Supports PDF, DOCX, DOC, TXT
"""
import io
import logging
from typing import Tuple, Optional
from pathlib import Path

# PDF extraction
try:
    import pdfplumber
    from PyPDF2 import PdfReader
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logging.warning("PDF libraries not installed. PDF extraction will fail.")

# DOCX extraction
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logging.warning("python-docx not installed. DOCX extraction will fail.")

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_content: bytes) -> Tuple[str, int]:
    """
    Extract text from PDF file
    
    Args:
        file_content: PDF file content as bytes
    
    Returns:
        Tuple of (extracted_text, character_count)
    
    Raises:
        ValueError: If PDF extraction fails
    """
    if not PDF_AVAILABLE:
        raise ValueError("PDF extraction libraries not available")
    
    text = ""
    
    try:
        # Try pdfplumber first (better extraction)
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        if not text.strip():
            # Fallback to PyPDF2
            pdf_reader = PdfReader(io.BytesIO(file_content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    if not text.strip():
        raise ValueError("No text could be extracted from PDF")
    
    return text.strip(), len(text.strip())


def extract_text_from_docx(file_content: bytes) -> Tuple[str, int]:
    """
    Extract text from DOCX file
    
    Args:
        file_content: DOCX file content as bytes
    
    Returns:
        Tuple of (extracted_text, character_count)
    
    Raises:
        ValueError: If DOCX extraction fails
    """
    if not DOCX_AVAILABLE:
        raise ValueError("DOCX extraction library not available")
    
    try:
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        if not text.strip():
            raise ValueError("No text found in DOCX")
        
        return text.strip(), len(text.strip())
    
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")


def extract_text_from_txt(file_content: bytes) -> Tuple[str, int]:
    """
    Extract text from TXT file
    
    Args:
        file_content: TXT file content as bytes
    
    Returns:
        Tuple of (extracted_text, character_count)
    
    Raises:
        ValueError: If TXT extraction fails
    """
    try:
        # Try UTF-8 first
        text = file_content.decode('utf-8')
    except UnicodeDecodeError:
        try:
            # Fallback to Latin-1
            text = file_content.decode('latin-1')
        except UnicodeDecodeError as e:
            logger.error(f"TXT decoding failed: {e}")
            raise ValueError(f"Failed to decode text file: {str(e)}")
    
    if not text.strip():
        raise ValueError("Text file is empty")
    
    return text.strip(), len(text.strip())


def extract_text_from_file(
    file_content: bytes,
    file_extension: str
) -> Tuple[str, int, int]:
    """
    Extract text from uploaded file based on extension
    
    Args:
        file_content: File content as bytes
        file_extension: File extension (e.g., ".pdf", ".docx")
    
    Returns:
        Tuple of (text, char_count, word_count)
    
    Raises:
        ValueError: If extraction fails or unsupported format
    """
    ext = file_extension.lower()
    
    try:
        if ext == ".pdf":
            text, char_count = extract_text_from_pdf(file_content)
        elif ext in [".docx", ".doc"]:
            text, char_count = extract_text_from_docx(file_content)
        elif ext == ".txt":
            text, char_count = extract_text_from_txt(file_content)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
        
        # Calculate word count
        word_count = len(text.split())
        
        logger.info(f"✅ Extracted {char_count} chars, {word_count} words from {ext} file")
        
        return text, char_count, word_count
    
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during text extraction: {e}")
        raise ValueError(f"Failed to extract text: {str(e)}")
