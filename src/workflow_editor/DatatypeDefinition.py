from traitlets import Dict, List, Unicode, TraitType
import typing as t

G = t.TypeVar("G")
S = t.TypeVar("S")


class DatatypeDefinitionKey(TraitType[G, S]):
    info_text = "\"oneOf\""

    def validate(self, obj: t.Any, value: t.Any):
        if value == "oneOf":
            return t.cast(G, value)
        self.error(obj, value)


DatatypeDefinition = Dict(key_trait=DatatypeDefinitionKey(), per_key_traits={
    "oneOf": List(trait=Dict(per_key_traits={
        "$ref": Unicode()
    }))
})
