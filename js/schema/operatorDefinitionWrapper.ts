import type {OperatorDefinition, OperatorDefinitionSource} from "./workflowSchema";
import {OperatorNodeInfo} from "../nodes/operatorNode";
import ParamsEditor from "../ui/paramsEditor";
import {DYNAMIC_OUTPUT_TYPE_MARKER} from "../constants";

export default class OperatorDefinitionWrapper {
    private readonly data: OperatorDefinition;
    private readonly definedOutputType: string;

    constructor(data: OperatorDefinition, outputType: string) {
        this.data = data;
        this.definedOutputType = outputType;

        if (this.hasDynamicOutputType && (!this.sources || Object.values(this.sources).length !== 1)) {
            throw new Error(`The operator ${this.id} has a dynamic output type. For that to work it must have exactly one source.`);
        }
    }

    get id(): string {
        return this.data.properties.type.enum[0];
    }

    get title(): string {
        return this.data.title ?? this.id;
    }

    get help_url(): string {
        return this.data.links?.find(link => link.rel === "external help")?.href ?? "https://docs.geoengine.io";
    }

    get description(): string {
        return this.data.description ?? "Workflow Operator";
    }

    get sources(): Record<string, OperatorDefinitionSource> | undefined {
        return this.data.properties.sources?.properties;
    }

    isSourceRequired(sourceName: string): boolean {
        return this.data.properties.sources?.required?.includes(sourceName) ?? false;
    }

    get hasParams(): boolean {
        return this.data.properties.params.properties !== undefined || this.data.properties.params.oneOf !== undefined;
    }

    showParamsEditor(currentNode: OperatorNodeInfo) {
        ParamsEditor.Instance.show(currentNode, this.data.properties.params);
    }

    get hasDynamicOutputType(): boolean {
        return this.definedOutputType === DYNAMIC_OUTPUT_TYPE_MARKER;
    }

    get outputTypeOnStart(): string {
        return this.hasDynamicOutputType ? Object.values(this.sources!)[0].pinType : this.definedOutputType;
    }
}