import {LGraph, LGraphNode, LiteGraph} from "litegraph.js";
import type {Workflow, WorkflowOperator} from "../schema/workflowSchema";
import {layout, graphlib} from "@dagrejs/dagre";
import {OPERATOR_CATEGORY, WORKFLOW_OUT_INPUT_NAME, WORKFLOW_OUT_NODE_TYPE} from "../constants";
import {OperatorNodeInfo} from "../nodes/operatorNode";

export function importWorkflow(litegraph: LGraph, workflow?: Workflow) {
    console.log("Importing workflow:", workflow);
    if (!workflow) {
        litegraph.doExportAsync(); // show initial WorkflowOut validation
        return;
    }
    litegraph.exportInProgress = true; // block validation on every params set

    const outNode = LiteGraph.createNode(WORKFLOW_OUT_NODE_TYPE);
    litegraph.add(outNode, true);
    const g = new graphlib.Graph();
    g.setGraph({
        rankdir: "LR"
    });
    g.setDefaultEdgeLabel(function() { return {}; });
    g.setNode(String(outNode.id), {
        width: outNode.size[0],
        height: outNode.size[1] + LiteGraph.NODE_TITLE_HEIGHT
    });
    addOperator(litegraph, g, workflow.operator, outNode, WORKFLOW_OUT_INPUT_NAME);

    layout(g);
    applyPositions(litegraph, g);

    litegraph.updateExecutionOrder();
    litegraph.exportInProgress = false;
    litegraph.doExportAsync();
}

function addOperator(litegraph: LGraph, g: graphlib.Graph, operator: WorkflowOperator, parentNode: LGraphNode, sourceName: string) {
    //create node
    const newNode = LiteGraph.createNode(OPERATOR_CATEGORY + "/" + operator.type);
    litegraph.add(newNode, true);
    const newNodeId = String(newNode.id);
    g.setNode(newNodeId, {
        width: newNode.size[0],
        height: newNode.size[1] + LiteGraph.NODE_TITLE_HEIGHT
    });
    (newNode as unknown as OperatorNodeInfo).paramValues = operator.params;
    //connect output to parent
    newNode.connect(0, parentNode, sourceName);
    g.setEdge(newNodeId, String(parentNode.id));
    // create and connect sources
    if (!operator.sources) return;

    for (const [sourceName, sourceDef] of Object.entries(operator.sources)) {
        addOperator(litegraph, g, sourceDef, newNode, sourceName);
    }
}

function applyPositions(litegraph: LGraph, g: graphlib.Graph) {
    for (const nodeId of g.nodes()) {
        const nodeLabel = g.node(nodeId);
        const node = litegraph.getNodeById(parseInt(nodeId))!;
        node.pos[0] = nodeLabel.x;
        node.pos[1] = nodeLabel.y;
    }
}
