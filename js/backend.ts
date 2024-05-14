import {checkedJsonFetch} from "./util";
import {WorkflowSchema} from "./workflowSchema";

export enum DatasetType {
    Raster = "raster",
    Vector = "vector"
}

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

    async ensureDatasetType(datasetName: string, expectedType: DatasetType): Promise<string | null> {
        let res;

        try {
            res = await fetch(this.serverUrl + "/dataset/" + encodeURIComponent(datasetName), {
                headers: {
                    Authorization: "Bearer " + this.token
                }
            });
        } catch {
            return "Es konnte keine Verbindung zum Server hergestellt werden, um die Existenz des angefragten Datensatzes zu prüfen.";
        }
        const json = await res.json();

        if (!res.ok) {
            return `Fehler beim Prüfen des Datensatzes "${datasetName}": ${json.message}`;
        }
        const foundType = json.resultDescriptor.type as DatasetType;

        if (foundType !== expectedType) {
            return `Es wird ein Datensatz vom Typ ${expectedType} erwartet, aber "${datasetName}" ist vom Typ ${foundType}.`;
        }
        return null;
    }
}