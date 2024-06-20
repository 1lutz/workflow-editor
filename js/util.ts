import type {JsonSchemaRef, Workflow} from "./schema/workflowSchema";
import {LGraph, LGraphNode} from "litegraph.js";
import {Backend} from "./backend";
import {ValidationSummary} from "./ui/validationSummary";
import {z} from "zod";
import {ErrorMessageResponse} from "./schema/backendSchema";

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

const cachedJsonFiles: { [url: string]: Promise<any> } = {};

export function checkedJsonFetchWithCache(url: string) {
    let file = cachedJsonFiles[url];

    if (!file) {
        file = checkedJsonFetch(url);
        cachedJsonFiles[url] = file;
    }
    return file;
}

export async function fetchAndParse<T extends z.ZodTypeAny>(input: URL | RequestInfo, init: RequestInit | undefined, schema: T) {
    const res = await fetch(input, init);
    const schemaWithErr = z.union([schema, ErrorMessageResponse]);
    const json = await schemaWithErr.parseAsync(await res.json());

    if ("error" in json) {
        throw new Error(json.message);
    }
    if (!res.ok) {
        throw new Error("HTTP error: " + res.status + " " + res.statusText);
    }
    return json as z.infer<T>;
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
    } else if (Array.isArray(arg)) {
        return arg.length === 0;
    } else {
        return Object.keys(arg).length === 0;
    }
}

export function uppercaseFirstLetter(s: string): string {
    return s[0].toUpperCase() + s.substring(1);
}

export function buildWorkflowFromInput(node: LGraphNode, slot: number): Workflow {
    return {
        type: uppercaseFirstLetter(node.getInputDataType(slot)),
        operator: node.getInputData(slot)
    };
}
