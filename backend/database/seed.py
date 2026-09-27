from datetime import datetime

from backend.database.database import (
    initialize_database,
    save_analysis
)


def seed_database():

    initialize_database()

    save_analysis(
        analysis_date=datetime.now().isoformat(),
        changed_modules="navigation",
        affected_modules="navigation,flight_planning",
        risk_score=75.0,
        risk_level="HIGH"
    )

    save_analysis(
        analysis_date=datetime.now().isoformat(),
        changed_modules="weather",
        affected_modules="weather,flight_planning",
        risk_score=48.0,
        risk_level="MEDIUM"
    )

    print("Database initialized successfully.")
    print("Sample analysis records inserted.")


if __name__ == "__main__":
    seed_database()