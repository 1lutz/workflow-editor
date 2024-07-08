import {LGraphNode} from "litegraph.js";
import {buildWorkflowFromInput, getValidationSummary} from "../util";
import {WORKFLOW_OUT_INPUT_NAME} from "../constants";

export default class WorkflowOutNode extends LGraphNode {
    static title = "Workflow Out";
    static desc = "Data flowing into this block is exported as a workflow."

    constructor() {
        super(WorkflowOutNode.title);
        this.addInput(WORKFLOW_OUT_INPUT_NAME, "raster,vector,plot");
    }

    onExecute() {
        const workflow = buildWorkflowFromInput(this, 0);

        if (workflow) {
            this.graph?.setOutputData(WorkflowOutNode.title, workflow);
            this.has_errors = false;
        } else {
            this.has_errors = true;

            if (this.graph) {
                this.graph.setOutputData(WorkflowOutNode.title, null);
                const validationSummary = getValidationSummary(this.graph);

                if (this.isInputConnected(0))
                    validationSummary.addError(WorkflowOutNode.title, "Es ist kein Datensatz angekommen. Prüfe, ob bei dem angeschlossenen Operator Fehler vorliegen.");
                else
                    validationSummary.addError(WorkflowOutNode.title, "Es ist kein Datensatz angekommen. Verbinde diesen Operator mit einem anderen Operator, zum Beispiel \"GdalSource\".");
            }
        }
    }
}