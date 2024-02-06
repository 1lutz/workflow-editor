// @ts-nocheck
// noinspection PointlessBooleanExpressionJS,JSDuplicatedDeclaration

import {LGraphCanvas, LiteGraph} from "litegraph.js";

/**
 * The built-in "Set Array" node can't set the first index of an array,
 * because it treats zero like an undefined index. This fix updates the
 * node to make the distinction correct.
 */
function fixSetArrayDoesNotWorkWithIndexZero() {
    let constructor = LiteGraph.getNodeType("basic/set_array");
    constructor.prototype.onExecute = function () {
        var arr = this.getInputData(0);
        if (!arr)
            return;
        var v = this.getInputData(1);
        if (v === undefined)
            return;
        if (typeof this.properties.index === "number")
            arr[Math.floor(this.properties.index)] = v;
        this.setOutputData(0, arr);
    }
}

/**
 * If the user tries creating a node by dropping a link on the empty grid
 * it would crash in the past because the variable "nodeNewType" is not
 * declared.
 */
function fixCreateDefaultNodeForSlotFailsInStrictMode() {
    LGraphCanvas.prototype.createDefaultNodeForSlot = function (optPass) { // addNodeMenu for connection
        var optPass = optPass || {};
        var opts = Object.assign({
                nodeFrom: null // input
                , slotFrom: null // input
                , nodeTo: null   // output
                , slotTo: null   // output
                , position: []	// pass the event coords
                , nodeType: null	// choose a nodetype to add, AUTO to set at first good
                , posAdd: [0, 0]	// adjust x,y
                , posSizeFix: [0, 0] // alpha, adjust the position x,y based on the new node size w,h
            }
            , optPass
        );
        var that = this;

        var isFrom = opts.nodeFrom && opts.slotFrom !== null;
        var isTo = !isFrom && opts.nodeTo && opts.slotTo !== null;

        if (!isFrom && !isTo) {
            console.warn("No data passed to createDefaultNodeForSlot " + opts.nodeFrom + " " + opts.slotFrom + " " + opts.nodeTo + " " + opts.slotTo);
            return false;
        }
        if (!opts.nodeType) {
            console.warn("No type to createDefaultNodeForSlot");
            return false;
        }

        var nodeX = isFrom ? opts.nodeFrom : opts.nodeTo;
        var slotX = isFrom ? opts.slotFrom : opts.slotTo;

        var iSlotConn = false;
        switch (typeof slotX) {
            case "string":
                iSlotConn = isFrom ? nodeX.findOutputSlot(slotX, false) : nodeX.findInputSlot(slotX, false);
                slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
                break;
            case "object":
                // ok slotX
                iSlotConn = isFrom ? nodeX.findOutputSlot(slotX.name) : nodeX.findInputSlot(slotX.name);
                break;
            case "number":
                iSlotConn = slotX;
                slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
                break;
            case "undefined":
            default:
                // bad ?
                //iSlotConn = 0;
                console.warn("Cant get slot information " + slotX);
                return false;
        }

        if (slotX === false || iSlotConn === false) {
            console.warn("createDefaultNodeForSlot bad slotX " + slotX + " " + iSlotConn);
        }

        // check for defaults nodes for this slottype
        var fromSlotType = slotX.type == LiteGraph.EVENT ? "_event_" : slotX.type;
        var slotTypesDefault = isFrom ? LiteGraph.slot_types_default_out : LiteGraph.slot_types_default_in;
        if (slotTypesDefault && slotTypesDefault[fromSlotType]) {
            if (slotX.link !== null) {
                // is connected
            } else {
                // is not not connected
            }
            let nodeNewType = false;
            if (typeof slotTypesDefault[fromSlotType] == "object") {
                for (var typeX in slotTypesDefault[fromSlotType]) {
                    if (opts.nodeType == slotTypesDefault[fromSlotType][typeX] || opts.nodeType == "AUTO") {
                        nodeNewType = slotTypesDefault[fromSlotType][typeX];
                        // console.log("opts.nodeType == slotTypesDefault[fromSlotType][typeX] :: "+opts.nodeType);
                        break; // --------
                    }
                }
            } else {
                if (opts.nodeType == slotTypesDefault[fromSlotType] || opts.nodeType == "AUTO") nodeNewType = slotTypesDefault[fromSlotType];
            }
            if (nodeNewType) {
                var nodeNewOpts = false;
                if (typeof nodeNewType == "object" && nodeNewType.node) {
                    nodeNewOpts = nodeNewType;
                    nodeNewType = nodeNewType.node;
                }

                //that.graph.beforeChange();

                var newNode = LiteGraph.createNode(nodeNewType);
                if (newNode) {
                    // if is object pass options
                    if (nodeNewOpts) {
                        if (nodeNewOpts.properties) {
                            for (var i in nodeNewOpts.properties) {
                                newNode.addProperty(i, nodeNewOpts.properties[i]);
                            }
                        }
                        if (nodeNewOpts.inputs) {
                            newNode.inputs = [];
                            for (var i in nodeNewOpts.inputs) {
                                newNode.addOutput(
                                    nodeNewOpts.inputs[i][0],
                                    nodeNewOpts.inputs[i][1]
                                );
                            }
                        }
                        if (nodeNewOpts.outputs) {
                            newNode.outputs = [];
                            for (var i in nodeNewOpts.outputs) {
                                newNode.addOutput(
                                    nodeNewOpts.outputs[i][0],
                                    nodeNewOpts.outputs[i][1]
                                );
                            }
                        }
                        if (nodeNewOpts.title) {
                            newNode.title = nodeNewOpts.title;
                        }
                        if (nodeNewOpts.json) {
                            newNode.configure(nodeNewOpts.json);
                        }

                    }

                    // add the node
                    that.graph.add(newNode);
                    newNode.pos = [opts.position[0] + opts.posAdd[0] + (opts.posSizeFix[0] ? opts.posSizeFix[0] * newNode.size[0] : 0)
                        , opts.position[1] + opts.posAdd[1] + (opts.posSizeFix[1] ? opts.posSizeFix[1] * newNode.size[1] : 0)]; //that.last_click_position; //[e.canvasX+30, e.canvasX+5];*/

                    //that.graph.afterChange();

                    // connect the two!
                    if (isFrom) {
                        opts.nodeFrom.connectByType(iSlotConn, newNode, fromSlotType);
                    } else {
                        opts.nodeTo.connectByTypeOutput(iSlotConn, newNode, fromSlotType);
                    }

                    // if connecting in between
                    if (isFrom && isTo) {
                        // TODO
                    }

                    return true;

                } else {
                    console.log("failed creating " + nodeNewType);
                }
            }
        }
        return false;
    };
}

/**
 * Automatically applies fixes to external components like LiteGraph.
 */
export default function applyAllBugfixes() {
    fixSetArrayDoesNotWorkWithIndexZero();
    fixCreateDefaultNodeForSlotFailsInStrictMode();
}