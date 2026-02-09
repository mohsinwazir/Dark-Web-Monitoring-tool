"""
AI Report Generator using LangChain + Ollama
Generates executive summaries of high-risk dark web findings
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict
from langchain_community.llms import Ollama
import logging
# Robust imports for LangChain to prevent startup crashes
try:
    from langchain_community.llms import Ollama
    from langchain_core.prompts import PromptTemplate
    from langchain.chains import LLMChain
except ImportError:
    try:
        from langchain_community.llms import Ollama
        from langchain.prompts import PromptTemplate
        from langchain.chains import LLMChain
    except ImportError:
        # Emergency Fallback: Dummy classes to allow server startup
        print("[!] LangChain imports failed. Report generation will be disabled.")
        class Ollama: 
            def __init__(self, **kwargs): pass
        class PromptTemplate: 
            def __init__(self, **kwargs): pass
        class LLMChain: 
            def __init__(self, **kwargs): pass
            def run(self, **kwargs): return "Error: LangChain not available."

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generates intelligence reports using LLM"""
    
    def __init__(self, model_name="llama3"):
        """
        Initialize report generator with Ollama
        
        Args:
            model_name: Ollama model to use (default: llama3)
        """
        try:
            self.llm = Ollama(model=model_name, temperature=0.7)
            logger.info(f"[ReportGen] Initialized with model: {model_name}")
        except Exception as e:
            logger.error(f"[ReportGen] Failed to initialize Ollama: {e}")
            self.llm = None
    
    def create_executive_summary(self, high_risk_data: List[Dict]) -> str:
        """
        Generate an executive summary from high-risk findings
        
        Args:
            high_risk_data: List of high-risk findings (dictionaries)
        
        Returns:
            Formatted executive summary text
        """
        if not self.llm:
            return "Error: LLM not initialized. Please ensure Ollama is running."
        
        if not high_risk_data:
            return "No high-risk findings in the last 24 hours."
        
        # Prepare data summary for prompt
        findings_summary = self._prepare_findings_summary(high_risk_data)
        
        # Create prompt template
        prompt_template = PromptTemplate(
            input_variables=["findings_count", "findings_data"],
            template="""You are a Cyber Threat Intelligence Analyst. Your task is to create a concise executive summary for a CEO based on dark web intelligence findings.

**Your Guidelines:**
1. Write in clear, non-technical language
2. Highlight the top 3 most critical threats
3. Provide one actionable mitigation step
4. Keep the summary under 300 words
5. Do NOT use technical jargon or acronyms without explanation

**Data Overview:**
- Total high-risk findings: {findings_count}
- Time period: Last 24 hours

**Raw Intelligence Data:**
{findings_data}

**Your Executive Summary:**"""
        )
        
        # Create LangChain
        chain = LLMChain(llm=self.llm, prompt=prompt_template)
        
        try:
            # Generate report
            summary = chain.run(
                findings_count=len(high_risk_data),
                findings_data=findings_summary
            )
            logger.info("[ReportGen] Successfully generated executive summary")
            return summary.strip()
        except Exception as e:
            logger.error(f"[ReportGen] Failed to generate summary: {e}")
            return f"Error generating report: {str(e)}"
    
    def _prepare_findings_summary(self, data: List[Dict]) -> str:
        """Format findings data for LLM prompt"""
        summary_lines = []
        
        for idx, finding in enumerate(data[:50], 1):  # Limit to top 50
            line = (
                f"{idx}. {finding.get('label', 'unknown').upper()} "
                f"(Risk: {finding.get('risk_score', 0)*100:.0f}%) - "
                f"{finding.get('title', 'No title')[:100]} | "
                f"URL: {finding.get('url', 'unknown')[:80]}"
            )
            
            # Add entity info if available
            entities = finding.get('entities', {})
            darkweb_terms = entities.get('DARKWEB_TERMS', [])
            if darkweb_terms:
                line += f" | Keywords: {', '.join(darkweb_terms[:5])}"
            
            summary_lines.append(line)
        
        return "\n".join(summary_lines)
    
    def save_report_to_db(self, db, summary: str, findings_count: int) -> str:
        """
        Save generated report to SQLite
        
        Args:
            db: SQLAlchemy Session
            summary: Generated report summary text
            findings_count: Number of findings analyzed
        
        Returns:
            Report document ID
        """
        from models_sql import DailyReport
        
        report = DailyReport(
            findings_count=findings_count,
            summary=summary,
            period="last_24_hours"
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"[ReportGen] Saved report to SQLite: {report.id}")
        return str(report.id)
    
    def create_trend_analysis(self, trend_data: Dict) -> str:
        """
        Generate trend analysis commentary
        
        Args:
            trend_data: Dictionary with keyword trend statistics
        
        Returns:
            Analysis text
        """
        if not self.llm:
            return "Error: LLM not initialized."
        
        prompt_template = PromptTemplate(
            input_variables=["trends"],
            template="""You are analyzing dark web activity trends. Based on the following data showing percentage changes in keyword mentions, provide a brief 2-3 sentence analysis highlighting the most significant trend.

**Trend Data:**
{trends}

**Your Analysis:**"""
        )
        
        # Format trend data
        trend_text = "\n".join([
            f"- {keyword}: {change:+.1f}% change"
            for keyword, change in trend_data.items()
        ])
        
        chain = LLMChain(llm=self.llm, prompt=prompt_template)
        
        try:
            analysis = chain.run(trends=trend_text)
            return analysis.strip()
        except Exception as e:
            logger.error(f"[ReportGen] Failed to generate trend analysis: {e}")
            return f"Error: {str(e)}"


# Global instance
_report_generator = None

def get_report_generator(model_name="llama3"):
    """Get or create global ReportGenerator instance"""
    global _report_generator
    if _report_generator is None:
        _report_generator = ReportGenerator(model_name=model_name)
    return _report_generator
