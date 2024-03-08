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
}

type OperatorDefinitionSource = OperatorDefinitionParam & {
    geo_type: 'raster' | 'vector' | 'plot'
}

type OperatorDefinition = {
    description?: string,
    help_text?: string,
    properties: {
        type: {
            //the single element is operator id
            enum: string[]
        },
        params: { [key: string]: OperatorDefinitionParam },
        sources?: { [key: string]: OperatorDefinitionSource }
    },
    geo_type: 'raster' | 'vector' | 'plot' | 'copyFromSource'
}

type OperatorDefinitions = {
    definitions: { [key: string]: OperatorDefinition }
}

interface OperatorNodeInfo {
    getInputSchema(slot: number): object | undefined;

    isInputRequired(slot: number): boolean;
}