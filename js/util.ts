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

export function binarySearch(max: number, getValueAt: (index: number) => number, match: number): number {
    let min = 0;

    while (min <= max) {
        const guess = Math.floor((min + max) / 2);
        const value = getValueAt(guess);

        if (value === match) {
            return guess;
        } else if (value < match) {
            min = guess + 1;
        } else {
            max = guess - 1;
        }
    }
    return max;
}

export function clippedString(str: string, maxWidth: number, ctx: CanvasRenderingContext2D): string {
    const ellipsis = "…";

    const textWidth = ctx.measureText(str).width;
    const ellipsisWidth = ctx.measureText(ellipsis).width;

    if (textWidth <= maxWidth || textWidth <= ellipsisWidth) {
        return str;
    }
    const index = binarySearch(
        str.length,
        guess => ctx.measureText(str.substring(0, guess)).width,
        maxWidth - ellipsisWidth
    );
    return str.substring(0, index) + ellipsis;
}
