import {
    ContextMenuItem,
    INodeInputSlot,
    INodeOutputSlot,
    INodeSlot,
    LGraphNode,
    LiteGraph,
    Vector2
} from "litegraph.js";
import {OPERATOR_CATEGORY} from "./constants";
import {getBackend, getValidationSummary, isEmpty} from "./util";
import type {WorkflowOperator} from "./workflowSchema";
import {isSourceArray} from "./typeguards";
import OperatorDefinitionWrapper from "./operatorDefinitionWrapper";
import {customOperatorValidation} from "./customValidation";

export interface OperatorNodeInfo {
    title: string;
    paramValues: object;
    help_url: string;
}

function openInNewTab(url: string) {
    window.open(url, "_blank");
}

export function registerWorkflowOperator(op: OperatorDefinitionWrapper) {
    const nodeId = OPERATOR_CATEGORY + "/" + op.id;

    Object.values(op.sources || {})
        .filter(sourceDef => !isSourceArray(sourceDef))
        .forEach(sourceDef => {
            // @ts-ignore
            let defaultOut: string[] = LiteGraph.slot_types_default_out[sourceDef.pinType];
            if (!defaultOut.includes(nodeId)) defaultOut.push(nodeId);
        });

    // @ts-ignore
    let defaultIn: string[] = LiteGraph.slot_types_default_in[op.outputType];
    defaultIn.push(nodeId);

    class NewNode extends LGraphNode implements OperatorNodeInfo {
        static title = op.title;
        static desc = op.description;
        paramValues: object = {};

        constructor() {
            super(NewNode.title);

            if (!isEmpty(op.sources)) {
                this.addInputs(Object.entries(op.sources!).map(([sourceName, sourceDef]) => [sourceName, sourceDef.pinType, undefined]));
            }
            this.addOutput("out", op.outputType);

            if (!isEmpty(op.params)) {
                this.addWidget("button", "params", "", this.edit.bind(this));
            }
        }

        edit() {
            op.showParamsEditor(this);
        }

        async onExecute() {
            const backend = getBackend(this.graph!);
            const validationSummary = getValidationSummary(this.graph!);

            let isValid = true;

            let res: WorkflowOperator = {
                type: op.id,
                params: this.paramValues
            };
            if (isEmpty(this.paramValues) && !isEmpty(op.params)) {
                validationSummary.addError(NewNode.title, "Die Konfigurationsparameter wurden nicht angegeben.");
                isValid = false;
            }
            if (!isEmpty(op.sources)) {
                res.sources = {};

                for (const [sourceName, sourceDef] of Object.entries(op.sources!)) {
                    const sourceData = this.getInputDataByName(sourceName);
                    res.sources[sourceName] = sourceData;

                    if (sourceData === undefined && op.isSourceRequired(sourceName)) {
                        validationSummary.addError(NewNode.title, `Der Parameter "${sourceName}" erwartet Daten, es wurden aber keine eingegeben.`);
                        isValid = false;
                    }
                    if (isSourceArray(sourceDef)) {
                        // TODO validate inner type
                    }
                }
            }
            if (isValid) {
                const customErrorMessage = await customOperatorValidation(backend, res);

                if (typeof customErrorMessage === "string") {
                    validationSummary.addError(NewNode.title, customErrorMessage);
                    isValid = false;
                }
            }

            if (isValid) {
                this.has_errors = false;
                this.setOutputData(0, res);
            } else {
                this.has_errors = true;
                this.setOutputData(0, undefined);
            }
        }

        getExtraMenuOptions(): ContextMenuItem[] {
            let extras: ContextMenuItem[] = [];

            if (op.help_url) {
                extras.push({
                    content: "Operator Help",
                    callback: function () {
                        openInNewTab(op.help_url!);
                    }
                });
            }
            return extras;
        }

        getSlotMenuOptions(slot: INodeSlot): ContextMenuItem[] {
            const slot2 = slot as unknown as {
                input?: INodeInputSlot;
                output?: INodeOutputSlot;
                slot: number;
                link_pos: Vector2;
            };
            const isConnectedOutput = Boolean(slot2.output?.links?.length);

            if (isConnectedOutput) {
                return [{
                    content: "Disconnect Links",
                    // @ts-ignore
                    slot
                }];
            } else {
                return [];
            }
        }

        get help_url(): string {
            return op.help_url;
        }
    }

    LiteGraph.registerNodeType(nodeId, NewNode);
}
