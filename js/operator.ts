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
import {getBackend, getDefinitionName, hasSchemaRestrictions} from "./util";
import type {OperatorDefinition} from "./operatorDefinitions";
import {Backend} from "./backend";
import {OperatorDefinitionParam} from "./operatorDefinitions";
import {DatasetType} from "./backend";

function openInNewTab(url: string) {
    window.open(url, "_blank");
}

export async function customValidationOk(backend: Backend, instance: unknown, schema?: OperatorDefinitionParam) {
    try {
        if (schema?.format === RASTER_REF_FORMAT) {
            return typeof instance === "string" && await backend.getDatasetType(instance) === DatasetType.Raster;
        }
        if (schema?.format === VECTOR_REF_FORMAT) {
            return typeof instance === "string" && await backend.getDatasetType(instance) === DatasetType.Vector;
        }
    } catch (err) {
        console.log("Error during custom validation of \"" + instance + "\" with", schema, ":", err);
        return false;
    }
    return true;
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
                this.addInputs(simplifiedInputs.map(input => [input.name, input.type]));
            }
            this.addOutput("out", outputType);
        }

        async onExecute() {
            const that = this;
            const backend = getBackend(that.graph!);

            if (needsToValidateInputs) {
                let isValid = true;

                async function validateInput(inIndex: number) {
                    const inputInfo = simplifiedInputs[inIndex];
                    const checkSet = inputInfo.required;
                    const checkSchema = Boolean(inputInfo.schema);

                    if (checkSet || checkSchema) {
                        const instance = that.getInputData(inIndex);

                        if (checkSet && instance === undefined) {
                            return false;
                        }
                        if (checkSchema && (!validate(instance, inputInfo.schema).valid || !await customValidationOk(backend, instance, inputInfo.schema))) {
                            return false;
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
