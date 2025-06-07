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
                    </div>
                    <div class="attack-basics-right">
                        ${this.renderTypeSelectors(attack, currentCharacter)}
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

    renderTypeSelectors(attack, character) {
        // Fetch all type definitions from the system
        const attackTypes = AttackTypeSystem.getAttackTypeDefinitions ? AttackTypeSystem.getAttackTypeDefinitions() : {};
        const effectTypes = AttackTypeSystem.getEffectTypeDefinitions ? AttackTypeSystem.getEffectTypeDefinitions() : {};
        const freeAttackTypes = AttackTypeSystem.getFreeAttackTypesFromArchetype ? AttackTypeSystem.getFreeAttackTypesFromArchetype(character) : [];

        // Map definitions to options for RenderUtils.renderSelect
        const attackTypeOptions = Object.values(attackTypes).map(type => ({
            value: type.id,
            label: `${type.name} (${freeAttackTypes.includes(type.id) ? 'Free' : (type.cost + 'p')})`,
            disabled: (attack.attackTypes || []).includes(type.id) // Disable if already selected
        }));

        const effectTypeOptions = Object.values(effectTypes).map(type => ({
            value: type.id,
            label: `${type.name} (${type.cost}p)`,
            disabled: (attack.effectTypes || []).includes(type.id)
        }));

        return `
            ${RenderUtils.renderFormGroup({
                label: 'Attack Type:',
                inputId: `attack-type-select-${this.parentTab.selectedAttackIndex}`,
                inputHtml: RenderUtils.renderSelect({
                    id: `attack-type-select-${this.parentTab.selectedAttackIndex}`,
                    options: attackTypeOptions,
                    dataAttributes: { action: 'add-attack-type' },
                    placeholder: 'Add an Attack Type...'
                })
            })}
            ${RenderUtils.renderFormGroup({
                label: 'Effect Type:',
                inputId: `effect-type-select-${this.parentTab.selectedAttackIndex}`,
                inputHtml: RenderUtils.renderSelect({
                    id: `effect-type-select-${this.parentTab.selectedAttackIndex}`,
                    options: effectTypeOptions,
                    dataAttributes: { action: 'add-effect-type' },
                    placeholder: 'Add an Effect Type...'
                })
            })}
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

    // Event handling
    handleFormEvent(event) {
        const action = event.target.dataset.action;
        const value = event.target.value;

        switch (action) {
            case 'update-attack-name':
                this.parentTab.updateAttackProperty('name', value);
                break;
            case 'update-attack-subtitle':
                this.parentTab.updateAttackProperty('subtitle', value);
                break;
            case 'update-attack-details':
                this.parentTab.updateAttackProperty('description', value);
                break;
            case 'update-attack-type':
                this.parentTab.updateAttackProperty('attackType', value);
                break;
            case 'add-attack-type':
                if (value && this.parentTab.addAttackType) {
                    this.parentTab.addAttackType(value);
                    event.target.value = ''; // Reset selection
                }
                break;
            case 'add-effect-type':
                if (value && this.parentTab.addEffectType) {
                    this.parentTab.addEffectType(value);
                    event.target.value = ''; // Reset selection
                }
                break;
        }
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