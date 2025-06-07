// AttackBasicsForm.js - Data-driven attack basics form component
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class AttackBasicsForm {
    constructor(parentTab) {
        this.parentTab = parentTab;
    }

    render(attack, character) {
        // Use the character parameter passed in or get from builder
        const currentCharacter = character || this.parentTab.builder.currentCharacter;
        
        return `
            <div class="attack-basics-form">
                <div class="attack-basics-columns">
                    <div class="attack-basics-left">
                        ${this.renderNameFields(attack)}
                        ${this.renderIntegratedTypeSelection(attack, currentCharacter)}
                    </div>
                    <div class="attack-basics-right">
                        ${this.renderConditionalFields(attack, currentCharacter)}
                    </div>
                </div>
            </div>
        `;
    }

    renderNameFields(attack) {
        return `
            <div class="attack-name-row">
                <label for="attack-name-${this.parentTab.selectedAttackIndex}">Attack Name:</label>
                <input type="text" id="attack-name-${this.parentTab.selectedAttackIndex}" value="${attack.name || ''}" placeholder="Enter attack name" data-action="update-attack-name">
            </div>
            <div class="attack-subtitle-row">
                <label for="attack-subtitle-${this.parentTab.selectedAttackIndex}">Subtitle:</label>
                <input type="text" id="attack-subtitle-${this.parentTab.selectedAttackIndex}" value="${attack.subtitle || ''}" placeholder="e.g., Ranged Physical" data-action="update-attack-subtitle">
            </div>
            <div class="attack-details-row">
                <label for="attack-details-${this.parentTab.selectedAttackIndex}">Details:</label>
                <textarea id="attack-details-${this.parentTab.selectedAttackIndex}" placeholder="Describe the attack's appearance and function." data-action="update-attack-details" rows="3">${attack.description || ''}</textarea>
            </div>
        `;
    }

    renderIntegratedTypeSelection(attack, character) {
        return `
            <div class="integrated-type-selection">
                ${this.renderAttackTypeSection(attack, character)}
                ${this.renderEffectTypeSection(attack, character)}
            </div>
        `;
    }

    renderAttackTypeSection(attack, character) {
        const attackTypes = AttackTypeSystem.getAttackTypeDefinitions?.() || {};
        const freeAttackTypes = AttackTypeSystem.getFreeAttackTypesFromArchetype?.(character) || [];
        const selectedTypes = attack.attackTypes || [];
        
        // Show selected attack types as tags
        const selectedTags = selectedTypes.map(typeId => {
            const def = attackTypes[typeId];
            const isFree = freeAttackTypes.includes(typeId);
            return `<span class="tag attack-type-tag">
                ${def?.name || typeId} ${isFree ? '(Free)' : `(${def?.cost || 0}p)`}
                <button data-action="remove-attack-type" data-id="${typeId}" title="Remove attack type">×</button>
            </span>`;
        }).join('');
        
        // Filter out already selected types for dropdown
        const availableTypes = Object.values(attackTypes)
            .filter(type => !selectedTypes.includes(type.id))
            .map(type => ({
                value: type.id,
                label: `${type.name} (${freeAttackTypes.includes(type.id) ? 'Free' : (type.cost + 'p')})`
            }));
        
        return `
            <div class="type-section">
                <h4>Attack Types</h4>
                <div class="type-tags-area">
                    ${selectedTags}
                    ${availableTypes.length > 0 ? RenderUtils.renderSelect({
                        id: `attack-type-select-${this.parentTab.selectedAttackIndex}`,
                        options: availableTypes,
                        dataAttributes: { action: 'add-attack-type' },
                        placeholder: 'Add an Attack Type...',
                        classes: ['inline-selector']
                    }) : '<span class="no-options">All attack types selected</span>'}
                </div>
            </div>
        `;
    }

    renderEffectTypeSection(attack, character) {
        const effectTypes = AttackTypeSystem.getEffectTypeDefinitions?.() || {};
        const selectedTypes = attack.effectTypes || [];
        
        // Show selected effect types as tags
        const selectedTags = selectedTypes.map(typeId => {
            const def = effectTypes[typeId];
            return `<span class="tag effect-type-tag">
                ${def?.name || typeId} (${def?.cost || 0}p)
                <button data-action="remove-effect-type" data-id="${typeId}" title="Remove effect type">×</button>
            </span>`;
        }).join('');
        
        // For Effect Type, typically only one is selected (mutually exclusive)
        // But we'll allow multiple for flexibility
        const availableTypes = Object.values(effectTypes)
            .filter(type => !selectedTypes.includes(type.id))
            .map(type => ({
                value: type.id,
                label: `${type.name} (${type.cost}p)`
            }));
        
        return `
            <div class="type-section">
                <h4>Effect Type</h4>
                <div class="type-tags-area">
                    ${selectedTags}
                    ${availableTypes.length > 0 ? RenderUtils.renderSelect({
                        id: `effect-type-select-${this.parentTab.selectedAttackIndex}`,
                        options: availableTypes,
                        dataAttributes: { action: 'add-effect-type' },
                        placeholder: 'Add an Effect Type...',
                        classes: ['inline-selector']
                    }) : '<span class="no-options">Effect type selected</span>'}
                </div>
            </div>
        `;
    }


    renderConditionalFields(attack, character) {
        let html = '';
        
        // Show hybrid order selector if hybrid effect type is selected
        if ((attack.effectTypes || []).includes('hybrid')) {
            html += `
                <div class="form-group">
                    <label for="hybrid-order-${this.parentTab.selectedAttackIndex}">Hybrid Order:</label>
                    <select id="hybrid-order-${this.parentTab.selectedAttackIndex}" data-action="update-hybrid-order">
                        <option value="damage-first" ${attack.hybridOrder === 'damage-first' ? 'selected' : ''}>Damage then Conditions</option>
                        <option value="conditions-first" ${attack.hybridOrder === 'conditions-first' ? 'selected' : ''}>Conditions then Damage</option>
                    </select>
                </div>
            `;
        }
        
        // Show basic conditions selector if condition or hybrid effect type is selected
        if ((attack.effectTypes || []).some(e => ['condition', 'hybrid'].includes(e))) {
            html += this.renderBasicConditionsSection(attack);
            html += this.renderAdvancedConditionsSection(attack);
        }
        
        return html ? `<div class="conditional-fields">${html}</div>` : '';
    }

    renderBasicConditionsSection(attack) {
        const conditions = AttackTypeSystem.getBasicConditions?.() || [];
        const selectedConditions = attack.basicConditions || [];
        
        // Show selected basic conditions as tags
        const selectedTags = selectedConditions.map(conditionId => {
            const condition = conditions.find(c => c.id === conditionId);
            return `<span class="tag condition-tag">
                ${condition?.name || conditionId}
                <button data-action="remove-basic-condition" data-id="${conditionId}" title="Remove basic condition">×</button>
            </span>`;
        }).join('');
        
        // Filter out already selected conditions for dropdown
        const availableConditions = conditions
            .filter(c => !selectedConditions.includes(c.id))
            .map(c => ({
                value: c.id,
                label: c.name
            }));
        
        return `
            <div class="conditions-section">
                <h4>Basic Conditions</h4>
                <div class="condition-tags-area">
                    ${selectedTags}
                    ${availableConditions.length > 0 ? RenderUtils.renderSelect({
                        id: `basic-condition-select-${this.parentTab.selectedAttackIndex}`,
                        options: availableConditions,
                        dataAttributes: { action: 'add-basic-condition' },
                        placeholder: 'Add Basic Condition...',
                        classes: ['inline-selector']
                    }) : (selectedConditions.length > 0 ? '<span class="no-options">All basic conditions selected</span>' : '')}
                </div>
            </div>
        `;
    }

    renderAdvancedConditionsSection(attack) {
        const conditions = AttackTypeSystem.getAdvancedConditions?.() || [];
        const selectedConditions = attack.advancedConditions || [];
        
        // Show selected advanced conditions as tags
        const selectedTags = selectedConditions.map(conditionId => {
            const condition = conditions.find(c => c.id === conditionId);
            return `<span class="tag advanced-condition-tag">
                ${condition?.name || conditionId} (${condition?.cost || 0}p)
                <button data-action="remove-advanced-condition" data-id="${conditionId}" title="Remove advanced condition">×</button>
            </span>`;
        }).join('');
        
        // Filter out already selected conditions for dropdown
        const availableConditions = conditions
            .filter(c => !selectedConditions.includes(c.id))
            .map(c => ({
                value: c.id,
                label: `${c.name} (${c.cost || 0}p)`
            }));
        
        return `
            <div class="conditions-section">
                <h4>Advanced Conditions</h4>
                <div class="condition-tags-area">
                    ${selectedTags}
                    ${availableConditions.length > 0 ? RenderUtils.renderSelect({
                        id: `advanced-condition-select-${this.parentTab.selectedAttackIndex}`,
                        options: availableConditions,
                        dataAttributes: { action: 'add-advanced-condition' },
                        placeholder: 'Add Advanced Condition...',
                        classes: ['inline-selector']
                    }) : (selectedConditions.length > 0 ? '<span class="no-options">All advanced conditions selected</span>' : '')}
                </div>
            </div>
        `;
    }

    // Fallback to simple form if data-driven approach fails
    renderSimpleTypeSelector(attack) {
        return `
            <div class="attack-type-row">
                <label for="attack-type-${this.parentTab.selectedAttackIndex}">Attack Type:</label>
                <select id="attack-type-${this.parentTab.selectedAttackIndex}" data-action="update-attack-type">
                    <option value="">Select attack type</option>
                    <option value="melee" ${attack.attackType === 'melee' ? 'selected' : ''}>Melee</option>
                    <option value="ranged" ${attack.attackType === 'ranged' ? 'selected' : ''}>Ranged</option>
                    <option value="direct" ${attack.attackType === 'direct' ? 'selected' : ''}>Direct</option>
                    <option value="area" ${attack.attackType === 'area' ? 'selected' : ''}>Area</option>
                </select>
            </div>
            <div class="attack-type-description">
                ${attack.attackType ? this.getAttackTypeDescription(attack.attackType) : 'Select an attack type to see its description.'}
            </div>
        `;
    }

    getAttackTypeDescription(attackTypeId) {
        const descriptions = {
            melee: 'Close-range physical attack',
            ranged: 'Long-range projectile attack', 
            direct: 'Targeted single enemy attack',
            area: 'Affects multiple targets in an area'
        };
        return `<em>${descriptions[attackTypeId] || ''}</em>`;
    }


    // Set attack index (for compatibility with other components)
    setAttackIndex(index) {
        // AttackBasicsForm doesn't need to store this as it uses parentTab.selectedAttackIndex
    }

    // Cleanup method
    destroy() {
        // Remove any event listeners if needed
    }
}