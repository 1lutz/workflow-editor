import type { RenderContext } from "@anywidget/types";
import "litegraph.js/css/litegraph";
import "./widget.css";
import { LGraph, LGraphCanvas } from "litegraph.js";

/* Specifies attributes defined with traitlets in ../src/workflow_editor/__init__.py */
interface WidgetModel {
	value: object;
}

export function render({ model, el }: RenderContext<WidgetModel>) {
	let domCanvas = document.createElement("canvas");
	domCanvas.classList.add("workflow_editor-canvas")
	domCanvas.width = 800;
	domCanvas.height = 500;
	el.appendChild(domCanvas);

	let graph = new LGraph();
	let canvas = new LGraphCanvas(domCanvas, graph);
	canvas.default_connection_color_byType = {
		number: "#7F7",
		string: "#77F",
		boolean: "#F77",
	}
	canvas.default_connection_color_byTypeOff = {
		number: "#474",
		string: "#447",
		boolean: "#744",
	};

	//graph.start();

	/*model.on("change:value", () => {
		btn.innerHTML = `count is ${model.get("value")}`;
	});*/
}
