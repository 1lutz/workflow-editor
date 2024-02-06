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
import {OPERATOR_CATEGORY, GEO_TYPES} from "./constants";

function isSource(input: WorkflowOperatorInput): boolean {
    return input.forceAsSource || GEO_TYPES.some(sourceType => input.type.includes(sourceType));
}

function openInNewTab(url: string) {
    window.open(url, "_blank");//?.focus();
}

export function registerWorkflowOperator(object: WorkflowOperatorDefinition) {
    const nodeId = OPERATOR_CATEGORY + "/" + object.title;
    let needsToValidateInputs = Boolean(object.required && object.required.length);
    const simplifiedInputs = object.inputs && object.inputs.map(input => {
        if (input.schema) {
            needsToValidateInputs = true;
        }
        input.type
            .split(",")
            .filter(singleType => GEO_TYPES.includes(singleType))
            .forEach(singleGeoType => {
                // @ts-ignore
                let defaultOut: string[] = LiteGraph.slot_types_default_out[singleGeoType];
                if (!defaultOut.includes(nodeId)) defaultOut.push(nodeId);
            });
        return [input.name, input.type] as [string, string];
    });
    let simplifiedOutputType: string;
    let inputSlotToCopyTypeFrom: undefined | number = undefined;

    if (object.outputType === "copyFromSource") {
        inputSlotToCopyTypeFrom = object.inputs!.findIndex(isSource);
        // noinspection JSUnusedAssignment
        simplifiedOutputType = object.inputs![inputSlotToCopyTypeFrom].type;
    } else {
        // noinspection JSUnusedAssignment
        simplifiedOutputType = object.outputType;
        // @ts-ignore
        // noinspection JSMismatchedCollectionQueryUpdate
        let defaultIn: string[] = LiteGraph.slot_types_default_in[object.outputType];
        defaultIn.push(nodeId);
    }

    class NewNode extends LGraphNode implements OperatorNodeInfo {
        static title = object.title;
        static desc = object.desc || "Workflow Operator";
        defaultBoxColor: string;

        constructor() {
            super(object.title);
            this.defaultBoxColor = this.boxcolor;

            if (simplifiedInputs) {
                this.addInputs(simplifiedInputs);
            }
            this.addOutput("out", simplifiedOutputType);
        }

        onConnectInput(inputIndex: number, newOutputType: INodeOutputSlot["type"]): boolean {
            if (inputIndex === inputSlotToCopyTypeFrom) {
                const oldOutputType = this.getOutputInfo(0)!.type;

                if (newOutputType !== oldOutputType) {
                    this.disconnectOutput(0);
                    this.setOutputDataType(0, newOutputType);
                }
            }
            return true;
        }

        onExecute() {
            const that = this;

            if (needsToValidateInputs) {
                let isValid = true;

                function validateInput(inIndex: number) {
                    const inputInfo = object.inputs![inIndex];
                    const checkSet = Boolean(object.required && object.required.includes(inputInfo.name));
                    const checkSchema = Boolean(inputInfo.schema);

                    if (checkSet || checkSchema) {
                        const instance = that.getInputData(inIndex);

                        if (checkSet && instance === undefined) {
                            return false;
                        }
                        if (checkSchema && !validate(instance, inputInfo.schema).valid) {
                            return false;
                        }
                    }
                    return true;
                }

                for (let i = 0; i < object.inputs!.length; i++) {
                    if (!validateInput(i)) {
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
                type: object.title,
                params: {}
            };
            if (object.inputs) {
                function importInputData(inIndex: number) {
                    const inData = that.getInputData(inIndex);
                    if (inData === undefined) return;

                    const inInfo = object.inputs![inIndex];

                    if (isSource(inInfo)) {
                        if (!res.sources) res.sources = {};
                        res.sources[inInfo.name] = inData;
                    } else {
                        res.params[inInfo.name] = inData;
                    }
                }

                for (let i = 0; i < object.inputs.length; i++) {
                    importInputData(i);
                }
            }
            this.setOutputData(0, res);
        }

        getExtraMenuOptions(): ContextMenuItem[] {
            let extras: ContextMenuItem[] = [];

            if (object.helpUrl) {
                extras.push({
                    content: "Operator Help",
                    callback: function () {
                        openInNewTab(object.helpUrl!);
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
            const helpUrl = slot2.input && object.inputs![slot2.slot].helpUrl;
            const isOutputConnected = Boolean(slot2.output?.links?.length);

            if (helpUrl) {
                return [{
                    content: "Input Help",
                    callback: function () {
                        openInNewTab(helpUrl);
                    }
                }];
            } else if (isOutputConnected) {
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
            return object.inputs && object.inputs[slot]?.schema;
        }

        isInputRequired(slot: number): boolean {
            return Boolean(object.inputs && object.required && object.required.includes(object.inputs[slot]?.name));
        }
    }

    LiteGraph.registerNodeType(nodeId, NewNode);
}

export function isOperatorNode(arg: any): arg is OperatorNodeInfo {
    return arg && typeof arg.getInputSchema === "function" && typeof arg.isInputRequired === "function";
}