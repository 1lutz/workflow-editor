import {
    ContextMenuItem,
    INodeInputSlot,
    INodeOutputSlot,
    INodeSlot,
    LGraphNode,
    LiteGraph,
    Vector2
} from "litegraph.js";
import {validate} from "jsonschema";
import {OPERATOR_CATEGORY, RASTER_REF_FORMAT, VECTOR_REF_FORMAT} from "./constants";
import {getBackend, getDefinitionName, getValidationSummary, hasSchemaRestrictions} from "./util";
import type {OperatorDefinition} from "./operatorDefinitions";
import type {WorkflowOperator} from "./workflowTypes";
import {OperatorDefinitionParam} from "./operatorDefinitions";
import {Backend, DatasetType} from "./backend";

export interface OperatorNodeInfo {
    getInputSchema(slot: number): any | undefined;

    isInputRequired(slot: number): boolean;
}

function openInNewTab(url: string) {
    window.open(url, "_blank");
}

export async function customValidationOk(backend: Backend, instance: any, schema?: OperatorDefinitionParam): Promise<string | null> {
    try {
        if (schema?.format === RASTER_REF_FORMAT) {
            return await backend.ensureDatasetType(instance, DatasetType.Raster);
        }
        if (schema?.format === VECTOR_REF_FORMAT) {
            return await backend.ensureDatasetType(instance, DatasetType.Vector);
        }
    } catch (err: any) {
        //return "Error during custom validation of \"" + instance + "\" with", schema, ":", err;
        return `Ein Fehler ist beim Validieren von "${JSON.stringify(instance)}" gegen das Schema ${JSON.stringify(schema, null, 4)} aufgetreten: ${err.message}`;
    }
    return null;
}

type SimplifiedInputInfo = {
    name: string,
    type: string,
    required: boolean,
    schema?: OperatorDefinitionParam,
    isSource: boolean,
    help_text?: string
}

export function registerWorkflowOperator(object: OperatorDefinition, outputType: string) {
    const nodeId = OPERATOR_CATEGORY + "/" + object.properties.type.enum[0];
    let needsToValidateInputs = Boolean(object.properties.params.required?.length) || Boolean(object.properties.sources?.required?.length);
    let simplifiedInputs: SimplifiedInputInfo[] = [];

    for (const [paramName, paramDef] of Object.entries(object.properties.params.properties || {})) {
        const paramHasRestrictions = hasSchemaRestrictions(paramDef);

        if (paramHasRestrictions) {
            needsToValidateInputs = true;
        }
        simplifiedInputs.push({
            name: paramName,
            type: paramDef.type,
            required: object.properties.params.required?.includes(paramName) ?? false,
            schema: paramHasRestrictions ? paramDef : undefined,
            isSource: false,
            help_text: paramDef.help_text
        });
    }
    for (const [sourceName, sourceDef] of Object.entries(object.properties.sources?.properties || {})) {
        const sourceType = getDefinitionName(sourceDef);

        // @ts-ignore
        let defaultOut: string[] = LiteGraph.slot_types_default_out[sourceType];
        if (!defaultOut.includes(nodeId)) defaultOut.push(nodeId);

        simplifiedInputs.push({
            name: sourceName,
            type: sourceType,
            required: object.properties.sources?.required?.includes(sourceName) ?? false,
            isSource: true
        });
    }

    // @ts-ignore
    let defaultIn: string[] = LiteGraph.slot_types_default_in[outputType];
    defaultIn.push(nodeId);

    class NewNode extends LGraphNode implements OperatorNodeInfo {
        static title = object.title || object.properties.type.enum[0];
        static desc = object.description || "Workflow Operator";
        defaultBoxColor: string;

        constructor() {
            super(NewNode.title);
            this.defaultBoxColor = this.boxcolor;

            if (simplifiedInputs) {
                this.addInputs(simplifiedInputs.map(input => [input.name, input.type, undefined]));
            }
            this.addOutput("out", outputType);
        }

        async onExecute() {
            const that = this;
            const backend = getBackend(that.graph!);
            const validationSummary = getValidationSummary(this.graph!);

            if (needsToValidateInputs) {
                let isValid = true;

                async function validateInput(inIndex: number) {
                    const inputInfo = simplifiedInputs[inIndex];
                    const checkSet = inputInfo.required;
                    const checkSchema = Boolean(inputInfo.schema);

                    if (checkSet || checkSchema) {
                        const instance = that.getInputData(inIndex);

                        if (checkSet && instance === undefined) {
                            validationSummary.addError(NewNode.title, `Der Parameter "${inputInfo.name}" erwartet Daten, es wurden aber keine eingegeben.`);
                            return false;
                        }
                        if (checkSchema) {
                            const schemaValidationRes = validate(instance, inputInfo.schema);

                            if (!schemaValidationRes.valid) {
                                for (const error of schemaValidationRes.errors) {
                                    validationSummary.addError(NewNode.title, JSON.stringify(error)); // TODO
                                }
                                return false;
                            }
                            const customErrorMessage = await customValidationOk(backend, instance, inputInfo.schema);

                            if (typeof customErrorMessage === "string") {
                                validationSummary.addError(NewNode.title, customErrorMessage);
                                return false;
                            }
                        }
                    }
                    return true;
                }

                for (let i = 0; i < simplifiedInputs.length; i++) {
                    if (!await validateInput(i)) {
                        isValid = false;
                        break;
                    }
                }
                if (isValid) {
                    this.boxcolor = this.defaultBoxColor;
                } else {
                    this.boxcolor = "red";
                    this.setOutputData(0, undefined);
                    return;
                }
            }
            let res: WorkflowOperator = {
                type: object.properties.type.enum[0],
                params: {}
            };
            if (simplifiedInputs.length) {
                function importInputData(inIndex: number) {
                    const inData = that.getInputData(inIndex);
                    if (inData === undefined) return;

                    const inInfo = simplifiedInputs[inIndex];

                    if (inInfo.isSource) {
                        if (!res.sources) res.sources = {};
                        res.sources[inInfo.name] = inData;
                    } else {
                        res.params[inInfo.name] = inData;
                    }
                }

                for (let i = 0; i < simplifiedInputs.length; i++) {
                    importInputData(i);
                }
            }
            this.setOutputData(0, res);
        }

        getExtraMenuOptions(): ContextMenuItem[] {
            let extras: ContextMenuItem[] = [];

            if (object.help_text) {
                extras.push({
                    content: "Operator Help",
                    callback: function () {
                        openInNewTab(object.help_text!);
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
            const help_text = slot2.input && simplifiedInputs[slot2.slot].help_text;
            const isConnectedOutput = Boolean(slot2.output?.links?.length);

            if (help_text) {
                return [{
                    content: "Input Help",
                    callback: function () {
                        openInNewTab(help_text);
                    }
                }];
            } else if (isConnectedOutput) {
                return [{
                    content: "Disconnect Links",
                    // @ts-ignore
                    slot
                }];
            } else {
                return [];
            }
        }

        getInputSchema(slot: number): object | undefined {
            return simplifiedInputs[slot]?.schema;
        }

        isInputRequired(slot: number): boolean {
            return Boolean(simplifiedInputs[slot].required);
        }
    }

    LiteGraph.registerNodeType(nodeId, NewNode);
}
