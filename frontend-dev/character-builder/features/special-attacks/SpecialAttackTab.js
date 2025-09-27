
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
            
            'set-basicCondition': () => this.setCondition(element.value, false),
            'remove-basicCondition': () => this.removeCondition(data.id, false),
            'set-advancedCondition': () => this.setCondition(element.value, true),
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
    
    setCondition(conditionId, isAdvanced) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return;
        
        const arrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
        
        // Set single condition (like attack/effect types)
        attack[arrayKey] = conditionId ? [conditionId] : [];
        
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
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            const arrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
            if(attack[arrayKey]) attack[arrayKey] = attack[arrayKey].filter(id => id !== conditionId);
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
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



    addAttackType(typeId) { 
        if (!typeId) return;
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (attack && !attack.attackTypes.includes(typeId)) {
            attack.attackTypes.push(typeId);
            // CRITICAL: Trigger recalculation
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
        }
    }

    removeAttackType(typeId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            attack.attackTypes = (attack.attackTypes || []).filter(id => id !== typeId);
            // CRITICAL: Trigger recalculation
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
        }
    }

    addEffectType(typeId) {
        if (!typeId) return;
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            attack.effectTypes = [typeId];
            // CRITICAL: Trigger recalculation
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
        }
    }

    removeEffectType(typeId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            attack.effectTypes = [];
            // CRITICAL: Trigger recalculation
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
        }
    }

    addCondition(conditionId, isAdvanced) {
        if (!conditionId) return;
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            const arrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
            if (!attack[arrayKey]) attack[arrayKey] = [];
            if (!attack[arrayKey].includes(conditionId)) {
                attack[arrayKey].push(conditionId);
                // CRITICAL: Trigger recalculation
                SpecialAttackSystem.recalculateAttackPoints(character, attack);
                this.builder.updateCharacter();
            }
        }
    }

    removeCondition(conditionId, isAdvanced) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            const arrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
            if (attack[arrayKey]) {
                attack[arrayKey] = attack[arrayKey].filter(id => id !== conditionId);
                // CRITICAL: Trigger recalculation
                SpecialAttackSystem.recalculateAttackPoints(character, attack);
                this.builder.updateCharacter();
            }
        }
    }
        
    onCharacterUpdate() {
        this.render();
    }
}
