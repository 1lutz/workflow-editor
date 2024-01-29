import type {RenderContext} from "@anywidget/types";
import "litegraph.js/css/litegraph";
import "./widget.css";
import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import {registerWorkflowOperator} from "./util.ts";
import WorkflowOutNode from "./workflowOutNode.ts";
import {OPERATOR_CATEGORY, WORKFLOW_OUT_NODE_TYPE} from "./constants.ts";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
interface WidgetModel {
    definitions: WorkflowOperatorDefinition[];
    workflow: object;
}

export function render({model, el}: RenderContext<WidgetModel>) {
    let domCanvas = document.createElement("canvas");
    domCanvas.classList.add("workflow_editor-canvas");
    domCanvas.width = 800;
    domCanvas.height = 500;
    domCanvas.addEventListener('contextmenu', function (event) {
        //hide jupyter application contextmenu
        event.stopPropagation();
    })

    let domLitegraphContainer = document.createElement("div");
    domLitegraphContainer.classList.add("litegraph");
    domLitegraphContainer.appendChild(domCanvas);
    el.appendChild(domLitegraphContainer);

    let graph = new LGraph();
    let canvas = new LGraphCanvas(domCanvas, graph);
    canvas.default_connection_color_byType = {
        number: "#7F7",
        string: "#77F",
        boolean: "#F77",
    };
    canvas.default_connection_color_byTypeOff = {
        number: "#474",
        string: "#447",
        boolean: "#744",
    };
    window.graphcanvas = canvas;

    graph.addOutput("Workflow Out", "raster,vector,plot", null);
    LiteGraph.registerNodeType(WORKFLOW_OUT_NODE_TYPE, WorkflowOutNode);

    let domButton = document.createElement("button");
    domCanvas.classList.add("workflow_editor-execute");
    domButton.innerHTML = "Execute";
    domButton.addEventListener("click", () => {
        graph.setOutputData("Workflow Out", null);
        graph.runStep();
        const workflow = graph.getOutputData("Workflow Out");
        model.set("workflow", workflow);
        model.save_changes();
    });
    el.appendChild(domButton);

    const initialDefinitions = model.get("definitions");

    if (initialDefinitions && initialDefinitions.length) {
        initialDefinitions.forEach(registerWorkflowOperator);
    }
    model.on("change:definitions", () => {
        // @ts-ignore
        const registeredOperators = LiteGraph.getNodeTypesInCategory(OPERATOR_CATEGORY);

        for (const registeredOperator of registeredOperators) {
            // @ts-ignore
            if (registeredOperator.type === WORKFLOW_OUT_NODE_TYPE) {
                //keep "Workflow Out" node
                continue;
            }
            const nodesWithType = graph.findNodesByClass(registeredOperator);

            for (const nodeWithType of nodesWithType) {
                graph.remove(nodeWithType);
            }
            // @ts-ignore
            LiteGraph.unregisterNodeType(registeredOperator);
        }
        const definitions = model.get("definitions");
        definitions.forEach(registerWorkflowOperator);
    });
}
