import {LGraphNode} from "litegraph.js";
import {buildWorkflowFromInput, getValidationSummary} from "./util";

export default class WorkflowOutNode extends LGraphNode {
    static title = "Workflow Out";
    static desc = "Data flowing into this block is exported as a workflow."

    constructor() {
        super(WorkflowOutNode.title);
        this.addInput("return", "raster,vector,plot");
    }

    onExecute() {
        const workflow = buildWorkflowFromInput(this, 0);

        if (workflow.operator) {
            this.graph?.setOutputData(WorkflowOutNode.title, workflow);
            this.has_errors = false;
        } else {
            this.has_errors = true;

            if (this.graph) {
                this.graph.setOutputData(WorkflowOutNode.title, null);
                getValidationSummary(this.graph).addError(WorkflowOutNode.title, "Der Eingabedatensatz fehlt. Verbinde diesen Operator mit einem anderen Operator, zum Beispiel \"GdalSource\".");
            }
        }
    }
}