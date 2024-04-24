import type {JsonSchemaRef} from "./editorSchema";

export function getDefinitionName(ref: JsonSchemaRef) {
    return ref.$ref.substring(14);
}

const metaOnlySchemaProps = ["id", "$schema", "title", "description", "type", "help_text"];

export function hasSchemaRestrictions(schema: object) {
    for (const schemaKey in schema) {
        if (!metaOnlySchemaProps.includes(schemaKey)) {
            return true;
        }
    }
    return false;
}

const cachedJsonFiles: {[url: string]: Promise<any>} = {};

export function cachedJsonFetch(url: string) {
    let file = cachedJsonFiles[url];

    if (!file) {
        file = fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error("HTTP error: " + res.status + " " + res.statusText);
                }
                return res.json();
            });
        cachedJsonFiles[url] = file;
    }
    return file;
}