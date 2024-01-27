import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("workflow_editor")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class WorkflowEditor(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"
    value = traitlets.Dict().tag(sync=True)
