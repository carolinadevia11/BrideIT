"""
Document Parser Service for Divorce/Custody Agreements

This service extracts text from PDF/DOC files and uses AI to parse
structured information from custody agreements.

To use:
1. Install dependencies: pip install pdfplumber python-docx openai
2. Set OPENAI_API_KEY in environment variables
3. Import and use: parser = DocumentParser(); result = await parser.parse_document(file_bytes, file_type)
"""

import base64
import io
import json
import os
from typing import Dict, Any, Optional
import re

# Optional imports - install as needed
try:
    import pdfplumber
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("⚠️  pdfplumber not installed. PDF parsing will not work. Install with: pip install pdfplumber")

try:
    from docx import Document
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False
    print("⚠️  python-docx not installed. DOCX parsing will not work. Install with: pip install python-docx")

try:
    from openai import AsyncOpenAI
    OPENAI_SUPPORT = True
except ImportError:
    OPENAI_SUPPORT = False
    print("⚠️  openai not installed. AI parsing will not work. Install with: pip install openai")


class DocumentParser:
    """Parse divorce/custody agreement documents using AI."""
    
    def __init__(self, ai_provider: str = "openai", api_key: Optional[str] = None):
        """
        Initialize document parser.
        
        Args:
            ai_provider: "openai", "anthropic", "google", or "local"
            api_key: API key for the chosen provider (or use env vars)
        """
        self.ai_provider = ai_provider
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        
        if ai_provider == "openai" and OPENAI_SUPPORT and self.api_key:
            self.openai_client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.openai_client = None
    
    def extract_text_from_file(self, file_content: bytes, file_type: str) -> str:
        """
        Extract text from PDF, DOCX, or TXT files.
        
        Args:
            file_content: Raw file bytes
            file_type: File extension (pdf, docx, doc, txt)
            
        Returns:
            Extracted text content
        """
        file_type_lower = file_type.lower().replace('.', '')
        
        if file_type_lower == 'pdf':
            if not PDF_SUPPORT:
                raise ValueError("PDF support not available. Install pdfplumber: pip install pdfplumber")
            return self._extract_from_pdf(file_content)
        elif file_type_lower in ['doc', 'docx']:
            if not DOCX_SUPPORT:
                raise ValueError("DOCX support not available. Install python-docx: pip install python-docx")
            return self._extract_from_docx(file_content)
        elif file_type_lower == 'txt':
            return file_content.decode('utf-8', errors='ignore')
        else:
            raise ValueError(f"Unsupported file type: {file_type}. Supported: pdf, docx, doc, txt")
    
    def _extract_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF using pdfplumber."""
        text_parts = []
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}")
        
        extracted = "\n\n".join(text_parts)
        if not extracted or len(extracted.strip()) < 50:
            raise ValueError("Could not extract sufficient text from PDF. File may be scanned/image-based.")
        return extracted
    
    def _extract_from_docx(self, file_content: bytes) -> str:
        """Extract text from Word documents."""
        try:
            doc = Document(io.BytesIO(file_content))
            text_parts = [paragraph.text for paragraph in doc.paragraphs]
            extracted = "\n".join(text_parts)
            if not extracted or len(extracted.strip()) < 50:
                raise ValueError("Could not extract sufficient text from document.")
            return extracted
        except Exception as e:
            raise ValueError(f"Error extracting text from DOCX: {str(e)}")
    
    async def parse_with_ai(self, text: str) -> Dict[str, Any]:
        """
        Parse document text using AI to extract structured data.
        
        Args:
            text: Extracted text from document
            
        Returns:
            Dictionary with parsed custody agreement information
        """
        if self.ai_provider == "openai" and self.openai_client:
            return await self._parse_with_openai(text)
        else:
            # Fallback to pattern matching if AI not available
            return self._parse_with_patterns(text)
    
    def _build_parsing_prompt(self, text: str) -> str:
        """Build a prompt for AI to extract custody agreement information."""
        # Limit text to avoid token limits (keep first 8000 chars)
        text_sample = text[:8000] if len(text) > 8000 else text
        
        return f"""Analyze the following divorce/custody agreement document and extract key information.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):

{{
    "custodyArrangement": "50-50" | "primary-secondary" | "custom",
    "custodySchedule": "description of schedule (e.g., week-on/week-off, 2-2-3, alternating weeks)",
    "holidaySchedule": "description of holiday arrangements",
    "decisionMaking": "joint" | "sole" | "split",
    "expenseSplit": {{
        "ratio": "50-50" | "60-40" | "70-30" | "custom",
        "parent1": 50,
        "parent2": 50
    }},
    "childSupport": {{
        "amount": 0,
        "payer": "parent1" | "parent2" | "none",
        "frequency": "monthly" | "bi-weekly" | "weekly" | "none"
    }},
    "extractedTerms": [
        {{
            "term": "Custody Split",
            "value": "50/50 Equal Time",
            "confidence": 0.9
        }}
    ],
    "startDate": "YYYY-MM-DD" or null,
    "endDate": "YYYY-MM-DD" or null,
    "confidence": 0.85
}}

