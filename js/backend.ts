import {checkedJsonFetch} from "./util";
import {OperatorDefinitions} from "./operatorDefinitions";

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
        return await OperatorDefinitions.parseAsync(file);
    }

    async getDatasetType(datasetName: string) {
        const res = await checkedJsonFetch(this.serverUrl + "/dataset/" + encodeURIComponent(datasetName), {
            headers: {
                Authorization: "Bearer " + this.token
            }
        });
        return res.resultDescriptor.type as DatasetType;
    }
}