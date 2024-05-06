export type WorkflowOperator = {
    type: string,
    params: { [key: string]: any },
    sources?: { [key: string]: any }
}

export type Workflow = {
    type: string,
    operator: WorkflowOperator
}
