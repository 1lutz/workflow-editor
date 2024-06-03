import type {JsonSchemaRef} from "./workflowSchema";
import {LGraph} from "litegraph.js";
import {Backend} from "./backend";
import {ValidationSummary} from "./validationSummary";

export function getDefinitionName(ref: JsonSchemaRef) {
    return ref.$ref.substring(14);
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

export function getBackend(graph: LGraph): Backend {
    // @ts-ignore
    return graph.backend;
}

export function getValidationSummary(graph: LGraph): ValidationSummary {
    // @ts-ignore
    return graph.validationSummary;
}

export function joinDistinct(arr: any[], separator?: string) {
    return [...new Set(arr)].join(separator);
}

export function isEmpty(arg: undefined | object | any[]): boolean {
    if (arg === undefined) {
        return true;
    }
    else if (Array.isArray(arg)) {
        return arg.length === 0;
    } else {
        return Object.keys(arg).length === 0;
    }
}
