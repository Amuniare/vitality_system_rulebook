// rulebook/character-builder/ui/tabs/SpecialAttackTab.js
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
    }

    render() {
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
    
    setupEventListeners() {
        if (this.listenersAttached) {
            return;
        }

        const container = document.getElementById('tab-specialAttacks');
        if(container) {
            EventManager.delegateEvents(container, {
                click: { '[data-action]': (e, el) => this.handleEvent(e, el) },
                change: { 'select[data-action]': (e, el) => this.handleEvent(e, el) },
                input: { 
                    'input[data-action]': (e, el) => this.handleEvent(e, el), 
                    'textarea[data-action]': (e, el) => this.handleEvent(e, el) 
                }
            }, this);
            
            this.listenersAttached = true;
            console.log('✅ SpecialAttackTab event listeners attached ONCE.');
        }
    }

    handleEvent(e, element) {
        const { action, ...data } = element.dataset;
        e.stopPropagation();

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
            
            'purchase-upgrade': () => this.purchaseUpgrade(data.upgradeId),
            'remove-upgrade': () => this.removeUpgrade(data.upgradeId),
            'toggle-upgrade-category': () => { this.upgradeSelection.toggleCategory(data.category); this.render(); },
            
            'continue-to-utility': () => this.builder.switchTab('utility')
        };
        
        handlers[action]?.();
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
        if(attack) attack[prop] = value;
        this.builder.updateCharacter(); 
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

    purchaseUpgrade(upgradeId) {
        try {
            SpecialAttackSystem.addUpgradeToAttack(this.builder.currentCharacter, this.selectedAttackIndex, upgradeId);
            this.builder.updateCharacter();
        } catch (error) { this.builder.showNotification(error.message, 'error'); }
    }

    removeUpgrade(upgradeId) {
        try {
            SpecialAttackSystem.removeUpgradeFromAttack(this.builder.currentCharacter, this.selectedAttackIndex, upgradeId);
            this.builder.updateCharacter();
        } catch (error) { this.builder.showNotification(error.message, 'error'); }
    }
    
    onCharacterUpdate() {
        this.render();
    }
}