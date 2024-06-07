import {checkedJsonFetch} from "./util";
import {Workflow, WorkflowSchema} from "./schema/workflowSchema";
import type {ResultType, WorkflowMetadata} from "./schema/backendSchema";
import {GetDatasetResponse, RegisterWorkflowResponse, WorkflowMetadataResponse} from "./schema/backendSchema";

export class Backend {
    private readonly serverUrl: string;
    private readonly token: string;

    constructor(serverUrl: string, token: string) {
        this.serverUrl = serverUrl;
        this.token = token;
    }

    async fetchOperatorDefinitions() {
        const file = await checkedJsonFetch(this.serverUrl + "/workflow/schema");
        return await WorkflowSchema.parseAsync(file);
    }

    async getDatasetType(datasetName: string): Promise<ResultType> {
        const res = await fetch(this.serverUrl + "/dataset/" + encodeURIComponent(datasetName), {
            headers: {
                Authorization: "Bearer " + this.token
            }
        });
        const json = GetDatasetResponse.parse(await res.json());

        if ("error" in json) {
            throw new Error(json.message);
        }
        return json.resultDescriptor.type;
    }

    async getWorkflowMetadata(workflow: Workflow): Promise<WorkflowMetadata> {
        // TODO add POST /workflow/validate backend API
        let res = await fetch(this.serverUrl + "/workflow", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + this.token
            },
            body: JSON.stringify(workflow)
        });
        const registerJson = RegisterWorkflowResponse.parse(await res.json());

        if ("error" in registerJson) {
            throw new Error(registerJson.message);
        }
        const workflowId = registerJson.id;

        res = await fetch(this.serverUrl + "/workflow/" + workflowId + "/metadata", {
            headers: {
                Authorization: "Bearer " + this.token
            }
        });
        const metadataJson = WorkflowMetadataResponse.parse(await res.json());

        if ("error" in metadataJson) {
            throw new Error(metadataJson.message);
        }
        return metadataJson;
    }
}