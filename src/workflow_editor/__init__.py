import importlib.metadata
import pathlib

import anywidget
import traitlets
import typing as t
import requests
import requests_file

from workflow_editor.WorkflowOperatorDefinition import (
    WorkflowOperatorDefinition
)

try:
    __version__ = importlib.metadata.version("workflow_editor")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

session = requests.Session()
session.mount('file://', requests_file.FileAdapter())


class WorkflowEditor(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    definitions = traitlets.List(WorkflowOperatorDefinition())\
        .tag(sync=True)  # type: traitlets.traitlets.List[WorkflowOperatorDefinition] # noqa
    workflow = traitlets.Dict(
        default_value=None,
        allow_none=True,
        read_only=True
    )\
        .tag(sync=True)

    def load_definitions_from(self, url: str):
        self.definitions = session.get(url).json()
