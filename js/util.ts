import type {JsonSchemaRef, Workflow} from "./schema/workflowSchema";
import {LGraph, LGraphNode} from "litegraph.js";
import {Backend} from "./backend";
import {ValidationSummary} from "./ui/validationSummary";
import {z} from "zod";
import {ErrorMessageResponse, Symbology} from "./schema/backendSchema";
import {ELLIPSIS, RANDOM_COLOR_DICT} from "./constants";

export function getDefinitionName(ref: JsonSchemaRef) {
    return ref.$ref.substring(14);
}

export async function fetchAndParse<T extends z.ZodTypeAny>(input: URL | RequestInfo, init: RequestInit | undefined, schema: T) {
    const res = await fetch(input, init);
    const schemaWithErr = z.union([schema, ErrorMessageResponse]);
    const json = res.headers.get("content-length") === "0" ? undefined : await res.json();
    const parsed = await schemaWithErr.parseAsync(json);

    if (parsed !== undefined && "error" in parsed) {
        throw new Error(json.message);
    }
    if (!res.ok) {
        throw new Error("HTTP error: " + res.status + " " + res.statusText);
    }
    return parsed as z.infer<T>;
}

const cachedJsonFiles = new Map<URL | RequestInfo, Promise<any>>();

export async function fetchAndParseWithCache<T extends z.ZodTypeAny>(input: URL | RequestInfo, init: RequestInit | undefined, schema: T) {
    let file = cachedJsonFiles.get(input);

    if (!file) {
        file = fetchAndParse(input, init, schema);
        cachedJsonFiles.set(input, file);
    }
    return file as Promise<z.infer<T>>;
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

export function isEmpty(arg: undefined | null | object | any[]): boolean {
    if (arg === undefined || arg === null) {
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

export function buildWorkflowFromInput(node: LGraphNode, slot: number): Workflow | null {
    const data = node.getInputData(slot);
    if (!data) return null;

    return {
        type: uppercaseFirstLetter(node.getInputDataType(slot)) as any,
        operator: data
    };
}

export function buildWorkflowFromOutput(node: LGraphNode): Workflow | null {
    const data = node.getOutputData(0);
    if (!data) return null;

    return {
        type: uppercaseFirstLetter(node.getOutputInfo(0)!.type) as any,
        operator: data
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
    const textWidth = ctx.measureText(str).width;
    const ellipsisWidth = ctx.measureText(ELLIPSIS).width;

    if (textWidth <= maxWidth || textWidth <= ellipsisWidth) {
        return str;
    }
    const index = binarySearch(
        str.length,
        guess => ctx.measureText(str.substring(0, guess)).width,
        maxWidth - ellipsisWidth
    );
    return str.substring(0, index) + ELLIPSIS;
}

export async function buildDefaultSymbologyForWorkflow(workflow: Workflow, workflowId: string, backend: Backend): Promise<Symbology> {
    if (workflow.type === "Raster") {
        return {
            type: 'raster',
            opacity: 1.0,
            rasterColorizer: {
                type: 'singleBand',
                band: 0,
                bandColorizer: {
                    type: 'linearGradient',
                    breakpoints: [
                        {value: 1, color: [0, 0, 0, 255]},
                        {value: 255, color: [255, 255, 255, 255]},
                    ],
                    overColor: [255, 255, 255, 127],
                    underColor: [0, 0, 0, 127],
                    noDataColor: [0, 0, 0, 0],
                },
            },
        };
    }
    const resultDescriptor = await backend.getWorkflowMetadata(workflowId);
    if (resultDescriptor.type !== "vector") throw new Error("Unsupported workflow type");

    switch (resultDescriptor.dataType) {
        case "MultiPoint":
            return {
                type: 'point',
                radius: {
                    type: 'static',
                    value: 10
                },
                stroke: {
                    width: {
                        type: 'static',
                        value: 1
                    },
                    color: {
                        type: 'static',
                        color: [0, 0, 0, 255]
                    }
                },
                fillColor: {
                    type: 'static',
                    color: RANDOM_COLOR_DICT
                }
            };
        case "MultiLineString":
            return {
                type: 'line',
                stroke: {
                    width: {type: 'static', value: 1},
                    color: {
                        type: 'static',
                        color: RANDOM_COLOR_DICT
                    }
                },
                autoSimplified: true
            };
        case "MultiPolygon":
            return {
                type: 'polygon',
                stroke: {
                    width: {
                        type: 'static',
                        value: 1
                    },
                    color: {
                        type: 'static',
                        color: [0, 0, 0, 255]
                    }
                },
                fillColor: {
                    type: 'static',
                    color: RANDOM_COLOR_DICT
                },
                autoSimplified: true
            };
        default:
            throw new Error('unknown symbology type');
    }
}

export function simpleErrorHandler(actionDescription: string, error: any) {
    alert("Failed to " + actionDescription + ": " + error.message);
}
