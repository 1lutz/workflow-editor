import {INodeInputSlot, LGraphNode} from "litegraph.js";
// @ts-ignore
import {JSONEditor} from "@json-editor/json-editor/dist/jsoneditor.js"
import {Modal} from "bootstrap";
import {TYPED_JSON_EDITOR_HOLDER_ID, TYPED_JSON_EDITOR_MODAL_ID} from "./constants";

import {isOperatorNode} from "./typeguards";
import {ValidationSummary} from "./validationSummary";
import {getValidationSummary} from "./util";

type TypedJsonEditorModalDiv = HTMLElement & {
    instance?: TypedJsonEditorModal;
}

class TypedJsonEditorModal {
    private static instance: TypedJsonEditorModal;

    private modalBs: Modal;
    private editor?: JSONEditor;
    private holderDiv: HTMLElement;
    private currentNode?: TypedJsonEditorNode;
    private oldSchema?: object;
    private validationSummary?: ValidationSummary;

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
        saveButton.addEventListener("click", function() {
            TypedJsonEditorModal.Instance.handleSave();
        });

        modalDiv.addEventListener("keypress", function(event) {
            if ((event.keyCode === 13 || event.which === 13) && TypedJsonEditorModal.Instance.modalBs._isShown) {
                // enter pressed in modal
                if (document.activeElement?.nodeName === "INPUT" && document.activeElement.getAttribute("type") === "text") {
                    // manually trigger change event on text inputs to update in model
                    document.activeElement.dispatchEvent(new Event("change"));
                    console.log("updated input on enter");
                }
                TypedJsonEditorModal.Instance.handleSave();
            }
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
        if (!this.currentNode || !this.validationSummary) {
            console.log("ERROR: Editor detached from node on save.");
            return;
        }
        if (!this.editor) {
            console.log("ERROR: No JSONEditor registered on save.");
            return;
        }
        const errors: {path: string, property: string, message: string}[] = this.editor.validate();
        const isValid = errors.length === 0;

        if (isValid) {
            console.log("saving", this.editor.getValue());
            this.currentNode.setOutputData(0, this.editor.getValue());
            this.modalBs.hide();
        } else {
            this.currentNode.setOutputData(0, undefined);

            for (const error of errors) {
                this.validationSummary.addError(TypedJsonEditorNode.title, `Das Feld "${error.path} folgt nicht der ${error.property}-Eigenschaft: ${error.message}"`);
            }
        }
    }

    public show(currentNode: TypedJsonEditorNode, schema: object) {
        this.currentNode = currentNode;
        this.validationSummary = getValidationSummary(currentNode.graph!);

        if (this.editor && this.oldSchema !== schema) {
            console.log("destroy editor with old schema");
            this.editor.destroy();
        }
        if (!this.editor || this.oldSchema !== schema) {
            console.log("create new editor");
            this.editor = new JSONEditor(this.holderDiv, {
                theme: "bootstrap5",
                iconlib: "fontawesome5",
                disable_array_delete_last_row: true,
                schema
            });
            this.oldSchema = schema;
        } else if (this.editor.getValue() === currentNode.getOutputData(0)) {
            console.log("value in existing editor did not change");
        } else {
            console.log("update value in existing editor");
            this.editor.setValue(currentNode.getOutputData(0));
        }
        this.modalBs.show();
    }
}

export default class TypedJsonEditorNode extends LGraphNode {
    static title = "Typed JSON Editor";
    static desc = "Simplifies editing params of workflow operators with complex types.";

    private defaultBoxColor: string;
    private oldSchema?: object;
    private schema?: object;
    private isRequired = false;

    constructor() {
        super(TypedJsonEditorNode.title);
        this.defaultBoxColor = this.boxcolor;
        this.addOutput("data", 0);
        this.addWidget("button", "edit", "", this.edit.bind(this));
    }

    onExecute() {
        this.boxcolor = this.isRequired && this.getOutputData(0) === undefined ? "red" : this.defaultBoxColor;
    }

    onConnectOutput(_outputIndex: number, _inputType: INodeInputSlot["type"], _inputSlot: INodeInputSlot, inputNode: LGraphNode, inputIndex: number): boolean {
        // can only connect with one node at a time
        this.disconnectOutput(0);
        // if the editor is unconnected it should show no error indicator
        this.isRequired = false;

        if (!isOperatorNode(inputNode)) {
            this.setOutputData(0, undefined);
            alert("Der Editor kann nur mit einem Workflow Operator verwendet werden.");
            return false;
        }
        this.schema = inputNode.getInputSchema(inputIndex);

        if (!this.schema) {
            this.setOutputData(0, undefined);
            alert("Der mit dem Editor verbundene Eingang spezifiziert kein Schema. Dieses ist jedoch zum Bearbeiten erforderlich.");
            return false;
        }
        if (this.getOutputData(0) !== undefined && this.oldSchema !== this.schema) {
            this.setOutputData(0, undefined);
            console.log("reset node output of editor because schema changed");
        }
        this.oldSchema = this.schema;
        this.isRequired = inputNode.isInputRequired(inputIndex);
        console.log("is connected input required?", this.isRequired);
        return true;
    }

    edit() {
        if (!this.schema || !this.getOutputInfo(0)?.links.length) {
            alert("Zum Bearbeiten muss der Editor mit einem Eingang eines Workflow Operators verbunden werden, welcher ein Schema spezifiziert.");
            return;
        }
        TypedJsonEditorModal.Instance.show(this, this.schema);
    }
}