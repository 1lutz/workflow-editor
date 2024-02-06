import type {RenderContext} from "@anywidget/types";
import "litegraph.js/css/litegraph";
import "./widget.css";
import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import {registerWorkflowOperator} from "./util";
import WorkflowOutNode from "./workflowOutNode";
import {
    LGraphCanvas_CONFIG_OVERRIDES,
    LiteGraph_CONFIG_OVERRIDES,
    OPERATOR_CATEGORY,
    PREDEFINED_NODE_TYPES,
    TYPED_JSON_EDITOR_NODE_TYPE,
    WORKFLOW_OUT_NODE_TYPE
} from "./constants";
import TypedJsonEditorNode from "./typedJsonEditorNode";
import applyAllBugfixes from "./bugfixes";

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
    Object.assign(LiteGraph, LiteGraph_CONFIG_OVERRIDES);
    Object.assign(canvas, LGraphCanvas_CONFIG_OVERRIDES);
    applyAllBugfixes();

    graph.addOutput("Workflow Out", "raster,vector,plot", null);
    LiteGraph.registerNodeType(WORKFLOW_OUT_NODE_TYPE, WorkflowOutNode);

    LiteGraph.registerNodeType(TYPED_JSON_EDITOR_NODE_TYPE, TypedJsonEditorNode);

    let domButton = document.createElement("button");
    domButton.classList.add("workflow_editor-execute", "btn", "btn-outline-primary", "btn-sm");
    domButton.innerHTML = "Execute";
    domButton.addEventListener("click", () => {
        graph.setOutputData("Workflow Out", null);
        graph.runStep();
        graph.setDirtyCanvas(true, false);
        const workflow = graph.getOutputData("Workflow Out");
        model.set("workflow", workflow);
        model.save_changes();

        const workflowOutCount = graph.findNodesByType(WORKFLOW_OUT_NODE_TYPE).length;

        if (workflowOutCount === 0) {
            alert("Es muss ein Ausgabeblock vorhanden sein. Füge dem Graphen einen \"Workflow Out\"-Block hinzu und verbinde ihn mit einem Operator, zum Beispiel \"GdalSource\".");
        } else if (workflowOutCount > 1) {
            alert("Damit das Ergebnis eindeutig ist, darf es nur einen Ausgabeblock geben. Lösche überschüssige \"Workflow Out\"-Block.");
        }
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
            if (PREDEFINED_NODE_TYPES.includes(registeredOperator.type)) {
                //keep predefined nodes like "Workflow Out"
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
