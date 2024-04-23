import importlib.metadata
import pathlib

import anywidget
import traitlets
import typing as t
import requests
import requests_file

from workflow_editor.OperatorDefinition import (
    OperatorDefinition
)
from workflow_editor.DatatypeDefinition import (
    DatatypeDefinition
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

    schema = traitlets.Dict(per_key_traits={
        "definitions": traitlets.Dict(value_trait=traitlets.Union([
            OperatorDefinition,
            DatatypeDefinition
        ]))
    })\
        .tag(sync=True)
    workflow = traitlets.Dict(
        default_value=None,
        allow_none=True,
        read_only=True
    )\
        .tag(sync=True)

    def load_schema_from(self, url: str):
        self.schema = session.get(url).json()
