import ast
from pathlib import Path

import networkx as nx


class DependencyAnalyzer:

    def __init__(self, source_path):

        self.source_path = Path(source_path)

        self.graph = nx.DiGraph()


    def analyze_file(self, file_path):

        source = file_path.read_text(
            encoding="utf-8"
        )

        tree = ast.parse(source)

        module_name = file_path.stem

        self.graph.add_node(
            module_name
        )

        dependencies = []

        for node in ast.walk(tree):

            if isinstance(
                node,
                ast.Import
            ):

                for alias in node.names:

                    dependencies.append(
                        alias.name.split(".")[0]
                    )


            elif isinstance(
                node,
                ast.ImportFrom
            ):

                if node.module:

                    dependencies.append(
                        node.module.split(".")[0]
                    )


        for dependency in dependencies:

            dependency_file = (
                self.source_path /
                f"{dependency}.py"
            )

            if dependency_file.exists():

                self.graph.add_node(
                    dependency
                )

                self.graph.add_edge(
                    module_name,
                    dependency
                )


    def analyze(self):

        for file_path in self.source_path.glob(
            "*.py"
        ):

            self.analyze_file(
                file_path
            )


        nodes = list(
            self.graph.nodes
        )

        edges = [
            {
                "source": source,
                "target": target
            }

            for source, target
            in self.graph.edges
        ]


        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }


    def get_graph(self):

        return self.graph