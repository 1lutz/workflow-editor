import type {JsonSchemaRef, OperatorDefinitionParam} from "./operatorDefinitions";
import {RASTER_REF_FORMAT, VECTOR_REF_FORMAT} from "./constants";

export function getDefinitionName(ref: JsonSchemaRef) {
    return ref.$ref.substring(14);
}

const metaOnlySchemaProps = ["id", "$schema", "title", "description", "type", "help_text"];

export function hasSchemaRestrictions(schema: OperatorDefinitionParam) {
    if (schema.format === RASTER_REF_FORMAT || schema.format === VECTOR_REF_FORMAT) {
        return true;
    }
    for (const schemaKey in schema) {
        if (!metaOnlySchemaProps.includes(schemaKey)) {
            return true;
        }
    }
    return false;
}

export function checkedJsonFetch(url: string, init?: RequestInit) {
    return fetch(url, init)
        .then(res => {
            if (!res.ok) {
                throw new Error("HTTP error: " + res.status + " " + res.statusText);
            }
            return res.json();
        });
}

const cachedJsonFiles: {[url: string]: Promise<any>} = {};

export function cachedCheckedJsonFetch(url: string) {
    let file = cachedJsonFiles[url];

    if (!file) {
        file = checkedJsonFetch(url);
        cachedJsonFiles[url] = file;
    }
    return file;
}