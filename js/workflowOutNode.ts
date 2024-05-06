import {LGraphNode} from "litegraph.js";
import {getValidationSummary} from "./util";
import type {WorkflowOperator, Workflow} from "./workflowTypes";

export default class WorkflowOutNode extends LGraphNode {
    static title = "Workflow Out";
    static desc = "Data flowing into this block is exported as a workflow."

    defaultBoxColor: string;

    constructor() {
        super(WorkflowOutNode.title);
        this.defaultBoxColor = this.boxcolor;
        this.addInput("return", "raster,vector,plot");
    }

    onExecute() {
        const operator: WorkflowOperator = this.getInputData(0);

        if (operator) {
            let type = this.getInputDataType(0);
            type = type[0].toUpperCase() + type.substring(1);
            const workflow: Workflow = {type, operator};
            this.graph?.setOutputData(WorkflowOutNode.title, workflow);
            this.boxcolor = this.defaultBoxColor;
        } else {
            this.boxcolor = "red";

            if (this.graph) {
                this.graph.setOutputData("Workflow Out", null);
                getValidationSummary(this.graph).addError(WorkflowOutNode.title, "Der Eingabedatensatz fehlt. Verbinde diesen Operator mit einem anderen Operator, zum Beispiel \"GdalSource\".");
            }
        }
    }
}