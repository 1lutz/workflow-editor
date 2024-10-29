import {
    ContextMenu,
    ContextMenuEventListener,
    ContextMenuItem,
    IContextMenuOptions,
    LGraph,
    LGraphCanvas,
    LiteGraph
} from "litegraph.js/build/litegraph.core";
import WorkflowOutNode from "../nodes/workflowOutNode";
import {
    LGraphCanvas_CONFIG_OVERRIDES,
    LiteGraph_CONFIG_OVERRIDES,
    OPERATOR_CATEGORY,
    WORKFLOW_OUT_NODE_TYPE
} from "../constants";
import {getBackend, getValidationSummary} from "../util";
import applyAllBugfixes from "../bugfixes";
import {ValidationSummary} from "./validationSummary";
import {importWorkflow} from "./workflowImporter";
import {AnyModel, WidgetModel } from "../widget";

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
    async function doExportInternal() {
        graph.list_of_graphcanvas.forEach(o => {
            o.canvas.style.cursor = "progress";
        })
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
            validationSummary.addError("Allgemein", `Damit das Ergebnis eindeutig ist, darf es nur einen Ausgabeblock geben. Lösche überschüssige ${WorkflowOutNode.title}-Blöcke.`);
        }
        validationSummary.render();
        graph.list_of_graphcanvas.forEach(o => {
            o.canvas.style.removeProperty("cursor");
        })
        console.log("Export finished!", workflow);
    }

    graph.doExport = async () => {
        if (graph.isExportInProgress) {
            return;
        }
        graph.isExportInProgress = true;
        await doExportInternal();
        graph.isExportInProgress = false;
    };
    graph.onNodeConnectionChange = graph.doExport;
}

function getCanvasMenuOptions(this: LGraphCanvas): ContextMenuItem[] {
    const canvas = this;
    return [
        {
            content: "Add Node",
            has_submenu: true,
            callback: function (_node: ContextMenuItem, _options: IContextMenuOptions, e: MouseEvent, prev_menu: ContextMenu | undefined) {
                const graph = canvas.graph;
                if (!graph) return;
                const nodes = LiteGraph.getNodeTypesInCategory(OPERATOR_CATEGORY, canvas.filter || graph.filter);
                const entries = nodes
                    .filter(node => {
                        // @ts-ignore
                        return !node.skip_list;
                    })
                    .map(node => ({
                        // @ts-ignore
                        value: node.type,
                        // @ts-ignore
                        content: node.title,
                        has_submenu: false,
                        callback: function (cmi: ContextMenuItem, _options: IContextMenuOptions, _e: MouseEvent, prev_menu: ContextMenu | undefined) {
                            // noinspection JSVoidFunctionReturnValueUsed
                            const firstEvent: any = prev_menu!.getFirstEvent();
                            graph.beforeChange();
                            const node = LiteGraph.createNode(cmi!.value);

                            if (node) {
                                node.pos = canvas.convertEventToCanvasOffset(firstEvent);
                                graph.add(node);
                            }
                            graph.afterChange();
                        }
                    }));
                const ref_window = canvas.getCanvasWindow();
                new LiteGraph.ContextMenu(entries, {event: e, parentMenu: prev_menu}, ref_window);
            }
        },
        {
            content: "Import workflow as template",
            has_submenu: true,
            callback: function (_node: ContextMenuItem, _options: IContextMenuOptions, e: MouseEvent, prev_menu: ContextMenu | undefined) {
                const ref_window = canvas.getCanvasWindow();
                const backend = getBackend(canvas.graph);
                const templateContextMenu = new LiteGraph.ContextMenu([{
                    content: "With workflow id",
                    has_submenu: false,
                    callback: function () {
                        canvas.prompt("Workflow id", "", async (workflowId: string) => {
                            const workflow = await backend.loadWorkflow(workflowId);
                            await importWorkflow(canvas.graph, workflow, "Template");
                        }, e);
                    }
                }], {event: e, parentMenu: prev_menu}, ref_window);
                backend.listProjects().then(projects => {
                    projects
                        .filter(projectOverview => projectOverview.layerNames.length > 0)
                        .forEach(projectOverview => {
                            templateContextMenu.addItem("From project " + projectOverview.name, {
                                content: "<Not displayed>",
                                submenu: {
                                    options: projectOverview.layerNames.map(layerName => ({
                                        content: `From layer ${projectOverview.name}/${layerName}`,
                                        has_submenu: false,
                                        callback: async function () {
                                            const project = await backend.loadProjectById(projectOverview.id);
                                            const workflowId = project.layers.find(layer => layer.name === layerName)!.workflow;
                                            const workflow = await backend.loadWorkflow(workflowId);
                                            await importWorkflow(canvas.graph, workflow, layerName);
                                        } as unknown as ContextMenuEventListener
                                    }))
                                }
                            })
                        });
                });
            }
        }];
}

export function clearGraph(graph: LGraph) {
    graph.clear();
    graph.addOutput(WorkflowOutNode.title, "raster,vector,plot", null);
    const outNode = LiteGraph.createNode(WORKFLOW_OUT_NODE_TYPE);
    graph.add(outNode);
    outNode.pos = [100, 100];
}

export function createUI(model: AnyModel<WidgetModel>, el: HTMLElement) {
    const domCanvas = createCanvas();
    el.appendChild(createContainer(domCanvas));
    const graph = createGraph(domCanvas);
    registerExporter(graph, model);
    // @ts-ignore
    graph.list_of_graphcanvas[0].getMenuOptions = getCanvasMenuOptions;

    const validationSummary = new ValidationSummary();
    // @ts-ignore
    graph.validationSummary = validationSummary;
    el.appendChild(validationSummary.createContainer());

    return graph;
}
