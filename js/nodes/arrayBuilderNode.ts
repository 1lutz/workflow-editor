import {LGraphNode} from "litegraph.js";
import {joinDistinct} from "../util";

export default class ArrayBuilderNode extends LGraphNode {
    static title = "Array Builder";
    static desc = "Data flowing into this block is exported as a workflow."

    combinedTypes: string = "";

    constructor() {
        super(ArrayBuilderNode.title);
        this.addInput("item", 0);
        this.addOutput("arr", "array");
    }

    onBeforeConnectInput(targetSlot: number): number {
        // try to connect empty input
        if (this.inputs[targetSlot].link === null) {
            return targetSlot;
        }
        // try to connect to any free input
        for (var i = 0; i < this.inputs.length; ++i) {
            if (this.inputs[i].link === null) {
                return i;
            }
        }
        // connect to newly created input
        this.addInput("item", 0);
        return this.inputs.length - 1;
    }

    onExecute() {
        let allTypes = [];
        let arr = [];

        for (let inputSlot = 0; inputSlot < this.inputs.length; inputSlot++) {
            allTypes.push(this.getInputDataType(inputSlot));
            arr.push(this.getInputData(inputSlot));
        }
        this.combinedTypes = joinDistinct(allTypes);
        this.setOutputData(0, arr);
    }
}