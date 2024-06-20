import type {WorkflowOperator} from "./schema/workflowSchema";
import {ResultType, FeatureDataType} from "./schema/backendSchema";
import {Backend} from "./backend";
import {LGraphNode} from "litegraph.js";
import {buildWorkflowFromInput} from "./util";

const dispatcher: Record<string, (backend: Backend, instance: WorkflowOperator, node: LGraphNode) => Promise<string | undefined>> = {
    GdalSource: validateGdalSource,
    OgrSource: validateOgrSource,
    ColumnRangeFilter: validateColumnRangeFilter
};

export function customOperatorValidation(backend: Backend, instance: WorkflowOperator, node: LGraphNode): Promise<string | undefined> {
    const validator = dispatcher[instance.type];

    if (validator) {
        return validator(backend, instance, node)
            .catch(err => "Fehler beim Validieren: " + err.message);
    } else {
        return Promise.resolve(undefined);
    }
}

async function assertDatasetType(backend: Backend, instance: WorkflowOperator, expectedType: string) {
    const datasetName: string = instance.params.data;
    const foundType = await backend.getDatasetType(datasetName);

    if (foundType !== expectedType) {
        return `Es wird ein Datensatz vom Typ ${expectedType} erwartet, aber "${datasetName}" ist vom Typ ${foundType}.`;
    }
}

function validateGdalSource(backend: Backend, instance: WorkflowOperator) {
    const expectedType = ResultType.enum.raster;

    return assertDatasetType(backend, instance, expectedType);
}

async function validateOgrSource(backend: Backend, instance: WorkflowOperator) {
    const expectedType = ResultType.enum.vector;

    return assertDatasetType(backend, instance, expectedType);
}

async function validateColumnRangeFilter(backend: Backend, instance: WorkflowOperator, node: LGraphNode) {
    const workflow = buildWorkflowFromInput(node, 0);
    const workflowMetadata = await backend.getWorkflowMetadata(workflow);

    const expectedName: string = instance.params.column;
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
