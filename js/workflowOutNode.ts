import {LGraphNode} from "litegraph.js";

export default class WorkflowOutNode extends LGraphNode {
    static title = "Workflow Out";

    constructor() {
        super(WorkflowOutNode.title);
        this.addInput("in", 0);
    }

    onExecute() {
        this.graph?.setOutputData("Workflow Out", this.getInputData(0));
    }
}