export type ValidationError = {
    operatorName: string;
    message: string;
}

export class ValidationSummary {
    private placeholder?: HTMLElement;
    private errors: {[operatorName: string]: string[]} = {};

    createContainer() {
        this.placeholder = document.createElement("div");
        this.placeholder.classList.add("workflow_editor-validation");
        return this.placeholder;
    }

    addError(operatorName: string, message: string) {
        let group = this.errors[operatorName];
        if (!group) group = this.errors[operatorName] = [];
        group.push(message);
    }

    render() {
        let entries;

        if (this.placeholder && (entries = Object.entries(this.errors)).length) {
            const messageBody = entries
                .map(function ([operatorName, messages]) {
                    return `<h5>${operatorName}</h5><p>${messages.join("<br>")}</p>`
                })
                .join("");
            this.placeholder.innerHTML = `<div class="alert alert-danger alert-dismissible" role="alert">
    <h4>Validierungsfehler beim Exportieren</h4>
    ${messageBody}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
</div>`;
        }
        this.errors = {};
    }
}