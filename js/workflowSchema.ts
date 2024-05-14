import {z} from "zod";
import {cachedCheckedJsonFetch, getDefinitionName, joinDistinct} from "./util";
import {JSON_SCHEMA_URL} from "./constants";
import {validate} from "jsonschema";
import {isObject} from "./typeguards";

const JsonSchemaRef = z.object({
    $ref: z.string()
});

export type JsonSchemaRef = z.infer<typeof JsonSchemaRef>;

const OperatorDefinitionParam = z
    .preprocess(
        (param: unknown) => {
            if (!isObject(param)) return param;

            if ("type" in param) {
                if (typeof param.type === "string") {
                    (param as any).pinType = param.type;
                } else if (Array.isArray(param.type)) {
                    const realType = param.type.find((elem: unknown) => typeof elem === "string" && elem !== "null");

                    if (realType) {
                        (param as any).pinType = realType;
                    }
                }
            } else if ("oneOf" in param) {
                if (Array.isArray(param.oneOf) && param.oneOf.every((variant: unknown) => isObject(variant) && "type" in variant && typeof variant.type === "string")) {
                    (param as any).pinType = joinDistinct(param.oneOf.map(variant => variant.type), ",");
                }
            } else if ("anyOf" in param) {
                if (Array.isArray(param.anyOf)) {
                    const innerOneOf = param.anyOf.find((variant: unknown) => isObject(variant) && "oneOf" in variant && Array.isArray(variant.oneOf))?.oneOf;

                    if (innerOneOf && innerOneOf.every((variant: unknown) => isObject(variant) && "type" in variant && typeof variant.type === "string")) {
                        (param as any).pinType = joinDistinct(innerOneOf.map((variant: any) => variant.type), ",");
                    }
                }
            }
            return param;
        },
        z.object({
            pinType: z.string(),
            help_text: z.string().optional(),
            format: z.string().optional()
        }).passthrough());

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

export const WorkflowSchema = z.object({
    definitions: z.record(z.string(), z.union([OperatorDefinition, DatatypeDefinition]))
}).refine(async (editorSchema) => {
    const jsonSchema = await cachedCheckedJsonFetch(JSON_SCHEMA_URL);
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