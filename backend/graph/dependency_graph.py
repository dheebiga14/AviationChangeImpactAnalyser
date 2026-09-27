import networkx as nx


class DependencyGraph:

    def __init__(self):
        self.graph = nx.DiGraph()

    def add_module(self, module_name):

        self.graph.add_node(
            module_name
        )

    def add_dependency(
        self,
        source,
        target
    ):

        self.graph.add_edge(
            source,
            target
        )

    def build_from_dependencies(
        self,
        nodes,
        edges
    ):

        self.graph.clear()

        for node in nodes:
            self.add_module(node)

        for edge in edges:

            self.add_dependency(
                edge["source"],
                edge["target"]
            )

        return self.graph

    def get_nodes(self):

        return list(
            self.graph.nodes
        )

    def get_edges(self):

        return [
            {
                "source": source,
                "target": target
            }
            for source, target
            in self.graph.edges
        ]

    def get_node_count(self):

        return self.graph.number_of_nodes()

    def get_edge_count(self):

        return self.graph.number_of_edges()

    def find_dependents(
        self,
        module
    ):

        if module not in self.graph:
            return []

        return list(
            self.graph.predecessors(module)
        )

    def find_dependencies(
        self,
        module
    ):

        if module not in self.graph:
            return []

        return list(
            self.graph.successors(module)
        )

    def get_graph_data(self):

        return {
            "nodes": self.get_nodes(),
            "edges": self.get_edges(),
            "node_count": self.get_node_count(),
            "edge_count": self.get_edge_count()
        }