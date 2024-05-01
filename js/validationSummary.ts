export type ValidationError = {
    operatorName: string;
    message: string;
}

export class ValidationSummary {
    private placeholder?: HTMLElement;
    private errors: ValidationError[] = [];

    createContainer() {
        return this.placeholder = document.createElement("div");
    }

    addError(error: ValidationError) {
        this.errors.push(error);
    }

    render() {
        if (this.placeholder) {
            const messageBody = Object.entries(this.errors.reduce(function (accumulator, currentError) {
                let group = accumulator[currentError.operatorName];
                if (!group) group = accumulator[currentError.operatorName] = [];
                group.push(currentError.message);
                return accumulator;
            }, {} as { [operatorName: string]: string[] }))
                .map(function ([operatorName, messages]) {
                    return `<h5>${operatorName}</h5><p>${messages.join("<br>")}</p>`
                })
                .join("");
            this.placeholder.innerHTML = `<div class="alert alert-danger alert-dismissable" role="alert">
    <div>${messageBody}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
</div>`;
        }
        this.errors = [];
    }
}