class RiskAnalyzer:

    # Safety criticality of aviation modules
    CRITICALITY = {
        "navigation": 5,
        "flight_planning": 5,
        "aircraft_monitoring": 4,
        "communication": 4,
        "weather": 3
    }

    def __init__(self, changes, impact):
        self.changes = changes
        self.impact = impact

    def calculate_change_size(self):
        total_added = 0
        total_removed = 0

        for file_data in self.changes.get("files", []):
            total_added += file_data.get("added_lines", 0)
            total_removed += file_data.get("removed_lines", 0)

        return total_added + total_removed

    def calculate_criticality(self):
        affected_modules = self.impact.get(
            "all_affected_modules",
            []
        )

        criticality_values = []

        for module in affected_modules:
            value = self.CRITICALITY.get(module, 2)
            criticality_values.append(value)

        if not criticality_values:
            return 1

        return max(criticality_values)

    def calculate_change_score(self, change_size):

        if change_size == 0:
            return 0

        elif change_size <= 5:
            return 5

        elif change_size <= 15:
            return 15

        elif change_size <= 30:
            return 25

        else:
            return 30

    def calculate_impact_score(self, affected_count):

        if affected_count <= 0:
            return 0

        return min(affected_count * 10, 30)

    def calculate_criticality_score(self, criticality):

        return (criticality / 5) * 40

    def determine_risk_level(self, score):

        if score <= 30:
            return "LOW"

        elif score <= 60:
            return "MEDIUM"

        elif score <= 80:
            return "HIGH"

        else:
            return "CRITICAL"

    def generate_risk_factors(
        self,
        change_size,
        affected_count,
        criticality
    ):

        factors = []

        if criticality >= 5:
            factors.append(
                "High criticality aviation component affected"
            )

        elif criticality >= 4:
            factors.append(
                "Safety-related aviation component affected"
            )

        if affected_count >= 3:
            factors.append(
                "Multiple dependent modules affected"
            )

        elif affected_count >= 2:
            factors.append(
                "Dependent modules affected"
            )

        if change_size >= 30:
            factors.append(
                "Large software change detected"
            )

        elif change_size >= 15:
            factors.append(
                "Moderate software change detected"
            )

        elif change_size > 0:
            factors.append(
                "Software modification detected"
            )

        if not factors:
            factors.append(
                "Limited change and impact scope"
            )

        return factors

    def calculate_risk(self):

        # 1. Calculate size of software change
        change_size = self.calculate_change_size()

        # 2. Number of affected modules
        affected_count = self.impact.get(
            "impact_scope",
            0
        )

        # 3. Criticality of affected modules
        criticality = self.calculate_criticality()

        # 4. Individual risk components
        change_score = self.calculate_change_score(
            change_size
        )

        impact_score = self.calculate_impact_score(
            affected_count
        )

        criticality_score = self.calculate_criticality_score(
            criticality
        )

        # 5. Final risk score
        score = (
            change_score
            + impact_score
            + criticality_score
        )

        score = round(
            min(score, 100),
            2
        )

        # 6. Risk category
        risk_level = self.determine_risk_level(
            score
        )

        # 7. Risk factors
        factors = self.generate_risk_factors(
            change_size,
            affected_count,
            criticality
        )

        return {
            "risk_score": score,
            "risk_level": risk_level,

            "change_size": change_size,

            "affected_modules": affected_count,

            "criticality": criticality,

            "factors": factors,

            "score_components": {
                "change_score": change_score,
                "impact_score": impact_score,
                "criticality_score": round(
                    criticality_score,
                    2
                )
            }
        }