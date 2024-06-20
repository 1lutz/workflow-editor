import {z} from "zod";
import {checkedJsonFetchWithCache, getDefinitionName} from "../util";
import {JSON_SCHEMA_URL} from "../constants";
import {validate} from "jsonschema";

const JsonSchemaRef = z.object({
    $ref: z.string()
});

export type JsonSchemaRef = z.infer<typeof JsonSchemaRef>;

const JsonSchemaLinks = z.array(z.object({
    rel: z.string(),
    href: z.string()
})).optional();

const OperatorDefinitionParam = z.object({
    format: z.string().optional()
}).passthrough();

export type OperatorDefinitionParam = z.infer<typeof OperatorDefinitionParam>;

const OperatorDefinitionParams = z.object({
    properties: z.record(z.string(), OperatorDefinitionParam),
    required: z.array(z.string())
}).partial();

export type OperatorDefinitionParams = z.infer<typeof OperatorDefinitionParams>;

const OperatorDefinitionSource = z.union([
    // normal raster, vector or plot source
    JsonSchemaRef,
    // array of sources
    z.object({items: JsonSchemaRef}),
    // union of sources
    z.object({anyOf: z.array(JsonSchemaRef)})
]).transform(source => "$ref" in source ? {
    pinType: getDefinitionName(source)
} : "items" in source ? {
    pinType: "array",
    innerType: getDefinitionName(source.items)
} : {
    pinType: source.anyOf.map(getDefinitionName).join()
});

export type OperatorDefinitionSource = z.infer<typeof OperatorDefinitionSource>;

const OperatorDefinitionSources = z.object({
    properties: z.record(z.string(), OperatorDefinitionSource),
    required: z.array(z.string()).optional()
});

const OperatorDefinition = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    links: JsonSchemaLinks,
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

export const WorkflowSchema = z.object({
    definitions: z.record(z.string(), z.union([OperatorDefinition, DatatypeDefinition]))
}).refine(async (editorSchema) => {
    const jsonSchema = await checkedJsonFetchWithCache(JSON_SCHEMA_URL);
    return validate(editorSchema, jsonSchema).valid;
}, "The operator definition file must be valid json schema");

export type WorkflowSchema = z.infer<typeof WorkflowSchema>;

export type WorkflowOperator = {
    type: string,
    params: { [key: string]: any },
    sources?: { [key: string]: any }
}

export type Workflow = {
    type: string,
    operator: WorkflowOperator
}