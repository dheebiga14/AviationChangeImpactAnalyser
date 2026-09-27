import json
from pathlib import Path


class TestPrioritizer:

    def __init__(
        self,
        test_file,
        impact,
        risk
    ):

        self.test_file = Path(
            test_file
        )

        self.impact = impact
        self.risk = risk


    def load_tests(self):

        if not self.test_file.exists():

            return []

        with open(
            self.test_file,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)


    def calculate_priority(
        self,
        test
    ):

        component = test.get(
            "component",
            ""
        )

        criticality = test.get(
            "criticality",
            1
        )

        coverage = test.get(
            "coverage",
            50
        )


        affected = (
            self.impact.get(
                "all_affected_modules",
                []
            )
        )


        score = 0


        # Component affected
        if component in affected:

            score += 50


        # Safety criticality
        score += criticality * 8


        # Lower coverage means higher
        # testing priority

        score += (100 - coverage) * 0.2


        # High system risk

        risk_level = self.risk.get(
            "risk_level",
            "LOW"
        )


        if risk_level == "CRITICAL":

            score += 20

        elif risk_level == "HIGH":

            score += 15

        elif risk_level == "MEDIUM":

            score += 10


        return round(
            score,
            2
        )


    def prioritize(self):

        tests = self.load_tests()

        results = []


        for test in tests:

            priority = (
                self.calculate_priority(
                    test
                )
            )

            item = dict(test)

            item["priority_score"] = (
                priority
            )

            results.append(item)


        results.sort(
            key=lambda x:
            x["priority_score"],
            reverse=True
        )


        for index, test in enumerate(
            results,
            start=1
        ):

            test["execution_order"] = index


            if test["priority_score"] >= 80:

                test["priority"] = "CRITICAL"

            elif test["priority_score"] >= 60:

                test["priority"] = "HIGH"

            elif test["priority_score"] >= 40:

                test["priority"] = "MEDIUM"

            else:

                test["priority"] = "LOW"


        return {

            "total_tests": len(
                results
            ),

            "tests": results
        }