import {fetchAndParse} from "./util";
import {Workflow, WorkflowSchema} from "./schema/workflowSchema";
import type {ResultType} from "./schema/backendSchema";
import {
    GetDatasetResponse,
    RegisterWorkflowResponse,
    WorkflowMetadataResponse,
    ListProjectsResponse,
    LoadProjectResponse
} from "./schema/backendSchema";

export class Backend {
    private readonly serverUrl: string;
    private readonly token: string;

    constructor(serverUrl: string, token: string) {
        this.serverUrl = serverUrl;
        this.token = token;
    }

    fetchOperatorDefinitions(): Promise<WorkflowSchema> {
        return fetchAndParse(this.serverUrl + "/workflow/schema", undefined, WorkflowSchema);
    }

    async getDatasetType(datasetName: string): Promise<ResultType> {
        const json = await fetchAndParse(this.serverUrl + "/dataset/" + encodeURIComponent(datasetName), {
            headers: {
                Authorization: "Bearer " + this.token
            }
        }, GetDatasetResponse);
        return json.resultDescriptor.type;
    }

    async getWorkflowMetadata(workflow: Workflow): Promise<WorkflowMetadataResponse> {
        // TODO add POST /workflow/validate backend API
        let registerJson = await fetchAndParse(this.serverUrl + "/workflow", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + this.token
            },
            body: JSON.stringify(workflow)
        }, RegisterWorkflowResponse);
        const workflowId = registerJson.id;

        return await fetchAndParse(this.serverUrl + "/workflow/" + workflowId + "/metadata", {
            headers: {
                Authorization: "Bearer " + this.token
            }
        }, WorkflowMetadataResponse);
    }

    listProjects(): Promise<ListProjectsResponse> {
        return fetchAndParse(this.serverUrl + "/projects?order=NameAsc&offset=0&limit=10", {
            headers: {
                Authorization: "Bearer " + this.token
            }
        }, ListProjectsResponse);
    }

    loadProject(projectId: string): Promise<LoadProjectResponse> {
        return fetchAndParse(this.serverUrl + "/project/" + encodeURIComponent(projectId), {
            headers: {
                Authorization: "Bearer " + this.token
            }
        }, LoadProjectResponse);
    }

    async loadWorkflow(workflowId: string): Promise<Workflow> {
        const res = await fetch(this.serverUrl + "/workflow/" + encodeURIComponent(workflowId), {
            headers: {
                Authorization: "Bearer " + this.token
            }
        });
        const json = await res.json();

        if ("error" in json) {
            throw new Error(json.message);
        }
        if (!res.ok) {
            throw new Error("HTTP error: " + res.status + " " + res.statusText);
        }
        return json;
    }
}