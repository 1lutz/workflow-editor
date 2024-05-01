import { z } from "zod";
import {cachedCheckedJsonFetch} from "./util";
import {JSON_SCHEMA_URL} from "./constants";
import {validate} from "jsonschema";

const JsonSchemaRef = z.object({
    $ref: z.string()
});

export type JsonSchemaRef = z.infer<typeof JsonSchemaRef>;

const OperatorDefinitionParam = z.object({
    type: z.string(),
    help_text: z.string().optional(),
    format: z.string().optional()
}).passthrough();

export type OperatorDefinitionParam = z.infer<typeof OperatorDefinitionParam>;

const OperatorDefinitionParams = z.object({
    properties: z.record(z.string(), OperatorDefinitionParam),
    required: z.array(z.string())
}).partial();

const OperatorDefinitionSources = z.object({
    properties: z.record(z.string(), JsonSchemaRef),
    required: z.array(z.string()).optional()
});

const OperatorDefinition = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    help_text: z.string().optional(),
    properties: z.object({
        type: z.object({
            //the single element is operator id
            "enum": z.array(z.string()).nonempty().length(1)
        }),
        params: OperatorDefinitionParams,
        sources: OperatorDefinitionSources.optional()
    })
});

export type OperatorDefinition = z.infer<typeof OperatorDefinition>;

const DatatypeDefinition = z.object({
    oneOf: z.array(JsonSchemaRef)
});

export type DatatypeDefinition = z.infer<typeof DatatypeDefinition>;

export const OperatorDefinitions = z.object({
    definitions: z.record(z.string(), z.union([OperatorDefinition, DatatypeDefinition]))
}).refine(async (editorSchema) => {
    const jsonSchema = await cachedCheckedJsonFetch(JSON_SCHEMA_URL);
    return validate(editorSchema, jsonSchema).valid;
}, "The operator definition file must be valid json schema");

export type OperatorDefinitions = z.infer<typeof OperatorDefinitions>;