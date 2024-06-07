import {z} from "zod";

export const ResultType = z.enum(["raster", "vector", "plot"]);

export type ResultType = z.infer<typeof ResultType>;

export const FeatureDataType = z.enum(["category", "int", "float", "text", "bool", "dateTime"]);

export type FeatureDataType = z.infer<typeof FeatureDataType>;

const ErrorMessageResponse = z.object({
    error: z.string(),
    message: z.string()
});

export const GetDatasetResponse = z.union([
    z.object({
        resultDescriptor: z.object({
            type: ResultType
        })
    }),
    ErrorMessageResponse
]);

export const RegisterWorkflowResponse = z.union([
    z.object({
        id: z.string().uuid()
    }),
    ErrorMessageResponse
]);

const WorkflowMetadata = z.object({
    columns: z.record(z.string(), z.object({
        dataType: FeatureDataType
    }))
});

export type WorkflowMetadata = z.infer<typeof WorkflowMetadata>;

export const WorkflowMetadataResponse = z.union([
    WorkflowMetadata,
    ErrorMessageResponse
]);