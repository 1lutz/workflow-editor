export * from "../node_modules/litegraph.js";
import {LGraphCanvas as LGraphCanvasOriginal} from "../node_modules/litegraph.js";

export class LGraphCanvas extends LGraphCanvasOriginal {
    constructor(
        canvas: HTMLCanvasElement | string,
        graph?: LGraph,
        options?: {
            skip_render?: boolean;
            autoresize?: boolean;
        }
    );

    default_connection_color_byType: { [key: string]: string };
    default_connection_color_byTypeOff: { [key: string]: string };
}