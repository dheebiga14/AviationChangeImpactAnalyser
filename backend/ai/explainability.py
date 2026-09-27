class RiskExplainer:

    def explain(
        self,
        features,
        prediction
    ):

        change_size = features[0]
        affected_modules = features[1]
        criticality = features[2]

        factors = []

        if change_size > 20:

            factors.append(
                "Large software change"
            )

        elif change_size > 10:

            factors.append(
                "Moderate software change"
            )

        else:

            factors.append(
                "Small software change"
            )

        if affected_modules >= 4:

            factors.append(
                "Large impact scope"
            )

        elif affected_modules >= 2:

            factors.append(
                "Multiple affected modules"
            )

        if criticality >= 5:

            factors.append(
                "Highly safety-critical module affected"
            )

        elif criticality >= 4:

            factors.append(
                "Safety-related module affected"
            )

        return {
            "prediction": prediction,
            "factors": factors
        }