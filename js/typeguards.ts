import type {DatatypeDefinition} from "./workflowSchema";
import type {OperatorNodeInfo} from "./operator";

export function isOperatorNode(arg: any): arg is OperatorNodeInfo {
    return arg && typeof arg.getInputSchema === "function" && typeof arg.isInputRequired === "function";
}

export function isDatatypeDefinition(arg: any): arg is DatatypeDefinition {
    return arg && typeof arg.oneOf === "object";
}

export function isPromise(arg: any): arg is Promise<any> {
    return typeof arg === "object" && typeof arg.then === "function";
}

export function isObject(arg: any): arg is object {
    return arg !== null && typeof arg === "object";
}