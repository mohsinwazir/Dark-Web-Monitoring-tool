"""
PDF Report Generator
Converts intelligence reports to professional PDF format
"""

import logging
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

logger = logging.getLogger(__name__)


class PDFReportGenerator:
    """Generates professional PDF reports from intelligence data"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Create custom paragraph styles"""
        
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#2C3E50'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=HexColor('#7F8C8D'),
            spaceAfter=12,
            alignment=TA_CENTER
        ))
        
        # Section header
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#2980B9'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        # Body text
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=11,
            leading=16,
            alignment=TA_JUSTIFY,
            spaceAfter=12
        ))
        
        # Alert box
        self.styles.add(ParagraphStyle(
            name='AlertBox',
            parent=self.styles['BodyText'],
            fontSize=10,
            textColor=HexColor('#E74C3C'),
            backColor=HexColor('#FADBD8'),
            borderWidth=1,
            borderColor=HexColor('#E74C3C'),
            borderPadding=10,
            spaceAfter=12
        ))
    
    def generate_report_pdf(self, report_data: dict) -> BytesIO:
        """
        Generate PDF from report data
        
        Args:
            report_data: Dictionary with report information
                - timestamp: Report generation time
                - findings_count: Number of findings
                - summary: AI-generated summary text
                - period: Time period covered
        
        Returns:
            BytesIO object containing PDF data
        """
        try:
            # Create BytesIO buffer
            buffer = BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=50
            )
            
            # Container for PDF elements
            story = []
            
            # Title
            title = Paragraph(
                "Dark Web Intelligence Report",
                self.styles['CustomTitle']
            )
            story.append(title)
            story.append(Spacer(1, 12))
            
            # Date and metadata
            date_str = datetime.fromisoformat(report_data['timestamp']).strftime('%B %d, %Y')
            subtitle = Paragraph(
                f"Generated on {date_str}",
                self.styles['Subtitle']
            )
            story.append(subtitle)
            story.append(Spacer(1, 20))
            
            # Summary statistics table
            stats_data = [
                ['Report Period', report_data.get('period', 'Last 24 Hours')],
                ['High-Risk Findings', str(report_data.get('findings_count', 0))],
                ['Classification', 'Executive Summary']
            ]
            
            stats_table = Table(stats_data, colWidths=[2.5*inch, 3.5*inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), HexColor('#34495E')),
                ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#FFFFFF')),
                ('BACKGROUND', (1, 0), (1, -1), HexColor('#ECF0F1')),
                ('TEXTCOLOR', (1, 0), (1, -1), HexColor('#2C3E50')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#BDC3C7')),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ]))
            
            story.append(stats_table)
            story.append(Spacer(1, 30))
            
            # Executive Summary Section
            section_header = Paragraph(
                "Executive Summary",
                self.styles['SectionHeader']
            )
            story.append(section_header)
            
            # Summary content
            summary_text = report_data.get('summary', 'No summary available.')
            
            # Split summary into paragraphs
            paragraphs = summary_text.split('\n\n')
            for para_text in paragraphs:
                if para_text.strip():
                    para = Paragraph(para_text.strip(), self.styles['CustomBody'])
                    story.append(para)
                    story.append(Spacer(1, 6))
            
            # Critical notice if high findings count
            if report_data.get('findings_count', 0) > 30:
                story.append(Spacer(1, 20))
                alert_text = (
                    f"<b>⚠ High Activity Alert:</b> This report contains "
                    f"{report_data['findings_count']} high-risk findings, which is above "
                    f"the normal threshold. Immediate review recommended."
                )
                alert = Paragraph(alert_text, self.styles['AlertBox'])
                story.append(alert)
            
            # Footer section
            story.append(Spacer(1, 40))
            footer = Paragraph(
                "<i>This report was automatically generated by the Dark Web Intelligence System. "
                "For technical details or questions, contact your security team.</i>",
                self.styles['Normal']
            )
            story.append(footer)
            
            # Build PDF
            doc.build(story)
            
            # Reset buffer position
            buffer.seek(0)
            
            logger.info(f"[PDF] Generated report with {len(story)} elements")
            return buffer
            
        except Exception as e:
            logger.error(f"[PDF] Generation failed: {e}")
            raise
    
    def generate_findings_pdf(self, findings: list) -> BytesIO:
        """
        Generate detailed PDF with individual findings
        
        Args:
            findings: List of finding dictionaries
        
        Returns:
            BytesIO object containing PDF data
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Title
        title = Paragraph("High-Risk Findings Report", self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 30))
        
        # Each finding
        for idx, finding in enumerate(findings[:20], 1):  # Limit to 20
            # Finding header
            header_text = f"<b>Finding #{idx}: {finding.get('label', 'Unknown').upper()}</b>"
            header = Paragraph(header_text, self.styles['SectionHeader'])
            story.append(header)
            
            # Finding details
            details = [
                ['URL', finding.get('url', 'N/A')[:80]],
                ['Title', finding.get('title', 'No title')],
                ['Risk Score', f"{finding.get('risk_score', 0)*100:.0f}%"],
                ['CSAM Flag', 'YES' if finding.get('csam_flag') else 'NO']
            ]
            
            details_table = Table(details, colWidths=[1.5*inch, 4.5*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), HexColor('#ECF0F1')),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#BDC3C7')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            
            story.append(details_table)
            story.append(Spacer(1, 20))
        
        doc.build(story)
        buffer.seek(0)
        return buffer


# Global instance
_pdf_generator = None

def get_pdf_generator():
    """Get or create global PDF generator instance"""
    global _pdf_generator
    if _pdf_generator is None:
        _pdf_generator = PDFReportGenerator()
    return _pdf_generator
