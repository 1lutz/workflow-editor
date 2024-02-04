import {LiteGraph} from "litegraph.js";

/**
 * The built-in "Set Array" node can't set the first index of an array,
 * because it treats zero like an undefined index. This fix updates the
 * node to make the distinction correct.
 */
function fixSetArrayDoesNotWorkWithIndexZero() {
    let constructor = LiteGraph.getNodeType("basic/set_array");
    constructor.prototype.onExecute = function() {
        var arr = this.getInputData(0);
        if(!arr)
            return;
        var v = this.getInputData(1);
        if(v === undefined )
            return;
        if(typeof this.properties.index === "number")
            arr[ Math.floor(this.properties.index) ] = v;
        this.setOutputData(0,arr);
    }
}

/**
 * Automatically applies fixes to external components like LiteGraph.
 */
export default function applyAllBugfixes() {
    fixSetArrayDoesNotWorkWithIndexZero();
}