type WorkflowOperator = {
    type: string,
    params: { [key: string]: any },
    sources?: { [key: string]: any }
}

type Workflow = {
    type: string,
    operator: WorkflowOperator
}

type OperatorDefinitionParam = {
    type: string,
    help_text?: string,
    items?: object,
    properties?: object
}

type OperatorDefinitionParams = {
    properties?: { [key: string]: OperatorDefinitionParam },
    required?: string[]
}

type OperatorDefinitionSources = {
    properties: { [key: string]: JsonSchemaRef },
    required?: string[]
}

type OperatorDefinition = {
    title?: string,
    description?: string,
    help_text?: string,
    properties: {
        type: {
            //the single element is operator id
            enum: [string]
        },
        params: OperatorDefinitionParams,
        sources?: OperatorDefinitionSources
    }
}

type DatatypeDefinition = {
    oneOf: JsonSchemaRef[]
}

type JsonSchemaRef = {
    $ref: string
}

type EditorSchema = {
    definitions: { [key: string]: OperatorDefinition | DatatypeDefinition }
}

type SimplifiedInputInfo = {
    name: string,
    type: string,
    required: boolean,
    schema?: object,
    isSource: boolean,
    help_text?: string
}

interface OperatorNodeInfo {
    getInputSchema(slot: number): object | undefined;

    isInputRequired(slot: number): boolean;
}