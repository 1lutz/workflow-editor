import {LGraphNode} from "litegraph.js";
import {buildWorkflow, getValidationSummary} from "./util";
import {WorkflowOperator} from "./workflowSchema";

export default class WorkflowOutNode extends LGraphNode {
    static title = "Workflow Out";
    static desc = "Data flowing into this block is exported as a workflow."

    constructor() {
        super(WorkflowOutNode.title);
        this.addInput("return", "raster,vector,plot");
    }

    onExecute() {
        const operator: WorkflowOperator = this.getInputData(0);

        if (operator) {
            const workflow = buildWorkflow(operator, this.getInputDataType(0));
            this.graph?.setOutputData(WorkflowOutNode.title, workflow);
            this.has_errors = false;
        } else {
            this.has_errors = true;

            if (this.graph) {
                this.graph.setOutputData("Workflow Out", null);
                getValidationSummary(this.graph).addError(WorkflowOutNode.title, "Der Eingabedatensatz fehlt. Verbinde diesen Operator mit einem anderen Operator, zum Beispiel \"GdalSource\".");
            }
        }
    }
}