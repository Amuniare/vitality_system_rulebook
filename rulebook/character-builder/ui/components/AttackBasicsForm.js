// AttackBasicsForm.js - Handles name, description, and type selectors for special attacks
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class AttackBasicsForm {
    constructor(parentTab) {
        this.parentTab = parentTab;
        this.attackIndex = 0;
    }

    setAttackIndex(index) {
        this.attackIndex = index;
    }

    render(attack) {
        return `
            <div class="attack-basics-form">
                <div class="attack-basics-columns">
                    <div class="attack-basics-left">
                        ${this.renderNameFields(attack)}
                    </div>
                    <div class="attack-basics-right">
                        ${this.renderTypeSelector(attack)}
                    </div>
                </div>
            </div>
        `;
    }

    renderNameFields(attack) {
        return `
            <div class="attack-name-row">
                <label for="attack-name-${this.attackIndex}">Attack Name:</label>
                <input type="text" 
                       id="attack-name-${this.attackIndex}" 
                       value="${attack.name || ''}" 
                       placeholder="Enter attack name" 
                       data-action="update-attack-name">
            </div>
            <div class="attack-subtitle-row">
                <label for="attack-subtitle-${this.attackIndex}">Attack Subtitle:</label>
                <input type="text" 
                       id="attack-subtitle-${this.attackIndex}" 
                       value="${attack.subtitle || ''}" 
                       placeholder="Enter subtitle" 
                       data-action="update-attack-subtitle">
            </div>
            <div class="attack-details-row">
                <label for="attack-details-${this.attackIndex}">Attack Details:</label>
                <input type="text" 
                       id="attack-details-${this.attackIndex}" 
                       value="${attack.details || ''}" 
                       placeholder="Enter details" 
                       data-action="update-attack-details">
            </div>
        `;
    }

    renderTypeSelector(attack) {
        return `
            <div class="attack-type-row">
                <label for="attack-type-${this.attackIndex}">Attack Type:</label>
                <select id="attack-type-${this.attackIndex}" data-action="update-attack-type">
                    <option value="">Select attack type</option>
                    ${this.renderAttackTypeOptions(attack)}
                </select>
            </div>
            <div class="attack-type-description">
                ${attack.attackType ? this.getAttackTypeDescription(attack.attackType) : 'Select an attack type to see its description.'}
            </div>
        `;
    }

    renderAttackTypeOptions(attack) {
        const attackTypes = AttackTypeSystem.getAvailableAttackTypes();
        return attackTypes.map(type => 
            `<option value="${type.id}" ${attack.attackType === type.id ? 'selected' : ''}>${type.name}</option>`
        ).join('');
    }

    getAttackTypeDescription(attackTypeId) {
        const attackType = AttackTypeSystem.getAttackTypeById(attackTypeId);
        return attackType ? `<em>${attackType.description}</em>` : '';
    }

    // Granular update methods for improved performance
    updateAttackName(newName) {
        const input = document.getElementById(`attack-name-${this.attackIndex}`);
        if (input && input.value !== newName) {
            input.value = newName;
        }
    }

    updateAttackSubtitle(newSubtitle) {
        const input = document.getElementById(`attack-subtitle-${this.attackIndex}`);
        if (input && input.value !== newSubtitle) {
            input.value = newSubtitle;
        }
    }

    updateAttackDetails(newDetails) {
        const input = document.getElementById(`attack-details-${this.attackIndex}`);
        if (input && input.value !== newDetails) {
            input.value = newDetails;
        }
    }

    updateAttackType(newType) {
        const select = document.getElementById(`attack-type-${this.attackIndex}`);
        if (select && select.value !== newType) {
            select.value = newType;
        }
        
        // Update description
        const descContainer = select?.parentElement?.nextElementSibling;
        if (descContainer) {
            descContainer.innerHTML = newType ? this.getAttackTypeDescription(newType) : 'Select an attack type to see its description.';
        }
    }

    // Handle form events
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
                this.parentTab.updateAttackProperty('details', value);
                break;
            case 'update-attack-type':
                this.parentTab.updateAttackProperty('attackType', value);
                break;
        }
    }

    // Cleanup method
    destroy() {
        // Remove any event listeners if needed
    }
}