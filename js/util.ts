import {INodeOutputSlot, LGraphNode, LiteGraph} from "litegraph.js";
import {validate} from "jsonschema";

export function extendedRegisterNodeClassFromObject(object: {
    name: string,
    title: string,
    desc?: string,
    inputs?: [string, string, object?][],
    outputs?: [string, string][]
}) {
    let typesToCopy: { [key: number]: number[] } = {};
    let needsToValidateInputs = false;
    const simplifiedInputs = object.inputs && object.inputs.map(input => {
        if (input.length === 2) {
            return input as [string, string];
        } else {
            needsToValidateInputs = true;
            return [input[0], input[1]] as [string, string];
        }
    });
    const simplifiedOutputs = object.outputs && object.outputs.map((output, outIndex) => {
        if (!output[1].startsWith("copyFrom")) {
            return output;
        } else {
            const srcIndex = parseInt(output[1].substring(8));
            let allOutIndexes = typesToCopy[srcIndex];

            if (!allOutIndexes) {
                allOutIndexes = typesToCopy[srcIndex] = [];
            }
            allOutIndexes.push(outIndex);
            return [output[0], object.inputs![srcIndex][1]] as [string, string];
        }
    });

    class NewNode extends LGraphNode {
        static title = object.title;
        static desc = object.desc || "Generated from object";
        defaultBoxColor: string;

        constructor() {
            super(object.title);
            this.defaultBoxColor = this.boxcolor;

            if (simplifiedInputs) {
                this.addInputs(simplifiedInputs);
            }
            if (simplifiedOutputs) {
                this.addOutputs(simplifiedOutputs);
            }
        }

        onConnectInput(inputIndex: number, newOutputType: INodeOutputSlot["type"]): boolean {
            const allOutIndexes = typesToCopy[inputIndex];

            if (allOutIndexes) {
                const that = this;

                function checkOutputDataType(outIndex: number) {
                    const oldOutputType = that.getOutputInfo(outIndex)!.type;

                    if (newOutputType !== oldOutputType) {
                        that.disconnectOutput(outIndex);
                        that.setOutputDataType(outIndex, newOutputType);
                    }
                }

                allOutIndexes.forEach(checkOutputDataType);
            }
            return true;
        }

        onExecute() {
            if (!needsToValidateInputs) return;
            let isValid = true;
            const that = this;

            function validateInput(inIndex: number) {
                const inputInfo = object.inputs![inIndex];
                if (inputInfo.length !== 3) return true;
                const instance = that.getInputData(inIndex);
                const schema = inputInfo[2]!
                return validate(instance, schema).valid;
            }

            for (let i = 0; i < object.inputs!.length; i++) {
                if (!validateInput(i)) {
                    isValid = false;
                    break;
                }
            }
            this.boxcolor = isValid ? this.defaultBoxColor : "red";
        }
    }

    LiteGraph.registerNodeType(object.name, NewNode);
}