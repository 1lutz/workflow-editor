import type {RenderContext} from "@anywidget/types";
import "litegraph.js/css/litegraph";
import "./widget.css";
import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import {registerWorkflowOperator} from "./operator";
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
import {isDatatypeDefinition} from "./typeguards";
import {getDefinitionName} from "./util";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
interface WidgetModel {
    schema: EditorSchema;
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

    const initialDefinitions = model.get("schema");

    if (initialDefinitions) {
        registerDefinitions(initialDefinitions);
    }
    model.on("change:schema", () => {
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
        const definitions = model.get("schema");
        registerDefinitions(definitions);
    });
}

function registerDefinitions(schema: EditorSchema) {
    let operators: { [operatorName: string]: OperatorDefinition } = {};
    let outputTypes: { [operatorName: string]: string } = {};

    for (const [key, definition] of Object.entries(schema.definitions)) {
        if (isDatatypeDefinition(definition)) {
            for (const ref of definition.oneOf) {
                outputTypes[getDefinitionName(ref)] = key;
            }
        } else {
            operators[key] = definition;
        }
    }
    for (const [key, operator] of Object.entries(operators)) {
        registerWorkflowOperator(operator, outputTypes[key]);
    }
}
