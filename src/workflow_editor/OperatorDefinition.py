from traitlets import Dict, List, Unicode, TraitType
import typing as t

G = t.TypeVar("G")
S = t.TypeVar("S")


class OperatorDefinitionKey(TraitType[G, S]):
    info_text = "not \"oneOf\""

    def validate(self, obj: t.Any, value: t.Any):
        if value != "oneOf":
            return t.cast(G, value)
        self.error(obj, value)


OperatorDefinition = Dict(key_trait=OperatorDefinitionKey(), per_key_traits={
    "title": Unicode(allow_none=True),
    "description": Unicode(allow_none=True),
    "help_text": Unicode(allow_none=True),
    "properties": Dict(per_key_traits={
        "type": Dict(per_key_traits={
            "enum": List(trait=Unicode(), minlen=1, maxlen=1)
        }),
        "params": Dict(per_key_traits={
            "properties": Dict(allow_none=True, value_trait=Dict(
                per_key_traits={
                    "type": Unicode(),
                    "help_text": Unicode(allow_none=True),
                    "items": Dict(allow_none=True),
                    "properties": Dict(allow_none=True)
                }
            )),
            "required": List(allow_none=True, trait=Unicode())
        }),
        "sources": Dict(allow_none=True, per_key_traits={
            "properties": Dict(value_trait=Dict(
                per_key_traits={
                    "$ref": Unicode()
                }
            )),
            "required": List(allow_none=True, trait=Unicode())
        })
    })
})
