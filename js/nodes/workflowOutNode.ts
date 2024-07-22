import {LGraph, LGraphCanvas, LGraphNode, LiteGraph} from "litegraph.js/build/litegraph.core";
import {buildWorkflowFromInput, getValidationSummary} from "../util";
import {WORKFLOW_OUT_INPUT_NAME, WORKFLOW_OUT_NODE_TYPE} from "../constants";

export default class WorkflowOutNode extends LGraphNode {
    static title = "Workflow Out";
    static desc = "Data flowing into this block is exported as a workflow."
    static skip_list = true;

    constructor() {
        super(WorkflowOutNode.title);
        this.shape = LiteGraph.BOX_SHAPE;
        this.block_delete = true;
        const color = LGraphCanvas.node_colors.green;
        this.color = color.color;
        this.bgcolor = color.bgcolor;
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

    // stop adding this node using the searchbox
    onAdded(graph: LGraph) {
        if (graph.findNodesByType(WORKFLOW_OUT_NODE_TYPE).length > 1) {
            graph.remove(this);
        }
    }
}