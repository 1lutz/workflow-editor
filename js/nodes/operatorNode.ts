import {
    ContextMenuItem,
    INodeInputSlot,
    INodeOutputSlot,
    INodeSlot,
    LGraphNode,
    LiteGraph,
    Vector2
} from "litegraph.js";
import {OPERATOR_CATEGORY} from "../constants";
import {getBackend, getValidationSummary, isEmpty} from "../util";
import type {WorkflowOperator} from "../schema/workflowSchema";
import {isSourceArray} from "../typeguards";
import OperatorDefinitionWrapper from "../schema/operatorDefinitionWrapper";
import {customOperatorValidation} from "../customValidation";
import ArrayBuilderNode from "./arrayBuilderNode";
import ParamsView from "../ui/paramsView";

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
            for (const singleInputType of sourceDef.pinType.split(",")) {
                // @ts-ignore
                let defaultOut: string[] = LiteGraph.slot_types_default_out[singleInputType];
                if (!defaultOut.includes(nodeId)) defaultOut.push(nodeId);
            }
        });

    if (!op.hasDynamicOutputType) {
        // @ts-ignore
        let defaultIn: string[] = LiteGraph.slot_types_default_in[op.outputTypeOnStart];
        defaultIn.push(nodeId);
    }

    class NewNode extends LGraphNode implements OperatorNodeInfo {
        static title = op.title;
        static desc = op.description;

        private _paramValues: Record<string, any> = {};
        private _paramsWidget?: ParamsView = undefined;

        get paramValues() {
            return this._paramValues;
        }

        set paramValues(newValue) {
            this._paramValues = newValue;
            this._paramsWidget!.value = newValue;
            this.setSize(this.computeSize());
            //this.setDirtyCanvas(false, true);
        }

        constructor() {
            super(NewNode.title);

            if (!isEmpty(op.sources)) {
                this.addInputs(Object.entries(op.sources!).map(([sourceName, sourceDef]) => [sourceName, sourceDef.pinType, undefined]));
            }
            this.addOutput("out", op.outputTypeOnStart);

            if (op.hasParams) {
                this.addWidget("button", "edit params", "", this.editParams.bind(this));
                this.addCustomWidget(this._paramsWidget = new ParamsView());
            }
        }

        private editParams() {
            op.showParamsEditor(this);
        }

        onConnectInput(_inputIndex: number, newOutputType: INodeOutputSlot["type"]): boolean {
            // Note: this works correctly because when the output is dynamic
            // OperatorDefinitionWrapper ensures there is only one input.

            if (op.hasDynamicOutputType) {
                const oldOutputType = this.getOutputInfo(0)!.type;

                if (newOutputType !== oldOutputType) {
                    this.disconnectOutput(0);
                    this.setOutputDataType(0, newOutputType);
                }
            }
            return true;
        }

        async onExecute() {
            const backend = getBackend(this.graph!);
            const validationSummary = getValidationSummary(this.graph!);

            let isValid = true;

            let res: WorkflowOperator = {
                type: op.id,
                params: this.paramValues
            };
            if (isEmpty(this.paramValues) && op.hasParams) {
                validationSummary.addError(NewNode.title, "Die Konfigurationsparameter wurden nicht angegeben.");
                isValid = false;
            }
            if (!isEmpty(op.sources)) {
                res.sources = {};

                for (const [sourceName, sourceDef] of Object.entries(op.sources!)) {
                    const sourceSlot = this.findInputSlot(sourceName);
                    const sourceData = this.getInputData(sourceSlot);
                    res.sources[sourceName] = sourceData;

                    if (sourceData === undefined && op.isSourceRequired(sourceName)) {
                        validationSummary.addError(NewNode.title, `Der Parameter "${sourceName}" erwartet Daten, es wurden aber keine eingegeben.`);
                        isValid = false;
                    }
                    if (isSourceArray(sourceDef)) {
                        const sourceNode = this.getInputNode(sourceSlot);

                        if (!(sourceNode instanceof ArrayBuilderNode)) {
                            validationSummary.addError(NewNode.title, `Der Parameter "${sourceName}" erwartet ein Array aus ${sourceDef.innerType}-Datensätzen, das mit ${ArrayBuilderNode.title} erstellt wurde.`);
                            isValid = false;
                        } else if (sourceNode.combinedTypes !== sourceDef.innerType) {
                            validationSummary.addError(NewNode.title, `Der Parameter "${sourceName}" erwartet ein Array aus ${sourceDef.innerType}-Datensätzen, aber es enthält ${sourceNode.combinedTypes}.`);
                            isValid = false;
                        }
                    }
                }
            }
            if (isValid) {
                const customErrorMessage = await customOperatorValidation(res, backend, this);

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
