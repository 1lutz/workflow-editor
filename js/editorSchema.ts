import { z } from "zod";
import {cachedJsonFetch} from "./util";
import {JSON_SCHEMA_URL} from "./constants";
import {validate} from "jsonschema";

const JsonSchemaRef = z.object({
    $ref: z.string()
});

export type JsonSchemaRef = z.infer<typeof JsonSchemaRef>;

const OperatorDefinitionParam = z.object({
    type: z.string(),
    help_text: z.string().optional()
}).passthrough();

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

export const EditorSchema = z.object({
    definitions: z.record(z.string(), z.union([OperatorDefinition, DatatypeDefinition]))
}).refine(async (editorSchema) => {
    const jsonSchema = await cachedJsonFetch(JSON_SCHEMA_URL);
    return validate(editorSchema, jsonSchema).valid;
}, "The operator definition file must be valid according to json schema draft 4");

export type EditorSchema = z.infer<typeof EditorSchema>;