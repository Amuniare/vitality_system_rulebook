// MainPoolTab.js - Main pool purchases (traits, flaws, boons, upgrades)
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedTraitConditions = [];
        this.selectedTraitStats = [];
        this.selectedFlawStats = '';
        this.selectedBoonUpgrades = {};
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        const pointInfo = this.calculatePointInfo(character);

        tabContent.innerHTML = `
            <div class="main-pool-section">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Purchase traits, flaws, boons, and action upgrades using your main pool points.
                    Traits provide conditional bonuses, flaws give permanent stat bonuses for restrictions,
                    and boons grant unique abilities.
                </p>
                
                ${this.renderPointPoolStatus(pointInfo)}
                ${this.renderTraitsSection(character)}
                ${this.renderFlawsSection(character)}
                ${this.renderBoonsSection(character)}
                ${this.renderUpgradesSection(character)}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks based on your archetype.</p>
                    <button id="continue-to-special-attacks" class="btn-primary">Continue to Special Attacks →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    calculatePointInfo(character) {
        const tier = character.tier;
        let available = Math.max(0, (tier - 2) * 15);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            available += Math.max(0, (tier - 2) * 15);
        }
        
        // Calculate spent
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + (trait.cost || 30), 0);
        const spentOnFlaws = character.mainPoolPurchases.flaws.reduce((total, flaw) => total + (flaw.cost || 30), 0);
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + (boon.cost || 0), 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * 30;
        
        const totalSpent = spentOnTraits + spentOnFlaws + spentOnBoons + spentOnUpgrades;
        
        return {
            available,
            spent: totalSpent,
            remaining: available - totalSpent,
            breakdown: {
                traits: spentOnTraits,
                flaws: spentOnFlaws,
                boons: spentOnBoons,
                upgrades: spentOnUpgrades
            }
        };
    }

    renderPointPoolStatus(pointInfo) {
        const status = pointInfo.remaining < 0 ? 'over-budget' : 
                      pointInfo.remaining === 0 ? 'fully-used' : '';
        
        return `
            <div class="main-pool-status ${status}">
                <h3>Main Pool Points</h3>
                <div class="pool-summary">
                    <div class="pool-total">
                        <span class="pool-label">Available:</span>
                        <span class="pool-value">${pointInfo.available}</span>
                    </div>
                    <div class="pool-spent">
                        <span class="pool-label">Spent:</span>
                        <span class="pool-value">${pointInfo.spent}</span>
                    </div>
                    <div class="pool-remaining">
                        <span class="pool-label">Remaining:</span>
                        <span class="pool-value ${pointInfo.remaining < 0 ? 'over-budget' : ''}">${pointInfo.remaining}</span>
                    </div>
                </div>
                
                <div class="spending-breakdown">
                    <div class="breakdown-item">Traits: ${pointInfo.breakdown.traits}p</div>
                    <div class="breakdown-item">Flaws: ${pointInfo.breakdown.flaws}p</div>
                    <div class="breakdown-item">Boons: ${pointInfo.breakdown.boons}p</div>
                    <div class="breakdown-item">Upgrades: ${pointInfo.breakdown.upgrades}p</div>
                </div>
            </div>
        `;
    }

    renderTraitsSection(character) {
        const availableTraits = TraitFlawSystem.getAvailableTraits();
        const purchasedTraits = character.mainPoolPurchases.traits;
        
        return `
            <div class="main-pool-category">
                <h3>Traits (30p each)</h3>
                <p class="category-description">
                    Conditional bonuses activated by circumstances. Choose 2 stat bonuses and conditions totaling up to 3 tiers.
                    Multiple bonuses to the same stat stack with -1 reduction per additional bonus.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Traits (${purchasedTraits.length})</h4>
                    ${purchasedTraits.length > 0 ? `
                        <div class="trait-list">
                            ${purchasedTraits.map((trait, index) => this.renderPurchasedTrait(trait, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No traits purchased yet</p>'}
                </div>
                
                <div class="purchase-interface">
                    <h4>Purchase New Trait</h4>
                    <button id="open-trait-builder" class="btn-secondary">Build Custom Trait</button>
                </div>
                
                <div id="trait-builder" class="trait-builder hidden">
                    ${this.renderTraitBuilder(character)}
                </div>
            </div>
        `;
    }

    renderPurchasedTrait(trait, index) {
        return `
            <div class="purchased-trait">
                <div class="trait-header">
                    <span class="trait-name">${trait.name}</span>
                    <span class="trait-cost">30p</span>
                    <button class="btn-small btn-danger" data-action="remove-trait" data-index="${index}">Remove</button>
                </div>
                <div class="trait-details">
                    <div class="trait-conditions">Conditions: ${trait.conditionNames?.join(', ') || 'Custom'}</div>
                    <div class="trait-bonuses">Bonuses: +${trait.tier || 'Tier'} to ${trait.statBonuses.join(', ')}</div>
                </div>
            </div>
        `;
    }

    renderTraitBuilder(character) {
        const conditionCategories = this.getTraitConditionCategories();
        const statTargets = TraitFlawSystem.getStatBonusTargets();
        
        return `
            <div class="trait-builder-interface">
                <h5>Custom Trait Builder</h5>
                
                <div class="trait-form">
                    <div class="form-group">
                        <label for="trait-name">Trait Name</label>
                        <input type="text" id="trait-name" placeholder="Enter trait name" value="">
                    </div>
                    
                    <div class="form-group">
                        <label>Conditions (Total up to 3 tiers)</label>
                        <div class="condition-budget">
                            Tier Budget Used: <span id="condition-tier-used">0</span>/3
                        </div>
                        <div class="condition-categories">
                            ${Object.entries(conditionCategories).map(([tier, conditions]) => `
                                <div class="condition-tier">
                                    <h6>Tier ${tier} Conditions</h6>
                                    <div class="condition-options">
                                        ${conditions.map(condition => `
                                            <label class="condition-option">
                                                <input type="checkbox" 
                                                       value="${condition.id}" 
                                                       data-tier="${tier}"
                                                       class="condition-checkbox">
                                                <span class="condition-name">${condition.name}</span>
                                                <span class="condition-description">${condition.description}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Stat Bonuses (Choose exactly 2)</label>
                        <div class="stat-bonus-count">
                            Selected: <span id="stat-bonus-count">0</span>/2
                        </div>
                        <div class="stat-options">
                            ${statTargets.map(stat => `
                                <label class="stat-option">
                                    <input type="checkbox" value="${stat.id}" class="stat-checkbox">
                                    <span class="stat-name">${stat.name}</span>
                                    <span class="stat-description">${stat.description}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="trait-builder-actions">
                        <button id="purchase-trait" class="btn-primary" disabled>Purchase Trait (30p)</button>
                        <button id="cancel-trait" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderFlawsSection(character) {
        const availableFlaws = TraitFlawSystem.getAvailableFlaws();
        const purchasedFlaws = character.mainPoolPurchases.flaws;
        const statTargets = TraitFlawSystem.getStatBonusTargets();
        
        return `
            <div class="main-pool-category">
                <h3>Flaws (30p each)</h3>
                <p class="category-description">
                    Permanent disadvantages that provide +Tier bonus to one stat. Each flaw costs 30p and gives you a restriction.
                    Multiple bonuses to the same stat stack with -1 reduction per additional bonus.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Flaws (${purchasedFlaws.length})</h4>
                    ${purchasedFlaws.length > 0 ? `
                        <div class="flaw-list">
                            ${purchasedFlaws.map((flaw, index) => this.renderPurchasedFlaw(flaw, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No flaws purchased yet</p>'}
                </div>
                
                <div class="purchase-interface">
                    <h4>Purchase Flaw</h4>
                    <div class="flaw-grid">
                        ${availableFlaws.map(flaw => this.renderFlawOption(flaw, character)).join('')}
                    </div>
                </div>
                
                <div id="flaw-purchase-modal" class="flaw-modal hidden">
                    <div class="modal-content">
                        <h4>Select Stat Bonus</h4>
                        <p id="selected-flaw-description"></p>
                        <div class="stat-selection">
                            ${statTargets.map(stat => `
                                <label class="stat-option">
                                    <input type="radio" name="flaw-stat" value="${stat.id}">
                                    <span class="stat-name">${stat.name}</span>
                                    <span class="stat-description">${stat.description}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="modal-actions">
                            <button id="confirm-flaw-purchase" class="btn-primary" disabled>Purchase Flaw (30p)</button>
                            <button id="cancel-flaw-purchase" class="btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedFlaw(flaw, index) {
        return `
            <div class="purchased-flaw">
                <div class="flaw-header">
                    <span class="flaw-name">${flaw.name}</span>
                    <span class="flaw-cost">30p</span>
                    <button class="btn-small btn-danger" data-action="remove-flaw" data-index="${index}">Remove</button>
                </div>
                <div class="flaw-details">
                    <div class="flaw-restriction">Restriction: ${this.getFlawDescription(flaw.flawId)}</div>
                    <div class="flaw-bonus">Bonus: +Tier to ${flaw.statBonus || 'None selected'}</div>
                </div>
            </div>
        `;
    }

    renderFlawOption(flaw, character) {
        const canAfford = this.calculatePointInfo(character).remaining >= 30;
        const alreadyPurchased = character.mainPoolPurchases.flaws.some(f => f.flawId === flaw.id);
        
        return `
            <div class="flaw-card ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-flaw-id="${flaw.id}">
                <h5>${flaw.name}</h5>
                <p class="flaw-cost">Cost: 30p</p>
                <p class="flaw-description">${flaw.description}</p>
                <div class="flaw-effect">Effect: ${flaw.effect}</div>
                ${alreadyPurchased ? '<div class="already-purchased">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="cannot-afford">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    renderBoonsSection(character) {
        const simpleBoons = UniqueAbilitySystem.getAvailableBoons();
        const complexBoons = UniqueAbilitySystem.getComplexUniqueAbilities();
        const purchasedBoons = character.mainPoolPurchases.boons;
        
        return `
            <div class="main-pool-category">
                <h3>Boons (Variable Cost)</h3>
                <p class="category-description">
                    Permanent abilities that change how your character functions. Simple boons have fixed costs,
                    while complex boons have base costs plus optional upgrades.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Boons (${purchasedBoons.length})</h4>
                    ${purchasedBoons.length > 0 ? `
                        <div class="boon-list">
                            ${purchasedBoons.map((boon, index) => this.renderPurchasedBoon(boon, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No boons purchased yet</p>'}
                </div>
                
                <div class="boon-categories">
                    <div class="simple-boons">
                        <h4>Simple Boons</h4>
                        <div class="boon-grid">
                            ${simpleBoons.map(boon => this.renderSimpleBoonOption(boon, character)).join('')}
                        </div>
                    </div>
                    
                    <div class="complex-boons">
                        <h4>Complex Boons</h4>
                        <div class="boon-grid">
                            ${complexBoons.map(boon => this.renderComplexBoonOption(boon, character)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedBoon(boon, index) {
        return `
            <div class="purchased-boon">
                <div class="boon-header">
                    <span class="boon-name">${boon.name}</span>
                    <span class="boon-cost">${boon.cost}p</span>
                    <button class="btn-small btn-danger" data-action="remove-boon" data-index="${index}">Remove</button>
                </div>
                <div class="boon-details">
                    <div class="boon-effect">${this.getBoonDescription(boon.boonId)}</div>
                    ${boon.upgrades && boon.upgrades.length > 0 ? `
                        <div class="boon-upgrades">Upgrades: ${boon.upgrades.length}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderSimpleBoonOption(boon, character) {
        const canAfford = this.calculatePointInfo(character).remaining >= boon.cost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id);
        
        return `
            <div class="boon-card simple ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-boon-id="${boon.id}" 
                 data-boon-type="simple">
                <h5>${boon.name}</h5>
                <p class="boon-cost">Cost: ${boon.cost}p</p>
                <p class="boon-description">${boon.description}</p>
                <div class="boon-category">Category: ${boon.category}</div>
                ${alreadyPurchased ? '<div class="already-purchased">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="cannot-afford">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    renderComplexBoonOption(boon, character) {
        const canAfford = this.calculatePointInfo(character).remaining >= boon.baseCost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id);
        
        return `
            <div class="boon-card complex ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-boon-id="${boon.id}" 
                 data-boon-type="complex">
                <h5>${boon.name}</h5>
                <p class="boon-cost">Base Cost: ${boon.baseCost}p</p>
                <p class="boon-description">${boon.description}</p>
                <div class="boon-category">Category: ${boon.category}</div>
                ${boon.upgrades ? `<div class="upgrade-count">${boon.upgrades.length} upgrades available</div>` : ''}
                ${alreadyPurchased ? '<div class="already-purchased">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="cannot-afford">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    renderUpgradesSection(character) {
        const purchasedUpgrades = character.mainPoolPurchases.primaryActionUpgrades;
        const availableActions = this.getAvailablePrimaryActions(character);
        
        return `
            <div class="main-pool-category">
                <h3>Primary Action Upgrades (30p each)</h3>
                <p class="category-description">
                    Convert any Primary Action to a Quick Action. This allows you to perform the action 
                    as part of your Quick Action instead of using your Primary Action.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Upgrades (${purchasedUpgrades.length})</h4>
                    ${purchasedUpgrades.length > 0 ? `
                        <div class="upgrade-list">
                            ${purchasedUpgrades.map((upgrade, index) => `
                                <div class="purchased-upgrade">
                                    <span class="upgrade-name">${upgrade.actionName} → Quick Action</span>
                                    <span class="upgrade-cost">30p</span>
                                    <button class="btn-small btn-danger" data-action="remove-upgrade" data-index="${index}">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="empty-state">No upgrades purchased yet</p>'}
                </div>
                
                <div class="purchase-interface">
                    <h4>Purchase Action Upgrade</h4>
                    <div class="action-grid">
                        ${availableActions.map(action => this.renderActionUpgradeOption(action, character)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderActionUpgradeOption(action, character) {
        const canAfford = this.calculatePointInfo(character).remaining >= 30;
        const alreadyPurchased = character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === action.id);
        
        return `
            <div class="action-card ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-action-id="${action.id}">
                <h5>${action.name}</h5>
                <p class="action-cost">Cost: 30p</p>
                <p class="action-description">${action.description}</p>
                <div class="upgrade-effect">Effect: Can use as Quick Action</div>
                ${alreadyPurchased ? '<div class="already-purchased">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="cannot-afford">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    setupEventListeners() {
        // Continue button
        const continueBtn = document.getElementById('continue-to-special-attacks');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('specialAttacks');
            });
        }

        // Trait builder
        const traitBuilderBtn = document.getElementById('open-trait-builder');
        if (traitBuilderBtn) {
            traitBuilderBtn.addEventListener('click', () => {
                this.toggleTraitBuilder();
            });
        }

        // Trait builder form
        this.setupTraitBuilderListeners();
        
        // Flaw selection
        this.setupFlawListeners();
        
        // Boon selection
        this.setupBoonListeners();
        
        // Action upgrades
        this.setupUpgradeListeners();
        
        // Remove buttons
        this.setupRemoveListeners();
    }

    setupTraitBuilderListeners() {
        // Condition checkboxes
        document.querySelectorAll('.condition-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateConditionBudget();
                this.validateTraitBuilder();
            });
        });

        // Stat checkboxes
        document.querySelectorAll('.stat-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateStatBonusCount();
                this.validateTraitBuilder();
            });
        });

        // Purchase and cancel buttons
        const purchaseBtn = document.getElementById('purchase-trait');
        const cancelBtn = document.getElementById('cancel-trait');
        
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => {
                this.purchaseTrait();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelTraitBuilder();
            });
        }
    }

    setupFlawListeners() {
        document.querySelectorAll('.flaw-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const flawId = card.dataset.flawId;
                this.openFlawPurchaseModal(flawId);
            });
        });

        // Modal listeners
        const confirmBtn = document.getElementById('confirm-flaw-purchase');
        const cancelBtn = document.getElementById('cancel-flaw-purchase');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmFlawPurchase();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeFlawPurchaseModal();
            });
        }

        // Stat radio buttons
        document.querySelectorAll('input[name="flaw-stat"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const confirmBtn = document.getElementById('confirm-flaw-purchase');
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                }
            });
        });
    }

    setupBoonListeners() {
        document.querySelectorAll('.boon-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const boonId = card.dataset.boonId;
                const boonType = card.dataset.boonType;
                
                if (boonType === 'simple') {
                    this.purchaseSimpleBoon(boonId);
                } else {
                    this.openComplexBoonModal(boonId);
                }
            });
        });
    }

    setupUpgradeListeners() {
        document.querySelectorAll('.action-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const actionId = card.dataset.actionId;
                this.purchaseActionUpgrade(actionId);
            });
        });
    }

    setupRemoveListeners() {
        // Remove buttons for all item types
        document.querySelectorAll('[data-action^="remove-"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const index = parseInt(btn.dataset.index);
                
                switch(action) {
                    case 'remove-trait':
                        this.removeTrait(index);
                        break;
                    case 'remove-flaw':
                        this.removeFlaw(index);
                        break;
                    case 'remove-boon':
                        this.removeBoon(index);
                        break;
                    case 'remove-upgrade':
                        this.removeUpgrade(index);
                        break;
                }
            });
        });
    }

    // Trait Builder Methods
    toggleTraitBuilder() {
        const builder = document.getElementById('trait-builder');
        if (builder) {
            builder.classList.toggle('hidden');
            if (!builder.classList.contains('hidden')) {
                this.resetTraitBuilder();
            }
        }
    }

    resetTraitBuilder() {
        document.getElementById('trait-name').value = '';
        document.querySelectorAll('.condition-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.stat-checkbox').forEach(cb => cb.checked = false);
        this.updateConditionBudget();
        this.updateStatBonusCount();
        this.validateTraitBuilder();
    }

    updateConditionBudget() {
        const checkedConditions = document.querySelectorAll('.condition-checkbox:checked');
        let totalTiers = 0;
        
        checkedConditions.forEach(checkbox => {
            totalTiers += parseInt(checkbox.dataset.tier);
        });
        
        const budgetDisplay = document.getElementById('condition-tier-used');
        if (budgetDisplay) {
            budgetDisplay.textContent = totalTiers;
            budgetDisplay.className = totalTiers > 3 ? 'over-budget' : '';
        }
    }

    updateStatBonusCount() {
        const checkedStats = document.querySelectorAll('.stat-checkbox:checked');
        const countDisplay = document.getElementById('stat-bonus-count');
        
        if (countDisplay) {
            countDisplay.textContent = checkedStats.length;
            countDisplay.className = checkedStats.length > 2 ? 'over-budget' : '';
        }
    }

    validateTraitBuilder() {
        const name = document.getElementById('trait-name').value.trim();
        const conditionTiers = this.getSelectedConditionTiers();
        const statCount = document.querySelectorAll('.stat-checkbox:checked').length;
        const purchaseBtn = document.getElementById('purchase-trait');
        
        const isValid = name.length > 0 && 
                       conditionTiers > 0 && conditionTiers <= 3 &&
                       statCount === 2;
        
        if (purchaseBtn) {
            purchaseBtn.disabled = !isValid;
        }
    }

    getSelectedConditionTiers() {
        const checkedConditions = document.querySelectorAll('.condition-checkbox:checked');
        let totalTiers = 0;
        
        checkedConditions.forEach(checkbox => {
            totalTiers += parseInt(checkbox.dataset.tier);
        });
        
        return totalTiers;
    }

    purchaseTrait() {
        const character = this.builder.currentCharacter;
        const name = document.getElementById('trait-name').value.trim();
        const selectedConditions = Array.from(document.querySelectorAll('.condition-checkbox:checked')).map(cb => cb.value);
        const selectedStats = Array.from(document.querySelectorAll('.stat-checkbox:checked')).map(cb => cb.value);
        
        try {
            const trait = {
                traitId: `custom_${Date.now()}`,
                name: name,
                cost: 30,
                tier: character.tier,
                conditions: selectedConditions,
                statBonuses: selectedStats,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.traits.push(trait);
            this.builder.updateCharacter();
            this.cancelTraitBuilder();
            this.render(); // Re-render to show new trait
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
        }
    }

    cancelTraitBuilder() {
        const builder = document.getElementById('trait-builder');
        if (builder) {
            builder.classList.add('hidden');
        }
    }

    // Flaw Methods
    openFlawPurchaseModal(flawId) {
        const modal = document.getElementById('flaw-purchase-modal');
        const description = document.getElementById('selected-flaw-description');
        const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
        
        if (modal && description && flaw) {
            description.textContent = flaw.description;
            modal.classList.remove('hidden');
            modal.dataset.flawId = flawId;
            
            // Reset radio buttons
            document.querySelectorAll('input[name="flaw-stat"]').forEach(radio => {
                radio.checked = false;
            });
            
            const confirmBtn = document.getElementById('confirm-flaw-purchase');
            if (confirmBtn) {
                confirmBtn.disabled = true;
            }
        }
    }

    closeFlawPurchaseModal() {
        const modal = document.getElementById('flaw-purchase-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    confirmFlawPurchase() {
        const character = this.builder.currentCharacter;
        const modal = document.getElementById('flaw-purchase-modal');
        const flawId = modal.dataset.flawId;
        const selectedStat = document.querySelector('input[name="flaw-stat"]:checked').value;
        
        try {
            const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
            
            const flawPurchase = {
                flawId: flawId,
                name: flaw.name,
                cost: 30,
                effect: flaw.effect,
                restriction: flaw.restriction,
                statBonus: selectedStat,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.flaws.push(flawPurchase);
            this.builder.updateCharacter();
            this.closeFlawPurchaseModal();
            this.render();
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase flaw: ${error.message}`, 'error');
        }
    }

    // Boon Methods
    purchaseSimpleBoon(boonId) {
        const character = this.builder.currentCharacter;
        
        try {
            const boon = UniqueAbilitySystem.getAvailableBoons().find(b => b.id === boonId);
            
            const boonPurchase = {
                boonId: boonId,
                name: boon.name,
                cost: boon.cost,
                category: boon.category,
                effect: boon.effect,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.boons.push(boonPurchase);
            this.builder.updateCharacter();
            this.render();
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    openComplexBoonModal(boonId) {
        // For now, just purchase the base boon
        // TODO: Implement upgrade selection modal for complex boons
        this.purchaseSimpleBoon(boonId);
    }

    // Action Upgrade Methods
    purchaseActionUpgrade(actionId) {
        const character = this.builder.currentCharacter;
        
        try {
            const action = this.getAvailablePrimaryActions(character).find(a => a.id === actionId);
            
            const upgrade = {
                actionId: actionId,
                actionName: action.name,
                cost: 30,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.primaryActionUpgrades.push(upgrade);
            this.builder.updateCharacter();
            this.render();
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase upgrade: ${error.message}`, 'error');
        }
    }

    // Remove Methods
    removeTrait(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.traits.length) {
            character.mainPoolPurchases.traits.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
        }
    }

    removeFlaw(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.flaws.length) {
            character.mainPoolPurchases.flaws.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
        }
    }

    removeBoon(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.boons.length) {
            character.mainPoolPurchases.boons.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
        }
    }

    removeUpgrade(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.primaryActionUpgrades.length) {
            character.mainPoolPurchases.primaryActionUpgrades.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
        }
    }

    // Helper Methods
    getTraitConditionCategories() {
        return {
            1: [
                { id: 'rooted', name: 'Rooted', description: 'Cannot move this turn' },
                { id: 'vengeful', name: 'Vengeful', description: 'Must have been hit since last turn' },
                { id: 'focused', name: 'Focused', description: 'Targeting same enemy as last turn' },
                { id: 'overwhelmed', name: 'Overwhelmed', description: 'Outnumbered 2:1 or more' },
                { id: 'elevated', name: 'Elevated', description: 'Higher ground than target' },
                { id: 'charging', name: 'Charging', description: 'Moved at least 2 spaces this turn' }
            ],
            2: [
                { id: 'bloodied', name: 'Bloodied', description: 'Below half health' },
                { id: 'protected', name: 'Protected', description: 'Ally is adjacent' },
                { id: 'isolated', name: 'Isolated', description: 'No allies within 2 spaces' }
            ],
            3: [
                { id: 'desperate', name: 'Desperate', description: 'Below quarter health' }
            ]
        };
    }

    getAvailablePrimaryActions(character) {
        return [
            { id: 'base_attack', name: 'Base Attack', description: 'Your basic attack action' },
            { id: 'dodge', name: 'Dodge Action', description: 'Add Tier to Avoidance' },
            { id: 'brace', name: 'Brace Action', description: 'Add Tier to Durability' },
            { id: 'fortify', name: 'Fortify Action', description: 'Add Tier to all Resistances' },
            { id: 'aim', name: 'Aim Action', description: 'Add Tier to next Accuracy Check' },
            { id: 'empower', name: 'Empower Action', description: 'Add Tier to next Damage Roll' },
            { id: 'refine', name: 'Refine Action', description: 'Add Tier to next Condition Check' },
            { id: 'assist', name: 'Assist Action', description: 'Give ally Tier bonus to their next roll' },
            { id: 'carry', name: 'Carry Action', description: 'Move character or heavy object' },
            { id: 'protect', name: 'Protect Action', description: 'Redirect attacks to yourself' },
            { id: 'use', name: 'Use Action', description: 'Interact with complex objects' },
            { id: 'hasten', name: 'Hasten Action', description: 'Move again at full speed' },
            { id: 'hide', name: 'Hide Action', description: 'Attempt to conceal yourself' },
            { id: 'prepare', name: 'Prepare Action', description: 'Delay action until trigger' }
        ];
    }

    getFlawDescription(flawId) {
        const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
        return flaw ? flaw.description : 'Unknown flaw';
    }

    getBoonDescription(boonId) {
        const simpleBoon = UniqueAbilitySystem.getAvailableBoons().find(b => b.id === boonId);
        if (simpleBoon) return simpleBoon.description;
        
        const complexBoon = UniqueAbilitySystem.getComplexUniqueAbilities().find(b => b.id === boonId);
        return complexBoon ? complexBoon.description : 'Unknown boon';
    }
}