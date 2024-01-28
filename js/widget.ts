import type { RenderContext } from "@anywidget/types";
import "litegraph.js/css/litegraph";
import "./widget.css";
import {LGraph, LGraphCanvas, LiteGraph} from "litegraph.js";
import {extendedRegisterNodeClassFromObject} from "./util.ts";
import WorkflowOutNode from "./workflowOutNode.ts";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
interface WidgetModel {
	value: object;
}

export function render({ model, el }: RenderContext<WidgetModel>) {
	let domCanvas = document.createElement("canvas");
	domCanvas.classList.add("workflow_editor-canvas");
	domCanvas.width = 800;
	domCanvas.height = 500;
	domCanvas.addEventListener('contextmenu', function(event) {
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

	graph.addOutput("Workflow Out", 0, null);
	LiteGraph.registerNodeType("lk/workflowout", WorkflowOutNode);

	extendedRegisterNodeClassFromObject({
		name: "lk/union2",
		title: "MyUnion2",
		inputs: [
			["in", "string,number"]
		],
		outputs: [
			["out", "copyFrom0"]
		]
	});

	let domButton = document.createElement("button");
	domCanvas.classList.add("workflow_editor-execute");
	domButton.innerHTML = "Execute";
	domButton.addEventListener("click", () => {
		graph.runStep();
		alert(JSON.stringify(graph.getOutputData("Workflow Out"), null, 4));
	});
	el.appendChild(domButton);

	/*model.on("change:value", () => {
		btn.innerHTML = `count is ${model.get("value")}`;
	});*/
}
