import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import {AnyModel} from "@anywidget/types";
import WorkflowOutNode from "../nodes/workflowOutNode";
import {LGraphCanvas_CONFIG_OVERRIDES, LiteGraph_CONFIG_OVERRIDES, WORKFLOW_OUT_NODE_TYPE} from "../constants";
import {getValidationSummary} from "../util";
import applyAllBugfixes from "../bugfixes";
import {Workflow} from "../schema/workflowSchema";
import {ValidationSummary} from "./validationSummary";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
export interface WidgetModel {
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

function registerExporter(graph: LGraph, model: AnyModel<WidgetModel>) {
    async function doExportAsyncInternal() {
        console.log("Starting export ...");
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
        console.log("Export finished!");
    }
    graph.doExportAsync = async () => {
        if (graph.exportInProgress) {
            return;
        }
        graph.exportInProgress = true;
        await doExportAsyncInternal();
        graph.exportInProgress = false;
    };
    graph.onNodeConnectionChange = graph.doExportAsync;
}

export function createUI(model: AnyModel<WidgetModel>, el: HTMLElement) {
    const domCanvas = createCanvas();
    el.appendChild(createContainer(domCanvas));
    const graph = createGraph(domCanvas);
    registerExporter(graph, model);

    const validationSummary = new ValidationSummary();
    // @ts-ignore
    graph.validationSummary = validationSummary;
    el.appendChild(validationSummary.createContainer());

    return graph;
}