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
    schema?: object
}

type WorkflowOperatorDefinition = {
    title: string,
    desc?: string,
    inputs?: WorkflowOperatorInput[],
    required?: string[],
    outputType: string
}