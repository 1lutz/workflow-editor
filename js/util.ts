export function getDefinitionName(ref: JsonSchemaRef) {
    return ref.$ref.substring(14);
}

const metaOnlySchemaProps = ["title", "help_text", "type"];

export function hasSchemaRestrictions(schema: object) {
    for (const schemaKey in schema) {
        if (!metaOnlySchemaProps.includes(schemaKey)) {
            return true;
        }
    }
    return false;
}