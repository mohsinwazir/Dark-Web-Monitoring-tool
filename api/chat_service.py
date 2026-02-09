
import logging
from database_sql import get_db, SessionLocal
from models_sql import CrawledItem
from sqlalchemy import desc
from datetime import datetime, timedelta
import asyncio

# Robust imports
try:
    from langchain_community.llms import Ollama
    from langchain.callbacks.manager import CallbackManager
    from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser
except ImportError:
    print("[!] LangChain imports failed. Chat will be disabled.")
    Ollama = None

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, model_name="llama3"):
        self.llm = None
        if Ollama:
            try:
                # We won't use StreamingStdOutCallbackHandler for API streaming, 
                # but we enable streaming=True to allow .stream() calls
                self.llm = Ollama(
                    model=model_name, 
                    temperature=0.7,
                )
            except Exception as e:
                logger.error(f"[Chat] Failed to init LLM: {e}")

    def get_trending_context(self):
        """Fetch trending items from SQLite for context"""
        try:
            db = SessionLocal()
            # Get last 50 high risk items for RAG context
            items = db.query(CrawledItem).filter(
                CrawledItem.risk_score > 0.7
            ).order_by(desc(CrawledItem.timestamp)).limit(10).all()
            
            if not items:
                return "System Status: Online. No recent threats detected."
                
            context = "Recent High Risk Findings:\n"
            for item in items:
                context += f"- [{item.category}] {item.title}: {item.url}\n"
            
            db.close()
            return context
        except Exception as e:
            logger.error(f"[Chat] DB Error: {e}")
            return "Trend data unavailable."

    async def stream_chat(self, user_message: str):
        """Generator that yields response chunks"""
        if not self.llm:
            yield "System Error: AI model not initialized (Check Ollama)."
            return

        # RAG Context
        context_str = self.get_trending_context()
        
        template = """You are 'DarkChat', an elite cyber intelligence AI.
Keep answers concise, professional, and actionable. Do not be conversational only be technical.
Use the provided system context if relevant.

System Context:
{context}

User: {question}
DarkChat:"""
        
        prompt = PromptTemplate(template=template, input_variables=["context", "question"])
        
        # New LCEL Chain syntax
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            # Stream the response
            # Note: Ollama .stream() is synchronous or async depending on implementation
            # We use astream for async generator
            async for chunk in chain.astream({"context": context_str, "question": user_message}):
                yield chunk
        except Exception as e:
            logger.error(f"[Chat] Stream failed: {e}")
            yield f"Error generating response: {str(e)}"

# Global Singletons
_chat_service = None
def get_chat_service():
    global _chat_service
    if not _chat_service:
        _chat_service = ChatService()
    return _chat_service
