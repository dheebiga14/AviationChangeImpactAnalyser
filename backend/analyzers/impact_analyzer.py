class ImpactAnalyzer:

    def __init__(
        self,
        changes,
        dependency_result
    ):

        self.changes = changes
        self.dependencies = dependency_result


    def analyze(self):

        changed_modules = set(
            self.changes.get(
                "changed_modules",
                []
            )
        )

        direct_impact = set()
        indirect_impact = set()

        edges = self.dependencies.get(
            "edges",
            []
        )


        # --------------------------------
        # DIRECT IMPACT
        # --------------------------------

        for edge in edges:

            source = edge["source"]
            target = edge["target"]

            if target in changed_modules:

                direct_impact.add(
                    source
                )


        # --------------------------------
        # INDIRECT IMPACT
        # --------------------------------

        previous = set(
            direct_impact
        )

        while previous:

            current = set()

            for edge in edges:

                source = edge["source"]
                target = edge["target"]

                if target in previous:

                    if (
                        source not in
                        changed_modules
                    ):

                        if source not in direct_impact:

                            current.add(
                                source
                            )


            current -= indirect_impact

            if not current:
                break

            indirect_impact.update(
                current
            )

            previous = current


        all_affected = (
            changed_modules |
            direct_impact |
            indirect_impact
        )

        all_nodes = set(n for n in self.dependencies.get("nodes", []) if n != "__init__")
        # Ensure our core standard 5 modules are accounted for
        core_modules = {"navigation", "flight_planning", "aircraft_monitoring", "weather", "communication"}
        all_nodes.update(core_modules)

        unaffected = all_nodes - all_affected

        # Classify module states
        module_states = {}
        for m in all_nodes:
            if m in changed_modules:
                module_states[m] = "CHANGED"
            elif m in direct_impact:
                module_states[m] = "DIRECT IMPACT"
            elif m in indirect_impact:
                module_states[m] = "INDIRECT IMPACT"
            else:
                module_states[m] = "UNAFFECTED"

        # Classify edges with relation type
        classified_edges = []
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src == "__init__" or tgt == "__init__":
                continue
            
            if tgt in changed_modules and src in direct_impact:
                edge_type = "DIRECT IMPACT"
            elif tgt in direct_impact and src in indirect_impact:
                edge_type = "INDIRECT IMPACT"
            else:
                edge_type = "DEPENDENCY"
                
            classified_edges.append({
                "source": src,
                "target": tgt,
                "type": edge_type,
                "label": edge_type.title()
            })

        return {
            "changed_modules": sorted(changed_modules),
            "directly_affected": sorted(direct_impact),
            "indirectly_affected": sorted(indirect_impact),
            "unaffected_modules": sorted(unaffected),
            "all_affected_modules": sorted(all_affected),
            "impact_scope": len(all_affected),
            "module_states": module_states,
            "edges": classified_edges
        }