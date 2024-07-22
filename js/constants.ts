export const OPERATOR_CATEGORY = "geoengine";

export const WORKFLOW_OUT_NODE_TYPE = OPERATOR_CATEGORY + "/workflowout";

export const WORKFLOW_OUT_INPUT_NAME = "return";

export const ARRAY_BUILDER_NODE_TYPE = OPERATOR_CATEGORY + "/arraybuilder";

export const ARRAY_BUILDER_INPUT_NAME = "item";

export const JSON_META_SCHEMA_URL = "https://json-schema.org/draft-07/schema";

export const PARAMS_EDITOR_ID = "workflow_editor-params";

export const DYNAMIC_OUTPUT_TYPE_MARKER = "copyFromSource";

export const ELLIPSIS = "…";

export const MY_TEMPLATES_DIRECTORY = "My Templates";

export const WGS_84 = "EPSG:4326";

export const WGS_84_EXTENT = {
    lowerLeftCoordinate: {
        x: -180.0,
        y: -90.0
    },
    upperRightCoordinate: {
        x: 180.0,
        y: 90.0
    }
};

export const RANDOM_COLOR_DICT = [51, 160, 44, 255]; // #33a02c / green

export const LiteGraph_CONFIG_OVERRIDES = {
    release_link_on_empty_shows_menu: true,
    slot_types_default_in: {
        array: ARRAY_BUILDER_NODE_TYPE,
        //The following values must be arrays so that registerWorkflowOperator can push node ids.
        raster: [],
        vector: [],
        plot: [],
        "raster,vector,plot": ["geoengine/GdalSource", "geoengine/OgrSource"]
    },
    slot_types_default_out: {
        //The following values must be arrays so that registerWorkflowOperator can push node ids.
        raster: [WORKFLOW_OUT_NODE_TYPE],
        vector: [WORKFLOW_OUT_NODE_TYPE],
        plot: [WORKFLOW_OUT_NODE_TYPE]
    }
};

export const LGraphCanvas_CONFIG_OVERRIDES = {
    default_connection_color_byType: {
        number: "#7F7",
        string: "#77F",
        boolean: "#F77",
        raster: "#FF7",
        vector: "#F7F"
    },
    default_connection_color_byTypeOff: {
        number: "#474",
        string: "#447",
        boolean: "#744",
        raster: "#774",
        vector: "#747"
    }
};