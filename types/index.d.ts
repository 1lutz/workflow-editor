type WorkflowOperator = {
    type: string,
    params: { [key: string]: any },
    sources?: {[key: string]: any}
}

type Workflow = {
    type: string,
    operator: WorkflowOperator
}

type WorkflowOperatorInput = {
    name: string,
    type: string,
    helpUrl?: string,
    forceAsSource?: boolean,
    schema?: object
}

type WorkflowOperatorDefinition = {
    title: string,
    desc?: string,
    helpUrl?: string,
    inputs?: WorkflowOperatorInput[],
    required?: string[],
    outputType: 'raster' | 'vector' | 'plot' | 'copyFromSource'
}

interface OperatorNodeInfo {
    getInputSchema(slot: number): object | undefined;

    isInputRequired(slot: number): boolean;
}