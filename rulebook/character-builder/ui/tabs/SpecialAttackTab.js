// rulebook/character-builder/ui/tabs/SpecialAttackTab.js
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { LimitCalculator } from '../../calculators/LimitCalculator.js';
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedAttackIndex = 0;
        this.showingLimitModal = false;
        this.showingUpgradeModal = false;
        this.showingAttackTypeModal = false;
    }

    render() {
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }
        
        // Always show the full interface, just add a notice if build order isn't followed
        const hasAttributes = Object.values(character.attributes).some(attr => attr > 0);
        const hasMainPurchases = character.mainPoolPurchases.boons.length > 0 || 
                               character.mainPoolPurchases.traits.length > 0 ||
                               character.mainPoolPurchases.flaws.length > 0 ||
                               character.mainPoolPurchases.primaryActionUpgrades.length > 0;
        
        let buildOrderNotice = "";
        if (!hasAttributes) {
            buildOrderNotice = `
                <div class="prerequisite-notice">
                    <h3>Build Order Recommendation</h3>
                    <p>Consider completing attribute assignment in the Attributes tab first for better point calculations.</p>
                </div>
            `;
        } else if (!hasMainPurchases) {
            buildOrderNotice = `
                <div class="prerequisite-notice">
                    <h3>Build Order Recommendation</h3>
                    <p>Consider making some purchases in the Main Pool tab before creating special attacks.</p>
                </div>
            `;
        }

        tabContent.innerHTML = `
            <div class="special-attacks-section">
                <h2>Special Attacks</h2>
                <p class="section-description">
                    Create unique combat abilities using your special attack archetype rules.
                    Use limits to generate upgrade points, then purchase enhancements.
                </p>

                ${buildOrderNotice}
                ${this.renderArchetypeInfo(character)}
                ${this.renderAttackManagement(character)}
                ${character.specialAttacks.length > 0 && character.specialAttacks[this.selectedAttackIndex] ?
                    this.renderAttackBuilder(character) :
                    '<div class="empty-state">Create your first special attack to begin building.</div>'}
                ${this.renderLimitModal(character)}
                ${this.renderUpgradeModal(character)}
                ${this.renderAttackTypeModal(character)}

                <div class="next-step">
                    <p><strong>Next Step:</strong> Configure utility abilities and expertise.</p>
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

    renderArchetypeInfo(character) {
        const archetypeId = character.archetypes.specialAttack;
        
        if (!archetypeId) {
            return `
                <div class="archetype-info card">
                    <div class="card-header">
                        <h3 class="card-title">Special Attack Archetype: Not Selected</h3>
                    </div>
                    <div class="card-description">
                        <p>Select a Special Attack archetype in the Archetypes tab to unlock specific bonuses and free attack types.</p>
                        <p><em>You can still create basic special attacks without an archetype selected.</em></p>
                    </div>
                </div>
            `;
        }
        
        const archetypeDetails = SpecialAttackSystem.getSpecialAttackArchetypeDetails ? 
                                SpecialAttackSystem.getSpecialAttackArchetypeDetails(character) :
                                { name: this.formatArchetypeName(archetypeId), description: this.getArchetypeDescription(archetypeId, character) };

        return `
            <div class="archetype-info card">
                <div class="card-header">
                    <h3 class="card-title">Special Attack Archetype: ${archetypeDetails.name}</h3>
                </div>
                <div class="card-description">
                    ${archetypeDetails.description}
                </div>
            </div>
        `;
    }

    getArchetypeDescription(archetypeId, character) {
        if (!archetypeId) return 'No special attack archetype selected.';
        
        // Try to get archetype data from GameDataManager
        const archetypeData = this.builder.gameDataManager?.getData('archetypes');
        if (archetypeData && archetypeData.specialAttack) {
            const archetype = archetypeData.specialAttack.find(arch => arch.id === archetypeId);
            if (archetype) {
                return archetype.description;
            }
        }
        
        // Fallback descriptions if data isn't available
        const fallbackDescriptions = {
            'normal': '3 Specialty Upgrades at half cost, flexible limits',
            'specialist': '3 specific Limits, higher returns, focused style',
            'paragon': '10×Tier points per attack, no Limits',
            'oneTrick': 'Single attack with Tier×20 points, no Limits',
            'straightforward': 'Single Limit, simple but effective',
            'sharedUses': '10 shared uses, resource management focus',
            'dualNatured': 'Two attacks with 15×Tier points each',
            'basic': 'Enhances base attacks, Tier×10 points'
        };
        
        return fallbackDescriptions[archetypeId] || `${this.formatArchetypeName(archetypeId)} archetype selected.`;
    }

    renderAttackManagement(character) {
        const canCreate = SpecialAttackSystem.validateCanCreateAttack(character); // Using system
        const attacks = character.specialAttacks;

        return `
            <div class="attack-management">
                <div class="attack-list-header">
                    <h3>Attacks (${attacks.length})</h3>
                    ${RenderUtils.renderButton({
                        text: '+ Create Attack',
                        variant: 'primary',
                        disabled: !canCreate.isValid,
                        dataAttributes: { action: 'create-attack' },
                        title: canCreate.isValid ? 'Create a new special attack' : (canCreate.errors[0] || 'Cannot create more attacks')
                    })}
                </div>
                ${!canCreate.isValid && canCreate.errors.length > 0 ? `<p class="error-text small-text">${canCreate.errors[0]}</p>`: ''}

                ${attacks.length > 0 ? `
                    <div class="attack-tabs-container">
                        ${attacks.map((attack, index) => `
                            <div class="attack-tab ${index === this.selectedAttackIndex ? 'active' : ''}"
                                 data-attack-index="${index}" data-action="select-attack-tab">
                                <span class="attack-tab-name">${attack.name || `Attack ${index + 1}`}</span>
                                <span class="attack-tab-points">${attack.upgradePointsSpent || 0}/${attack.upgradePointsAvailable || 0}p</span>
                                ${RenderUtils.renderButton({
                                    text: '×',
                                    variant: 'danger',
                                    size: 'small',
                                    classes: ['delete-attack-btn'],
                                    dataAttributes: { action: 'delete-attack', index: index },
                                    title: `Delete ${attack.name || `Attack ${index + 1}`}`
                                })}
                            </div>
                        `).join('')}
                    </div>
                ` : `<div class="empty-state">No special attacks created yet.</div>`}
            </div>
        `;
    }

    renderAttackBuilder(character) {
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return '<div class="empty-state">Select an attack to build.</div>';

        return `
            <div class="attack-builder card">
                ${this.renderAttackBasics(attack)}
                ${this.renderAttackTypesSection(attack, character)}
                ${this.renderLimitsSection(attack, character)}
                ${this.renderUpgradesSection(attack, character)}
                ${this.renderPointsSummary(attack)}
            </div>
        `;
    }

    renderAttackBasics(attack) {
        return `
            <div class="attack-basics-form">
                ${RenderUtils.renderFormGroup({
                    label: 'Attack Name',
                    inputId: `attack-name-${this.selectedAttackIndex}`,
                    inputHtml: `<input type="text" id="attack-name-${this.selectedAttackIndex}" value="${attack.name}" placeholder="Enter attack name" data-action="update-attack-name">`
                })}
                ${RenderUtils.renderFormGroup({
                    label: 'Description',
                    inputId: `attack-description-${this.selectedAttackIndex}`,
                    inputHtml: `<textarea id="attack-description-${this.selectedAttackIndex}" placeholder="Describe your attack..." data-action="update-attack-description">${attack.description || ''}</textarea>`
                })}
            </div>
        `;
    }

    renderAttackTypesSection(attack, character) {
        // This section needs to show selected attack types and allow adding/removing them.
        // For brevity, a simplified version. A modal would be better for selection.
        const selectedTypes = attack.attackTypes || [];
        const availableTypes = AttackTypeSystem.getAttackTypeDefinitions(); // Get all
        const freeTypesFromArchetype = AttackTypeSystem.getFreeAttackTypesFromArchetype(character);


        return `
            <div class="attack-types-section section-block">
                 <div class="section-header">
                    <h4>Attack Types (${selectedTypes.length})</h4>
                    ${RenderUtils.renderButton({ text: '+ Add Attack Type', variant: 'secondary', size: 'small', dataAttributes: { action: 'open-attack-type-modal' }})}
                </div>
                ${selectedTypes.length > 0 ? `
                    <div class="selected-items-list">
                        ${selectedTypes.map(typeId => {
                            const typeDef = availableTypes[typeId];
                            const cost = freeTypesFromArchetype.includes(typeId) ? 0 : typeDef.cost;
                            return `
                                <div class="selected-item">
                                    <span>${typeDef.name} (${cost}p) ${freeTypesFromArchetype.includes(typeId) ? '(Free)' : ''}</span>
                                    ${RenderUtils.renderButton({text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-attack-type', 'type-id': typeId}})}
                                </div>`;
                        }).join('')}
                    </div>
                ` : `<div class="empty-state-small">No attack types selected.</div>`}
            </div>
        `;
    }
     renderAttackTypeModal(character) {
        if (!character || !character.specialAttacks[this.selectedAttackIndex]) return '';
        const attack = character.specialAttacks[this.selectedAttackIndex];
        const allTypes = AttackTypeSystem.getAttackTypeDefinitions();
        const freeTypes = AttackTypeSystem.getFreeAttackTypesFromArchetype(character);

        return `
            <div id="attack-type-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Attack Type</h3>
                        ${RenderUtils.renderButton({ text: '×', variant: 'secondary', size: 'small', dataAttributes: { action: 'close-attack-type-modal' }})}
                    </div>
                    <div class="modal-body">
                        ${RenderUtils.renderGrid(
                            Object.values(allTypes),
                            (typeDef) => {
                                const isSelected = attack.attackTypes.includes(typeDef.id);
                                const cost = freeTypes.includes(typeDef.id) ? 0 : typeDef.cost;
                                const canAfford = (attack.upgradePointsAvailable - attack.upgradePointsSpent) >= cost;
                                let status = isSelected ? 'purchased' : (canAfford ? 'available' : 'unaffordable');

                                return RenderUtils.renderCard({
                                    title: typeDef.name,
                                    cost: cost,
                                    description: `${typeDef.description} ${typeDef.penalty ? `<br><strong>Penalty:</strong> ${typeDef.penalty}` : ''}`,
                                    status: status,
                                    clickable: !isSelected && canAfford,
                                    disabled: isSelected || !canAfford,
                                    dataAttributes: { action: 'select-attack-type', 'type-id': typeDef.id, cost: cost }
                                }, { cardClass: 'attack-type-option', showStatus: true });
                            },
                            { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                        )}
                    </div>
                </div>
            </div>
        `;
    }


    renderLimitsSection(attack, character) {
        // ... (renderLimitItem should use RenderUtils.renderButton for delete)
        // ... (add limit button should use RenderUtils.renderButton)
        const archetype = character.archetypes.specialAttack;
        const canUseLimits = SpecialAttackSystem.canArchetypeUseLimits ? SpecialAttackSystem.canArchetypeUseLimits(archetype) : !['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype);

        if (!canUseLimits) {
            return `
                <div class="limits-section section-block disabled">
                    <h4>Limits</h4>
                    <p class="archetype-restriction">${this.formatArchetypeName(archetype)} archetype cannot use limits.</p>
                </div>
            `;
        }
        const limitBreakdown = LimitCalculator.getCalculationBreakdown(attack.limitPointsTotal || 0, character.tier, archetype);


        return `
            <div class="limits-section section-block">
                <div class="section-header">
                    <h4>Limits (${attack.limits.length})</h4>
                    ${RenderUtils.renderButton({ text: '+ Add Limit', variant: 'secondary', size: 'small', dataAttributes: { action: 'open-limit-modal' }})}
                </div>
                 ${RenderUtils.renderPurchasedList( // Using purchased list for display
                    attack.limits,
                    (limit, index) => this.renderLimitItem(limit, index),
                    { listContainerClass: 'limits-list selected-items-list', emptyMessage: 'No limits selected. Add limits to generate upgrade points.' }
                )}
                ${attack.limits.length > 0 ? `
                    <div class="limit-calculation-details">
                        <h5>Point Calculation from Limits</h5>
                        <div class="calculation-breakdown">
                            ${limitBreakdown.steps.map(step => `<div class="calc-line">${step}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    renderLimitItem(limit, index) {
        return `
            <div class="selected-item limit-item">
                <div class="item-header">
                    <span class="item-name">${limit.name}</span>
                    <span class="item-value">${limit.points}p</span>
                </div>
                <div class="item-description">${limit.description}</div>
                ${RenderUtils.renderButton({text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-limit', index: index}})}
            </div>
        `;
    }


    renderUpgradesSection(attack, character) {
        // ... (browse upgrades button should use RenderUtils.renderButton)
        // ... (purchased upgrade items should use a consistent structure, maybe a variant of .selected-item)
         const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        return `
            <div class="upgrades-section section-block">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining">
                        Upgrade Points: <span class="${remainingPoints < 0 ? 'error-text' : ''}">${remainingPoints}</span> / ${attack.upgradePointsAvailable || 0}
                    </div>
                </div>
                 ${RenderUtils.renderPurchasedList(
                    attack.upgrades || [],
                    (upgrade, index) => this.renderPurchasedUpgrade(upgrade, index),
                    { listContainerClass: 'upgrades-list selected-items-list', title: `Purchased Upgrades (${attack.upgrades?.length || 0})`, showCount: false, emptyMessage: 'No upgrades purchased yet.' }
                )}
                <div class="browse-upgrades-action">
                     ${RenderUtils.renderButton({ text: 'Browse Available Upgrades', variant: 'secondary', size: 'small', dataAttributes: { action: 'open-upgrade-modal' }})}
                </div>
            </div>
        `;
    }
    renderPurchasedUpgrade(upgrade, index) {
         return `
            <div class="selected-item purchased-upgrade">
                 <div class="item-header">
                    <span class="item-name">${upgrade.name}</span>
                    <span class="item-value">${upgrade.cost}p</span>
                </div>
                <div class="item-description">${upgrade.description || upgrade.effect || 'Effect details missing.'}</div>
                ${RenderUtils.renderButton({text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-upgrade', index: index}})}
            </div>
        `;
    }


    renderPointsSummary(attack) {
        // ... (use RenderUtils.renderPointDisplay for consistency if applicable)
        const remaining = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        const status = remaining < 0 ? 'error' : (remaining === 0 && (attack.upgradePointsAvailable || 0) > 0 ? 'warning' : 'default');

        return `
            <div class="points-summary-block section-block">
                <h4>Attack Point Summary</h4>
                ${RenderUtils.renderPointDisplay(attack.upgradePointsSpent || 0, attack.upgradePointsAvailable || 0, 'Upgrade Points', {showRemaining: true, variant: status})}
            </div>
        `;
    }

    renderLimitModal(character) {
        // ... (options should be rendered as cards using RenderUtils.renderCard)
        // ... (close button uses RenderUtils.renderButton)
        const allLimits = LimitCalculator.getAllLimits();
        const attack = character.specialAttacks[this.selectedAttackIndex];

        return `
            <div id="limit-modal" class="modal ${this.showingLimitModal ? '' : 'hidden'}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Limit to "${attack?.name || 'Attack'}"</h3>
                        ${RenderUtils.renderButton({ text: '×', variant: 'secondary', size: 'small', dataAttributes: { action: 'close-limit-modal' }})}
                    </div>
                    <div class="modal-body">
                        ${Object.entries(allLimits).map(([category, limits]) => `
                            <div class="limit-category-modal">
                                <h4>${this.formatCategoryName(category)}</h4>
                                ${RenderUtils.renderGrid(
                                    limits,
                                    (limit) => {
                                        const isSelected = attack?.limits.some(l => l.id === limit.id);
                                        // Basic validation for display, actual validation in system
                                        const validation = attack ? SpecialAttackSystem.validateLimitAddition(character, attack, limit) : {isValid: true};
                                        return RenderUtils.renderCard({
                                            title: limit.name,
                                            cost: limit.points,
                                            description: limit.description,
                                            status: isSelected ? 'purchased' : (validation.isValid ? 'available' : 'error'),
                                            clickable: !isSelected && validation.isValid,
                                            disabled: isSelected || !validation.isValid,
                                            dataAttributes: { action: 'select-limit', 'limit-id': limit.id }
                                        }, { cardClass: 'limit-option', showStatus: true });
                                    },
                                    { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                                )}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderUpgradeModal(character) {
        // ... (options should be rendered as cards using RenderUtils.renderCard)
        // ... (close button uses RenderUtils.renderButton)
        const attack = character.specialAttacks[this.selectedAttackIndex];
        // Simplified upgrade categories for now as in original
        const upgradeCategories = SpecialAttackSystem.getAvailableUpgrades ? SpecialAttackSystem.getAvailableUpgrades(character, attack) : { /* fallback from original */ };


        return `
            <div id="upgrade-modal" class="modal ${this.showingUpgradeModal ? '' : 'hidden'}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Purchase Upgrades for "${attack?.name || 'Attack'}"</h3>
                        ${RenderUtils.renderButton({ text: '×', variant: 'secondary', size: 'small', dataAttributes: { action: 'close-upgrade-modal' }})}
                    </div>
                     <div class="modal-points-info">
                        Available Points: ${(attack?.upgradePointsAvailable || 0) - (attack?.upgradePointsSpent || 0)}
                    </div>
                    <div class="modal-body">
                       ${Object.entries(upgradeCategories).map(([categoryName, upgrades]) => `
                            <div class="upgrade-category-modal">
                                <h4>${this.formatCategoryName(categoryName)}</h4>
                                ${RenderUtils.renderGrid(
                                    upgrades,
                                    (upgrade) => {
                                        const isSelected = attack?.upgrades?.some(u => u.id === upgrade.id);
                                        const canAfford = attack ? (attack.upgradePointsAvailable - attack.upgradePointsSpent) >= upgrade.cost : false;
                                        let status = isSelected ? 'purchased' : (canAfford ? 'available' : 'unaffordable');
                                        // Further validation if needed from SpecialAttackSystem.validateUpgradeAddition
                                        return RenderUtils.renderCard({
                                            title: upgrade.name,
                                            cost: upgrade.cost,
                                            description: upgrade.description,
                                            status: status,
                                            clickable: !isSelected && canAfford,
                                            disabled: isSelected || !canAfford,
                                            dataAttributes: { action: 'select-upgrade', 'upgrade-id': upgrade.id }
                                        }, { cardClass: 'upgrade-option', showStatus: true });
                                    },
                                    { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                                )}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    // setupEventListeners will be more reliant on data-actions handled by CharacterBuilder
    // formatArchetypeName and formatCategoryName remain the same

    // Method stubs for actions called by CharacterBuilder via EventManager
    // (Implementations would call SpecialAttackSystem and then this.builder.updateCharacter() & this.render())
    createNewAttack() {
        const character = this.builder.currentCharacter;
        if (!character) return;
        try {
            const newAttack = SpecialAttackSystem.createSpecialAttack(character); // System handles validation now
            character.specialAttacks.push(newAttack);
            this.selectedAttackIndex = character.specialAttacks.length - 1;
            this.builder.updateCharacter(); // This triggers re-render via CharacterBuilder
            this.builder.showNotification('New attack created!', 'success');
        } catch (error) {
            this.builder.showNotification(`Error creating attack: ${error.message}`, 'error');
        }
    }
    deleteAttack(index) {
        const character = this.builder.currentCharacter;
        if (!character || !character.specialAttacks[index]) return;
        const attackName = character.specialAttacks[index].name;
        if (confirm(`Delete "${attackName}"?`)) {
            SpecialAttackSystem.deleteSpecialAttack(character, index);
            if (this.selectedAttackIndex >= character.specialAttacks.length) {
                this.selectedAttackIndex = Math.max(0, character.specialAttacks.length - 1);
            }
            this.builder.updateCharacter();
            this.builder.showNotification(`Attack "${attackName}" deleted.`, 'info');
        }
    }
    updateAttackName(newName) {
        const attack = this.builder.currentCharacter?.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            attack.name = newName;
            this.builder.updateCharacter(); // Debounced update will happen
        }
    }
    updateAttackDescription(newDescription) {
         const attack = this.builder.currentCharacter?.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            attack.description = newDescription;
            this.builder.updateCharacter();
        }
    }
    openLimitModal() { this.showingLimitModal = true; this.render(); }
    closeLimitModal() { this.showingLimitModal = false; this.render(); }
    addLimit(limitId) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
        // Fetch full limit data
        const limitData = LimitCalculator.findLimitById(limitId);
        if(!limitData) {
            this.builder.showNotification('Limit definition not found.', 'error'); return;
        }
        try {
            SpecialAttackSystem.addLimitToAttack(character, this.selectedAttackIndex, limitData);
            this.builder.updateCharacter();
            this.closeLimitModal(); // Re-renders implicitly via builder update if tab is active
            this.builder.showNotification('Limit added.', 'success');
        } catch(error) {
            this.builder.showNotification(`Failed to add limit: ${error.message}`, 'error');
        }
    }
    removeLimit(limitIndexOnAttack) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
        try {
            // Assume SpecialAttackSystem.removeLimitFromAttack(character, attackIndex, limitIndexOnAttack)
            const removedLimit = attack.limits.splice(limitIndexOnAttack, 1)[0];
            SpecialAttackSystem.recalculateAttackPoints(character, attack); // Ensure system recalculates
            this.builder.updateCharacter();
            this.builder.showNotification(`Limit "${removedLimit.name}" removed.`, 'info');
        } catch(error) {
            this.builder.showNotification(`Failed to remove limit: ${error.message}`, 'error');
        }
    }

    openUpgradeModal() { this.showingUpgradeModal = true; this.render(); }
    closeUpgradeModal() { this.showingUpgradeModal = false; this.render(); }
    addUpgrade(upgradeId) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;

        // Fetch full upgrade data - Placeholder, replace with actual data source
        const upgradeData = SpecialAttackSystem.getUpgradeDefinition ? SpecialAttackSystem.getUpgradeDefinition(upgradeId) : { id: upgradeId, name: upgradeId, cost: 10, description: 'Placeholder' };
         if(!upgradeData) {
            this.builder.showNotification('Upgrade definition not found.', 'error'); return;
        }
        try {
            SpecialAttackSystem.addUpgradeToAttack(character, this.selectedAttackIndex, upgradeData);
            this.builder.updateCharacter();
            this.closeUpgradeModal();
            this.builder.showNotification('Upgrade added.', 'success');
        } catch(error) {
            this.builder.showNotification(`Failed to add upgrade: ${error.message}`, 'error');
        }
    }
    removeUpgrade(upgradeIndexOnAttack) {
         const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack || !attack.upgrades) return;
        try {
            const removedUpgrade = SpecialAttackSystem.removeUpgradeFromAttack(character, this.selectedAttackIndex, attack.upgrades[upgradeIndexOnAttack].id);
            this.builder.updateCharacter();
            this.builder.showNotification(`Upgrade "${removedUpgrade.name}" removed.`, 'info');
        } catch(error) {
            this.builder.showNotification(`Failed to remove upgrade: ${error.message}`, 'error');
        }
    }
    openAttackTypeModal() { this.showingAttackTypeModal = true; this.render(); }
    closeAttackTypeModal() { this.showingAttackTypeModal = false; this.render(); }

    selectAttackType(typeId, cost) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
        try {
            // AttackTypeSystem.addAttackTypeToAttack might be better here
            const validation = AttackTypeSystem.validateAttackTypeSelection(character, attack, typeId);
            if (!validation.isValid) throw new Error(validation.errors.join(', '));

            AttackTypeSystem.addAttackTypeToAttack(character, attack, typeId); // System handles cost
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
            this.closeAttackTypeModal(); // Will re-render via builder.updateCharacter
            this.builder.showNotification(`Attack type ${typeId} added.`, 'success');
        } catch(error) {
             this.builder.showNotification(`Failed to add attack type: ${error.message}`, 'error');
        }
    }
    removeAttackType(typeId) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
         try {
            AttackTypeSystem.removeAttackTypeFromAttack(character, attack, typeId); // System handles refund
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
            // Modal doesn't need to be open, this acts on the main display
            this.builder.showNotification(`Attack type ${typeId} removed.`, 'info');
        } catch(error) {
             this.builder.showNotification(`Failed to remove attack type: ${error.message}`, 'error');
        }
    }


    // formatArchetypeName and formatCategoryName remain the same
    formatArchetypeName(archetypeId) {
        if (!archetypeId) return 'None Selected';
        return archetypeId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    formatCategoryName(categoryName) {
        if (!categoryName) return '';
        return categoryName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    onCharacterUpdate() { // Called by CharacterBuilder
        // If the selected attack still exists, re-render. Otherwise, might select first or show empty.
        if (this.builder.currentCharacter && this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex]) {
            this.render();
        } else if (this.builder.currentCharacter && this.builder.currentCharacter.specialAttacks.length > 0) {
            this.selectedAttackIndex = 0;
            this.render();
        } else {
            this.selectedAttackIndex = 0; // Reset
            this.render(); // Will show "no attacks" state
        }
    }

    setupEventListeners() {
        // Event listeners are now handled by CharacterBuilder via data-action attributes
        // This method is kept for compatibility but can be empty since event delegation is used
    }
}

