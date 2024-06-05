import {
    ContextMenuItem,
    INodeInputSlot,
    INodeOutputSlot,
    INodeSlot,
    LGraphNode,
    LiteGraph,
    Vector2
} from "litegraph.js";
import {OPERATOR_CATEGORY, RASTER_REF_FORMAT, VECTOR_REF_FORMAT} from "./constants";
import {getBackend, getValidationSummary, isEmpty} from "./util";
import type {OperatorDefinitionSource, WorkflowOperator, OperatorDefinitionParams} from "./workflowSchema";
import {OperatorDefinitionParam} from "./workflowSchema";
import {Backend, DatasetType} from "./backend";
import {isSourceArray} from "./typeguards";
import OperatorDefinitionWrapper from "./operatorDefinitionWrapper";

export interface OperatorNodeInfo {
    title: string;
    params?: OperatorDefinitionParams;
    help_url: string;
}

function openInNewTab(url: string) {
    window.open(url, "_blank");
}

export async function customValidationOk(backend: Backend, instance: unknown, schema: OperatorDefinitionParam | OperatorDefinitionSource): Promise<string | null> {
    try {
        if ("format" in schema && typeof instance === "string") {
            if (schema.format === RASTER_REF_FORMAT) {
                return await backend.ensureDatasetType(instance, DatasetType.Raster);
            }
            if (schema.format === VECTOR_REF_FORMAT) {
                return await backend.ensureDatasetType(instance, DatasetType.Vector);
            }
        }
        if ("innerType" in schema && typeof schema.innerType === "string") {
            console.log("Validate source array", instance, "against schema", schema);
        }
    } catch (err: any) {
        //return "Error during custom validation of \"" + instance + "\" with", schema, ":", err;
        return `Ein Fehler ist beim Validieren von "${JSON.stringify(instance)}" gegen das Schema ${JSON.stringify(schema, null, 4)} aufgetreten: ${err.message}`;
    }
    return null;
}

export function registerWorkflowOperator(op: OperatorDefinitionWrapper) {
    const nodeId = OPERATOR_CATEGORY + "/" + op.id;

    Object.values(op.sources || {})
        .filter(sourceDef => !isSourceArray(sourceDef))
        .forEach(sourceDef => {
            // @ts-ignore
            let defaultOut: string[] = LiteGraph.slot_types_default_out[sourceDef.pinType];
            if (!defaultOut.includes(nodeId)) defaultOut.push(nodeId);
        });

    // @ts-ignore
    let defaultIn: string[] = LiteGraph.slot_types_default_in[op.outputType];
    defaultIn.push(nodeId);

    class NewNode extends LGraphNode implements OperatorNodeInfo {
        static title = op.title;
        static desc = op.description;
        params?: OperatorDefinitionParams;

        constructor() {
            super(NewNode.title);

            if (!isEmpty(op.sources)) {
                this.addInputs(Object.entries(op.sources!).map(([sourceName, sourceDef]) => [sourceName, sourceDef.pinType, undefined]));
            }
            this.addOutput("out", op.outputType);

            if (!isEmpty(op.params)) {
                this.addWidget("button", "params", "", this.edit.bind(this));
            }
        }

        edit() {
            op.showParamsEditor(this);
        }

        async onExecute() {
            const backend = getBackend(this.graph!);
            const validationSummary = getValidationSummary(this.graph!);

            if (!this.params) {
                this.has_errors = true;
                validationSummary.addError(NewNode.title, `Die Konfigurationsparameter wurden nicht richtig angegeben.`);
                return;
            }
            let isValid = true;

            for (const [paramName, paramVal] of Object.entries(this.params)) {
                const customErrorMessage = await customValidationOk(backend, paramVal, op.params![paramName]);

                if (typeof customErrorMessage === "string") {
                    validationSummary.addError(NewNode.title, customErrorMessage);
                    isValid = false;
                }
            }
            for (const [sourceName, sourceDef] of Object.entries(op.sources || {})) {
                const checkSet = op.isSourceRequired(sourceName);
                const checkSchema = isSourceArray(sourceDef);

                if (checkSet || checkSchema) {
                    const instance = this.getInputDataByName(sourceName);

                    if (checkSet && instance === undefined) {
                        validationSummary.addError(NewNode.title, `Der Parameter "${sourceName}" erwartet Daten, es wurden aber keine eingegeben.`);
                        return false;
                    }
                    if (checkSchema) {
                        const customErrorMessage = await customValidationOk(backend, instance, sourceDef);

                        if (typeof customErrorMessage === "string") {
                            validationSummary.addError(NewNode.title, customErrorMessage);
                            return false;
                        }
                    }
                }
            }
            if (isValid) {
                this.has_errors = false;
            } else {
                this.has_errors = true;
                this.setOutputData(0, undefined);
                return;
            }
            let res: WorkflowOperator = {
                type: op.id,
                params: this.params
            };
            if (!isEmpty(op.sources)) {
                res.sources = {};

                for (const sourceName of Object.keys(op.sources!)) {
                    const sourceData = this.getInputDataByName(sourceName);
                    if (sourceData === undefined) return;

                    res.sources[sourceName] = sourceData;
                }
            }
            this.setOutputData(0, res);
        }

        getExtraMenuOptions(): ContextMenuItem[] {
            let extras: ContextMenuItem[] = [];

            if (op.help_url) {
                extras.push({
                    content: "Operator Help",
                    callback: function () {
                        openInNewTab(op.help_url!);
                    }
                });
            }
            return extras;
        }

        getSlotMenuOptions(slot: INodeSlot): ContextMenuItem[] {
            const slot2 = slot as unknown as {
                input?: INodeInputSlot;
                output?: INodeOutputSlot;
                slot: number;
                link_pos: Vector2;
            };
            const isConnectedOutput = Boolean(slot2.output?.links?.length);

            if (isConnectedOutput) {
                return [{
                    content: "Disconnect Links",
                    // @ts-ignore
                    slot
                }];
            } else {
                return [];
            }
        }

        get help_url(): string {
            return op.help_url;
        }
    }

    LiteGraph.registerNodeType(nodeId, NewNode);
}
