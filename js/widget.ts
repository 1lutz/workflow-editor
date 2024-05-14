import type {RenderContext, AnyModel} from "@anywidget/types";
import type {OperatorDefinition, Workflow} from "./workflowSchema";
import "litegraph.js/css/litegraph";
import "./widget.css";
import "bootstrap/dist/css/bootstrap.min.css";
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
import {getDefinitionName, getValidationSummary} from "./util";
import {Backend} from "./backend";
import {ValidationSummary} from "./validationSummary";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
interface WidgetModel {
    serverUrl: string;
    token: string;
    workflow?: Workflow;
}

function createCanvas() {
    let domCanvas = document.createElement("canvas");
    domCanvas.classList.add("workflow_editor-canvas");
    domCanvas.width = 800;
    domCanvas.height = 500;
    domCanvas.addEventListener('contextmenu', function (event) {
        //hide jupyter application contextmenu
        event.stopPropagation();
    })
    return domCanvas;
}

function createContainer(domCanvas: HTMLCanvasElement) {
    let domLitegraphContainer = document.createElement("div");
    domLitegraphContainer.classList.add("litegraph");
    domLitegraphContainer.appendChild(domCanvas);
    return domLitegraphContainer;
}

function createGraph(domCanvas: HTMLCanvasElement) {
    let graph = new LGraph();
    let canvas = new LGraphCanvas(domCanvas, graph);
    Object.assign(LiteGraph, LiteGraph_CONFIG_OVERRIDES);
    Object.assign(canvas, LGraphCanvas_CONFIG_OVERRIDES);
    applyAllBugfixes();
    return graph;
}

function createExportButton(graph: LGraph, model: AnyModel<WidgetModel>) {
    let domButton = document.createElement("button");
    domButton.classList.add("workflow_editor-export", "btn", "btn-outline-primary", "btn-sm");
    domButton.innerHTML = "Export";
    domButton.addEventListener("click", async () => {
        graph.setOutputData(WorkflowOutNode.title, null);
        await graph.runStepAsync();
        graph.setDirtyCanvas(true, false);
        const workflow = graph.getOutputData(WorkflowOutNode.title);
        model.set("workflow", workflow);
        model.save_changes();

        const workflowOutCount = graph.findNodesByType(WORKFLOW_OUT_NODE_TYPE).length;
        const validationSummary = getValidationSummary(graph);

        if (workflowOutCount === 0) {
            validationSummary.addError("Allgemein", `Es muss ein Ausgabeblock vorhanden sein. Füge dem Graphen einen ${WorkflowOutNode.title}-Block hinzu und verbinde ihn mit einem Operator, zum Beispiel "GdalSource".`);
        } else if (workflowOutCount > 1) {
            validationSummary.addError("Allgemein", `Damit das Ergebnis eindeutig ist, darf es nur einen Ausgabeblock geben. Lösche überschüssige ${WorkflowOutNode.title}-Block.`);
        }
        validationSummary.render();
    });
    return domButton;
}

function createUI(model: AnyModel<WidgetModel>, el: HTMLElement) {
    const domCanvas = createCanvas();
    el.appendChild(createContainer(domCanvas));
    const graph = createGraph(domCanvas);
    el.appendChild(createExportButton(graph, model));

    const validationSummary = new ValidationSummary();
    // @ts-ignore
    graph.validationSummary = validationSummary;
    el.appendChild(validationSummary.createContainer());

    return graph;
}

function registerBackend(serverUrl: string, token: string, graph: LGraph) {
    const backend = new Backend(serverUrl, token);
    // @ts-ignore
    graph.backend = backend;
    return backend;
}

async function registerDefinitions(backend: Backend) {
    const schema = await backend.fetchOperatorDefinitions();

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

export function render({model, el}: RenderContext<WidgetModel>) {
    const graph = createUI(model, el);
    graph.addOutput("Workflow Out", "raster,vector,plot", null);
    LiteGraph.registerNodeType(WORKFLOW_OUT_NODE_TYPE, WorkflowOutNode);
    LiteGraph.registerNodeType(TYPED_JSON_EDITOR_NODE_TYPE, TypedJsonEditorNode);

    const initialServerUrl = model.get("serverUrl");
    const initalToken = model.get("token");

    if (initialServerUrl && initalToken) {
        const backend = registerBackend(initialServerUrl, initalToken, graph);
        registerDefinitions(backend);
    }
    model.on("change:serverUrl", () => {
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
        const serverUrl = model.get("serverUrl");
        const token = model.get("token");
        const backend = registerBackend(serverUrl, token, graph);
        registerDefinitions(backend);
    });
}

export function renderPlainModel({model, el, onExport}: { model: WidgetModel, el: HTMLElement, onExport: (workflow: Workflow) => void }) {
    const modelWrapper = {
        get<K extends keyof WidgetModel>(key: K): WidgetModel[K] {
            return model[key];
        },
        on(eventName: string): void {
            if (eventName === "change:workflow") {
                // @ts-ignore
                onExport(this.get("workflow"));
            }
        }
    } as unknown as AnyModel<WidgetModel>;
    render({model: modelWrapper, el});
}
