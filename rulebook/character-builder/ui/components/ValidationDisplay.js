// ValidationDisplay.js - Character validation and error display
import { RenderUtils } from '../shared/RenderUtils.js';
import { CharacterValidator } from '../../validators/CharacterValidator.js';

export class ValidationDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.lastValidation = null;
    }
    
    update() {
        const container = document.getElementById('validation-panel');
        if (!container) return;
        
        const character = this.builder.currentCharacter;
        if (!character) {
            container.innerHTML = this.renderEmptyState();
            return;
        }
        
        const validation = CharacterValidator.validateCharacter(character);
        
        // Only update if validation changed
        if (JSON.stringify(validation) === JSON.stringify(this.lastValidation)) {
            return;
        }
        
        this.lastValidation = validation;
        container.innerHTML = this.renderValidation(validation);
        
        console.log(`🔄 Validation updated: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
    }
    
    renderValidation(validation) {
        return `
            <div class="validation-section">
                <h3>Character Status</h3>
                
                ${this.renderOverallStatus(validation)}
                ${this.renderBuildOrder(validation)}
                ${this.renderSectionValidation(validation)}
                ${this.renderIssuesList(validation)}
            </div>
        `;
    }
    
    renderOverallStatus(validation) {
        const statusClass = validation.isValid ? 'valid' : 'invalid';
        const statusIcon = validation.isValid ? '✅' : '❌';
        const statusText = validation.isValid ? 'Character Valid' : 'Issues Found';
        
        return `
            <div class="validation-status ${statusClass}">
                <div class="status-icon">${statusIcon}</div>
                <div class="status-text">
                    <div class="status-title">${statusText}</div>
                    <div class="status-summary">
                        ${validation.errors.length} errors, ${validation.warnings.length} warnings
                    </div>
                </div>
            </div>
        `;
    }
    
    renderBuildOrder(validation) {
        const buildOrder = validation.sections?.buildOrder;
        if (!buildOrder) return '';
        
        const steps = [
            { id: 'archetypes', name: 'Archetypes', completed: buildOrder.buildState?.archetypesComplete },
            { id: 'attributes', name: 'Attributes', completed: buildOrder.buildState?.attributesAssigned },
            { id: 'mainPool', name: 'Main Pool', completed: buildOrder.buildState?.mainPoolPurchases },
            { id: 'specialAttacks', name: 'Special Attacks', completed: buildOrder.buildState?.hasSpecialAttacks }
        ];
        
        return `
            <div class="build-order">
                <h4>Build Progress</h4>
                <div class="build-steps">
                    ${steps.map((step, index) => {
                        const isCompleted = step.completed;
                        const isAccessible = index === 0 || steps[index - 1].completed;
                        
                        return `
                            <div class="build-step ${isCompleted ? 'completed' : ''} ${isAccessible ? 'accessible' : 'locked'}">
                                <div class="step-icon">
                                    ${isCompleted ? '✅' : isAccessible ? '⭕' : '🔒'}
                                </div>
                                <div class="step-name">${step.name}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    renderSectionValidation(validation) {
        const sections = validation.sections || {};
        const sectionNames = {
            archetypes: 'Archetypes',
            attributes: 'Attributes',
            specialAttacks: 'Special Attacks',
            pointPools: 'Point Pools'
        };
        
        return `
            <div class="section-validation">
                <h4>Section Status</h4>
                <div class="section-list">
                    ${Object.entries(sections).map(([sectionId, sectionValidation]) => {
                        if (sectionId === 'buildOrder') return ''; // Skip build order
                        
                        const name = sectionNames[sectionId] || sectionId;
                        const isValid = sectionValidation.isValid;
                        const errorCount = sectionValidation.errors?.length || 0;
                        const warningCount = sectionValidation.warnings?.length || 0;
                        
                        return `
                            <div class="section-status ${isValid ? 'valid' : 'invalid'}">
                                <div class="section-icon">${isValid ? '✅' : '❌'}</div>
                                <div class="section-info">
                                    <div class="section-name">${name}</div>
                                    <div class="section-summary">
                                        ${errorCount > 0 ? `${errorCount} errors` : ''}
                                        ${errorCount > 0 && warningCount > 0 ? ', ' : ''}
                                        ${warningCount > 0 ? `${warningCount} warnings` : ''}
                                        ${errorCount === 0 && warningCount === 0 ? 'All good' : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    renderIssuesList(validation) {
        const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0;
        
        if (!hasIssues) {
            return `
                <div class="issues-list">
                    <div class="no-issues">
                        🎉 No issues found! Character is ready for play.
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="issues-list">
                ${validation.errors.length > 0 ? `
                    <div class="errors-section">
                        <h5>Errors (${validation.errors.length})</h5>
                        <ul class="issue-items">
                            ${validation.errors.map(error => `
                                <li class="error-item">❌ ${error}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${validation.warnings.length > 0 ? `
                    <div class="warnings-section">
                        <h5>Warnings (${validation.warnings.length})</h5>
                        <ul class="issue-items">
                            ${validation.warnings.map(warning => `
                                <li class="warning-item">⚠️ ${warning}</li>
                            `).join('')}
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
                <div class="empty-state">
                    Create or select a character to see validation status
                </div>
            </div>
        `;
    }
    
    // Get validation for specific tab
    getTabValidation(tabName) {
        const character = this.builder.currentCharacter;
        if (!character) return { isValid: true, errors: [], warnings: [] };
        
        return CharacterValidator.validateSection(character, tabName);
    }
    
    // Check if tab should be enabled
    isTabEnabled(tabName) {
        const character = this.builder.currentCharacter;
        if (!character) return false;
        
        const validation = CharacterValidator.validateCharacter(character);
        const buildOrder = validation.sections?.buildOrder?.buildState;
        
        switch(tabName) {
            case 'basicInfo':
            case 'archetypes':
                return true;
            case 'attributes':
                return buildOrder?.archetypesComplete;
            case 'mainPool':
                return buildOrder?.attributesAssigned;
            case 'specialAttacks':
                return buildOrder?.archetypesComplete;
            case 'utility':
                return buildOrder?.attributesAssigned;
            case 'summary':
                return true;
            default:
                return false;
        }
    }
}