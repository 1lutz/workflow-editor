import type {OperatorDefinition, OperatorDefinitionSource, OperatorDefinitionParam} from "./workflowSchema";
import {OperatorNodeInfo} from "./operator";
import ParamsEditor from "./paramsEditor";

export default class OperatorDefinitionWrapper {
    private readonly data: OperatorDefinition;
    public readonly outputType: string;

    constructor(data: OperatorDefinition, outputType: string) {
        this.data = data;
        this.outputType = outputType;
    }

    get id(): string {
        return this.data.properties.type.enum[0];
    }

    get title(): string {
        return this.data.title ?? this.id;
    }

    get help_text(): string | undefined {
        return this.data.help_text;
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

    get params(): Record<string, OperatorDefinitionParam> | undefined {
        return this.data.properties.params.properties;
    }

    isParamRequired(paramName: string): boolean {
        return this.data.properties.params.required?.includes(paramName) ?? false;
    }

    showParamsEditor(currentNode: OperatorNodeInfo) {
        ParamsEditor.Instance.show(currentNode, this.data.properties.params);
    }
}