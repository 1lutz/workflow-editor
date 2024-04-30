import type {DatatypeDefinition} from "./operatorDefinitions";

export function isOperatorNode(arg: any): arg is OperatorNodeInfo {
    return arg && typeof arg.getInputSchema === "function" && typeof arg.isInputRequired === "function";
}

export function isDatatypeDefinition(arg: any): arg is DatatypeDefinition {
    return arg && typeof arg.oneOf === "object";
}