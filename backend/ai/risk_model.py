import joblib
from pathlib import Path


class RiskModel:

    _cached_model = None

    def __init__(self):

        self.model = RiskModel._cached_model

        base_dir = Path(__file__).resolve().parents[2]

        self.model_path = (
            base_dir /
            "ml_models" /
            "risk_model.pkl"
        )

    def load(self):

        if RiskModel._cached_model is not None:
            self.model = RiskModel._cached_model
            return True

        if self.model_path.exists():

            RiskModel._cached_model = joblib.load(
                self.model_path
            )
            self.model = RiskModel._cached_model

            return True

        return False

    def predict(self, features):

        if self.model is None:

            self.load()

        if self.model is None:

            return {
                "risk_level": "UNKNOWN",
                "risk_probability": 0.0
            }

        prediction = self.model.predict(
            [features]
        )[0]

        probabilities = (
            self.model.predict_proba(
                [features]
            )[0]
        )

        confidence = max(
            probabilities
        ) * 100

        return {
            "risk_level": str(prediction),
            "risk_probability": round(
                confidence,
                2
            )
        }