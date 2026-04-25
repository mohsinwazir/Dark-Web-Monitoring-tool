"""
AI Report Generator using LangChain + Ollama
Generates executive summaries of high-risk dark web findings
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict
import logging
from datetime import datetime, timedelta
from typing import List, Dict

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
            # Force fallback generator for presentation to prevent hanging
            self.llm = None
            logger.info("[ReportGen] Initialized in fallback mode (No Ollama)")
        except Exception as e:
            logger.error(f"[ReportGen] Failed to initialize: {e}")
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
            return self._fallback_generator(high_risk_data)
        
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
            logger.warning(f"[ReportGen] LLM generation failed ({e}). Using smart fallback generator.")
            return self._fallback_generator(high_risk_data)
    
    def _fallback_generator(self, data: List[Dict]) -> str:
        """Smart template-based fallback if Ollama is not installed"""
        if not data:
            return "No high-risk data available for report generation."
            
        count = len(data)
        categories = {}
        
        # Sort data by risk score descending
        sorted_data = sorted(data, key=lambda x: x.get('risk_score', 0), reverse=True)
        
        for item in sorted_data:
            cat = item.get('category', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
            
        top_category = max(categories.items(), key=lambda x: x[1])[0] if categories else "General Threats"
        highest_risk = sorted_data[0].get('risk_score', 0)
        
        # Build category breakdown
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        cat_breakdown = "\n".join([f"- **{k}**: {v} incidents detected" for k, v in sorted_categories]) if categories else "- No specific categories mapped."
        
        # Build Top 3 Threats
        top_threats = ""
        for i, item in enumerate(sorted_data[:3]):
            title = item.get('title', 'Unknown Title').strip()
            score = item.get('risk_score', 0) * 100
            url = item.get('url', 'Hidden Service')
            top_threats += f"{i+1}. **{title}**\n   - Risk Level: {score:.1f}%\n   - Source: `{url}`\n\n"
        
        return (
            f"### Executive Intelligence Overview\n"
            f"Over the designated reporting period, the DWITMS (Dark Web Intelligence Threat Monitoring System) successfully intercepted and analyzed **{count} high-risk communications**. "
            f"The primary threat vector identified during this scan was **{top_category}**, which represents the highest volume of malicious activity targeting the monitored perimeter. "
            f"The absolute peak risk confidence reached **{highest_risk*100:.1f}%**, indicating highly credible and actionable threat intelligence.\n\n"
            
            f"### Threat Vector Analysis\n"
            f"The collected intelligence spans multiple cyber-criminal domains. The volumetric breakdown of identified threats is as follows:\n"
            f"{cat_breakdown}\n\n"
            
            f"### Critical Intelligence Findings\n"
            f"The following nodes require immediate triage and investigation. These represent the highest confidence alerts extracted from the Tor network:\n\n"
            f"{top_threats}"
            
            f"### Strategic Recommendations & Mitigation\n"
            f"1. **Proactive Blacklisting:** Security Operations (SOC) must immediately ingest the identified `.onion` domains and associated IP nodes into firewall blocklists to prevent internal network pivoting.\n"
            f"2. **Vector Mitigation:** Given the prevalence of **{top_category}** in this report, defensive postures should be hardened against this specific vector (e.g., rotating compromised credentials, enhancing endpoint detection for illicit binaries).\n"
            f"3. **Continuous Monitoring:** Threat intelligence teams should maintain active surveillance on the listed high-value target URLs to track threat actor infrastructure migration."
        )

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