Document text:
{text_sample}
"""
    
    async def _parse_with_openai(self, text: str) -> Dict[str, Any]:
        """Parse using OpenAI GPT-4."""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized. Check API key.")
        
        prompt = self._build_parsing_prompt(text)
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o",  # or "gpt-4-turbo" for better JSON
                messages=[
                    {
                        "role": "system",
                        "content": "You are a legal document parser specializing in custody agreements. Extract structured information and return ONLY valid JSON, no markdown formatting, no code blocks."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1  # Lower temperature for more consistent parsing
            )
            
            content = response.choices[0].message.content
            # Remove any markdown code blocks if present
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            content = content.strip()
            
            parsed = json.loads(content)
            return parsed
            
        except json.JSONDecodeError as e:
            print(f"⚠️  Failed to parse AI response as JSON: {e}")
            # Fallback to pattern matching
            return self._parse_with_patterns(text)
        except Exception as e:
            print(f"⚠️  OpenAI API error: {e}")
            # Fallback to pattern matching
            return self._parse_with_patterns(text)
    
    def _parse_with_patterns(self, text: str) -> Dict[str, Any]:
        """
        Fallback pattern matching parser (basic implementation).
        Used when AI is not available or fails.
        """
        text_lower = text.lower()
        parsed_data = {
            "parsed": True,
            "confidence": 0.6,  # Lower confidence for pattern matching
            "extractedTerms": [],
            "custodyArrangement": "custom",
            "custodySchedule": None,
            "holidaySchedule": None,
            "decisionMaking": "joint",
            "expenseSplit": {"ratio": "50-50", "parent1": 50, "parent2": 50},
            "childSupport": {"amount": 0, "payer": "none", "frequency": "none"},
            "startDate": None,
            "endDate": None
        }
        
        # Check for custody split patterns
        if re.search(r'50\s*[/-]\s*50|equal\s+time|fifty\s+fifty', text_lower):
            parsed_data["custodyArrangement"] = "50-50"
            parsed_data["extractedTerms"].append({
                "term": "Custody Split",
                "value": "50/50 Equal Time",
                "confidence": 0.9
            })
            parsed_data["expenseSplit"] = {"ratio": "50-50", "parent1": 50, "parent2": 50}
        elif re.search(r'primary.*secondary|primary\s+custody', text_lower):
            parsed_data["custodyArrangement"] = "primary-secondary"
            parsed_data["extractedTerms"].append({
                "term": "Custody Split",
                "value": "Primary/Secondary",
                "confidence": 0.8
            })
            parsed_data["expenseSplit"] = {"ratio": "60-40", "parent1": 60, "parent2": 40}
        
        # Check for decision-making terms
        if re.search(r'joint\s+legal\s+custody', text_lower):
            parsed_data["decisionMaking"] = "joint"
            parsed_data["extractedTerms"].append({
                "term": "Legal Custody",
                "value": "Joint Legal Custody",
                "confidence": 0.95
            })
        elif re.search(r'sole\s+legal\s+custody', text_lower):
            parsed_data["decisionMaking"] = "sole"
        
        # Check for holiday scheduling
        if re.search(r'alternat.*holiday|holiday.*alternat', text_lower):
            parsed_data["holidaySchedule"] = "Alternating holidays"
            parsed_data["extractedTerms"].append({
                "term": "Holiday Schedule",
                "value": "Alternating Holidays",
                "confidence": 0.85
            })
        
        # Check for custody schedule patterns
        if re.search(r'week.*on.*week.*off|alternat.*week', text_lower):
            parsed_data["custodySchedule"] = "Week-on/week-off"
        elif re.search(r'2\s*-\s*2\s*-\s*3|two.*two.*three', text_lower):
            parsed_data["custodySchedule"] = "2-2-3 schedule"
        
        return parsed_data
    
    async def parse_document(self, file_content: bytes, file_type: str) -> Dict[str, Any]:
        """
        Complete parsing pipeline: extract text and parse with AI.
        
        Args:
            file_content: Raw file bytes
            file_type: File extension
            
        Returns:
            Parsed custody agreement data
        """
        # Step 1: Extract text
        extracted_text = self.extract_text_from_file(file_content, file_type)
        
        # Step 2: Parse with AI (or fallback to patterns)
        parsed_data = await self.parse_with_ai(extracted_text)
        
        return parsed_data

