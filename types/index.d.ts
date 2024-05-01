type WorkflowOperator = {
    type: string,
    params: { [key: string]: any },
    sources?: { [key: string]: any }
}

type Workflow = {
    type: string,
    operator: WorkflowOperator
}

interface OperatorNodeInfo {
    getInputSchema(slot: number): any | undefined;

    isInputRequired(slot: number): boolean;
}