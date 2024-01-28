import type {RenderContext} from "@anywidget/types";
import "litegraph.js/css/litegraph";
import "./widget.css";
import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import {registerWorkflowOperator} from "./util.ts";
import WorkflowOutNode from "./workflowOutNode.ts";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
interface WidgetModel {
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
    LiteGraph.registerNodeType("geoengine/workflowout", WorkflowOutNode);

    registerWorkflowOperator({
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

    /*model.on("change:value", () => {
        btn.innerHTML = `count is ${model.get("value")}`;
    });*/
}
