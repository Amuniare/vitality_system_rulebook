// ValidationDisplay.js - COMPLETE REWRITE without validator dependencies
import { RenderUtils } from '../utils/RenderUtils.js';

export class ValidationDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.lastValidationResultString = null;
    }

    update() {
        const container = document.getElementById('validation-panel');
        if (!container) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            container.innerHTML = this.renderEmptyState();
            this.lastValidationResultString = null;
            return;
        }

        const validationResult = this.builder.validateCharacter();
        const currentResultString = JSON.stringify(validationResult);

        if (currentResultString === this.lastValidationResultString) {
            return;
        }
        this.lastValidationResultString = currentResultString;

        container.innerHTML = this.renderValidation(validationResult);
    }

    renderValidation(validationResult) {
        return `
            <div class="validation-section">
                <h3>Character Status</h3>
                ${this.renderOverallStatus(validationResult)}
                ${this.renderBuildOrder(validationResult.sections?.buildOrder)}
                ${this.renderSectionValidation(validationResult.sections)}
                ${this.renderIssuesList(validationResult.errors, validationResult.warnings)}
            </div>
        `;
    }

    renderOverallStatus(validationResult) {
        const isValid = validationResult.isValid;
        const statusType = isValid ? 'success' : 'error';

        const icon = isValid ? '✅' : (validationResult.errors.length > 0 ? '❌' : '⚠️');
        const titleText = isValid ? 'Character Valid' : (validationResult.errors.length > 0 ? 'Errors Found' : 'Warnings Found');
        const summaryText = `${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings.`;

        return `
            <div class="validation-status ${statusType}">
                <div class="status-icon">${icon}</div>
                <div class="status-text">
                    <div class="status-title">${titleText}</div>
                    <div class="status-summary">${summaryText}</div>
                </div>
            </div>
        `;
    }

    renderBuildOrder(buildOrderValidation) {
        if (!buildOrderValidation || !buildOrderValidation.buildState) return '';
        const buildState = buildOrderValidation.buildState;

        const steps = [
            { id: 'archetypes', name: 'Archetypes Complete', completed: buildState.archetypesComplete },
            { id: 'attributes', name: 'Attributes Assigned', completed: buildState.attributesAssigned },
            { id: 'mainPool', name: 'Main Pool Touched', completed: buildState.mainPoolPurchases },
            { id: 'specialAttacks', name: 'Special Attacks Exist', completed: buildState.hasSpecialAttacks }
        ];

        return `
            <div class="build-order-progress">
                <h4>Build Progress</h4>
                <div class="build-steps-list">
                    ${steps.map((step, index) => {
                        const isAccessible = index === 0 || steps[index - 1].completed;
                        return `
                            <div class="build-step-item ${step.completed ? 'completed' : (isAccessible ? 'pending' : 'locked')}">
                                <span class="step-icon">${step.completed ? '✅' : (isAccessible ? '⭕' : '🔒')}</span>
                                <span class="step-name">${step.name}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${buildOrderValidation.errors.length > 0 ? `<div class="error-text small-text">${buildOrderValidation.errors.join('<br>')}</div>` : ''}
                ${buildOrderValidation.warnings.length > 0 && buildOrderValidation.errors.length === 0 ? `<div class="warning-text small-text">${buildOrderValidation.warnings.join('<br>')}</div>` : ''}
            </div>
        `;
    }

    renderSectionValidation(sectionsValidation) {
        if (!sectionsValidation) return '';
        const sectionNamesMap = {
            buildOrder: 'Build Order',
            archetypes: 'Archetypes',
            attributes: 'Attributes',
            specialAttacks: 'Special Attacks',
            pointPools: 'Point Pools',
        };

        return `
            <div class="section-validation-details">
                <h4>Section Status</h4>
                <div class="section-status-list">
                    ${Object.entries(sectionsValidation).map(([sectionKey, valResult]) => {
                        if (sectionKey === 'buildOrder') return '';
                        const sectionName = sectionNamesMap[sectionKey] || sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                        const icon = valResult.isValid ? '✅' : (valResult.errors.length > 0 ? '❌' : '⚠️');
                        const issueSummary = [];
                        if (valResult.errors.length > 0) issueSummary.push(`${valResult.errors.length} err`);
                        if (valResult.warnings.length > 0) issueSummary.push(`${valResult.warnings.length} warn`);
                        
                        return `
                            <div class="section-status-item ${valResult.isValid ? 'valid' : (valResult.errors.length > 0 ? 'invalid' : 'has-warnings')}">
                                <span class="section-icon">${icon}</span>
                                <span class="section-name">${sectionName}</span>
                                <span class="section-issue-summary">${issueSummary.join(', ') || 'OK'}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderIssuesList(errors, warnings) {
        if (errors.length === 0 && warnings.length === 0) {
            return `<div class="no-issues-found status-indicator status-indicator-success">🎉 No validation issues found! Character is ready.</div>`;
        }
        return `
            <div class="issues-list-container">
                ${errors.length > 0 ? `
                    <div class="errors-section">
                        <h5>Errors (${errors.length})</h5>
                        <ul class="issue-items error-items">
                            ${errors.map(err => `<li>❌ ${err}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${warnings.length > 0 ? `
                    <div class="warnings-section">
                        <h5>Warnings (${warnings.length})</h5>
                        <ul class="issue-items warning-items">
                            ${warnings.map(warn => `<li>⚠️ ${warn}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="validation-section">
                <h3>Character Status</h3>
                <div class="empty-state">Create or select a character to see validation status.</div>
            </div>
        `;
    }
}