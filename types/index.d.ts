type WorkflowOperator = {
    type: string,
    params: { [key: string]: any },
    sources?: { [key: string]: any }
}

type Workflow = {
    type: string,
    operator: WorkflowOperator
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