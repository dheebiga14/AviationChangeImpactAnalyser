from dataclasses import dataclass


@dataclass
class FlightRecord:

    flight_id: str
    aircraft: str
    departure: str
    destination: str
    latitude: float
    longitude: float
    altitude: float
    speed: float
    status: str
    risk: str


@dataclass
class AnalysisRecord:

    analysis_date: str
    changed_modules: str
    affected_modules: str
    risk_score: float
    risk_level: str


@dataclass
class TestRecord:

    test_id: str
    component: str
    priority: str
    priority_score: float
    execution_order: int