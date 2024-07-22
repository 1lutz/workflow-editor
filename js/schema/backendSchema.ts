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

export const IdResponse = z.object({
    id: z.string().uuid()
});

const Measurement = z.object({
    type: z.enum(["unitless", "continuous", "classification"])
});

export const TypedResultDescriptor = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("vector"),
        dataType: z.enum(["Data", "MultiPoint", "MultiLineString", "MultiPolygon"]),
        columns: z.record(z.string(), z.object({
            dataType: FeatureDataType,
            measurement: Measurement
        }))
    }),
    z.object({
        type: z.literal("raster"),
        dataType: z.enum(["U8", "U16", "U32", "U64", "I8", "I16", "I32", "I64", "F32", "F64"]),
        bands: z.array(z.object({
            name: z.string(),
            measurement: Measurement
        }))
    }),
    z.object({
        type: z.literal("plot")
    })
]);

export type TypedResultDescriptor = z.infer<typeof TypedResultDescriptor>;

export const ListProjectsResponse = z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    layerNames: z.array(z.string())
}));

export type ListProjectsResponse = z.infer<typeof ListProjectsResponse>;

export const LoadProjectResponse = z.object({
    layers: z.array(z.object({
        name: z.string(),
        workflow: z.string().uuid()
    }))
});

export type LoadProjectResponse = z.infer<typeof LoadProjectResponse>;

export const AnyResponse = z.any();

export const NoContentResponse = z.undefined();

export type Coordinate2D = {
    x: number,
    y: number,
}

export type BoundingBox2D = {
    lowerLeftCoordinate: Coordinate2D,
    upperRightCoordinate: Coordinate2D,
}

export type TimeInstance = string | number;

export type TimeInterval = {
    start: TimeInstance,
    end: TimeInstance,
}

export type SpatialReferenceOption = string;

export type STRectangle = {
    spatialReference: SpatialReferenceOption,
    boundingBox: BoundingBox2D,
    timeInterval: TimeInterval
}

export type TimeGranularity = "millis" | "seconds" | "minutes" | "hours" | "days" | "months" | "years";

export type TimeStep = {
    granularity: TimeGranularity,
    step: number
}

export type CreateProjectInput = {
    name: string,
    description: string,
    bounds: STRectangle,
    timeStep?: TimeStep
}

export type VecUpdate<Content> = "none" | "delete" | Content;

export type LayerVisibility = {
    data: boolean,
    legend: boolean,
}

export type Symbology = any;

export type ProjectLayer = {
    workflow: string,
    name: string,
    visibility: LayerVisibility,
    symbology: Symbology,
}

export type Plot = any;

export type LayerUpdate = VecUpdate<ProjectLayer>;
export type PlotUpdate = VecUpdate<Plot>;

export type UpdateProjectInput = {
    id: string,
    name?: string,
    description?: string,
    layers?: LayerUpdate[],
    plots?: PlotUpdate[],
    bounds?: STRectangle,
    timeStep?: TimeStep,
}
