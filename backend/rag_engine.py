import os
import tempfile
from typing import List, Dict, Tuple, Any, Optional

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv

load_dotenv()

class LangChainRAGEngine:
    def __init__(self, provider: str = "Google Gemini", model_name: Optional[str] = None):
        self.provider = provider
        self.model_name = model_name
        self.api_key = self._get_api_key()
        self.vectorstore = None
        self.retriever = None
        self.documents = []
        self.chunks = []
        
        # Initialize LLM and Embeddings
        self.llm = self._init_llm()
        self.embeddings = self._init_embeddings()

    def _get_api_key(self) -> str:
        if self.provider == "Google Gemini":
            key = os.getenv("GEMINI_API_KEY", "")
            if not key:
                raise ValueError("GEMINI_API_KEY is missing in backend .env configuration.")
            return key
        elif self.provider == "OpenAI":
            key = os.getenv("OPENAI_API_KEY", "")
            if not key:
                raise ValueError("OPENAI_API_KEY is missing in backend .env configuration.")
            return key
        raise ValueError(f"Unsupported provider: {self.provider}")

    def _init_llm(self):
        """Initialize LLM based on configured provider."""
        if self.provider == "Google Gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI
            model = self.model_name or "gemini-3.6-flash"
            # Fallback for deprecated model names
            if model in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]:
                model = "gemini-3.6-flash"
            return ChatGoogleGenerativeAI(
                google_api_key=self.api_key,
                model=model,
                temperature=0.3
            )
        elif self.provider == "OpenAI":
            from langchain_openai import ChatOpenAI
            model = self.model_name or "gpt-4o-mini"
            return ChatOpenAI(
                api_key=self.api_key,
                model=model,
                temperature=0.3
            )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _init_embeddings(self):
        """Initialize Embeddings model."""
        try:
            if self.provider == "Google Gemini":
                from langchain_google_genai import GoogleGenerativeAIEmbeddings
                return GoogleGenerativeAIEmbeddings(
                    google_api_key=self.api_key,
                    model="models/embedding-001"
                )
            elif self.provider == "OpenAI":
                from langchain_openai import OpenAIEmbeddings
                return OpenAIEmbeddings(api_key=self.api_key)
        except Exception as e:
            print(f"Primary embeddings init warning: {e}. Using HuggingFace Embeddings...")
        
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    def _get_huggingface_embeddings(self):
        """Fallback to local HuggingFace embeddings."""
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    def process_pdf_bytes(self, files_data: List[Tuple[str, bytes]]) -> Tuple[List[Document], List[Document]]:
        """Extract text from uploaded PDF bytes and chunk into FAISS vectorstore."""
        all_docs = []

        for filename, content in files_data:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(content)
                tmp_path = tmp_file.name

            try:
                loader = PyPDFLoader(tmp_path)
                docs = loader.load()
                for d in docs:
                    d.metadata["source_name"] = filename
                    page_num = d.metadata.get("page", 0) + 1
                    d.metadata["page_number"] = page_num
                all_docs.extend(docs)
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        self.documents = all_docs

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        self.chunks = text_splitter.split_documents(all_docs)

        if self.chunks:
            try:
                self.vectorstore = FAISS.from_documents(self.chunks, self.embeddings)
            except Exception as primary_error:
                try:
                    self.embeddings = self._get_huggingface_embeddings()
                    self.vectorstore = FAISS.from_documents(self.chunks, self.embeddings)
                except Exception as fallback_error:
                    raise RuntimeError(
                        f"Embedding via {self.provider} failed ({primary_error}), and the local "
                        f"fallback also failed ({fallback_error}). Check your {self.provider} API key/quota."
                    ) from fallback_error

            self.retriever = self.vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 4}
            )

        return self.documents, self.chunks

    def generate_pdf_summary(self) -> Dict[str, str]:
        """Generate structured summary."""
        if not self.documents:
            return {"error": "No documents loaded."}

        combined_text = "\n\n".join([doc.page_content for doc in self.documents[:30]])

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are an expert research analyst AI assistant, built like NotebookLM.
Analyze the provided document text and generate a structured summary.

Format your response strictly into the following Markdown sections:

### 📌 Executive Summary
Provide a high-level 2-3 paragraph overview explaining the primary purpose, core thesis, and main outcome of the document.

### 🎯 Key Themes & Topics
List 4 to 6 main topics covered in the document with brief descriptive bullet points.

### 💡 Major Takeaways
List 5 to 7 actionable or critical takeaways from the document.

### 🏷️ Important Terminology & Definitions
Highlight 3 to 5 key terms, acronyms, or concepts defined or prominently used in the document with concise explanations.

### ❓ Suggested Questions to Ask
Provide 4 insightful follow-up questions a user might ask about this document.
"""),
            ("human", "Here is the document content:\n\n{document_content}")
        ])

        chain = prompt_template | self.llm | StrOutputParser()
        summary_markdown = chain.invoke({"document_content": combined_text})

        return {"summary_markdown": summary_markdown}

    def answer_question(self, question: str) -> Dict[str, Any]:
        """Answer question grounded in document context with citations."""
        if not self.retriever:
            return {"answer": "Please upload and process a PDF document first.", "sources": []}

        retrieved_docs = self.retriever.invoke(question)

        def format_docs(docs: List[Document]) -> str:
            formatted = []
            for d in docs:
                source = d.metadata.get("source_name", "Document")
                page = d.metadata.get("page_number", 1)
                formatted.append(f"[Source: {source} | Page {page}]\n{d.page_content}")
            return "\n\n".join(formatted)

        context_text = format_docs(retrieved_docs)

        system_prompt = (
            "You are NotebookLM AI, an expert assistant trained to answer questions strictly based on the provided document context.\n"
            "Respond accurately, clearly, and concisely. If the information is not contained in the context below, state clearly that "
            "the document does not provide enough detail to answer the question.\n\n"
            "Context:\n{context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}"),
        ])

        rag_chain = prompt | self.llm | StrOutputParser()
        answer = rag_chain.invoke({"context": context_text, "question": question})

        sources = []
        for doc in retrieved_docs:
            sources.append({
                "file_name": doc.metadata.get("source_name", "Document"),
                "page_number": doc.metadata.get("page_number", 1),
                "snippet": doc.page_content[:250] + "..."
            })

        return {
            "answer": answer,
            "sources": sources
        }
