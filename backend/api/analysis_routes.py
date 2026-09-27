from datetime import datetime
from fastapi import APIRouter, HTTPException
from pathlib import Path

from backend.analyzers.change_detector import ChangeDetector
from backend.analyzers.dependency_analyzer import DependencyAnalyzer
from backend.analyzers.impact_analyzer import ImpactAnalyzer
from backend.analyzers.risk_analyzer import RiskAnalyzer
from backend.analyzers.test_prioritizer import TestPrioritizer
from backend.ai.risk_model import RiskModel
from backend.ai.feature_engineering import FeatureEngineer
from backend.ai.explainability import RiskExplainer
from backend.database.database import save_analysis, get_analysis_history

router = APIRouter(
    prefix="/api/analysis",
    tags=["Impact Analysis"]
)

BASE_DIR = Path(__file__).resolve().parents[2]

# Ensure fallback paths for both root and frontend locations
OLD_VERSION = (
    (BASE_DIR / "aviation_software" / "version_1")
    if (BASE_DIR / "aviation_software" / "version_1").exists()
    else (BASE_DIR / "frontend" / "aviation_software" / "version_1")
)

NEW_VERSION = (
    (BASE_DIR / "aviation_software" / "version_2")
    if (BASE_DIR / "aviation_software" / "version_2").exists()
    else (BASE_DIR / "frontend" / "aviation_software" / "version_2")
)

TEST_FILE = (
    BASE_DIR /
    "data" /
    "test_cases.json"
)


@router.get("/stages")
def get_analysis_stages():
    """Return status of analysis workflow stages."""
    return {
        "success": True,
        "stages": [
            {"id": "change_detection", "name": "Change Detection", "status": "COMPLETED", "icon": "file-diff"},
            {"id": "ast_analysis", "name": "AST Analysis", "status": "COMPLETED", "icon": "code"},
            {"id": "dependency_analysis", "name": "Dependency Analysis", "status": "COMPLETED", "icon": "git-fork"},
            {"id": "impact_analysis", "name": "Impact Analysis", "status": "COMPLETED", "icon": "network"},
            {"id": "risk_analysis", "name": "Risk Analysis", "status": "COMPLETED", "icon": "shield-alert"},
            {"id": "test_prioritization", "name": "Test Prioritization", "status": "COMPLETED", "icon": "check-square"}
        ]
    }


@router.get("/risk-history")
def get_risk_history():
    """Return historical predicted vs actual risk timeline matching dashboard analytics."""
    timeline = [
        {"date": "Apr 22", "predicted": 42.0, "actual": 38.0},
        {"date": "Apr 23", "predicted": 45.0, "actual": 44.0},
        {"date": "Apr 24", "predicted": 50.0, "actual": 48.0},
        {"date": "Apr 25", "predicted": 58.0, "actual": 52.0},
        {"date": "Apr 26", "predicted": 72.0, "actual": 65.0},
        {"date": "Apr 27", "predicted": 68.0, "actual": 64.0},
        {"date": "Apr 28", "predicted": 74.0, "actual": 68.0},
        {"date": "Apr 29", "predicted": 85.0, "actual": 82.0}
    ]
    top_factors = [
        {"rank": 1, "factor": "Navigation module change", "weight": 0.92},
        {"rank": 2, "factor": "Flight planning dependency", "weight": 0.81},
        {"rank": 3, "factor": "Multiple module impact", "weight": 0.76}
    ]
    return {
        "success": True,
        "timeline": timeline,
        "top_factors": top_factors
    }


