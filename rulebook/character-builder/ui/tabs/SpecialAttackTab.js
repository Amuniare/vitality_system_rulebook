// SpecialAttackTab.js - Container component for special attack management
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { TierSystem } from '../../core/TierSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';
import { AttackBasicsForm } from '../components/AttackBasicsForm.js';
import { LimitSelection } from '../components/LimitSelection.js';
import { UpgradeSelection } from '../components/UpgradeSelection.js';

export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedAttackIndex = 0;
        
        // Initialize child components
        this.attackBasicsForm = new AttackBasicsForm(this);
        this.limitSelection = new LimitSelection(this);
        this.upgradeSelection = new UpgradeSelection(this);
    }

    render() {
        const character = this.builder.character;
        const archetype = character.archetypes?.specialAttack;
        
        return `
            <div class="special-attack-tab tab-content">
                ${this.renderArchetypeInfo(character)}
                ${this.renderAttackManagement(character)}
                ${character.specialAttacks && character.specialAttacks.length > 0 ? 
                    this.renderAttackBuilder(character) :
                    '<div class="empty-state">No special attacks created yet.</div>'}
            </div>
        `;
    }

    renderArchetypeInfo(character) {
        const archetype = character.archetypes?.specialAttack;
        
        if (!archetype) {
            return `
                <div class="archetype-info warning-block">
                    <h3>⚠️ No Special Attack Archetype Selected</h3>
                    <p>You need to select a Special Attack archetype in the Archetypes tab before you can create special attacks.</p>
                    <p><em>You can still create basic special attacks without an archetype selected.</em></p>
                    ${RenderUtils.renderButton({
                        text: 'Go to Archetypes Tab',
                        variant: 'primary',
                        dataAttributes: { action: 'switch-tab', tab: 'archetypes' }
                    })}
                </div>
            `;
        }

        return `
            <div class="archetype-info">
                <h3>Special Attack Archetype: ${this.formatArchetypeName(archetype)}</h3>
                <p>${this.getArchetypeDescription(archetype)}</p>
            </div>
        `;
    }

    renderAttackManagement(character) {
        const canCreate = SpecialAttackSystem.canCreateAttack(character);
        
        return `
            <div class="attack-management section-block">
                <div class="attack-management-header">
                    <h3>Special Attacks (${character.specialAttacks?.length || 0})</h3>
                    ${RenderUtils.renderButton({
                        text: '+ Create Attack',
                        variant: canCreate.isValid ? 'primary' : 'disabled',
                        dataAttributes: { action: 'create-attack' },
                        title: canCreate.isValid ? 'Create a new special attack' : (canCreate.errors[0] || 'Cannot create more attacks')
                    })}
                </div>
                
                ${character.specialAttacks && character.specialAttacks.length > 0 ? `
                    <div class="attack-tabs">
                        ${character.specialAttacks.map((attack, index) => `
                            <button class="attack-tab ${index === this.selectedAttackIndex ? 'active' : ''}" 
                                    data-action="select-attack" 
                                    data-index="${index}">
                                ${attack.name || `Attack ${index + 1}`}
                                ${RenderUtils.renderButton({
                                    text: '×',
                                    variant: 'danger',
                                    size: 'small',
                                    dataAttributes: { action: 'delete-attack', index: index },
                                    title: `Delete ${attack.name || `Attack ${index + 1}`}`
                                })}
                            </button>
                        `).join('')}
                    </div>
                ` : `<div class="empty-state">No special attacks created yet.</div>`}
            </div>
        `;
    }

    renderAttackBuilder(character) {
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return '<div class="empty-state">Select an attack to build.</div>';

        // Update component indices
        this.attackBasicsForm.setAttackIndex(this.selectedAttackIndex);
        this.limitSelection.setAttackIndex(this.selectedAttackIndex);
        this.upgradeSelection.setAttackIndex(this.selectedAttackIndex);

        return `
            <div class="attack-builder card">
                ${this.attackBasicsForm.render(attack, character)} 
                
                <div class="attack-summary-tags">
                    <!-- This is where selected types will be displayed -->
                    ${this.renderSelectedTypeTags(attack)}
                </div>

                <div class="attack-builder-columns">
                    <div class="limits-column">
                        ${this.limitSelection.render(attack, character)}
                    </div>
                    <div class="upgrades-column">
                        ${this.upgradeSelection.render(attack, character)}
                    </div>
                </div>
                
                ${this.renderPointsSummary(attack)}
            </div>
        `;
    }

    renderPointsSummary(attack) {
        const remaining = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        const status = remaining < 0 ? 'error' : (remaining === 0 && (attack.upgradePointsAvailable || 0) > 0 ? 'warning' : 'default');

        return `
            <div class="points-summary-block section-block">
                <h4>Attack Point Summary</h4>
                ${RenderUtils.renderPointDisplay(attack.upgradePointsSpent || 0, attack.upgradePointsAvailable || 0, 'Upgrade Points', {showRemaining: true, variant: status})}
            </div>
        `;
    }

    // Event handling methods
    handleEvent(event) {
        const action = event.target.dataset.action;

        // Route events to appropriate components
        if (this.attackBasicsForm && ['update-attack-name', 'update-attack-subtitle', 'update-attack-details', 'update-attack-type', 'add-attack-type', 'add-effect-type'].includes(action)) {
            this.attackBasicsForm.handleFormEvent(event);
            return;
        }

        if (this.limitSelection && ['open-limit-modal', 'close-limit-modal', 'add-limit', 'remove-limit', 'toggle-limit-category'].includes(action)) {
            this.limitSelection.handleEvent(event);
            return;
        }

        if (this.upgradeSelection && ['purchase-upgrade', 'remove-upgrade', 'toggle-upgrade-category'].includes(action)) {
            this.upgradeSelection.handleEvent(event);
            return;
        }

        // Handle tab-level events
        switch (action) {
            case 'create-attack':
                this.createNewAttack();
                break;
            case 'select-attack':
                this.selectAttack(parseInt(event.target.dataset.index));
                break;
            case 'delete-attack':
                this.deleteAttack(parseInt(event.target.dataset.index));
                break;
            case 'remove-attack-type':
                this.removeAttackType(event.target.dataset.id);
                break;
            case 'remove-effect-type':
                this.removeEffectType(event.target.dataset.id);
                break;
            case 'switch-tab':
                this.builder.switchTab(event.target.dataset.tab);
                break;
        }
    }

    // Attack management methods
    createNewAttack() {
        try {
            const character = this.builder.character;
            const newAttack = SpecialAttackSystem.createSpecialAttack(character);
            this.selectedAttackIndex = character.specialAttacks.length - 1;
            this.builder.updateCharacter();
            this.builder.showNotification('New attack created!', 'success');
            this.render();
        } catch (error) {
            this.builder.showNotification(`Error creating attack: ${error.message}`, 'error');
        }
    }

    selectAttack(index) {
        if (index >= 0 && index < this.builder.character.specialAttacks.length) {
            this.selectedAttackIndex = index;
            this.render();
        }
    }

    deleteAttack(index) {
        const character = this.builder.character;
        const attackName = character.specialAttacks[index]?.name || `Attack ${index + 1}`;
        
        if (SpecialAttackSystem.removeSpecialAttack(character, index)) {
            if (this.selectedAttackIndex >= character.specialAttacks.length) {
                this.selectedAttackIndex = Math.max(0, character.specialAttacks.length - 1);
            }
            this.builder.updateCharacter();
            this.builder.showNotification(`Attack "${attackName}" deleted.`, 'info');
            this.render();
        }
    }

    // Attack property update methods (called by AttackBasicsForm)
    updateAttackProperty(property, value) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack) {
            attack[property] = value;
            
            // Special handling for attack type changes
            if (property === 'attackType') {
                // Recalculate attack points if needed
                SpecialAttackSystem.recalculateAttackPoints(character, attack);
            }
            
            this.builder.updateCharacter();
            
            // Use granular updates instead of full re-render for better performance
            if (property === 'attackType') {
                this.attackBasicsForm.updateAttackType(value);
            } else {
                // Update the specific field
                this.attackBasicsForm[`update${property.charAt(0).toUpperCase() + property.slice(1)}`]?.(value);
            }
        }
    }

    // Limit management methods (called by LimitSelection)
    addLimit(limitId) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack && SpecialAttackSystem.addLimitToAttack) {
            try {
                SpecialAttackSystem.addLimitToAttack(character, attack, limitId);
                this.builder.updateCharacter();
                this.limitSelection.updateLimitsList(attack);
                this.limitSelection.updateCalculationFooter(attack, character);
                this.upgradeSelection.updatePurchasedUpgrades(attack); // Update points display
                this.builder.showNotification('Limit added!', 'success');
            } catch (error) {
                this.builder.showNotification(`Error adding limit: ${error.message}`, 'error');
            }
        }
    }

    removeLimit(index) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack && SpecialAttackSystem.removeLimitFromAttack) {
            try {
                SpecialAttackSystem.removeLimitFromAttack(character, attack, index);
                this.builder.updateCharacter();
                this.limitSelection.updateLimitsList(attack);
                this.limitSelection.updateCalculationFooter(attack, character);
                this.upgradeSelection.updatePurchasedUpgrades(attack); // Update points display
                this.builder.showNotification('Limit removed!', 'info');
            } catch (error) {
                this.builder.showNotification(`Error removing limit: ${error.message}`, 'error');
            }
        }
    }

    // Upgrade management methods (called by UpgradeSelection)
    purchaseUpgrade(upgradeId) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack && SpecialAttackSystem.purchaseUpgrade) {
            try {
                SpecialAttackSystem.purchaseUpgrade(character, attack, upgradeId);
                this.builder.updateCharacter();
                this.upgradeSelection.updatePurchasedUpgrades(attack);
                this.upgradeSelection.updateUpgradeCard(upgradeId, attack, character);
                this.builder.showNotification('Upgrade purchased!', 'success');
            } catch (error) {
                this.builder.showNotification(`Error purchasing upgrade: ${error.message}`, 'error');
            }
        }
    }

    removeUpgrade(index) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack && SpecialAttackSystem.removeUpgrade) {
            try {
                const upgradeName = attack.upgrades[index]?.name || 'upgrade';
                SpecialAttackSystem.removeUpgrade(character, attack, index);
                this.builder.updateCharacter();
                this.upgradeSelection.updatePurchasedUpgrades(attack);
                this.builder.showNotification(`${upgradeName} removed!`, 'info');
            } catch (error) {
                this.builder.showNotification(`Error removing upgrade: ${error.message}`, 'error');
            }
        }
    }

    // Character update callback for granular updates
    onCharacterUpdate(character) {
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            // Update individual components rather than full re-render
            this.limitSelection.updateCalculationFooter(attack, character);
            this.upgradeSelection.updatePurchasedUpgrades(attack);
        }
    }

    // Attack type management methods
    renderSelectedTypeTags(attack) {
        // Display selected types as removable tags
        const attackTypeTags = (attack.attackTypes || []).map(id => {
            const def = AttackTypeSystem.getAttackTypeDefinition ? AttackTypeSystem.getAttackTypeDefinition(id) : null;
            return def ? `<span class="tag attack-type-tag">${def.name} <button data-action="remove-attack-type" data-id="${id}">×</button></span>` : '';
        }).join('');

        const effectTypeTags = (attack.effectTypes || []).map(id => {
            const def = AttackTypeSystem.getEffectTypeDefinition ? AttackTypeSystem.getEffectTypeDefinition(id) : null;
            return def ? `<span class="tag effect-type-tag">${def.name} <button data-action="remove-effect-type" data-id="${id}">×</button></span>` : '';
        }).join('');

        return `${attackTypeTags}${effectTypeTags}`;
    }

    // Add attack type to current attack
    addAttackType(typeId) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        try {
            if (AttackTypeSystem.addAttackTypeToAttack) {
                AttackTypeSystem.addAttackTypeToAttack(character, attack, typeId);
            } else {
                // Fallback: add to array if system method doesn't exist
                if (!attack.attackTypes) attack.attackTypes = [];
                if (!attack.attackTypes.includes(typeId)) {
                    attack.attackTypes.push(typeId);
                }
            }
            this.builder.updateCharacter();
            this.render();
        } catch (error) {
            this.builder.showNotification(`Error adding attack type: ${error.message}`, 'error');
        }
    }

    // Remove attack type from current attack
    removeAttackType(typeId) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        try {
            if (AttackTypeSystem.removeAttackTypeFromAttack) {
                AttackTypeSystem.removeAttackTypeFromAttack(character, attack, typeId);
            } else {
                // Fallback: remove from array if system method doesn't exist
                if (attack.attackTypes) {
                    attack.attackTypes = attack.attackTypes.filter(id => id !== typeId);
                }
            }
            this.builder.updateCharacter();
            this.render();
        } catch (error) {
            this.builder.showNotification(`Error removing attack type: ${error.message}`, 'error');
        }
    }

    // Add effect type to current attack
    addEffectType(typeId) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        try {
            if (AttackTypeSystem.addEffectTypeToAttack) {
                AttackTypeSystem.addEffectTypeToAttack(character, attack, typeId);
            } else {
                // Fallback: add to array if system method doesn't exist
                if (!attack.effectTypes) attack.effectTypes = [];
                if (!attack.effectTypes.includes(typeId)) {
                    attack.effectTypes.push(typeId);
                }
            }
            this.builder.updateCharacter();
            this.render();
        } catch (error) {
            this.builder.showNotification(`Error adding effect type: ${error.message}`, 'error');
        }
    }

    // Remove effect type from current attack
    removeEffectType(typeId) {
        const character = this.builder.character;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        try {
            if (AttackTypeSystem.removeEffectTypeFromAttack) {
                AttackTypeSystem.removeEffectTypeFromAttack(character, attack, typeId);
            } else {
                // Fallback: remove from array if system method doesn't exist
                if (attack.effectTypes) {
                    attack.effectTypes = attack.effectTypes.filter(id => id !== typeId);
                }
            }
            this.builder.updateCharacter();
            this.render();
        } catch (error) {
            this.builder.showNotification(`Error removing effect type: ${error.message}`, 'error');
        }
    }

    // Helper methods
    formatArchetypeName(archetype) {
        return archetype ? archetype.charAt(0).toUpperCase() + archetype.slice(1) : '';
    }

    getArchetypeDescription(archetype) {
        const descriptions = {
            normal: 'Uses limits to generate upgrade points with diminishing returns.',
            specialist: 'Efficient limit-to-upgrade conversion for focused builds.',
            straightforward: 'Simple and direct limit-based upgrade system.',
            paragon: 'Fixed upgrade points per attack, no limits needed.',
            oneTrick: 'Single powerful attack with high upgrade point allocation.',
            dualNatured: 'Balanced approach with moderate upgrade points per attack.',
            basic: 'Simple attacks with minimal upgrade options.',
            sharedUses: 'Uses shared resource pool across multiple attacks.'
        };
        return descriptions[archetype] || 'Custom archetype with unique mechanics.';
    }

    // Cleanup method
    destroy() {
        this.attackBasicsForm?.destroy();
        this.limitSelection?.destroy();
        this.upgradeSelection?.destroy();
    }
}