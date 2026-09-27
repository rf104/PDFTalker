import os
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

def estimate_tokens(text: str) -> int:
    """Rough estimation of token count from string length (~4 chars per token)."""
    return len(text) // 4

def get_env_api_key(provider: str = "Google Gemini") -> str:
    """Retrieve API key from environment variables."""
    if provider == "Google Gemini":
        return os.getenv("GEMINI_API_KEY", "")
    elif provider == "OpenAI":
        return os.getenv("OPENAI_API_KEY", "")
    return ""

def format_doc_stats(pages: List[Any], chunks: List[Any]) -> Dict[str, Any]:
    """Calculate page count, chunk count, total words, and estimated tokens."""
    total_pages = len(pages)
    total_chunks = len(chunks)
    total_words = sum(len(page.page_content.split()) for page in pages)
    tokens_approx = sum(estimate_tokens(page.page_content) for page in pages)
    
    return {
        "pages": total_pages,
        "chunks": total_chunks,
        "words": total_words,
        "tokens_approx": tokens_approx
    }
