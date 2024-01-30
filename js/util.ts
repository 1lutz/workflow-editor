import {INodeOutputSlot, LGraphNode, LiteGraph} from "litegraph.js";
import {validate} from "jsonschema";
import {OPERATOR_CATEGORY} from "./constants";

export function registerWorkflowOperator(object: WorkflowOperatorDefinition) {
    let needsToValidateInputs = Boolean(object.required && object.required.length);
    const simplifiedInputs = object.inputs && object.inputs.map(input => {
        if (input.schema) {
            needsToValidateInputs = true;
        }
        return [input.name, input.type] as [string, string];
    });
    let simplifiedOutputType: string;
    let inputSlotToCopyTypeFrom: undefined | number = undefined;

    if (!object.outputType.startsWith("copyFrom")) {
        // noinspection JSUnusedAssignment
        simplifiedOutputType = object.outputType;
    } else {
        inputSlotToCopyTypeFrom = parseInt(object.outputType.substring(8));
        // noinspection JSUnusedAssignment
        simplifiedOutputType = object.inputs![inputSlotToCopyTypeFrom].type;
    }

    class NewNode extends LGraphNode implements OperatorNodeInfo {
        static title = object.title;
        static desc = object.desc || "Generated from object";
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

                    const inName = object.inputs![inIndex].name;
                    const inType = that.getInputDataType(inIndex);

                    if (inType === "raster" || inType === "vector") {
                        if (!res.sources) res.sources = {};
                        res.sources[inName] = inData;
                    } else {
                        res.params[inName] = inData;
                    }
                }

                for (let i = 0; i < object.inputs.length; i++) {
                    importInputData(i);
                }
            }
            this.setOutputData(0, res);
        }

        getInputSchema(slot: number): object | undefined {
            return object.inputs && object.inputs[slot]?.schema;
        }

        isInputRequired(slot: number): boolean {
            return Boolean(object.inputs && object.required && object.required.includes(object.inputs[slot]?.name));
        }
    }
    LiteGraph.registerNodeType(OPERATOR_CATEGORY + "/" + object.title, NewNode);
}

export function isOperatorNode(arg: any): arg is OperatorNodeInfo {
    return arg && typeof arg.getInputSchema === "function" && typeof arg.isInputRequired === "function";
}