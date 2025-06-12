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
        
        return `
            <div class="attack-builder card">
                ${this.attackBasicsForm.render(attack, character)}
                <div class="attack-builder-columns">
                    <div class="limits-column">
                        ${this.limitSelection.render(attack, character)}
                    </div>
                    <div class="upgrades-column">
                        ${this.upgradeSelection.render(attack, character)}
                    </div>
                </div>
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
            const element = e.target.closest('[data-action]');
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
        
        // Only stop propagation for non-input events to allow normal typing behavior
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
            
            'add-attackType': () => this.addAttackType(element.value),
            'remove-attackType': () => this.removeAttackType(data.id),
            'add-effectType': () => this.addEffectType(element.value),
            'remove-effectType': () => this.removeEffectType(data.id),
            
            'add-basicCondition': () => this.addCondition(element.value, false),
            'remove-basicCondition': () => this.removeCondition(data.id, false),
            'add-advancedCondition': () => this.addCondition(element.value, true),
            'remove-advancedCondition': () => this.removeCondition(data.id, true),
            
            'update-hybrid-order': () => this.updateAttackProperty('hybridOrder', element.value),
            
            'add-limit': () => this.addLimit(data.limitId),
            'remove-limit': () => this.removeLimit(data.limitId),
            'toggle-limit-category': () => this.toggleLimitCategory(data.category),
            'add-custom-limit': (e, el) => this.addCustomLimit(el),
            'show-custom-limit-form': (e, el) => this.limitSelection.showCustomLimitForm(el),
            'cancel-custom-limit-form': (e, el) => this.limitSelection.cancelCustomLimitForm(el),
            
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
            // Update the character timestamp and save to localStorage
            // but don't trigger a full re-render that would lose focus
            this.builder.currentCharacter.touch();
            if (this.builder.library && this.builder.currentCharacter.id) {
                this.builder.library.saveCharacter(this.builder.currentCharacter);
            }
        }
    }
    
    addAttackType(typeId) { 
        if (!typeId) return;
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if (attack && !attack.attackTypes.includes(typeId)) {
            attack.attackTypes.push(typeId);
            this.builder.updateCharacter();
        }
    }

    removeAttackType(typeId) {
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if(attack) attack.attackTypes = (attack.attackTypes || []).filter(id => id !== typeId);
        this.builder.updateCharacter();
    }

    addEffectType(typeId) {
        if (!typeId) return;
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            attack.effectTypes = [typeId];
            this.builder.updateCharacter();
        }
    }

    removeEffectType(typeId) {
        const attack = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex];
        if(attack) {
            attack.effectTypes = [];
            this.builder.updateCharacter();
        }
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
            
            // Hide the form and clear the fields using the scoped method
            this.limitSelection.cancelCustomLimitForm(buttonElement);
            
            this.builder.updateCharacter();
            this.builder.showNotification('Custom limit added successfully', 'success');
        } catch (error) {
            this.builder.showNotification(error.message, 'error');
        }
    }

    validateCustomLimitForm() {
        // Find the currently active attack tab's form
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;
        
        const forms = tabContent.querySelectorAll('.custom-limit-form');
        forms.forEach(form => {
            // Only validate visible forms
            if (form.style.display !== 'none') {
                this.limitSelection.validateCustomLimitFormScoped(form);
            }
        });
    }

    purchaseUpgrade(upgradeId) {
        // 1. Get current attack and point balance
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) {
            this.builder.showNotification('No attack selected', 'error');
            return;
        }
        
        // 2. Get the cost of the upgrade
        const upgradeData = SpecialAttackSystem.getUpgradeById(upgradeId);
        if (!upgradeData) {
            this.builder.showNotification('Upgrade not found', 'error');
            return;
        }
        
        const actualCost = SpecialAttackSystem._getActualUpgradeCost(upgradeData, character);
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        
        // 3. Check if this purchase will go over budget
        if (actualCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            SpecialAttackSystem.addUpgradeToAttack(character, this.selectedAttackIndex, upgradeId);
            this.builder.updateCharacter();
        } catch (error) {
            // This will now only catch hard rule validation errors.
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
        // Just call render - it will handle the state reset
        this.render();
    }
}