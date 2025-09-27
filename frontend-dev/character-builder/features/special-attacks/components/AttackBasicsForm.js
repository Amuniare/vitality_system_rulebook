
// frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js
import { AttackTypeSystem } from '../../../systems/AttackTypeSystem.js';
import { ArchetypeSystem } from '../../../systems/ArchetypeSystem.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class AttackBasicsForm {
    constructor(parentTab) {
        this.parentTab = parentTab;
    }

    render(attack, character) {
        if (!attack || !character) {
            return `<div class="error-text">Attack data not available.</div>`;
        }

        return `
            <div class="attack-basics-form">
                <div class="attack-basics-columns">
                    <div class="attack-basics-left">
                        ${this.renderNameAndDetailFields(attack)}
                    </div>
                    <div class="attack-basics-right">
                        ${this.renderTypeAndConditionSelectors(attack, character)}
                    </div>
                </div>
            </div>
        `;
    }

    renderNameAndDetailFields(attack) {
        return `
            ${RenderUtils.renderFormGroup({
                label: 'Attack Name:',
                inputId: `attack-name-${this.parentTab.selectedAttackIndex}`,
                inputHtml: `<input type="text" id="attack-name-${this.parentTab.selectedAttackIndex}" data-testid="attack-name" value="${attack.name || ''}" placeholder="Enter attack name" data-action="update-attack-name">`
            })}
            ${RenderUtils.renderFormGroup({
                label: 'Subtitle:',
                inputId: `attack-subtitle-${this.parentTab.selectedAttackIndex}`,
                inputHtml: `<input type="text" id="attack-subtitle-${this.parentTab.selectedAttackIndex}" value="${attack.subtitle || ''}" placeholder="e.g., Ranged Physical" data-action="update-attack-subtitle">`
            })}
            ${RenderUtils.renderFormGroup({
                label: 'Details:',
                inputId: `attack-details-${this.parentTab.selectedAttackIndex}`,
                inputHtml: `<textarea id="attack-details-${this.parentTab.selectedAttackIndex}" placeholder="Describe the attack's appearance and function." data-action="update-attack-details" rows="4">${attack.description || ''}</textarea>`
            })}
        `;
    }

    renderTypeAndConditionSelectors(attack, character) {
        const hasConditionEffect = (attack.effectTypes || []).some(e => ['condition', 'hybrid'].includes(e));

        return `
            ${this.renderIntegratedSelector(attack, character, 'Attack Types', 'attackTypes', AttackTypeSystem.getAttackTypeDefinitions(character), false)}
            ${this.renderIntegratedSelector(attack, character, 'Effect Type', 'effectTypes', AttackTypeSystem.getEffectTypeDefinitions(), false)}

            ${(attack.effectTypes || []).includes('hybrid') ? this.renderHybridOrderSelector(attack) : ''}
            
            ${hasConditionEffect ? this.renderConditionSelectors(attack, character) : ''}
        `;
    }
    
    renderIntegratedSelector(attack, character, label, propertyKey, definitions, allowMultiple) {
        // Normalize selectedIds to always be an array
        const selectedValue = attack[propertyKey];
        const selectedIds = Array.isArray(selectedValue) ? selectedValue : (selectedValue ? [selectedValue] : []);

        let allOptions = Object.values(definitions || {});
        
        // Get free types for attack types, effect types, and advanced conditions
        const freeTypes = propertyKey === 'attackTypes' ? 
            (AttackTypeSystem.getFreeAttackTypesFromArchetype?.(character) || []) :
            propertyKey === 'effectTypes' ? 
            (AttackTypeSystem.getFreeEffectTypesFromArchetype?.(character) || []) :
            propertyKey === 'advancedConditions' ?
            (AttackTypeSystem.getFreeAdvancedConditionsFromArchetype?.(character) || []) :
            [];

        const tagsHtml = allowMultiple ? selectedIds.map(id => {
            const def = allOptions.find(o => o.id === id);
            const isFree = freeTypes.includes(id);
            const costText = isFree ? 'Free' : `${def?.cost || 0}p`;
            return `<span class="tag attack-type-tag">
                ${def?.name || id} (${costText})
                <button data-action="remove-${propertyKey.slice(0, -1)}" data-id="${id}" title="Remove">×</button>
            </span>`;
        }).join('') : '';

        let dropdownHtml = '';
        const optionsForDropdown = allOptions.map(type => ({
            value: type.id,
            label: `${type.name} (${freeTypes.includes(type.id) ? 'Free' : `${type.cost || 0}p`})`
        }));
        
        // For multi-select, filter out already selected options. For single-select, show all.
        const finalDropdownOptions = allowMultiple ? optionsForDropdown.filter(opt => !selectedIds.includes(opt.value)) : optionsForDropdown;
        
        const shouldShowDropdown = allowMultiple ? (finalDropdownOptions.length > 0) : (optionsForDropdown.length > 0);
        
        if (shouldShowDropdown) {
            const isHybridSpecialist = propertyKey === 'effectTypes' && character.archetypes?.effectType === 'hybridSpecialist';

            if (isHybridSpecialist && allOptions.length === 1 && allOptions[0].id === 'hybrid') {
                 dropdownHtml = `<div class="archetype-restriction-message" style="font-style: italic; color: var(--accent-secondary); margin-top: var(--gap-small);">
                    As a Hybrid Specialist, all attacks must be Hybrid type.
                </div>`;
            } else {
                const currentValue = allowMultiple ? '' : (selectedIds[0] || '');
                
                dropdownHtml = RenderUtils.renderSelect({
                    id: `${propertyKey}-select-${this.parentTab.selectedAttackIndex}`,
                    options: finalDropdownOptions,
                    value: currentValue,
                    dataAttributes: {
                        action: `set-${propertyKey.slice(0, -1)}`, // Use a 'set' action for clarity
                        testid: propertyKey === 'effectTypes' ? 'attack-type' : (propertyKey === 'attackTypes' ? 'attack-type-select' : undefined)
                    },
                    placeholder: `Select ${label.slice(0, -1)}...`
                });
            }
        }
        
        return `
            <div class="form-group integrated-selector">
                <label>${label}</label>
                <div class="selected-tags">${tagsHtml}</div>
                ${dropdownHtml}
            </div>
        `;
    }

    renderHybridOrderSelector(attack) {
        return RenderUtils.renderFormGroup({
            label: 'Hybrid Order:',
            inputHtml: RenderUtils.renderSelect({
                id: `hybrid-order-${this.parentTab.selectedAttackIndex}`,
                options: [
                    { value: 'damage-first', label: 'Damage then Conditions' },
                    { value: 'conditions-first', label: 'Conditions then Damage' }
                ],
                value: attack.hybridOrder || 'damage-first',
                dataAttributes: { action: 'update-hybrid-order' }
            })
        });
    }

    renderConditionSelectors(attack, character) {
        const hasBasicSelections = (attack.basicConditions || []).length > 0;
        const hasAdvancedSelections = (attack.advancedConditions || []).length > 0;
        
        // If neither has selections, show both dropdowns
        if (!hasBasicSelections && !hasAdvancedSelections) {
            return `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderIntegratedSelector(attack, character, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions(), false)}
                ${this.renderArchetypeInfo(character, true)}
                ${this.renderIntegratedSelector(attack, character, 'Advanced Conditions', 'advancedConditions', AttackTypeSystem.getAdvancedConditions(), false)}
            `;
        }
        
        // If basic has selections, only show basic (hide advanced dropdown)
        if (hasBasicSelections) {
            return `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderIntegratedSelector(attack, character, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions(), false)}
            `;
        }
        
        // If advanced has selections, only show advanced (hide basic dropdown)
        if (hasAdvancedSelections) {
            return `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderArchetypeInfo(character, true)}
                ${this.renderIntegratedSelector(attack, character, 'Advanced Conditions', 'advancedConditions', AttackTypeSystem.getAdvancedConditions(), false)}
            `;
        }
        
        return '';
    }

    // Render archetype info box for Crowd Control benefits
    renderArchetypeInfo(character, showingAdvanced = false) {
        if (!showingAdvanced || character.archetypes.effectType !== 'crowdControl') {
            return '';
        }

        const freeConditions = ArchetypeSystem.getFreeAdvancedConditions(character);
        const usedConditions = ArchetypeSystem.countUsedFreeAdvancedConditions(character);
        const remainingFree = Math.max(0, freeConditions - usedConditions);

        if (freeConditions > 0) {
            return `
                <div class="archetype-info-box">
                    <strong>Crowd Control:</strong> You have ${remainingFree} of ${freeConditions} free Advanced Condition selections remaining.
                </div>
            `;
        }

        return '';
    }
}
