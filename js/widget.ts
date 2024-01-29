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
    el.appendChild(domCanvas);

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

    graph.addOutput("Workflow Out", "raster,vector,plot", null);
    LiteGraph.registerNodeType(WORKFLOW_OUT_NODE_TYPE, WorkflowOutNode);

    /*registerWorkflowOperator({
        title: "GdalSource",
        inputs: [
            ["data", "string"]
        ],
        required: ["data"],
        outputType: "raster"
    });
    registerWorkflowOperator({
        title: "OgrSource",
        inputs: [
            ["data", "string"],
            ["attributeProjection", "array", {
                "type": "array",
                "items": {
                    "type": "string"
                }
            }],
            ["attributeFilters", "array", {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "attribute": {
                            "type": "string"
                        },
                        "ranges": {
                            "type": [
                                {
                                    "type": "array",
                                    "items": {
                                        "type": "array",
                                        "items": {
                                            "type": "number"
                                        },
                                        "minItems": 2,
                                        "maxItems": 2
                                    }
                                },
                                {
                                    "type": "array",
                                    "items": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        },
                                        "minItems": 2,
                                        "maxItems": 2
                                    }
                                }
                            ]
                        },
                        "keepNulls": {
                            "type": "boolean"
                        }
                    },
                    "required": ["attribute", "ranges", "keepNulls"]
                }
            }]
        ],
        required: ["data"],
        outputType: "vector"
    });
    registerWorkflowOperator({
            title: "Expression",
            inputs: [
                ["expression", "string"],
                ["outputType", "string", {
                    "type": "string",
                    "enum": ["U8", "U16", "U32", "U64", "I8", "I16", "I32", "I64", "F32", "F64"]
                }],
                ["outputMeasurement", "object", {
                    "type": [
                        {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "enum": ["unitless"]
                                }
                            },
                            "required": ["type"]
                        },
                        {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "enum": ["continuous"]
                                },
                                "measurement": {
                                    "type": "string"
                                },
                                "unit": {
                                    "type": "string"
                                }
                            },
                            "required": ["type", "measurement"]
                        },
                        {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "enum": ["classification"]
                                },
                                "measurement": {
                                    "type": "string"
                                },
                                "classes": {
                                    "type": "object",
                                    "additionalProperties": {
                                        "type": "string"
                                    }
                                }
                            },
                            "required": ["type", "measurement", "classes"]
                        }
                    ]
                }],
                ["mapNoData", "boolean"],
                ["a", "raster"],
                ["b", "raster"],
                ["c", "raster"],
                ["d", "raster"],
                ["e", "raster"],
                ["f", "raster"],
                ["g", "raster"],
                ["h", "raster"]
            ],
            required: ["expression", "outputType", "mapNoData", "a"],
            outputType: "raster"
        }
    );
    registerWorkflowOperator({
        title: "PointInPolygonFilter",
        inputs: [
            ["points", "vector"],
            ["polygons", "vector"]
        ],
        required: ["points", "polygons"],
        outputType: "vector"
    });
    registerWorkflowOperator({
        title: "Reprojection",
        inputs: [
            ["targetSpatialReference", "string"],
            ["source", "raster,vector"]
        ],
        required: ["targetSpatialReference"],
        outputType: "copyFrom1"
    });
    registerWorkflowOperator({
        title: "Rgb",
        inputs: [
            ["redMin", "number"],
            ["redMax", "number"],
            ["redScale", "number", {
                "type": "number",
                "minimum": 0,
                "maximum": 1
            }],
            ["greenMin", "number"],
            ["greenMax", "number"],
            ["greenScale", "number", {
                "type": "number",
                "minimum": 0,
                "maximum": 1
            }],
            ["blueMin", "number"],
            ["blueMax", "number"],
            ["blueScale", "number", {
                "type": "number",
                "minimum": 0,
                "maximum": 1
            }],
            ["red", "raster"],
            ["green", "raster"],
            ["blue", "raster"]
        ],
        required: ["redMin", "redMax", "greenMin", "greenMax", "blueMin", "blueMax", "red", "green", "blue"],
        outputType: "raster"
    });
    registerWorkflowOperator({
        title: "LineSimplification",
        inputs: [
            ["algorithm", "string", {
                "type": "string",
                "enum": ["douglasPeucker", "visvalingam"]
            }],
            ["epsilon", "number"],
            ["vector", "vector"]
        ],
        required: ["algorithm", "vector"],
        outputType: "vector"
    });
    registerWorkflowOperator({
        title: "TemporalRasterAggregation",
        inputs: [
            ["aggregation", "object", {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["min", "max", "first", "last", "mean", "sum", "count"]
                    },
                    "ignoreNoData": {
                        "type": "boolean"
                    }
                },
                "required": ["type", "ignoreNoData"]
            }],
            ["window", "object", {
                "type": "object",
                "properties": {
                    "granularity": {
                        "type": "string",
                        "enum": ["millis", "seconds", "minutes", "hours", "days", "months", "years"]
                    },
                    "step": {
                        "type": "integer",
                        "exclusiveMinimum": 0
                    }
                },
                "required": ["granularity", "step"]
            }],
            ["windowReference", "string", {
                "type": "string",
                "pattern": "^\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d([+-][0-2]\\d:[0-5]\\d|Z)$"
            }],
            ["outputType", "string", {
                "type": "string",
                "enum": ["U8", "U16", "U32", "U64", "I8", "I16", "I32", "I64", "F32", "F64"]
            }],
            ["raster", "raster"]
        ],
        required: ["aggregation", "window", "raster"],
        outputType: "raster"
    });
    registerWorkflowOperator({
        title: "RasterVectorJoin",
        inputs: [
            ["names", "array", {
                "type": "array",
                "items": {
                    "type": "string"
                }
            }],
            ["featureAggregation", "string", {
                "type": "string",
                "enum": ["first", "mean"]
            }],
            ["featureAggregationIgnoreNoData", "boolean"],
            ["temporalAggregation", "string", {
                "type": "string",
                "enum": ["none", "first", "mean"]
            }],
            ["temporalAggregationIgnoreNoData", "boolean"],
            ["vector", "vector"],
            ["rasters", "array", {
                "type": "array",
                "items": {
                    "type": "object"
                }
            }]
        ],
        required: ["names", "featureAggregation", "temporalAggregation", "vector", "rasters"],
        outputType: "vector"
    })*/

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
