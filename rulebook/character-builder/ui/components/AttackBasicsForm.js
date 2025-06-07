// rulebook/character-builder/ui/components/AttackBasicsForm.js
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class AttackBasicsForm {
    constructor(parentTab) {
        this.parentTab = parentTab;
    }

    render(attack, character) {
        if (!attack || !character) {
            return `<div class="error-text">Attack data not available for rendering.</div>`;
        }

        return `
            <div class="attack-basics-form">
                <div class="attack-basics-columns">
                    <!-- Left Column: Name, Subtitle, Description -->
                    <div class="attack-basics-left">
                        ${this.renderNameFields(attack)}
                    </div>
                    <!-- Right Column: All type selections -->
                    <div class="attack-basics-right">
                        ${this.renderTypeSelectors(attack, character)}
                    </div>
                </div>
            </div>
        `;
    }

    renderNameFields(attack) {
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
                inputHtml: `<textarea id="attack-details-${this.parentTab.selectedAttackIndex}" placeholder="Describe the attack's appearance and function." data-action="update-attack-details" rows="3">${attack.description || ''}</textarea>`
            })}
        `;
    }

    renderTypeSelectors(attack, character) {
        return `
            ${this.renderIntegratedSelector(attack, character, 'Attack Types', 'attackTypes', AttackTypeSystem.getAttackTypeDefinitions(), true)}
            ${this.renderIntegratedSelector(attack, character, 'Effect Type', 'effectTypes', AttackTypeSystem.getEffectTypeDefinitions(), false)}
            ${this.renderConditionalFields(attack, character)}
        `;
    }

    renderIntegratedSelector(attack, character, label, property, definitions, allowMultiple) {
        const selectedIds = attack[property] || [];
        const allOptions = Object.values(definitions || {});
        const freeTypes = property === 'attackTypes' ? AttackTypeSystem.getFreeAttackTypesFromArchetype(character) : [];

        const tagsHtml = selectedIds.map(id => {
            const def = allOptions.find(o => o.id === id);
            const isFree = freeTypes.includes(id);
            const costText = isFree ? 'Free' : `${def?.cost || 0}p`;
            return `<span class="tag attack-type-tag">
                ${def?.name || id} (${costText})
                <button data-action="remove-${property.slice(0, -1)}" data-id="${id}" title="Remove">×</button>
            </span>`;
        }).join('');

        let dropdownHtml = '';
        if (allowMultiple || selectedIds.length === 0) {
            const availableOptions = allOptions
                .filter(opt => !selectedIds.includes(opt.id))
                .map(type => ({
                    value: type.id,
                    label: `${type.name} (${freeTypes.includes(type.id) ? 'Free' : `${type.cost || 0}p`})`
                }));

            if (availableOptions.length > 0) {
                dropdownHtml = RenderUtils.renderSelect({
                    id: `${property}-select-${this.parentTab.selectedAttackIndex}`,
                    options: availableOptions,
                    dataAttributes: { action: `add-${property.slice(0, -1)}` },
                    placeholder: `Add an ${label.slice(0, -1)}...`
                });
            }
        }

        return `
            <div class="form-group integrated-selector">
                <label>${label}</label>
                <div class="selected-tags">
                    ${tagsHtml || ''}
                </div>
                ${dropdownHtml}
            </div>
        `;
    }

    renderConditionalFields(attack, character) {
        let html = '';
        const hasConditionEffect = (attack.effectTypes || []).some(e => ['condition', 'hybrid'].includes(e));

        if ((attack.effectTypes || []).includes('hybrid')) {
            html += RenderUtils.renderFormGroup({
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
        
        if (hasConditionEffect) {
            html += '<hr style="border-color: var(--accent-secondary); margin: 1rem 0;">';
            html += this.renderConditionSelector(attack, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions());
            html += this.renderConditionSelector(attack, 'Advanced Conditions', 'advancedConditions', AttackTypeSystem.getAdvancedConditions());
        }

        return html ? `<div class="conditional-fields">${html}</div>` : '';
    }

    renderConditionSelector(attack, label, property, definitions) {
        const selectedIds = attack[property] || [];
        const allDefinitions = definitions || [];

        const tagsHtml = selectedIds.map(id => {
            const def = allDefinitions.find(d => d.id === id);
            return `<span class="tag condition-tag">
                ${def?.name || id} ${def?.cost ? `(${def.cost}p)`: ''}
                <button data-action="remove-${property.slice(0, -1)}" data-id="${id}">×</button>
            </span>`;
        }).join('');

        const availableOptions = allDefinitions
            .filter(c => !selectedIds.includes(c.id))
            .map(c => ({ value: c.id, label: `${c.name}${c.cost ? ` (${c.cost}p)` : ''}` }));

        const dropdownHtml = availableOptions.length > 0 ? RenderUtils.renderSelect({
            id: `${property}-select-${this.parentTab.selectedAttackIndex}`,
            options: availableOptions,
            dataAttributes: { action: `add-${property.slice(0, -1)}` },
            placeholder: `Add a ${label.slice(0, -1)}...`
        }) : '';

        return `
            <div class="form-group integrated-selector">
                <label>${label}</label>
                <div class="selected-tags">${tagsHtml || ''}</div>
                ${dropdownHtml}
            </div>
        `;
    }
}