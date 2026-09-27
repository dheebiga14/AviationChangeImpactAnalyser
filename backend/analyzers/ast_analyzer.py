import ast
from pathlib import Path


class ASTAnalyzer:

    def __init__(self, file_path):

        self.file_path = Path(file_path)


    def analyze(self):

        source = self.file_path.read_text(
            encoding="utf-8"
        )

        tree = ast.parse(source)

        functions = []
        classes = []
        imports = []
        calls = []

        for node in ast.walk(tree):

            if isinstance(
                node,
                (ast.FunctionDef, ast.AsyncFunctionDef)
            ):

                functions.append({
                    "name": node.name,
                    "line": node.lineno
                })


            elif isinstance(
                node,
                ast.ClassDef
            ):

                classes.append({
                    "name": node.name,
                    "line": node.lineno
                })


            elif isinstance(
                node,
                ast.Import
            ):

                for alias in node.names:

                    imports.append(
                        alias.name
                    )


            elif isinstance(
                node,
                ast.ImportFrom
            ):

                if node.module:

                    imports.append(
                        node.module
                    )


            elif isinstance(
                node,
                ast.Call
            ):

                if isinstance(
                    node.func,
                    ast.Name
                ):

                    calls.append(
                        node.func.id
                    )

                elif isinstance(
                    node.func,
                    ast.Attribute
                ):

                    calls.append(
                        node.func.attr
                    )


        return {
            "file": self.file_path.name,
            "functions": functions,
            "classes": classes,
            "imports": imports,
            "calls": calls
        }