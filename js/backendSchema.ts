import {z} from "zod";

const ErrorMessageSchema = z.object({
    error: z.string(),
    message: z.string()
});

export const GetDatasetSchema = z.union([
    z.object({
        resultDescriptor: z.object({
            type: z.string()
        })
    }),
    ErrorMessageSchema
]);