import type {AnyModel, RenderContext} from "@anywidget/types";
import type {OperatorDefinition, Workflow} from "./workflowSchema";
import "litegraph.js/css/litegraph";
import "./widget.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {LGraph, LiteGraph} from "litegraph.js";
import {registerWorkflowOperator} from "./operator";
import WorkflowOutNode from "./workflowOutNode";
import {
    OPERATOR_CATEGORY,
    PREDEFINED_NODE_TYPES,
    WORKFLOW_OUT_NODE_TYPE
} from "./constants";
import {isDatatypeDefinition} from "./typeguards";
import {getDefinitionName} from "./util";
import {Backend} from "./backend";
import {createUI, type WidgetModel} from "./ui";
import OperatorDefinitionWrapper from "./operatorDefinitionWrapper";

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
        registerWorkflowOperator(new OperatorDefinitionWrapper(operator, outputTypes[key]));
    }
}

export function render({model, el}: RenderContext<WidgetModel>) {
    const graph = createUI(model, el);
    graph.addOutput("Workflow Out", "raster,vector,plot", null);
    LiteGraph.registerNodeType(WORKFLOW_OUT_NODE_TYPE, WorkflowOutNode);

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
