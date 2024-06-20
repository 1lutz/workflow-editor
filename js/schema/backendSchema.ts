import {z} from "zod";

export const ResultType = z.enum(["raster", "vector", "plot"]);

export type ResultType = z.infer<typeof ResultType>;

export const FeatureDataType = z.enum(["category", "int", "float", "text", "bool", "dateTime"]);

export const ErrorMessageResponse = z.object({
    error: z.string(),
    message: z.string()
});

export const GetDatasetResponse = z.object({
    resultDescriptor: z.object({
        type: ResultType
    })
});

export const RegisterWorkflowResponse = z.object({
    id: z.string().uuid()
});

export const WorkflowMetadataResponse = z.object({
    columns: z.record(z.string(), z.object({
        dataType: FeatureDataType
    }))
});

export type WorkflowMetadataResponse = z.infer<typeof WorkflowMetadataResponse>;
