import os
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from rag_engine import LangChainRAGEngine
from utils import format_doc_stats

load_dotenv()

app = FastAPI(
    title="NotebookLM Backend API",
    description="LangChain-powered PDF Ingestion, Executive Summarization, and RAG Q&A Engine",
    version="2.0.0"
)

# Enable CORS for Next.js frontend (runs on localhost:3000 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory RAG engine instance
rag_engine_instance: Optional[LangChainRAGEngine] = None

class QuestionRequest(BaseModel):
    question: str
    provider: Optional[str] = "Google Gemini"
    model_name: Optional[str] = None

@app.get("/api/health")
def health_check():
    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))
    openai_configured = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "status": "healthy",
        "service": "NotebookLM Backend",
        "gemini_api_configured": gemini_configured,
        "openai_api_configured": openai_configured,
        "is_document_loaded": rag_engine_instance is not None and len(rag_engine_instance.documents) > 0
    }

@app.post("/api/upload")
async def upload_pdfs(
    files: List[UploadFile] = File(...),
    provider: str = "Google Gemini",
    model_name: Optional[str] = None
):
    global rag_engine_instance
    
    if not files:
        raise HTTPException(status_code=400, detail="No PDF files uploaded.")

    files_data = []
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid PDF.")
        content = await file.read()
        files_data.append((file.filename, content))

    try:
        engine = LangChainRAGEngine(provider=provider, model_name=model_name)
        docs, chunks = engine.process_pdf_bytes(files_data)
        rag_engine_instance = engine

        stats = format_doc_stats(docs, chunks)

        return {
            "message": "PDF processed and vectorstore created successfully!",
            "stats": stats,
            "filename_list": [f[0] for f in files_data]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/summary")
def generate_summary():
    global rag_engine_instance
    
    if not rag_engine_instance or not rag_engine_instance.documents:
        raise HTTPException(status_code=400, detail="No PDF processed yet. Please upload a PDF file first.")

    try:
        summary_result = rag_engine_instance.generate_pdf_summary()
        return summary_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/api/chat")
def chat_question(payload: QuestionRequest):
    global rag_engine_instance

    if not rag_engine_instance or not rag_engine_instance.retriever:
        raise HTTPException(status_code=400, detail="No PDF processed yet. Please upload a PDF file first.")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer_result = rag_engine_instance.answer_question(payload.question)
        return answer_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

@app.post("/api/reset")
def reset_session():
    global rag_engine_instance
    rag_engine_instance = None
    return {"message": "Session reset successfully."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
