export const OPERATOR_CATEGORY = "geoengine";

export const WORKFLOW_OUT_NODE_TYPE = OPERATOR_CATEGORY + "/workflowout";

export const TYPED_JSON_EDITOR_NODE_TYPE = OPERATOR_CATEGORY + "/typedjsoneditor";

export const PREDEFINED_NODE_TYPES = [WORKFLOW_OUT_NODE_TYPE, TYPED_JSON_EDITOR_NODE_TYPE];

export const TYPED_JSON_EDITOR_MODAL_ID = "workflow_editor-typed_editor_modal";

export const TYPED_JSON_EDITOR_HOLDER_ID = "workflow_editor-typed_editor_holder";

//export const GEO_TYPES = ["raster", "vector", "plot"];

export const LiteGraph_CONFIG_OVERRIDES = {
    release_link_on_empty_shows_menu: true,
    slot_types_default_in: {
        _event_: "widget/button",
        array: ["basic/array", TYPED_JSON_EDITOR_NODE_TYPE, "basic/set_array"],
        boolean: "basic/boolean",
        number: "widget/number",
        object: ["basic/data", TYPED_JSON_EDITOR_NODE_TYPE],
        string: ["basic/string", "string/concatenate"],
        vec2: "math3d/xy-to-vec2",
        vec3: "math3d/xyz-to-vec3",
        vec4: "math3d/xyzw-to-vec4",
        //The following values must be arrays so that registerWorkflowOperator can push node ids.
        raster: [],
        vector: [],
        plot: [],
        "raster,vector,plot": ["geoengine/GdalSource", "geoengine/OgrSource"]
    },
    slot_types_default_out: {
        _event_: ["logic/IF", "events/sequence", "events/log", "events/counter"],
        array: ["basic/watch", "basic/set_array", "basic/array[]"],
        boolean: ["logic/IF", "basic/watch", "math/branch", "math/gate"],
        number: [
            "basic/watch",
            {node: "math/operation", properties: {OP: "*"}, title: "A*B"},
            {node: "math/operation", properties: {OP: "/"}, title: "A/B"},
            {node: "math/operation", properties: {OP: "+"}, title: "A+B"},
            {node: "math/operation", properties: {OP: "-"}, title: "A-B"},
            {node: "math/compare", outputs: [["A==B", "boolean"]], title: "A==B"},
            {node: "math/compare", outputs: [["A>B", "boolean"]], title: "A>B"},
            {node: "math/compare", outputs: [["A<B", "boolean"]], title: "A<B"}
        ],
        object: ["basic/object_property", "basic/object_keys", "string/toString", "basic/watch"],
        string: ["basic/watch", "string/compare", "string/concatenate", "string/contains"],
        vec2: "math3d/vec2-to-xy",
        vec3: "math3d/vec3-to-xyz",
        vec4: "math3d/vec4-to-xyzw",
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
    },
    default_connection_color_byTypeOff: {
        number: "#474",
        string: "#447",
        boolean: "#744",
    }
};