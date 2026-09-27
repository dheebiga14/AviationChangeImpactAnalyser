class FeatureEngineer:

    def create_features(
        self,
        changes,
        impact
    ):

        change_size = 0

        for file_data in changes.get("files", []):

            change_size += (
                file_data.get("added_lines", 0)
                + file_data.get("removed_lines", 0)
            )

        affected_modules = impact.get(
            "impact_scope",
            0
        )

        criticality = 1

        module_criticality = {
            "navigation": 5,
            "flight_planning": 5,
            "aircraft_monitoring": 4,
            "communication": 4,
            "weather": 3
        }

        for module in impact.get(
            "all_affected_modules",
            []
        ):

            value = module_criticality.get(
                module,
                2
            )

            criticality = max(
                criticality,
                value
            )

        return [
            change_size,
            affected_modules,
            criticality
        ]