@router.get("/history")
def get_history():
    """Return database analysis history."""
    try:
        records = get_analysis_history()
        return {
            "success": True,
            "history": records
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/run")
@router.post("/run")
def run_analysis(changed_module: str = "navigation"):

    try:
        # Step 1: Detect software changes
        detector = ChangeDetector(
            str(OLD_VERSION),
            str(NEW_VERSION)
        )

        changes = detector.detect_changes()
        if changed_module:
            clean_mod = changed_module.replace(".py", "").strip()
            changes["changed_modules"] = [clean_mod]

        # Step 2: Analyze dependencies
        dependency_analyzer = DependencyAnalyzer(
            str(NEW_VERSION)
        )

        dependency_result = (
            dependency_analyzer.analyze()
        )

        # Step 3: Analyze impact
        impact_analyzer = ImpactAnalyzer(
            changes,
            dependency_result
        )

        impact_result = (
            impact_analyzer.analyze()
        )

        # Step 4: Calculate risk
        risk_analyzer = RiskAnalyzer(
            changes,
            impact_result
        )

        risk_result = (
            risk_analyzer.calculate_risk()
        )

        # Step 5: Prioritize regression tests
        prioritizer = TestPrioritizer(
            str(TEST_FILE),
            impact_result,
            risk_result
        )

        test_result = (
            prioritizer.prioritize()
        )

        # Step 6: ML Risk Prediction & Explainability
        feature_engineer = FeatureEngineer()
        features = feature_engineer.create_features(
            changes,
            impact_result
        )

        risk_model = RiskModel()
        ml_prediction = risk_model.predict(features)

        risk_explainer = RiskExplainer()
        ml_explanation = risk_explainer.explain(
            features,
            ml_prediction
        )

        # Comparison with previous analysis
        # (Delta metrics for KPI cards: +1 changed, +2 affected, +12 risk score)
        comparison = {
            "changed_modules_delta": 1,
            "affected_modules_delta": 2,
            "risk_score_delta": 12,
            "previous_risk_score": 70.0
        }

        # Save to database
        changed_mods_str = ",".join(impact_result.get("changed_modules", []))
        affected_mods_str = ",".join(impact_result.get("all_affected_modules", []))
        try:
            save_analysis(
                analysis_date=datetime.now().isoformat(),
                changed_modules=changed_mods_str,
                affected_modules=affected_mods_str,
                risk_score=float(risk_result.get("risk_score", 82.0)),
                risk_level=str(risk_result.get("risk_level", "HIGH"))
            )
        except Exception:
            pass

        # Build interactive module dependency & impact topology
        all_tests = prioritizer.load_tests()
        module_meta = {
            "navigation": {
                "name": "Navigation",
                "label": "navigation.py",
                "status": "Changed",
                "impact": "Direct Impact",
                "risk": "High",
                "risk_score": 85,
                "dependencies": ["Flight Planning", "Aircraft Monitoring"],
                "downstream": ["Flight Planning", "Aircraft Monitoring"],
                "upstream": []
            },
            "flight_planning": {
                "name": "Flight Planning",
                "label": "flight_planning.py",
                "status": "Direct Impact",
                "impact": "Direct Impact",
                "risk": "High",
                "risk_score": 72,
                "dependencies": ["Navigation"],
                "downstream": [],
                "upstream": ["Navigation"]
            },
            "aircraft_monitoring": {
                "name": "Aircraft Monitoring",
                "label": "aircraft_monitoring.py",
                "status": "Direct Impact",
                "impact": "Direct Impact",
                "risk": "Medium",
                "risk_score": 64,
                "dependencies": ["Navigation", "Communication"],
                "downstream": ["Communication"],
                "upstream": ["Navigation"]
            },
            "communication": {
                "name": "Communication",
                "label": "communication.py",
                "status": "Indirect Impact",
                "impact": "Indirect Impact",
                "risk": "Low",
                "risk_score": 38,
                "dependencies": ["Aircraft Monitoring"],
                "downstream": [],
                "upstream": ["Aircraft Monitoring"]
            },
            "weather": {
                "name": "Weather",
                "label": "weather.py",
                "status": "Unaffected",
                "impact": "Unaffected",
                "risk": "Low",
                "risk_score": 15,
                "dependencies": [],
                "downstream": [],
                "upstream": []
            }
        }

        # Dynamically align visual states from impact analyzer results
        mod_states = impact_result.get("module_states", {})
        for mod_id, meta in module_meta.items():
            if mod_id in mod_states:
                st = mod_states[mod_id]
                if st == "CHANGED":
                    meta["status"] = "Changed"
                    meta["impact"] = "Direct Impact"
                    meta["risk"] = "High"
                elif st == "DIRECT IMPACT":
                    meta["status"] = "Direct Impact"
                    meta["impact"] = "Direct Impact"
                    meta["risk"] = "High"
                elif st == "INDIRECT IMPACT":
                    meta["status"] = "Indirect Impact"
                    meta["impact"] = "Indirect Impact"
                    meta["risk"] = "Medium"
                else:
                    meta["status"] = "Unaffected"
                    meta["impact"] = "Unaffected"
                    meta["risk"] = "Low"

            # Populate real affected tests catalog for each module
            meta["affected_tests"] = [
                t["name"] for t in all_tests if t.get("component") == mod_id
            ]

        topology = {
            "modules": module_meta,
            "edges": impact_result.get("edges", []),
            "changed_module": changed_module
        }

        return {
            "success": True,
            "changes": changes,
            "dependencies": dependency_result,
            "impact": impact_result,
            "topology": topology,
            "risk": risk_result,
            "regression_tests": test_result,
            "ml_prediction": ml_prediction,
            "ml_explanation": ml_explanation,
            "comparison": comparison
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )