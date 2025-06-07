// rulebook/character-builder/ui/components/AttackBasicsForm.js
import { AttackTypeSystem } from '../../../systems/AttackTypeSystem.js';
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
                inputHtml: `<input type="text" id="attack-name-${this.parentTab.selectedAttackIndex}" value="${attack.name || ''}" placeholder="Enter attack name" data-action="update-attack-name">`
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
            ${this.renderIntegratedSelector(attack, character, 'Attack Types', 'attackTypes', AttackTypeSystem.getAttackTypeDefinitions(), true)}
            ${this.renderIntegratedSelector(attack, character, 'Effect Type', 'effectTypes', AttackTypeSystem.getEffectTypeDefinitions(), false)}

            ${(attack.effectTypes || []).includes('hybrid') ? this.renderHybridOrderSelector(attack) : ''}
            
            ${hasConditionEffect ? `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderConditionSelector(attack, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions())}
                ${this.renderConditionSelector(attack, 'Advanced Conditions', 'advancedConditions', AttackTypeSystem.getAdvancedConditions())}
            ` : ''}
        `;
    }
    
    renderIntegratedSelector(attack, character, label, propertyKey, definitions, allowMultiple) {
        const selectedIds = attack[propertyKey] || [];
        const allOptions = Object.values(definitions || {});
        const freeTypes = propertyKey === 'attackTypes' ? (AttackTypeSystem.getFreeAttackTypesFromArchetype?.(character) || []) : [];

        const tagsHtml = selectedIds.map(id => {
            const def = allOptions.find(o => o.id === id);
            const isFree = freeTypes.includes(id);
            const costText = (propertyKey === 'attackTypes' && isFree) ? 'Free' : `${def?.cost || 0}p`;
            return `<span class="tag attack-type-tag">
                ${def?.name || id} (${costText})
                <button data-action="remove-${propertyKey.slice(0, -1)}" data-id="${id}" title="Remove">×</button>
            </span>`;
        }).join('');

        let dropdownHtml = '';
        if (selectedIds.length === 0) {
            const availableOptions = allOptions
                .filter(opt => !selectedIds.includes(opt.id))
                .map(type => ({
                    value: type.id,
                    label: `${type.name} (${(propertyKey === 'attackTypes' && freeTypes.includes(type.id)) ? 'Free' : `${type.cost || 0}p`})`
                }));
            
            if (availableOptions.length > 0) {
                dropdownHtml = RenderUtils.renderSelect({
                    id: `${propertyKey}-select-${this.parentTab.selectedAttackIndex}`,
                    options: availableOptions,
                    dataAttributes: { action: `add-${propertyKey.slice(0, -1)}` },
                    placeholder: `Add an ${label.slice(0, -1)}...`
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

    renderConditionSelector(attack, label, propertyKey, definitions) {
        const selectedIds = attack[propertyKey] || [];
        const allDefinitions = definitions || [];

        const tagsHtml = selectedIds.map(id => {
            const def = allDefinitions.find(d => d.id === id);
            return `<span class="tag condition-tag">
                ${def?.name || id}${def?.cost ? ` (${def.cost}p)` : ''}
                <button data-action="remove-${propertyKey.slice(0, -1)}" data-id="${id}">×</button>
            </span>`;
        }).join('');

        let dropdownHtml = '';
        if (selectedIds.length === 0) {
            const availableOptions = allDefinitions
                .filter(c => !selectedIds.includes(c.id))
                .map(c => ({ value: c.id, label: `${c.name}${c.cost ? ` (${c.cost}p)` : ''}` }));

            if (availableOptions.length > 0) {
                dropdownHtml = RenderUtils.renderSelect({
                    id: `${propertyKey}-select-${this.parentTab.selectedAttackIndex}`,
                    options: availableOptions,
                    dataAttributes: { action: `add-${propertyKey.slice(0, -1)}` },
                    placeholder: `Add a ${label.slice(0, -1)}...`
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
}