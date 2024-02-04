import traitlets
import typing as t

G = t.TypeVar("G")
S = t.TypeVar("S")


class WorkflowOperatorDefinition(traitlets.TraitType[G, S]):
    info_text = "a workflow operator definition"

    @staticmethod
    def __check_inputs(inputs: t.Any) -> t.TypeGuard[list[dict]]:
        return inputs is None or (isinstance(inputs, list) and all(
            isinstance(o, dict) and
            "name" in o and isinstance(o["name"], str) and
            "type" in o and isinstance(o["type"], str) and
            ("forceAsSource" not in o or isinstance(o["forceAsSource"], bool)) and  # noqa
            ("schema" not in o or isinstance(o["schema"], dict))
            for o in inputs
        ))

    @staticmethod
    def __check_required(required: t.Any) -> t.TypeGuard[list[str]]:
        return required is None or (
            isinstance(required, list) and
            all(isinstance(o, str) for o in required)
        )

    def validate(self, obj: t.Any, value: t.Any) -> G:
        if isinstance(value, dict):
            if (
                "title" in value and isinstance(value["title"], str) and
                ("desc" not in value or isinstance(value["desc"], str)) and
                ("helpUrl" not in value or isinstance(value["helpUrl"], str)) and  # noqa
                WorkflowOperatorDefinition.__check_inputs(value.get("inputs")) and  # noqa
                WorkflowOperatorDefinition.__check_required(value.get("required")) and  # noqa
                value.get("outputType") in ["raster", "vector", "plot", "copyFromSource"]  # noqa
            ):
                return t.cast(G, value)
        self.error(obj, value)
