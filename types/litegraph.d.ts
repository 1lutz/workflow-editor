import {INodeInputSlot, INodeOutputSlot} from "litegraph.js";

declare module "litegraph.js" {
    interface LGraphCanvas {
        default_connection_color_byType: { [key: string]: string };
        default_connection_color_byTypeOff: { [key: string]: string };
    }

    interface LGraphNode {
        setOutputDataType(slot: number, type: INodeOutputSlot["type"]): void

        addInputs(array: [string, string | -1, Partial<INodeInputSlot>?][]): void;

        addOutputs(array: [string, string | -1, Partial<INodeOutputSlot>?][]): void;

        addInput(
            name: string,
            type: string | -1 | 0,
            extra_info?: Partial<INodeInputSlot>
        ): INodeInputSlot;

        addOutput(
            name: string,
            type: string | -1 | 0,
            extra_info?: Partial<INodeOutputSlot>
        ): INodeOutputSlot;
    }

    interface LGraph {
        addOutput(name: string, type: string | -1 | 0, value: any): void;
        setOutputData(name: string, value: any): void;
        runStepAsync(): Promise<void>;
    }
}