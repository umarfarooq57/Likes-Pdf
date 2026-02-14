"""
AI Engine
Document analysis, summarization, and chat using LLM APIs
Supports OpenAI, Anthropic, and local models
"""

import os
import re
import json
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime

# Try to import OpenAI
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    openai = None
    OPENAI_AVAILABLE = False

# Try to import anthropic
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    anthropic = None
    ANTHROPIC_AVAILABLE = False

# Try to import PyMuPDF for text extraction
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    fitz = None
    PYMUPDF_AVAILABLE = False


class AIEngine:
    """AI-powered document analysis engine"""
    
    # Document classification categories
    DOCUMENT_CATEGORIES = [
        "invoice", "receipt", "contract", "resume", "report",
        "form", "letter", "presentation", "legal", "financial",
        "medical", "technical", "academic", "other"
    ]
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        model: str = "gpt-3.5-turbo"
    ):
        """
        Initialize AI engine.
        
        Args:
            openai_api_key: OpenAI API key
            anthropic_api_key: Anthropic API key
            model: Default model to use
        """
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        self.model = model
        
        if self.openai_api_key and OPENAI_AVAILABLE:
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None
        
        if self.anthropic_api_key and ANTHROPIC_AVAILABLE:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
        else:
            self.anthropic_client = None
    
    def _check_llm_available(self):
        """Check if any LLM is available"""
        if not self.openai_client and not self.anthropic_client:
            raise RuntimeError("No LLM API configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.")
    
    def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.3
    ) -> Tuple[str, int]:
        """
        Call LLM with the given prompts.
        
        Returns:
            Tuple of (response_text, tokens_used)
        """
        self._check_llm_available()
        
        if self.openai_client:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            return text, tokens
        
        elif self.anthropic_client:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return text, tokens
        
        raise RuntimeError("No LLM available")
    
    @staticmethod
    def extract_text_from_pdf(pdf_path: Path, max_pages: int = 50) -> str:
        """Extract text content from a PDF"""
        if not PYMUPDF_AVAILABLE:
            raise RuntimeError("PyMuPDF is required for PDF text extraction")
        
        doc = fitz.open(str(pdf_path))
        text_parts = []
        
        for i, page in enumerate(doc):
            if i >= max_pages:
                text_parts.append(f"\n[... Remaining {len(doc) - max_pages} pages truncated ...]")
                break
            text = page.get_text()
            if text.strip():
                text_parts.append(f"--- Page {i + 1} ---\n{text}")
        
        doc.close()
        return "\n\n".join(text_parts)
    
    def summarize_document(
        self,
        text: str,
        length: str = "medium",
        style: str = "bullet"
    ) -> Dict[str, Any]:
        """
        Summarize document content.
        
        Args:
            text: Document text content
            length: short, medium, or long
            style: bullet, paragraph, or executive
            
        Returns:
            Summary result
        """
        length_instructions = {
            "short": "in 2-3 sentences",
            "medium": "in about 5-7 key points",
            "long": "in a comprehensive manner with all important details"
        }
        
        style_instructions = {
            "bullet": "Use bullet points for clarity.",
            "paragraph": "Write in clear paragraphs.",
            "executive": "Write as an executive summary suitable for business leaders."
        }
        
        system_prompt = """You are an expert document analyst. Your task is to summarize documents accurately and concisely."""
        
        user_prompt = f"""Please summarize the following document {length_instructions.get(length, length_instructions['medium'])}.
{style_instructions.get(style, style_instructions['bullet'])}

Document:
{text[:15000]}  # Limit context length

Provide a clear, accurate summary."""
        
        response, tokens = self._call_llm(system_prompt, user_prompt)
        
        return {
            "summary": response,
            "length": length,
            "style": style,
            "tokens_used": tokens,
        }
    
    def classify_document(self, text: str) -> Dict[str, Any]:
        """
        Classify document into categories.
        
        Args:
            text: Document text content
            
        Returns:
            Classification result with confidence
        """
        categories_str = ", ".join(self.DOCUMENT_CATEGORIES)
        
        system_prompt = """You are a document classification expert. Classify documents into the most appropriate category."""
        
        user_prompt = f"""Classify the following document into ONE of these categories:
{categories_str}

Document (first 3000 characters):
{text[:3000]}

Respond in JSON format:
{{"category": "category_name", "confidence": 0.0-1.0, "reasoning": "brief explanation"}}"""
        
        response, tokens = self._call_llm(system_prompt, user_prompt, max_tokens=200)
        
        # Parse JSON response
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[^}]+\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"category": "other", "confidence": 0.5, "reasoning": response}
        except json.JSONDecodeError:
            result = {"category": "other", "confidence": 0.5, "reasoning": response}
        
        result["tokens_used"] = tokens
        return result
    
    def extract_keywords(
        self,
        text: str,
        max_keywords: int = 20
    ) -> Dict[str, Any]:
        """
        Extract important keywords and phrases.
        
        Args:
            text: Document text content
            max_keywords: Maximum number of keywords
            
        Returns:
            List of keywords with relevance scores
        """
        system_prompt = """You are a keyword extraction expert. Extract the most important and relevant keywords from documents."""
        
        user_prompt = f"""Extract the {max_keywords} most important keywords and key phrases from this document.
Rate each keyword's relevance from 0.0 to 1.0.

Document (first 5000 characters):
{text[:5000]}

Respond in JSON format:
{{"keywords": [{{"term": "keyword", "relevance": 0.0-1.0}}]}}"""
        
        response, tokens = self._call_llm(system_prompt, user_prompt, max_tokens=500)
        
        # Parse response
        try:
            json_match = re.search(r'\{[^}]*"keywords"[^}]*\[.*?\]\s*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"keywords": []}
        except json.JSONDecodeError:
            result = {"keywords": []}
        
        result["tokens_used"] = tokens
        return result
    
    def analyze_resume(self, text: str) -> Dict[str, Any]:
        """
        Analyze a resume/CV document.
        
        Args:
            text: Resume text content
            
        Returns:
            Structured resume data
        """
        system_prompt = """You are an expert HR analyst and resume parser. Extract structured information from resumes accurately."""
        
        user_prompt = f"""Analyze this resume and extract structured information.

Resume:
{text[:8000]}

Respond in JSON format with these fields:
{{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country",
    "summary": "professional summary",
    "skills": ["skill1", "skill2"],
    "experience": [
        {{"title": "Job Title", "company": "Company", "duration": "dates", "description": "brief description"}}
    ],
    "education": [
        {{"degree": "Degree", "institution": "School", "year": "year"}}
    ],
    "certifications": ["cert1", "cert2"],
    "languages": ["language1", "language2"]
}}"""
        
        response, tokens = self._call_llm(system_prompt, user_prompt, max_tokens=1500)
        
        # Parse response
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"error": "Could not parse resume"}
        except json.JSONDecodeError:
            result = {"error": "Could not parse resume", "raw_response": response}
        
        result["tokens_used"] = tokens
        return result
    
    def analyze_contract(self, text: str) -> Dict[str, Any]:
        """
        Analyze a contract document.
        
        Args:
            text: Contract text content
            
        Returns:
            Structured contract analysis
        """
        system_prompt = """You are an expert legal analyst. Analyze contracts and extract key terms, obligations, and risks."""
        
        user_prompt = f"""Analyze this contract and extract key information.

Contract:
{text[:10000]}

Respond in JSON format:
{{
    "contract_type": "type of contract",
    "parties": [
        {{"name": "Party name", "role": "role in contract"}}
    ],
    "effective_date": "date or null",
    "expiration_date": "date or null",
    "key_terms": [
        {{"term": "term name", "description": "brief description"}}
    ],
    "obligations": [
        {{"party": "party name", "obligation": "description"}}
    ],
    "payment_terms": "payment details or null",
    "termination_clauses": ["clause1", "clause2"],
    "potential_risks": ["risk1", "risk2"],
    "summary": "brief contract summary"
}}"""
        
        response, tokens = self._call_llm(system_prompt, user_prompt, max_tokens=2000)
        
        # Parse response
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"error": "Could not parse contract"}
        except json.JSONDecodeError:
            result = {"error": "Could not parse contract", "raw_response": response}
        
        result["tokens_used"] = tokens
        return result
    
    def suggest_filename(self, text: str) -> Dict[str, Any]:
        """
        Suggest a descriptive filename based on document content.
        
        Args:
            text: Document text content
            
        Returns:
            Suggested filename and alternatives
        """
        system_prompt = """You are a document organization expert. Suggest clear, descriptive filenames for documents."""
        
        user_prompt = f"""Based on this document content, suggest a clear, descriptive filename.
The filename should be:
- Descriptive but concise (max 60 characters)
- Use underscores instead of spaces
- Include date if relevant (YYYY-MM-DD format)
- Follow business naming conventions

Document (first 2000 characters):
{text[:2000]}

Respond in JSON format:
{{
    "suggested_filename": "filename_without_extension",
    "alternatives": ["alt1", "alt2", "alt3"],
    "document_date": "YYYY-MM-DD or null",
    "document_type": "type"
}}"""
        
        response, tokens = self._call_llm(system_prompt, user_prompt, max_tokens=300)
        
        # Parse response
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"suggested_filename": "document", "alternatives": []}
        except json.JSONDecodeError:
            result = {"suggested_filename": "document", "alternatives": []}
        
        result["tokens_used"] = tokens
        return result
    
    def chat_with_document(
        self,
        text: str,
        question: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Answer questions about document content.
        
        Args:
            text: Document text content
            question: User's question
            conversation_history: Previous messages for context
            
        Returns:
            Answer and referenced sections
        """
        system_prompt = f"""You are a helpful document assistant. Answer questions based ONLY on the provided document content.
If the answer is not in the document, say so clearly.

Document content:
{text[:12000]}"""
        
        # Build conversation context
        if conversation_history:
            history_text = "\n".join([
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in conversation_history[-5:]  # Last 5 messages
            ])
            user_prompt = f"""Previous conversation:
{history_text}

Current question: {question}

Answer based on the document content. Cite specific sections when possible."""
        else:
            user_prompt = f"""Question: {question}

Answer based on the document content. Cite specific sections when possible."""
        
        response, tokens = self._call_llm(system_prompt, user_prompt)
        
        # Try to identify referenced pages/sections
        referenced_sections = []
        page_refs = re.findall(r'page\s*(\d+)', response.lower())
        if page_refs:
            referenced_sections = list(set(int(p) for p in page_refs))
        
        return {
            "answer": response,
            "referenced_sections": referenced_sections,
            "tokens_used": tokens,
            "question": question,
        }
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract named entities (people, organizations, dates, etc.).
        
        Args:
            text: Document text content
            
        Returns:
            Dictionary of extracted entities
        """
        system_prompt = """You are a named entity recognition expert. Extract all named entities from documents."""
        
        user_prompt = f"""Extract all named entities from this document.

Document (first 5000 characters):
{text[:5000]}

Respond in JSON format:
{{
    "people": ["name1", "name2"],
    "organizations": ["org1", "org2"],
    "locations": ["location1", "location2"],
    "dates": ["date1", "date2"],
    "monetary_values": ["$100", "€50"],
    "percentages": ["10%", "25%"],
    "emails": ["email1@example.com"],
    "phone_numbers": ["+1-234-567-8900"],
    "urls": ["https://example.com"]
}}"""
        
        response, tokens = self._call_llm(system_prompt, user_prompt, max_tokens=800)
        
        # Parse response
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {}
        except json.JSONDecodeError:
            result = {}
        
        result["tokens_used"] = tokens
        return result


class AIEngineLocal:
    """
    Fallback AI engine using local/simple methods when no LLM API is available.
    Uses keyword extraction, regex patterns, and heuristics.
    """
    
    @staticmethod
    def extract_keywords_simple(text: str, max_keywords: int = 20) -> List[Dict[str, Any]]:
        """Extract keywords using simple frequency analysis"""
        import re
        from collections import Counter
        
        # Clean and tokenize
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Remove common stop words
        stop_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
            'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been',
            'were', 'will', 'when', 'who', 'what', 'this', 'that', 'with',
            'from', 'they', 'would', 'there', 'their', 'which', 'about',
        }
        words = [w for w in words if w not in stop_words]
        
        # Count frequencies
        word_counts = Counter(words)
        most_common = word_counts.most_common(max_keywords)
        
        # Normalize to 0-1 scale
        max_count = most_common[0][1] if most_common else 1
        
        return [
            {"term": word, "relevance": round(count / max_count, 2)}
            for word, count in most_common
        ]
    
    @staticmethod
    def extract_emails(text: str) -> List[str]:
        """Extract email addresses from text"""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return list(set(re.findall(pattern, text)))
    
    @staticmethod
    def extract_phone_numbers(text: str) -> List[str]:
        """Extract phone numbers from text"""
        patterns = [
            r'\+?1?\s*\(?[0-9]{3}\)?[-.\s]*[0-9]{3}[-.\s]*[0-9]{4}',
            r'\+[0-9]{1,3}[-.\s]*[0-9]{1,4}[-.\s]*[0-9]{1,4}[-.\s]*[0-9]{1,9}',
        ]
        phones = []
        for pattern in patterns:
            phones.extend(re.findall(pattern, text))
        return list(set(phones))
    
    @staticmethod
    def extract_dates(text: str) -> List[str]:
        """Extract dates from text"""
        patterns = [
            r'\d{4}-\d{2}-\d{2}',  # 2024-01-15
            r'\d{2}/\d{2}/\d{4}',  # 01/15/2024
            r'\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}',
            r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}',
        ]
        dates = []
        for pattern in patterns:
            dates.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(dates))
    
    @staticmethod
    def extract_monetary_values(text: str) -> List[str]:
        """Extract monetary values from text"""
        patterns = [
            r'\$[\d,]+(?:\.\d{2})?',
            r'€[\d,]+(?:\.\d{2})?',
            r'£[\d,]+(?:\.\d{2})?',
            r'[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|dollars|euros|pounds)',
        ]
        values = []
        for pattern in patterns:
            values.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(values))
    
    @staticmethod
    def simple_summarize(text: str, num_sentences: int = 5) -> str:
        """Simple extractive summarization using sentence importance"""
        import re
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        if len(sentences) <= num_sentences:
            return ' '.join(sentences)
        
        # Score sentences by position and keyword presence
        word_freq = Counter(re.findall(r'\b[a-z]{4,}\b', text.lower()))
        
        scored = []
        for i, sentence in enumerate(sentences):
            words = re.findall(r'\b[a-z]{4,}\b', sentence.lower())
            score = sum(word_freq.get(w, 0) for w in words)
            
            # Boost first sentences
            if i < 3:
                score *= 1.5
            
            scored.append((score, i, sentence))
        
        # Select top sentences, maintain original order
        scored.sort(reverse=True)
        selected = sorted(scored[:num_sentences], key=lambda x: x[1])
        
        return ' '.join(s[2] for s in selected)
