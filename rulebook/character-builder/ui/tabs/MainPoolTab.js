// MainPoolTab.js - Main pool purchases (traits, flaws, boons, upgrades)
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';
import { GameConstants } from '../../core/GameConstants.js';

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.currentFlawId = null;
        this.currentBoonId = null;
        this.selectedBoonUpgrades = [];
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = '<div class="empty-state">No character selected</div>';
            return;
        }

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
                ${this.renderFlawsSection(character, pointInfo)}
                ${this.renderTraitsSection(character, pointInfo)}
                ${this.renderBoonsSection(character, pointInfo)}
                ${this.renderUpgradesSection(character, pointInfo)}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks based on your archetype.</p>
                    <button id="continue-to-special-attacks" class="btn-primary">Continue to Special Attacks →</button>
                </div>
            </div>
            
            <!-- Flaw Purchase Modal -->
            <div id="flaw-modal" class="purchase-modal hidden">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Purchase Flaw</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="flaw-details"></div>
                        <div class="stat-selection">
                            <h4>Choose Stat Bonus</h4>
                            <div id="flaw-stat-options"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="confirm-flaw" class="btn-primary" disabled>Purchase Flaw (+30p)</button>
                        <button id="cancel-flaw" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
            
            <!-- Complex Boon Modal -->
            <div id="boon-modal" class="purchase-modal hidden">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Configure Boon</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="boon-details"></div>
                        <div id="boon-upgrades" class="upgrade-section"></div>
                        <div class="cost-summary">
                            <strong>Total Cost: <span id="boon-total-cost">0</span>p</strong>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="confirm-boon" class="btn-primary">Purchase Boon</button>
                        <button id="cancel-boon" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    calculatePointInfo(character) {
        const tier = character.tier;
        let available = Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            available += Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        }
        
        // Add flaw bonuses
        const flawBonus = character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
        available += flawBonus;
        
        // Calculate spent
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + (trait.cost || GameConstants.TRAIT_COST), 0);
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + (boon.cost || 0), 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        const totalSpent = spentOnTraits + spentOnBoons + spentOnUpgrades;
        
        return {
            available,
            spent: totalSpent,
            remaining: available - totalSpent,
            flawBonus,
            breakdown: {
                traits: spentOnTraits,
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
                    <div class="pool-item">
                        <span class="pool-label">Base Pool:</span>
                        <span class="pool-value">${pointInfo.available - pointInfo.flawBonus}</span>
                    </div>
                    <div class="pool-item">
                        <span class="pool-label">Flaw Bonus:</span>
                        <span class="pool-value">+${pointInfo.flawBonus}</span>
                    </div>
                    <div class="pool-item">
                        <span class="pool-label">Total Available:</span>
                        <span class="pool-value">${pointInfo.available}</span>
                    </div>
                    <div class="pool-item">
                        <span class="pool-label">Spent:</span>
                        <span class="pool-value">${pointInfo.spent}</span>
                    </div>
                    <div class="pool-item">
                        <span class="pool-label">Remaining:</span>
                        <span class="pool-value ${pointInfo.remaining < 0 ? 'over-budget' : ''}">${pointInfo.remaining}</span>
                    </div>
                </div>
                
                <div class="spending-breakdown">
                    <div class="breakdown-item">Traits: ${pointInfo.breakdown.traits}p</div>
                    <div class="breakdown-item">Boons: ${pointInfo.breakdown.boons}p</div>
                    <div class="breakdown-item">Upgrades: ${pointInfo.breakdown.upgrades}p</div>
                </div>
            </div>
        `;
    }

    renderFlawsSection(character, pointInfo) {
        const availableFlaws = TraitFlawSystem.getAvailableFlaws();
        const purchasedFlaws = character.mainPoolPurchases.flaws;
        
        return `
            <div class="main-pool-category">
                <h3>Flaws (+${GameConstants.FLAW_BONUS}p each)</h3>
                <p class="category-description">
                    Permanent disadvantages that give you +${GameConstants.FLAW_BONUS} main pool points and +Tier bonus to one stat.
                    Each flaw imposes restrictions on your character.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Flaws (${purchasedFlaws.length})</h4>
                    ${purchasedFlaws.length > 0 ? `
                        <div class="item-list">
                            ${purchasedFlaws.map((flaw, index) => this.renderPurchasedFlaw(flaw, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No flaws purchased yet</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Flaws</h4>
                    <div class="item-grid">
                        ${availableFlaws.map(flaw => this.renderFlawOption(flaw, character, pointInfo)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedFlaw(flaw, index) {
        return `
            <div class="purchased-item flaw-item">
                <div class="item-header">
                    <span class="item-name">${flaw.name}</span>
                    <span class="item-cost">+${GameConstants.FLAW_BONUS}p</span>
                    <button class="btn-small btn-danger remove-flaw" data-index="${index}">Remove</button>
                </div>
                <div class="item-details">
                    <div class="item-effect">${flaw.restriction || flaw.effect}</div>
                    <div class="item-bonus">Bonus: +Tier to ${flaw.statBonus || 'None selected'}</div>
                </div>
            </div>
        `;
    }

    renderFlawOption(flaw, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.flaws.some(f => f.flawId === flaw.id);
        
        return `
            <div class="item-card flaw-card ${alreadyPurchased ? 'disabled' : ''}" 
                 data-flaw-id="${flaw.id}">
                <h5>${flaw.name}</h5>
                <p class="item-cost">Gives: +${GameConstants.FLAW_BONUS}p</p>
                <p class="item-description">${flaw.description}</p>
                <div class="item-effect">Effect: ${flaw.effect}</div>
                ${alreadyPurchased ? '<div class="status-badge">Already Purchased</div>' : ''}
            </div>
        `;
    }

    renderTraitsSection(character, pointInfo) {
        const availableTraits = TraitFlawSystem.getAvailableTraits();
        const purchasedTraits = character.mainPoolPurchases.traits;
        
        return `
            <div class="main-pool-category">
                <h3>Traits (${GameConstants.TRAIT_COST}p each)</h3>
                <p class="category-description">
                    Conditional bonuses activated by circumstances. Each trait provides +Tier bonus to 
                    ${availableTraits[0]?.bonusCount || 2} stats when conditions are met.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Traits (${purchasedTraits.length})</h4>
                    ${purchasedTraits.length > 0 ? `
                        <div class="item-list">
                            ${purchasedTraits.map((trait, index) => this.renderPurchasedTrait(trait, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No traits purchased yet</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Traits</h4>
                    <div class="item-grid">
                        ${availableTraits.map(trait => this.renderTraitOption(trait, character, pointInfo)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedTrait(trait, index) {
        return `
            <div class="purchased-item trait-item">
                <div class="item-header">
                    <span class="item-name">${trait.name}</span>
                    <span class="item-cost">${trait.cost || GameConstants.TRAIT_COST}p</span>
                    <button class="btn-small btn-danger remove-trait" data-index="${index}">Remove</button>
                </div>
                <div class="item-details">
                    <div class="item-condition">${trait.description || trait.condition}</div>
                    <div class="item-bonus">Bonuses: ${trait.statBonuses ? trait.statBonuses.join(', ') : 'To be selected'}</div>
                </div>
            </div>
        `;
    }

    renderTraitOption(trait, character, pointInfo) {
        const canAfford = pointInfo.remaining >= GameConstants.TRAIT_COST;
        const alreadyPurchased = character.mainPoolPurchases.traits.some(t => t.traitId === trait.id);
        
        return `
            <div class="item-card trait-card ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-trait-id="${trait.id}">
                <h5>${trait.name}</h5>
                <p class="item-cost">Cost: ${GameConstants.TRAIT_COST}p</p>
                <p class="item-description">${trait.description}</p>
                <div class="item-tier">Tier ${trait.tier} (${trait.bonusCount} stat bonuses)</div>
                ${alreadyPurchased ? '<div class="status-badge">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="status-badge error">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    renderBoonsSection(character, pointInfo) {
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
                        <div class="item-list">
                            ${purchasedBoons.map((boon, index) => this.renderPurchasedBoon(boon, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No boons purchased yet</p>'}
                </div>
                
                <div class="boon-categories">
                    <div class="simple-boons">
                        <h4>Simple Boons</h4>
                        <div class="item-grid">
                            ${simpleBoons.map(boon => this.renderSimpleBoonOption(boon, character, pointInfo)).join('')}
                        </div>
                    </div>
                    
                    <div class="complex-boons">
                        <h4>Complex Boons</h4>
                        <div class="item-grid">
                            ${complexBoons.map(boon => this.renderComplexBoonOption(boon, character, pointInfo)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedBoon(boon, index) {
        return `
            <div class="purchased-item boon-item">
                <div class="item-header">
                    <span class="item-name">${boon.name}</span>
                    <span class="item-cost">${boon.cost}p</span>
                    <button class="btn-small btn-danger remove-boon" data-index="${index}">Remove</button>
                </div>
                <div class="item-details">
                    <div class="item-effect">${boon.effect || boon.description}</div>
                    ${boon.upgrades && boon.upgrades.length > 0 ? `
                        <div class="item-upgrades">Upgrades: ${boon.upgrades.length}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderSimpleBoonOption(boon, character, pointInfo) {
        const canAfford = pointInfo.remaining >= boon.cost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id);
        
        return `
            <div class="item-card boon-card simple ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-boon-id="${boon.id}" 
                 data-boon-type="simple">
                <h5>${boon.name}</h5>
                <p class="item-cost">Cost: ${boon.cost}p</p>
                <p class="item-description">${boon.description}</p>
                <div class="item-category">Category: ${boon.category}</div>
                ${alreadyPurchased ? '<div class="status-badge">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="status-badge error">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    renderComplexBoonOption(boon, character, pointInfo) {
        const canAfford = pointInfo.remaining >= boon.baseCost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id);
        
        return `
            <div class="item-card boon-card complex ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-boon-id="${boon.id}" 
                 data-boon-type="complex">
                <h5>${boon.name}</h5>
                <p class="item-cost">Base Cost: ${boon.baseCost}p</p>
                <p class="item-description">${boon.description}</p>
                <div class="item-category">Category: ${boon.category}</div>
                ${boon.upgrades ? `<div class="upgrade-count">${boon.upgrades.length} upgrades available</div>` : ''}
                ${alreadyPurchased ? '<div class="status-badge">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="status-badge error">Cannot Afford</div>' : ''}
            </div>
        `;
    }

    renderUpgradesSection(character, pointInfo) {
        const purchasedUpgrades = character.mainPoolPurchases.primaryActionUpgrades;
        const availableActions = this.getAvailablePrimaryActions();
        
        return `
            <div class="main-pool-category">
                <h3>Primary Action Upgrades (${GameConstants.PRIMARY_TO_QUICK_COST}p each)</h3>
                <p class="category-description">
                    Convert any Primary Action to a Quick Action. This allows you to perform the action 
                    as part of your Quick Action instead of using your Primary Action.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Upgrades (${purchasedUpgrades.length})</h4>
                    ${purchasedUpgrades.length > 0 ? `
                        <div class="item-list">
                            ${purchasedUpgrades.map((upgrade, index) => this.renderPurchasedUpgrade(upgrade, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No upgrades purchased yet</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Actions</h4>
                    <div class="item-grid">
                        ${availableActions.map(action => this.renderActionOption(action, character, pointInfo)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedUpgrade(upgrade, index) {
        return `
            <div class="purchased-item upgrade-item">
                <div class="item-header">
                    <span class="item-name">${upgrade.actionName} → Quick Action</span>
                    <span class="item-cost">${GameConstants.PRIMARY_TO_QUICK_COST}p</span>
                    <button class="btn-small btn-danger remove-upgrade" data-index="${index}">Remove</button>
                </div>
                <div class="item-details">
                    <div class="item-effect">Can use ${upgrade.actionName} as Quick Action</div>
                </div>
            </div>
        `;
    }

    renderActionOption(action, character, pointInfo) {
        const canAfford = pointInfo.remaining >= GameConstants.PRIMARY_TO_QUICK_COST;
        const alreadyPurchased = character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === action.id);
        
        return `
            <div class="item-card action-card ${!canAfford || alreadyPurchased ? 'disabled' : ''}" 
                 data-action-id="${action.id}">
                <h5>${action.name}</h5>
                <p class="item-cost">Cost: ${GameConstants.PRIMARY_TO_QUICK_COST}p</p>
                <p class="item-description">${action.description}</p>
                <div class="upgrade-effect">Upgrade: Use as Quick Action</div>
                ${alreadyPurchased ? '<div class="status-badge">Already Purchased</div>' : ''}
                ${!canAfford && !alreadyPurchased ? '<div class="status-badge error">Cannot Afford</div>' : ''}
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

        // Flaw cards
        document.querySelectorAll('.flaw-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const flawId = card.dataset.flawId;
                this.openFlawModal(flawId);
            });
        });

        // Trait cards - simplified purchase
        document.querySelectorAll('.trait-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const traitId = card.dataset.traitId;
                this.purchaseTraitSimple(traitId);
            });
        });

        // Simple boon cards
        document.querySelectorAll('.boon-card.simple:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const boonId = card.dataset.boonId;
                this.purchaseSimpleBoon(boonId);
            });
        });

        // Complex boon cards
        document.querySelectorAll('.boon-card.complex:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const boonId = card.dataset.boonId;
                this.openBoonModal(boonId);
            });
        });

        // Action upgrade cards
        document.querySelectorAll('.action-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const actionId = card.dataset.actionId;
                this.purchaseActionUpgrade(actionId);
            });
        });

        // Remove buttons
        this.setupRemoveListeners();

        // Modal listeners
        this.setupModalListeners();
    }

    setupRemoveListeners() {
        document.querySelectorAll('.remove-flaw').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeFlaw(index);
            });
        });

        document.querySelectorAll('.remove-trait').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeTrait(index);
            });
        });

        document.querySelectorAll('.remove-boon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeBoon(index);
            });
        });

        document.querySelectorAll('.remove-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeUpgrade(index);
            });
        });
    }

    setupModalListeners() {
        // Flaw modal
        const flawModal = document.getElementById('flaw-modal');
        if (flawModal) {
            flawModal.querySelector('.modal-close').addEventListener('click', () => this.closeFlawModal());
            flawModal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeFlawModal());
            flawModal.querySelector('#cancel-flaw').addEventListener('click', () => this.closeFlawModal());
            flawModal.querySelector('#confirm-flaw').addEventListener('click', () => this.confirmFlawPurchase());
        }

        // Boon modal
        const boonModal = document.getElementById('boon-modal');
        if (boonModal) {
            boonModal.querySelector('.modal-close').addEventListener('click', () => this.closeBoonModal());
            boonModal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeBoonModal());
            boonModal.querySelector('#cancel-boon').addEventListener('click', () => this.closeBoonModal());
            boonModal.querySelector('#confirm-boon').addEventListener('click', () => this.confirmBoonPurchase());
        }
    }

    // FLAW METHODS
    openFlawModal(flawId) {
        const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
        if (!flaw) return;

        this.currentFlawId = flawId;
        const statTargets = TraitFlawSystem.getStatBonusTargets();

        document.getElementById('flaw-details').innerHTML = `
            <h4>${flaw.name}</h4>
            <p>${flaw.description}</p>
            <div class="flaw-effect"><strong>Effect:</strong> ${flaw.effect}</div>
        `;

        document.getElementById('flaw-stat-options').innerHTML = statTargets.map(stat => `
            <label class="stat-option">
                <input type="radio" name="flaw-stat" value="${stat.id}">
                <span class="stat-name">${stat.name}</span>
                <span class="stat-description">${stat.description}</span>
            </label>
        `).join('');

        // Add event listeners for radio buttons
        document.querySelectorAll('input[name="flaw-stat"]').forEach(radio => {
            radio.addEventListener('change', () => {
                document.getElementById('confirm-flaw').disabled = false;
            });
        });

        document.getElementById('flaw-modal').classList.remove('hidden');
        document.getElementById('confirm-flaw').disabled = true;
    }

    closeFlawModal() {
        document.getElementById('flaw-modal').classList.add('hidden');
        this.currentFlawId = null;
    }

    confirmFlawPurchase() {
        const character = this.builder.currentCharacter;
        const selectedStat = document.querySelector('input[name="flaw-stat"]:checked');
        
        if (!selectedStat || !this.currentFlawId) return;

        try {
            const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === this.currentFlawId);
            
            const flawPurchase = {
                flawId: this.currentFlawId,
                name: flaw.name,
                bonus: GameConstants.FLAW_BONUS,
                effect: flaw.effect,
                restriction: flaw.restriction,
                statBonus: selectedStat.value,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.flaws.push(flawPurchase);
            this.builder.updateCharacter();
            this.closeFlawModal();
            this.render();
            
            this.builder.showNotification(`Purchased ${flaw.name} for +${GameConstants.FLAW_BONUS}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase flaw: ${error.message}`, 'error');
        }
    }

    // TRAIT METHODS
    purchaseTraitSimple(traitId) {
        const character = this.builder.currentCharacter;
        
        try {
            const trait = TraitFlawSystem.getAvailableTraits().find(t => t.id === traitId);
            if (!trait) throw new Error('Trait not found');
            
            // For simplicity, auto-assign stat bonuses (user can customize later)
            const defaultStats = ['accuracy', 'damage']; // Default selection
            
            const traitPurchase = {
                traitId: traitId,
                name: trait.name,
                cost: GameConstants.TRAIT_COST,
                tier: trait.tier,
                condition: trait.condition,
                description: trait.description,
                statBonuses: defaultStats.slice(0, trait.bonusCount),
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.traits.push(traitPurchase);
            this.builder.updateCharacter();
            this.render();
            
            this.builder.showNotification(`Purchased ${trait.name} for ${GameConstants.TRAIT_COST}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
        }
    }

    // BOON METHODS
    purchaseSimpleBoon(boonId) {
        const character = this.builder.currentCharacter;
        
        try {
            const boon = UniqueAbilitySystem.getAvailableBoons().find(b => b.id === boonId);
            if (!boon) throw new Error('Boon not found');
            
            const boonPurchase = {
                boonId: boonId,
                name: boon.name,
                cost: boon.cost,
                category: boon.category,
                effect: boon.effect,
                description: boon.description,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.boons.push(boonPurchase);
            this.builder.updateCharacter();
            this.render();
            
            this.builder.showNotification(`Purchased ${boon.name} for ${boon.cost}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    openBoonModal(boonId) {
        const boon = UniqueAbilitySystem.getComplexUniqueAbilities().find(b => b.id === boonId);
        if (!boon) return;

        this.currentBoonId = boonId;
        this.selectedBoonUpgrades = [];

        document.getElementById('boon-details').innerHTML = `
            <h4>${boon.name}</h4>
            <p>${boon.description}</p>
            <div class="boon-base-cost"><strong>Base Cost:</strong> ${boon.baseCost}p</div>
        `;

        if (boon.upgrades && boon.upgrades.length > 0) {
            document.getElementById('boon-upgrades').innerHTML = `
                <h5>Available Upgrades</h5>
                <div class="upgrade-list">
                    ${boon.upgrades.map((upgrade, index) => `
                        <label class="upgrade-option">
                            <input type="checkbox" value="${upgrade.id}" data-cost="${upgrade.cost}" data-index="${index}">
                            <span class="upgrade-name">${upgrade.name}</span>
                            <span class="upgrade-cost">${upgrade.cost}p</span>
                            <span class="upgrade-description">${upgrade.description}</span>
                        </label>
                    `).join('')}
                </div>
            `;

            // Add upgrade selection listeners
            document.querySelectorAll('#boon-upgrades input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateBoonCost();
                });
            });
        }

        this.updateBoonCost();
        document.getElementById('boon-modal').classList.remove('hidden');
    }

    closeBoonModal() {
        document.getElementById('boon-modal').classList.add('hidden');
        this.currentBoonId = null;
        this.selectedBoonUpgrades = [];
    }

    updateBoonCost() {
        const boon = UniqueAbilitySystem.getComplexUniqueAbilities().find(b => b.id === this.currentBoonId);
        if (!boon) return;

        let totalCost = boon.baseCost;
        const selectedUpgrades = document.querySelectorAll('#boon-upgrades input[type="checkbox"]:checked');
        
        selectedUpgrades.forEach(checkbox => {
            totalCost += parseInt(checkbox.dataset.cost);
        });

        document.getElementById('boon-total-cost').textContent = totalCost;
    }

    confirmBoonPurchase() {
        const character = this.builder.currentCharacter;
        
        try {
            const boon = UniqueAbilitySystem.getComplexUniqueAbilities().find(b => b.id === this.currentBoonId);
            if (!boon) throw new Error('Boon not found');

            const selectedUpgrades = Array.from(document.querySelectorAll('#boon-upgrades input[type="checkbox"]:checked'))
                .map(checkbox => ({
                    id: checkbox.value,
                    cost: parseInt(checkbox.dataset.cost)
                }));

            const totalCost = boon.baseCost + selectedUpgrades.reduce((sum, upgrade) => sum + upgrade.cost, 0);
            
            const boonPurchase = {
                boonId: this.currentBoonId,
                name: boon.name,
                cost: totalCost,
                category: boon.category,
                effect: boon.effect,
                description: boon.description,
                upgrades: selectedUpgrades,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.boons.push(boonPurchase);
            this.builder.updateCharacter();
            this.closeBoonModal();
            this.render();
            
            this.builder.showNotification(`Purchased ${boon.name} for ${totalCost}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    // ACTION UPGRADE METHODS
    purchaseActionUpgrade(actionId) {
        const character = this.builder.currentCharacter;
        
        try {
            const action = this.getAvailablePrimaryActions().find(a => a.id === actionId);
            if (!action) throw new Error('Action not found');
            
            const upgrade = {
                actionId: actionId,
                actionName: action.name,
                cost: GameConstants.PRIMARY_TO_QUICK_COST,
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.primaryActionUpgrades.push(upgrade);
            this.builder.updateCharacter();
            this.render();
            
            this.builder.showNotification(`Purchased ${action.name} upgrade for ${GameConstants.PRIMARY_TO_QUICK_COST}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase upgrade: ${error.message}`, 'error');
        }
    }

    // REMOVE METHODS
    removeFlaw(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.flaws.length) {
            const flaw = character.mainPoolPurchases.flaws[index];
            character.mainPoolPurchases.flaws.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
            this.builder.showNotification(`Removed ${flaw.name}`, 'info');
        }
    }

    removeTrait(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.traits.length) {
            const trait = character.mainPoolPurchases.traits[index];
            character.mainPoolPurchases.traits.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
            this.builder.showNotification(`Removed ${trait.name}`, 'info');
        }
    }

    removeBoon(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.boons.length) {
            const boon = character.mainPoolPurchases.boons[index];
            character.mainPoolPurchases.boons.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
            this.builder.showNotification(`Removed ${boon.name}`, 'info');
        }
    }

    removeUpgrade(index) {
        const character = this.builder.currentCharacter;
        if (index >= 0 && index < character.mainPoolPurchases.primaryActionUpgrades.length) {
            const upgrade = character.mainPoolPurchases.primaryActionUpgrades[index];
            character.mainPoolPurchases.primaryActionUpgrades.splice(index, 1);
            this.builder.updateCharacter();
            this.render();
            this.builder.showNotification(`Removed ${upgrade.actionName} upgrade`, 'info');
        }
    }

    // HELPER METHODS
    getAvailablePrimaryActions() {
        return [
            { id: 'base_attack', name: 'Base Attack', description: 'Your basic attack action' },
            { id: 'dodge', name: 'Dodge Action', description: 'Add Tier to Avoidance for one turn' },
            { id: 'brace', name: 'Brace Action', description: 'Add Tier to Durability for one turn' },
            { id: 'fortify', name: 'Fortify Action', description: 'Add Tier to all Resistances for one turn' },
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
}