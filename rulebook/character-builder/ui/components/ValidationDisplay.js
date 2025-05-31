// ValidationDisplay.js - Build validation feedback
export class ValidationDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    update() {
        const character = this.builder.currentCharacter;
        if (!character) {
            this.showEmpty();
            return;
        }

        const validation = this.builder.validateCharacter();
        this.render(validation);
    }

    render(validation) {
        const container = document.getElementById('validation-panel');
        if (!container) return;

        container.innerHTML = `
            <h4>Build Validation</h4>
            <div id="validation-messages">
                ${this.renderValidationStatus(validation)}
                ${this.renderErrors(validation.errors)}
                ${this.renderWarnings(validation.warnings)}
                ${this.renderBuildProgress(validation)}
            </div>
        `;
    }

    renderValidationStatus(validation) {
        const status = validation.isValid ? 'valid' : 'invalid';
        const icon = validation.isValid ? '✓' : '⚠';
        const message = validation.isValid ? 'Build is valid' : 'Build has issues';
        
        return `
            <div class="validation-status ${status}">
                <span class="status-icon">${icon}</span>
                <span class="status-message">${message}</span>
            </div>
        `;
    }

    renderErrors(errors) {
        if (!errors || errors.length === 0) return '';

        return `
            <div class="validation-errors">
                <h5>Errors</h5>
                <ul>
                    ${errors.map(error => `<li class="error-item">${error}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderWarnings(warnings) {
        if (!warnings || warnings.length === 0) return '';

        return `
            <div class="validation-warnings">
                <h5>Warnings</h5>
                <ul>
                    ${warnings.map(warning => `<li class="warning-item">${warning}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderBuildProgress(validation) {
        const buildOrder = validation.sections.buildOrder;
        if (!buildOrder) return '';

        const steps = [
            { key: 'archetypesComplete', name: 'Archetypes', required: true },
            { key: 'attributesAssigned', name: 'Attributes', required: true },
            { key: 'mainPoolPurchases', name: 'Main Pool', required: false },
            { key: 'hasSpecialAttacks', name: 'Special Attacks', required: false }
        ];

        return `
            <div class="build-progress">
                <h5>Build Progress</h5>
                <div class="progress-steps">
                    ${steps.map(step => {
                        const completed = buildOrder.buildState[step.key];
                        const icon = completed ? '✓' : (step.required ? '○' : '◇');
                        const status = completed ? 'completed' : (step.required ? 'required' : 'optional');
                        
                        return `
                            <div class="progress-step ${status}">
                                <span class="step-icon">${icon}</span>
                                <span class="step-name">${step.name}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    showEmpty() {
        const container = document.getElementById('validation-panel');
        if (!container) return;

        container.innerHTML = `
            <h4>Build Validation</h4>
            <div id="validation-messages">
                <p class="empty-state">Select a character to view validation</p>
            </div>
        `;
    }
}