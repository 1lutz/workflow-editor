import importlib.metadata
import pathlib

import anywidget
import traitlets
import typing as t

try:
    __version__ = importlib.metadata.version("workflow_editor")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class WorkflowEditor(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    serverUrl = traitlets.Unicode().tag(sync=True)
    token = traitlets.Unicode().tag(sync=True)
    workflow = traitlets.Dict(
        default_value=None,
        allow_none=True,
        read_only=True
    )\
        .tag(sync=True)

    def __init__(self, serverUrl, token):
        super().__init__()
        self.serverUrl = serverUrl
        self.token = token
