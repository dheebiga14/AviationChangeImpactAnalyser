import json
from pathlib import Path


class GraphExporter:

    def __init__(self, graph):

        self.graph = graph

    def export_json(
        self,
        output_path
    ):

        output_path = Path(output_path)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        data = {
            "nodes": [
                {
                    "id": node,
                    "label": node
                }
                for node in self.graph.nodes
            ],
            "edges": [
                {
                    "source": source,
                    "target": target
                }
                for source, target
                in self.graph.edges
            ]
        }

        with open(
            output_path,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                data,
                file,
                indent=4
            )

        return str(output_path)