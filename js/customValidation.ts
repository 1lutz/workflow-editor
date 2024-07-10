import type {WorkflowOperator} from "./schema/workflowSchema";
import {ResultType, FeatureDataType} from "./schema/backendSchema";
import {Backend} from "./backend";
import {LGraphNode} from "litegraph.js";
import {buildWorkflowFromInput} from "./util";
import {isPromise} from "./typeguards";

type ValidationMessage = string | undefined;

const dispatcher: Record<string, (instance: WorkflowOperator, backend: Backend, node: LGraphNode) => Promise<ValidationMessage> | ValidationMessage> = {
    GdalSource: validateGdalSource,
    OgrSource: validateOgrSource,
    NeighborhoodAggregate: validateNeighborhoodAggregate,
    ColumnRangeFilter: validateColumnRangeFilter
};

export function customOperatorValidation(instance: WorkflowOperator, backend: Backend, node: LGraphNode): Promise<ValidationMessage> {
    const validator = dispatcher[instance.type];

    if (validator) {
        try {
            const res = validator(instance, backend, node);

            if (isPromise(res))
                return res.catch(err => {
                    // Validator was async and threw an unexpected error
                    return "Fehler beim Validieren: " + err.message;
                });
            else
                return Promise.resolve(res);
        } catch (err: any) {
            // Validator was sync and threw an unexpected error
            return Promise.resolve("Fehler beim Validieren: " + err.message);
        }
    } else {
        return Promise.resolve(undefined);
    }
}

async function assertDatasetType(instance: WorkflowOperator, backend: Backend, expectedType: string) {
    const datasetName: string = instance.params.data;
    const foundType = await backend.getDatasetType(datasetName);

    if (foundType !== expectedType) {
        return `Es wird ein Datensatz vom Typ ${expectedType} erwartet, aber "${datasetName}" ist vom Typ ${foundType}.`;
    }
}

function validateGdalSource(instance: WorkflowOperator, backend: Backend) {
    const expectedType = ResultType.enum.raster;

    return assertDatasetType(instance, backend, expectedType);
}

async function validateOgrSource(instance: WorkflowOperator, backend: Backend) {
    const expectedType = ResultType.enum.vector;

    return assertDatasetType(instance, backend, expectedType);
}

function validateNeighborhoodAggregate(instance: WorkflowOperator) {
    if (instance.params.neighborhood.type === "weightsMatrix") {
        const weights: number[][] = instance.params.neighborhood.weights;
        const columnCount = weights.length;

        if (columnCount % 2 === 0) {
            return "Die Gewichtungsmatrix muss ungerade Dimensionen haben.";
        }
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            const currentRowLength = weights[columnIndex].length;

            if (currentRowLength !== columnCount) {
                return `Es gibt ${columnCount} Spalten. Daher muss jede Zeile ${columnCount} Zellen besitzen. Zeile ${columnIndex + 1} hat aber ${currentRowLength} Zellen.`;
            }
        }
    }
}

async function validateColumnRangeFilter(instance: WorkflowOperator, backend: Backend, node: LGraphNode) {
    const workflow = buildWorkflowFromInput(node, 0)!;
    const workflowMetadata = await backend.getWorkflowMetadata(workflow);

    const expectedName: string = instance.params.column;
    // @ts-ignore
    const foundColumnMeta = workflowMetadata.columns[expectedName];

    if (!foundColumnMeta) {
        return `Die Quelle enthält keine Spalte mit dem Namen "${expectedName}".`;
    }

    const expectedType = instance.params.ranges.length > 0 ? typeof instance.params.ranges[0][0] : undefined;

    if (!expectedType) {
        return undefined;
    }
    if (foundColumnMeta.dataType === FeatureDataType.enum.text) {
        if (expectedType !== "string") {
            return `Die Spalte "${expectedName}" ist vom Typ ${foundColumnMeta.dataType}, aber die Range besteht nicht aus Strings.`;
        }
    } else {
        if (expectedType !== "number") {
            return `Die Spalte "${expectedName}" ist vom Typ ${foundColumnMeta.dataType}, aber die Range besteht nicht aus Zahlen.`;
        }
    }
}
