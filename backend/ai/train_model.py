from pathlib import Path

import joblib

from sklearn.ensemble import RandomForestClassifier


def train_model():

    # Training features:
    #
    # [change_size, affected_modules, criticality]

    X = [
        [2, 1, 2],
        [4, 1, 3],
        [5, 2, 3],
        [10, 2, 4],
        [15, 3, 4],
        [20, 3, 5],
        [25, 4, 5],
        [30, 5, 5],
        [40, 5, 5],
        [50, 6, 5]
    ]

    y = [
        "LOW",
        "LOW",
        "MEDIUM",
        "MEDIUM",
        "MEDIUM",
        "HIGH",
        "HIGH",
        "CRITICAL",
        "CRITICAL",
        "CRITICAL"
    ]

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    base_dir = Path(__file__).resolve().parents[2]

    model_dir = base_dir / "ml_models"

    model_dir.mkdir(
        exist_ok=True
    )

    model_path = (
        model_dir /
        "risk_model.pkl"
    )

    joblib.dump(
        model,
        model_path
    )

    print(
        "ML risk model trained successfully."
    )

    print(
        f"Model saved to: {model_path}"
    )


if __name__ == "__main__":
    train_model()