"""
IN9AD - Report Export Router (CSV, PDF, Excel, JSON)
Provides server-side generation of operational reports for Civil Protection and DGF.
"""

import io
import csv
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Query, Response, HTTPException
from pydantic import BaseModel

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from fpdf import FPDF
except ImportError:
    FPDF = None

router = APIRouter(prefix="/api/reports", tags=["Reports"])


class ExportRequest(BaseModel):
    title: Optional[str] = "IN9AD Operational Intelligence Report"
    data: Optional[List[Dict[str, Any]]] = None
    filters: Optional[Dict[str, Any]] = None


# Default fallback data when no custom rows are supplied in request body
DEFAULT_EXPORT_DATA = [
    {
        "id": "ALT-DZ-2026-001",
        "wilaya": "Tizi Ouzou (15)",
        "zone": "Yakouren Forest Massif",
        "risk_level": "CRITICAL",
        "risk_score_pct": 88.4,
        "temperature_c": 41.2,
        "relative_humidity_pct": 14.0,
        "wind_speed_kmh": 46.5,
        "wind_azimuth_deg": 180,
        "sirocco_flag": "ACTIVE",
        "projected_burned_area_12h_ha": 340.5,
        "status": "DEPLOYED",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    },
    {
        "id": "ALT-DZ-2026-002",
        "wilaya": "Bejaia (06)",
        "zone": "Akfadou Ridge",
        "risk_level": "HIGH",
        "risk_score_pct": 74.2,
        "temperature_c": 38.6,
        "relative_humidity_pct": 19.5,
        "wind_speed_kmh": 32.0,
        "wind_azimuth_deg": 165,
        "sirocco_flag": "ACTIVE",
        "projected_burned_area_12h_ha": 185.0,
        "status": "MONITORING",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    },
    {
        "id": "ALT-DZ-2026-003",
        "wilaya": "Bouira (10)",
        "zone": "Tikjda - Djurdjura",
        "risk_level": "MODERATE",
        "risk_score_pct": 52.8,
        "temperature_c": 33.1,
        "relative_humidity_pct": 28.0,
        "wind_speed_kmh": 22.0,
        "wind_azimuth_deg": 210,
        "sirocco_flag": "INACTIVE",
        "projected_burned_area_12h_ha": 42.0,
        "status": "RESOLVED",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    },
    {
        "id": "ALT-DZ-2026-004",
        "wilaya": "Jijel (18)",
        "zone": "Guerrouche - Babors",
        "risk_level": "HIGH",
        "risk_score_pct": 69.5,
        "temperature_c": 36.8,
        "relative_humidity_pct": 22.0,
        "wind_speed_kmh": 28.5,
        "wind_azimuth_deg": 190,
        "sirocco_flag": "INACTIVE",
        "projected_burned_area_12h_ha": 110.2,
        "status": "ACKNOWLEDGED",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
]


def _build_pdf_report(title: str, rows: List[Dict[str, Any]]) -> bytes:
    """Builds an elegant PDF with Dark Green header and clean typography using fpdf2."""
    if not FPDF:
        # Fallback to plain text if fpdf2 is somehow not present
        return f"{title}\n\n".encode("utf-8") + json.dumps(rows, indent=2).encode("utf-8")

    class In9adPDF(FPDF):
        def header(self):
            # Top dark green banner #0A4D3C (10, 77, 60)
            self.set_fill_color(10, 77, 60)
            self.rect(0, 0, self.w, 24, "F")
            
            # Header title in Cream #F5F1E8
            self.set_text_color(245, 241, 232)
            self.set_font("Helvetica", "B", 11)
            self.set_xy(10, 5)
            self.cell(0, 7, "IN9AD (EN: Saving) - AI Wildfire Intelligence Platform", 0, 1, "L")
            self.set_font("Helvetica", "", 8)
            self.set_xy(10, 13)
            self.cell(0, 6, "Civil Protection (DPC) & Forest Conservation (DGF) Operational Report", 0, 1, "L")
            self.ln(12)

        def footer(self):
            self.set_y(-15)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 10, f"Page {self.page_no()}/{{nb}} - Confidential Operational Data - IN9AD Algeria", 0, 0, "C")

    pdf = In9adPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.alias_nb_pages()
    pdf.add_page()

    # Document Title
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(10, 77, 60)
    pdf.cell(0, 8, title, 0, 1, "L")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S UTC")
    pdf.cell(0, 5, f"Export timestamp: {date_str} | Total records: {len(rows)}", 0, 1, "L")
    pdf.ln(4)

    if not rows:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 10, "No records found.", 0, 1, "L")
        return bytes(pdf.output())

    # Table columns (limit to first 7 columns for landscape fit)
    all_keys = list(rows[0].keys())
    keys = all_keys[:7]
    col_width = (pdf.w - 20) / len(keys)

    # Table Header (#0A4D3C)
    pdf.set_fill_color(10, 77, 60)
    pdf.set_text_color(245, 241, 232)
    pdf.set_font("Helvetica", "B", 8)
    for k in keys:
        display_name = k.replace("_", " ").upper()
        pdf.cell(col_width, 7, display_name[:16], border=1, align="C", fill=True)
    pdf.ln()

    # Table Rows
    pdf.set_font("Helvetica", "", 7.5)
    row_idx = 0
    for r in rows:
        row_idx += 1
        if row_idx % 2 == 0:
            pdf.set_fill_color(245, 241, 232) # Cream background
            pdf.set_text_color(26, 46, 40)
        else:
            pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(26, 46, 40)

        for k in keys:
            val = str(r.get(k, ""))
            pdf.cell(col_width, 6, val[:22], border=1, align="C", fill=True)
        pdf.ln()

    return bytes(pdf.output())


@router.post("/export")
async def export_report(
    type: str = Query("csv", pattern="^(csv|pdf|json|xlsx)$"),
    payload: Optional[ExportRequest] = None
):
    """
    Exports wildfire telemetry, alert logs, and system audits in requested format.
    Query type: csv | pdf | json | xlsx
    """
    data = (payload and payload.data) if (payload and payload.data) else DEFAULT_EXPORT_DATA
    title = (payload and payload.title) if (payload and payload.title) else "IN9AD Operational Intelligence Report"
    timestamp = int(time.time())

    if type == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
            writer.writeheader()
            writer.writerows(data)
        content = output.getvalue().encode("utf-8-sig")
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="in9ad_report_{timestamp}.csv"'}
        )

    elif type == "json":
        content = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="in9ad_report_{timestamp}.json"'}
        )

    elif type == "xlsx":
        buf = io.BytesIO()
        if pd is not None:
            df = pd.DataFrame(data)
            df.to_excel(buf, index=False, engine="openpyxl")
        else:
            # Fallback if pandas is missing
            output = io.StringIO()
            if data:
                writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
                writer.writeheader()
                writer.writerows(data)
            buf.write(output.getvalue().encode("utf-8-sig"))
        buf.seek(0)
        return Response(
            content=buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="in9ad_report_{timestamp}.xlsx"'}
        )

    elif type == "pdf":
        pdf_bytes = _build_pdf_report(title, data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="in9ad_report_{timestamp}.pdf"'}
        )

    raise HTTPException(status_code=400, detail="Unsupported format")
