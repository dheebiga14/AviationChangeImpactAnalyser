import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path

from backend.reports.report_generator import (
    generate_change_impact_report,
    generate_risk_assessment_report,
    generate_test_prioritization_report,
    generate_flight_simulation_report,
    generate_report
)

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

BASE_DIR = Path(__file__).resolve().parents[2]
REPORT_DIR = BASE_DIR / "reports"
REPORT_DIR.mkdir(exist_ok=True)


@router.get("/list")
def list_reports():
    """Return available system reports with file sizes, dates, and download paths."""
    now_str = datetime.utcnow().strftime("%b %d, %Y")
    default_reports = [
        {
            "id": "change_impact",
            "name": "Change Impact Analysis Report",
            "date": now_str,
            "size": "245 KB",
            "filename": "aviation_impact_report.pdf",
            "type": "Change Impact",
            "param": "impact"
        },
        {
            "id": "risk_assessment",
            "name": "Risk Assessment Report",
            "date": now_str,
            "size": "198 KB",
            "filename": "aviation_risk_report.pdf",
            "type": "Risk",
            "param": "risk"
        },
        {
            "id": "test_prioritization",
            "name": "Test Prioritization Report",
            "date": now_str,
            "size": "182 KB",
            "filename": "aviation_test_report.pdf",
            "type": "Regression",
            "param": "tests"
        },
        {
            "id": "flight_simulation",
            "name": "Flight Simulation Report",
            "date": now_str,
            "size": "310 KB",
            "filename": "aviation_simulation_report.pdf",
            "type": "Simulation",
            "param": "simulation"
        }
    ]
    return {
        "success": True,
        "reports": default_reports
    }


@router.get("/generate")
def generate_analysis_report(type: str = Query("impact", description="Report type: impact, risk, tests, simulation")):
    """Generate and download one of 4 genuinely distinct PDF reports."""
    try:
        type_clean = type.lower()
        if "risk" in type_clean:
            filename = "aviation_risk_report.pdf"
            output_file = REPORT_DIR / filename
            generate_risk_assessment_report(str(output_file))
        elif "test" in type_clean:
            filename = "aviation_test_report.pdf"
            output_file = REPORT_DIR / filename
            generate_test_prioritization_report(str(output_file))
        elif "sim" in type_clean or "flight" in type_clean:
            filename = "aviation_simulation_report.pdf"
            output_file = REPORT_DIR / filename
            generate_flight_simulation_report(str(output_file))
        else:
            filename = "aviation_impact_report.pdf"
            output_file = REPORT_DIR / filename
            generate_change_impact_report(str(output_file))

        return FileResponse(
            path=str(output_file),
            filename=filename,
            media_type="application/pdf"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )