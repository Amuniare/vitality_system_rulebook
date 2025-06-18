from pathlib import Path

# --- File 1: frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js ---

file_path_1 = Path("frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js")

# The new code for AttackBasicsForm.js
new_code_1 = """
// frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js
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
            ${this.renderIntegratedSelector(attack, character, 'Attack Types', 'attackTypes', AttackTypeSystem.getAttackTypeDefinitions(), false)}
            ${this.renderIntegratedSelector(attack, character, 'Effect Type', 'effectTypes', AttackTypeSystem.getEffectTypeDefinitions(), false)}

            ${(attack.effectTypes || []).includes('hybrid') ? this.renderHybridOrderSelector(attack) : ''}
            
            ${hasConditionEffect ? this.renderConditionSelectors(attack) : ''}
        `;
    }
    
    renderIntegratedSelector(attack, character, label, propertyKey, definitions, allowMultiple) {
        // Normalize selectedIds to always be an array
        const selectedValue = attack[propertyKey];
        const selectedIds = Array.isArray(selectedValue) ? selectedValue : (selectedValue ? [selectedValue] : []);

        let allOptions = Object.values(definitions || {});
        
        if (propertyKey === 'effectTypes' && character.archetypes?.effectType) {
            allOptions = this.filterEffectTypesByArchetype(allOptions, character.archetypes.effectType);
        }
        
        const freeTypes = propertyKey === 'attackTypes' ? (AttackTypeSystem.getFreeAttackTypesFromArchetype?.(character) || []) : [];

        const tagsHtml = allowMultiple ? selectedIds.map(id => {
            const def = allOptions.find(o => o.id === id);
            const isFree = freeTypes.includes(id);
            const costText = (propertyKey === 'attackTypes' && isFree) ? 'Free' : `${def?.cost || 0}p`;
            return `<span class="tag attack-type-tag">
                ${def?.name || id} (${costText})
                <button data-action="remove-${propertyKey.slice(0, -1)}" data-id="${id}" title="Remove">×</button>
            </span>`;
        }).join('') : '';

        let dropdownHtml = '';
        const optionsForDropdown = allOptions.map(type => ({
            value: type.id,
            label: `${type.name} (${(propertyKey === 'attackTypes' && freeTypes.includes(type.id)) ? 'Free' : `${type.cost || 0}p`})`
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

    renderConditionSelectors(attack) {
        const hasBasicSelections = (attack.basicConditions || []).length > 0;
        const hasAdvancedSelections = (attack.advancedConditions || []).length > 0;
        
        // If neither has selections, show both dropdowns
        if (!hasBasicSelections && !hasAdvancedSelections) {
            return `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderConditionSelector(attack, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions())}
                ${this.renderConditionSelector(attack, 'Advanced Conditions', 'advancedConditions', AttackTypeSystem.getAdvancedConditions())}
            `;
        }
        
        // If basic has selections, only show basic (hide advanced dropdown)
        if (hasBasicSelections) {
            return `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderConditionSelector(attack, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions())}
            `;
        }
        
        // If advanced has selections, only show advanced (hide basic dropdown)
        if (hasAdvancedSelections) {
            return `
                <hr style="border-color: var(--accent-secondary); margin: 1.5rem 0 1rem;">
                ${this.renderConditionSelector(attack, 'Advanced Conditions', 'advancedConditions', AttackTypeSystem.getAdvancedConditions())}
            `;
        }
        
        return '';
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
                    value: '', // Explicitly set to empty to reset after selection
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

    filterEffectTypesByArchetype(effectTypes, archetypeId) {
        switch (archetypeId) {
            case 'damageSpecialist':
                // Only allow damage type
                return effectTypes.filter(type => type.id === 'damage');
                
            case 'hybridSpecialist':
                // Only allow hybrid type (should be pre-selected and disabled)
                return effectTypes.filter(type => type.id === 'hybrid');
                
            case 'crowdControl':
                // Allow all effect types
                return effectTypes;
                
            default:
                // If no effect type archetype or unknown archetype, allow all
                return effectTypes;
        }
    }
}
"""

# --- File 2: frontend/character-builder/features/special-attacks/SpecialAttackTab.js ---

file_path_2 = Path("frontend/character-builder/features/special-attacks/SpecialAttackTab.js")

# The new code for SpecialAttackTab.js
new_code_2 = """
// frontend/character-builder/features/special-attacks/SpecialAttackTab.js
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { EventManager } from '../../shared/utils/EventManager.js';
import { AttackBasicsForm } from './components/AttackBasicsForm.js';
import { LimitSelection } from './components/LimitSelection.js';
import { UpgradeSelection } from './components/UpgradeSelection.js';

export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedAttackIndex = 0;
        this.attackBasicsForm = new AttackBasicsForm(this);
        this.limitSelection = new LimitSelection(this);
        this.upgradeSelection = new UpgradeSelection(this);
        this.listenersAttached = false;
        this.clickHandler = null;
        this.containerElement = null;
    }

    render() {
        this.listenersAttached = false;
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;
        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }
        
        tabContent.innerHTML = `
            <div class="special-attacks-section">
                <h2>Special Attacks</h2>
                <p class="section-description">Create unique combat abilities using limits and upgrades.</p>
                ${this.renderAttackManagement(character)}
                ${character.specialAttacks.length > 0 ?
                    this.renderAttackBuilder(character) :
                    '<div class="empty-state">Create your first special attack to begin building.</div>'}
                <div class="next-step">
                    ${RenderUtils.renderButton({
                        text: 'Continue to Utility →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-utility' }
                    })}
                </div>
            </div>
        `;
        this.setupEventListeners();
        
        // Validate custom limit form after render to ensure button state is correct
        setTimeout(() => {
            this.validateCustomLimitForm();
        }, 10);
    }
    
    renderAttackManagement(character) {
        const canCreate = SpecialAttackSystem.validateCanCreateAttack(character);
        return `
            <div class="attack-management">
                <div class="attack-list-header">
                    <h3>Attacks (${character.specialAttacks.length})</h3>
                    ${RenderUtils.renderButton({
                        text: '+ Create Attack', variant: 'primary', disabled: !canCreate.isValid,
                        dataAttributes: { action: 'create-attack' }, title: canCreate.isValid ? 'Create new' : (canCreate.errors[0] || '')
                    })}
                </div>
                <div class="attack-tabs-container">
                    ${character.specialAttacks.map((attack, index) => this.renderAttackTab(attack, index)).join('')}
                </div>
            </div>
        `;
    }
    
    renderAttackTab(attack, index) {
        return `
            <div class="attack-tab ${index === this.selectedAttackIndex ? 'active' : ''}" data-action="select-attack-tab" data-attack-index="${index}">
                <span class="attack-tab-name">${attack.name || `Attack ${index + 1}`}</span>
                <span class="attack-tab-points">${attack.upgradePointsSpent || 0}/${attack.upgradePointsAvailable || 0}p</span>
                ${RenderUtils.renderButton({
                    text: '×',
                    variant: 'danger',
                    size: 'small',
                    classes: ['delete-attack-btn'],
                    dataAttributes: { action: 'delete-attack', index }
                })}
            </div>
        `;
    }

    renderAttackBuilder(character) {
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return '';
        
        const archetype = character.archetypes.specialAttack;
        
        return `
            <div class="attack-builder card">
                ${this.attackBasicsForm.render(attack, character)}
                <div class="attack-builder-columns">
                    ${archetype === 'sharedUses' ? 
                        this._renderSharedUsesAttackUI(attack, character) : 
                        this._renderDefaultAttackUI(attack, character)
                    }
                </div>
            </div>
        `;
    }
    
    _renderDefaultAttackUI(attack, character) {
        return `
            <div class="limits-column">
                ${this.limitSelection.render(attack, character)}
            </div>
            <div class="upgrades-column">
                ${this.upgradeSelection.render(attack, character)}
            </div>
        `;
    }
    
    _renderSharedUsesAttackUI(attack, character) {
        const useCostSelected = attack.useCost && attack.useCost > 0;
        const upgradesDisabled = !useCostSelected;
        
        return `
            <div class="use-cost-column">
                <div class="use-cost-selector">
                    <h3>Use Cost</h3>
                    <p class="section-description">Select the cost for this attack (1-3 uses).</p>
                    <div class="use-cost-options">
                        ${[1, 2, 3].map(cost => `
                            <div class="card clickable ${attack.useCost === cost ? 'selected' : ''}" 
                                 data-action="select-use-cost" data-cost="${cost}">
                                <input type="radio" name="use-cost-${attack.id}" value="${cost}" 
                                       ${attack.useCost === cost ? 'checked' : ''} 
                                       style="display: none;">
                                <div class="card-header">
                                    <div class="card-title">${cost} Use${cost > 1 ? 's' : ''}</div>
                                    <div class="card-cost">${character.tier * 5 * cost} points</div>
                                </div>
                                <div class="card-description">
                                    ${cost === 1 ? 'Single-use attack with moderate power' : 
                                      cost === 2 ? 'Moderate cost attack with good power' : 
                                      'High cost attack with maximum power'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="upgrades-column ${upgradesDisabled ? 'disabled' : ''}">
                ${upgradesDisabled ? 
                    '<div class="disabled-message"><p>Select a Use Cost to enable upgrades</p></div>' :
                    this.upgradeSelection.render(attack, character)
                }
            </div>
        `;
    }
    
    removeEventListeners() {
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.containerElement.removeEventListener('change', this.clickHandler);
            this.containerElement.removeEventListener('input', this.clickHandler);
            this.clickHandler = null;
            this.containerElement = null;
        }
    }
    
    setupEventListeners() {
        // Clean up old listeners first to prevent duplication
        this.removeEventListeners();

        const container = document.getElementById('tab-specialAttacks');
        if (!container) return;

        // Store the handler and container for proper cleanup
        this.clickHandler = (e) => {
            // For radio buttons and other inputs, check the target itself first
            let element = e.target.hasAttribute('data-action') ? e.target : e.target.closest('[data-action]');
            if (element) {
                this.handleEvent(e, element);
            } else if (e.target.classList.contains('custom-limit-input')) {
                this.validateCustomLimitForm();
            }
        };
        this.containerElement = container;

        // Attach listeners using stored properties
        this.containerElement.addEventListener('click', this.clickHandler);
        this.containerElement.addEventListener('change', this.clickHandler);
        this.containerElement.addEventListener('input', this.clickHandler);
        
        this.listenersAttached = true;
        console.log('✅ SpecialAttackTab event listeners attached ONCE.');
    }

    handleEvent(e, element) {
        const { action, ...data } = element.dataset;
        
        if (element.tagName === 'SELECT' && e.type === 'click') {
            return;
        }
        
        if (e.type !== 'input') {
            e.stopPropagation();
        }

        const handlers = {
            'create-attack': () => this.createNewAttack(),
            'select-attack-tab': () => this.selectAttack(parseInt(data.attackIndex)),
            'delete-attack': () => this.deleteAttack(parseInt(data.index)),
            
            'update-attack-name': () => this.updateAttackProperty('name', element.value),
            'update-attack-subtitle': () => this.updateAttackProperty('subtitle', element.value),
            'update-attack-details': () => this.updateAttackProperty('description', element.value),
            
            'set-attackType': () => this.setAttackType(element.value),
            'set-effectType': () => this.setEffectType(element.value),
            
            'add-basicCondition': () => this.addCondition(element.value, false),
            'remove-basicCondition': () => this.removeCondition(data.id, false),
            'add-advancedCondition': () => this.addCondition(element.value, true),
            'remove-advancedCondition': () => this.removeCondition(data.id, true),
            
            'update-hybrid-order': () => this.updateAttackProperty('hybridOrder', element.value),
            
            'select-use-cost': () => this.selectUseCost(parseInt(data.cost)),
            
            'add-limit': () => this.addLimit(data.limitId),
            'remove-limit': () => this.removeLimit(data.limitId),
            'toggle-limit-category': () => this.toggleLimitCategory(data.category),
            'add-custom-limit': (e, el) => this.addCustomLimit(el),
            'cancel-custom-limit-form': () => this.limitSelection.clearCustomLimitForm(),
            
            'purchase-upgrade': () => this.purchaseUpgrade(data.upgradeId),
            'remove-upgrade': () => this.removeUpgrade(data.upgradeId),
            'toggle-specialty': () => this.toggleUpgradeSpecialty(data.upgradeId),
            'toggle-upgrade-category': () => { this.upgradeSelection.toggleCategory(data.category); this.render(); },
            
            'show-custom-upgrade-form': () => this.upgradeSelection.showCustomUpgradeForm(),
            'cancel-custom-upgrade-special-attack': () => this.upgradeSelection.cancelCustomUpgradeForm(),
            'add-custom-upgrade-special-attack': () => this.upgradeSelection.handleAddCustomUpgrade(),
            
            'continue-to-utility': () => this.builder.switchTab('utility')
        };
        
        handlers[action]?.(e, element);
    }
    
    createNewAttack() {
        const character = this.builder.currentCharacter;
        try {
            const newAttack = SpecialAttackSystem.createSpecialAttack(character);
            character.specialAttacks.push(newAttack);
            this.selectedAttackIndex = character.specialAttacks.length - 1;
            this.builder.updateCharacter();
        } catch(e) { this.builder.showNotification(e.message, 'error'); }
    }
    
    selectAttack(index) {
        if (index !== this.selectedAttackIndex) {
            this.selectedAttackIndex = index;
            this.render();
        }
    }
    
    deleteAttack(index) {
        if(isNaN(index)) return;
        if(confirm('Are you sure you want to delete this attack?')){
            SpecialAttackSystem.deleteSpecialAttack(this.builder.currentCharacter, index);
            if (this.selectedAttackIndex >= this.builder.currentCharacter.specialAttacks.length) {
                this.selectedAttackIndex = Math.max(0, this.builder.currentCharacter.specialAttacks.length - 1);
            }
            this.builder.updateCharacter();
        }
    }
    
    updateAttackProperty(prop, value) { 
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            attack[prop] = value;
            this.builder.currentCharacter.touch();
            if (this.builder.library && this.builder.currentCharacter.id) {
                this.builder.library.saveCharacter(this.builder.currentCharacter);
            }
        }
    }
    
    selectUseCost(cost) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            attack.useCost = cost;
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
        }
    }
    
    setAttackType(newTypeId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return;
        
        const oldTypeId = (attack.attackTypes && attack.attackTypes.length > 0) ? attack.attackTypes[0] : null;
        if (oldTypeId === newTypeId) return;

        // Replace the existing type with the new one
        attack.attackTypes = newTypeId ? [newTypeId] : [];
        
        SpecialAttackSystem.recalculateAttackPoints(character, attack);
        this.builder.updateCharacter();
    }

    setEffectType(newTypeId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return;

        const oldTypeId = (attack.effectTypes && attack.effectTypes.length > 0) ? attack.effectTypes[0] : null;
        if (oldTypeId === newTypeId) return;
        
        attack.effectTypes = newTypeId ? [newTypeId] : [];

        SpecialAttackSystem.recalculateAttackPoints(character, attack);
        this.builder.updateCharacter();
    }
    
    addCondition(conditionId, isAdvanced) {
        if (!conditionId) return;
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            const arrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
            if (!attack[arrayKey]) attack[arrayKey] = [];
            if (!attack[arrayKey].includes(conditionId)) {
                attack[arrayKey].push(conditionId);
                this.builder.updateCharacter();
            }
        }
    }

    removeCondition(conditionId, isAdvanced) {
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            const arrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
            if(attack[arrayKey]) attack[arrayKey] = attack[arrayKey].filter(id => id !== conditionId);
            this.builder.updateCharacter();
        }
    }
    
    addLimit(limitId) {
        try {
            SpecialAttackSystem.addLimitToAttack(this.builder.currentCharacter, this.selectedAttackIndex, limitId);
            this.builder.updateCharacter();
        } catch (error) { this.builder.showNotification(error.message, 'error'); }
    }

    removeLimit(limitId) {
        try {
            SpecialAttackSystem.removeLimitFromAttack(this.builder.currentCharacter, this.selectedAttackIndex, limitId);
            this.builder.updateCharacter();
        } catch (error) { this.builder.showNotification(error.message, 'error'); }
    }

    toggleLimitCategory(category) {
        this.limitSelection.toggleCategory(category);
        this.render();
    }

    addCustomLimit(buttonElement) {
        const creatorCard = buttonElement.closest('.custom-limit-creator');
        if (!creatorCard) {
            this.builder.showNotification('Custom limit form not found', 'error');
            return;
        }
        
        const form = creatorCard.querySelector('.custom-limit-form');
        const nameInput = form.querySelector('.custom-limit-name');
        const descriptionInput = form.querySelector('.custom-limit-description');
        const pointsInput = form.querySelector('.custom-limit-points');
        
        if (!nameInput || !descriptionInput || !pointsInput) {
            this.builder.showNotification('Custom limit form inputs not found', 'error');
            return;
        }
        
        const limitData = {
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim(),
            points: pointsInput.value
        };
        
        try {
            SpecialAttackSystem.addCustomLimitToAttack(this.builder.currentCharacter, this.selectedAttackIndex, limitData);
            
            this.limitSelection.cancelCustomLimitForm(buttonElement);
            
            this.builder.updateCharacter();
            this.builder.showNotification('Custom limit added successfully', 'success');
        } catch (error) {
            this.builder.showNotification(error.message, 'error');
        }
    }

    validateCustomLimitForm() {
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;
        
        const forms = tabContent.querySelectorAll('.custom-limit-form');
        forms.forEach(form => {
            if (form.style.display !== 'none') {
                this.limitSelection.validateCustomLimitFormScoped(form);
            }
        });
    }

    purchaseUpgrade(upgradeId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) {
            this.builder.showNotification('No attack selected', 'error');
            return;
        }
        
        const upgradeData = SpecialAttackSystem.getUpgradeById(upgradeId);
        if (!upgradeData) {
            this.builder.showNotification('Upgrade not found', 'error');
            return;
        }
        
        const actualCost = SpecialAttackSystem._getActualUpgradeCost(upgradeData, character);
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        
        if (actualCost > remainingPoints) {
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        try {
            SpecialAttackSystem.addUpgradeToAttack(character, this.selectedAttackIndex, upgradeId);
            this.builder.updateCharacter();
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
        }
    }

    removeUpgrade(upgradeId) {
        try {
            SpecialAttackSystem.removeUpgradeFromAttack(this.builder.currentCharacter, this.selectedAttackIndex, upgradeId);
            this.builder.updateCharacter();
        } catch (error) { this.builder.showNotification(error.message, 'error'); }
    }

    toggleUpgradeSpecialty(upgradeId) {
        try {
            SpecialAttackSystem.toggleUpgradeSpecialty(this.builder.currentCharacter, this.selectedAttackIndex, upgradeId);
            this.builder.updateCharacter();
        } catch (error) { this.builder.showNotification(error.message, 'error'); }
    }
    
    onCharacterUpdate() {
        this.render();
    }
}
"""

try:
    # Write the updated content for the first file
    file_path_1.write_text(new_code_1, encoding='utf-8')
    print(f"Successfully updated {file_path_1}")

    # Write the updated content for the second file
    file_path_2.write_text(new_code_2, encoding='utf-8')
    print(f"Successfully updated {file_path_2}")

except FileNotFoundError as e:
    print(f"Error: File not found at {e.filename}")
except Exception as e:
    print(f"An error occurred: {e}")