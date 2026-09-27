import ast
import difflib
from pathlib import Path


class ChangeDetector:

    def __init__(self, old_path, new_path):

        self.old_path = Path(old_path)
        self.new_path = Path(new_path)


    def read_file(self, path):

        try:

            return path.read_text(
                encoding="utf-8"
            )

        except Exception:

            return ""


    def get_functions(self, source):

        functions = []

        try:

            tree = ast.parse(source)

            for node in ast.walk(tree):

                if isinstance(
                    node,
                    (ast.FunctionDef, ast.AsyncFunctionDef)
                ):

                    functions.append(node.name)

        except Exception:

            pass

        return functions


    def compare_files(
        self,
        old_file,
        new_file
    ):

        old_source = self.read_file(old_file)
        new_source = self.read_file(new_file)

        old_lines = old_source.splitlines()
        new_lines = new_source.splitlines()

        diff = list(
            difflib.unified_diff(
                old_lines,
                new_lines,
                lineterm=""
            )
        )

        old_functions = set(
            self.get_functions(old_source)
        )

        new_functions = set(
            self.get_functions(new_source)
        )

        added_functions = list(
            new_functions - old_functions
        )

        removed_functions = list(
            old_functions - new_functions
        )

        return {
            "file": new_file.name,
            "changed": len(diff) > 0,
            "added_lines": sum(
                1 for line in diff
                if line.startswith("+")
                and not line.startswith("+++")
            ),
            "removed_lines": sum(
                1 for line in diff
                if line.startswith("-")
                and not line.startswith("---")
            ),
            "added_functions": added_functions,
            "removed_functions": removed_functions,
            "diff": diff
        }


    def detect_changes(self):

        old_files = {
            file.name: file
            for file in self.old_path.glob("*.py")
        }

        new_files = {
            file.name: file
            for file in self.new_path.glob("*.py")
        }

        all_files = sorted(
            set(old_files.keys()) |
            set(new_files.keys())
        )

        file_changes = []

        changed_modules = []

        for filename in all_files:

            old_file = old_files.get(filename)
            new_file = new_files.get(filename)

            if old_file and new_file:

                result = self.compare_files(
                    old_file,
                    new_file
                )

            elif new_file:

                result = {
                    "file": filename,
                    "changed": True,
                    "status": "ADDED",
                    "added_lines": len(
                        self.read_file(new_file).splitlines()
                    ),
                    "removed_lines": 0,
                    "added_functions": self.get_functions(
                        self.read_file(new_file)
                    ),
                    "removed_functions": [],
                    "diff": []
                }

            else:

                result = {
                    "file": filename,
                    "changed": True,
                    "status": "REMOVED",
                    "added_lines": 0,
                    "removed_lines": len(
                        self.read_file(old_file).splitlines()
                    ),
                    "added_functions": [],
                    "removed_functions": self.get_functions(
                        self.read_file(old_file)
                    ),
                    "diff": []
                }

            file_changes.append(result)

            if result["changed"]:

                changed_modules.append(
                    filename.replace(".py", "")
                )

        return {
            "total_files": len(all_files),

            "changed_files": len(
                changed_modules
            ),

            "changed_modules": changed_modules,

            "files": file_changes
        }