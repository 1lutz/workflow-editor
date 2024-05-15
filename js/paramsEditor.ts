import {Offcanvas} from "bootstrap";
import {OperatorDefinitionParams} from "./workflowSchema";
import {PARAMS_EDITOR_ID} from "./constants";
// @ts-ignore
import {JSONEditor} from "@json-editor/json-editor/dist/jsoneditor";
import {OperatorNodeInfo} from "./operator";

type ParamsEditorDiv = HTMLElement & {
    instance?: ParamsEditor;
}

export default class ParamsEditor {
    private static instance: ParamsEditor;

    private offcanvasBs: Offcanvas;
    private editor?: JSONEditor;
    private holderDiv: HTMLElement;
    private currentNode?: OperatorNodeInfo;
    private oldSchema?: OperatorDefinitionParams;

    private constructor() {
        let offcanvasDiv: ParamsEditorDiv = document.createElement("div");
        offcanvasDiv.instance = this;

        offcanvasDiv.id = PARAMS_EDITOR_ID;
        offcanvasDiv.classList.add("offcanvas", "offcanvas-end");
        offcanvasDiv.tabIndex = -1;
        offcanvasDiv.innerHTML = `
<div class="offcanvas-header">
    <h5 class="offcanvas-title">Params Editor</h5>
    <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
</div>
<div class="offcanvas-body">
    <p>
        <a href="https://docs.geoengine.io" target="_blank">
            Open operator help
        </a>
    </p>
    <p class="editor-holder"></p>
    <button type="button" class="editor-save btn btn-primary mt-3">
        Save changes
    </button>
</div>`;
        const saveButton = offcanvasDiv.querySelector(`.editor-save`)!;
        saveButton.addEventListener("click", function() {
            ParamsEditor.Instance.handleSave();
        });
        this.offcanvasBs = Offcanvas.getOrCreateInstance(offcanvasDiv);
        this.holderDiv = offcanvasDiv.querySelector(".editor-holder")!;
    }

    public static get Instance() {
        if (this.instance) {
            console.log("ParamsEditor already in static context");
            return this.instance;
        }
        let modalDiv: ParamsEditorDiv | null = document.getElementById(PARAMS_EDITOR_ID);

        if (modalDiv) {
            console.log("Found ParamsEditor in body");
            return this.instance = modalDiv.instance!;
        }
        console.log("Rendering new ParamsEditor");
        return this.instance = new this();
    }

    private handleSave() {
        if (!this.currentNode) {
            console.log("ERROR: Editor detached from node on save.");
            return;
        }
        if (!this.editor) {
            console.log("ERROR: No JSONEditor registered on save.");
            return;
        }
        const isValid = this.editor.validate().length === 0;

        if (isValid) {
            console.log("saving", this.editor.getValue());
            this.currentNode.params = this.editor.getValue();
            this.offcanvasBs.hide();
        } else {
            this.currentNode.params = undefined;
        }
    }

    show(currentNode: OperatorNodeInfo, schema: OperatorDefinitionParams) {
        this.currentNode = currentNode;

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
        } else if (this.editor.getValue() === currentNode.params) {
            console.log("value in existing editor did not change");
        } else {
            console.log("update value in existing editor");
            this.editor.setValue(currentNode.params);
        }
        this.offcanvasBs.show();
    }
}