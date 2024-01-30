import {INodeInputSlot, LGraphNode} from "litegraph.js";
// @ts-ignore
import {JSONEditor} from "@json-editor/json-editor/dist/nonmin/jsoneditor.js"
// @ts-ignore
import {Modal} from "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {TYPED_JSON_EDITOR_HOLDER_ID, TYPED_JSON_EDITOR_MODAL_ID} from "./constants.ts";

type TypedJsonEditorModalDiv = HTMLElement & {
    instance?: TypedJsonEditorModal;
}

class TypedJsonEditorModal {
    private static instance: TypedJsonEditorModal;

    private modalBs: Modal;
    private editor: JSONEditor;
    private holderDiv: HTMLElement;
    private currentNode?: TypedJsonEditorNode;
    private oldSchema?: object;

    private constructor() {
        let modalDiv: TypedJsonEditorModalDiv = document.createElement("div");
        modalDiv.instance = this;
        modalDiv.id = TYPED_JSON_EDITOR_MODAL_ID;
        modalDiv.classList.add("modal");
        modalDiv.tabIndex = -1;
        modalDiv.innerHTML = `
<div class="modal-dialog modal-lg">
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">Typed JSON Editor</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <p id="${TYPED_JSON_EDITOR_HOLDER_ID}"></p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary">Save changes</button>
        </div>
    </div>
</div>`;
        document.body.appendChild(modalDiv);

        const saveButton = document.querySelector(`#${TYPED_JSON_EDITOR_MODAL_ID} .modal-footer .btn-primary`)!;
        saveButton.addEventListener("click", function () {
            TypedJsonEditorModal.Instance.handleSave();
        });

        this.modalBs = new Modal(modalDiv);
        this.holderDiv = document.getElementById(TYPED_JSON_EDITOR_HOLDER_ID)!;
    }

    public static get Instance() {
        if (this.instance) {
            console.log("TypedJsonEditorModal already in static context");
            return this.instance;
        }
        let modalDiv: TypedJsonEditorModalDiv | null = document.getElementById(TYPED_JSON_EDITOR_MODAL_ID);

        if (modalDiv) {
            console.log("Found TypedJsonEditorModal in body");
            return this.instance = modalDiv.instance!;
        }
        console.log("Rendering new TypedJsonEditorModal");
        return this.instance = new this();
    }

    private handleSave() {
        console.log("in handleSave");

        if (!this.currentNode) {
            console.log("Editor detached from node on save. Should normally never happen.");
            return;
        }
        const isValid = this.editor.validate().length === 0;

        if (isValid) {
            this.currentNode.setOutputData(0, this.editor.getValue());
            this.modalBs.hide();
        } else {
            this.currentNode.setOutputData(0, undefined);
            alert("Die Daten folgen nicht dem erwarteten Schema.");
        }
    }

    public show(currentNode: TypedJsonEditorNode, schema: object) {
        this.currentNode = currentNode;

        if (this.editor && this.oldSchema !== schema) {
            console.log("destroy editor with old schema");
            this.editor.destroy();
        }
        if (!this.editor || this.oldSchema !== schema) {
            console.log("create new editor");
            this.editor = new JSONEditor(this.holderDiv, {
                theme: "bootstrap5",
                schema
            });
            this.oldSchema = schema;
        }
        this.modalBs.show();
    }
}

export default class TypedJsonEditorNode extends LGraphNode {
    static title = "Typed JSON Editor";

    private defaultBoxColor: string;
    private oldSchema?: object;
    private schema?: object;

    constructor() {
        super(TypedJsonEditorNode.title);
        this.defaultBoxColor = this.boxcolor;
        this.addOutput("data", 0);
        this.addWidget("button", "edit", "", this.edit.bind(this));
    }

    onExecute() {
        this.boxcolor = this.getOutputData(0) === undefined ? "red" : this.defaultBoxColor;
    }

    onConnectOutput(_outputIndex: number, _inputType: INodeInputSlot["type"], _inputSlot: INodeInputSlot, inputNode: LGraphNode, inputIndex: number): boolean {
        // can only connect with one node at a time
        this.disconnectOutput(0);

        this.schema = "getInputSchema" in inputNode && typeof inputNode.getInputSchema === "function" ? inputNode.getInputSchema(inputIndex) : undefined;

        if (!this.schema) {
            this.setOutputData(0, undefined);
            alert("Der mit dem Knoten verbundene Eingang spezifiziert kein Schema. Dieses ist jedoch zum Bearbeiten erforderlich.");
            return false;
        }
        if (this.getOutputData(0) !== undefined && this.oldSchema !== this.schema) {
            this.setOutputData(0, undefined);
            console.log("reset node output of editor because schema changed");
        }
        this.oldSchema = this.schema;
        return true;
    }

    edit() {
        if (!this.schema) {
            alert("Zum Bearbeiten muss der Knoten mit genau einem Eingang verbunden werden, der ein Schema spezifiziert.");
            return;
        }
        TypedJsonEditorModal.Instance.show(this, this.schema);
    }
}