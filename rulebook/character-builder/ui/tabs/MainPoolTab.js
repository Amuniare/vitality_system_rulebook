// MainPoolTab.js - Main pool purchases (FIXED VERSION)
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

        // Debug log
        console.log('MainPoolTab render - character:', character);
        console.log('MainPoolPurchases:', character.mainPoolPurchases);

        const pointInfo = this.calculatePointInfo(character);
        console.log('Point info:', pointInfo);

        tabContent.innerHTML = `
            <div class="main-pool-section">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Purchase traits, flaws, boons, and action upgrades. Flaws give you +30p each.
                </p>
                
                ${this.renderPointPoolStatus(pointInfo)}
                ${this.renderFlawsSection(character, pointInfo)}
                ${this.renderTraitsSection(character, pointInfo)}
                ${this.renderBoonsSection(character, pointInfo)}
                ${this.renderUpgradesSection(character, pointInfo)}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks.</p>
                    <button id="continue-to-special-attacks" class="btn-primary">Continue to Special Attacks →</button>
                </div>
            </div>
        `;

        // Set up event listeners AFTER DOM is created
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    }

    calculatePointInfo(character) {
        const tier = character.tier;
        
        // Base main pool (tier-2) * 15
        let basePool = Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            basePool += Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        }
        
        // FLAWS GIVE BONUS POINTS when purchased (not pre-existing)
        const flawBonus = character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
        
        const totalAvailable = basePool + flawBonus;
        
        // Calculate spent
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + (trait.cost || GameConstants.TRAIT_COST), 0);
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + (boon.cost || 0), 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        const totalSpent = spentOnTraits + spentOnBoons + spentOnUpgrades;
        
        return {
            basePool,
            flawBonus,
            totalAvailable,
            spent: totalSpent,
            remaining: totalAvailable - totalSpent,
            breakdown: {
                traits: spentOnTraits,
                boons: spentOnBoons,
                upgrades: spentOnUpgrades
            }
        };
    }

    renderPointPoolStatus(pointInfo) {
        return `
            <div class="main-pool-status">
                <h3>Main Pool Points</h3>
                <div class="pool-summary">
                    <div class="pool-item">
                        <span>Base Pool: ${pointInfo.basePool}p</span>
                    </div>
                    <div class="pool-item">
                        <span>Flaw Bonus: +${pointInfo.flawBonus}p</span>
                    </div>
                    <div class="pool-item">
                        <span><strong>Total Available: ${pointInfo.totalAvailable}p</strong></span>
                    </div>
                    <div class="pool-item">
                        <span>Spent: ${pointInfo.spent}p</span>
                    </div>
                    <div class="pool-item">
                        <span><strong>Remaining: ${pointInfo.remaining}p</strong></span>
                    </div>
                </div>
            </div>
        `;
    }

    renderFlawsSection(character, pointInfo) {
        const availableFlaws = TraitFlawSystem.getAvailableFlaws();
        const purchasedFlaws = character.mainPoolPurchases.flaws;
        
        return `
            <div class="main-pool-category">
                <h3>Flaws (Give +30p each)</h3>
                <p>Take disadvantages to gain extra main pool points.</p>
                
                <div class="purchased-items">
                    <h4>Purchased Flaws (${purchasedFlaws.length})</h4>
                    ${purchasedFlaws.length > 0 ? `
                        <div class="item-list">
                            ${purchasedFlaws.map((flaw, index) => `
                                <div class="purchased-item">
                                    <span>${flaw.name} (+30p, +Tier to ${flaw.statBonus})</span>
                                    <button class="btn-danger btn-small remove-flaw" data-index="${index}">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="empty-state">No flaws purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Flaws</h4>
                    <div class="flaw-grid">
                        ${availableFlaws.map(flaw => {
                            const alreadyPurchased = purchasedFlaws.some(f => f.flawId === flaw.id);
                            return `
                                <div class="flaw-card ${alreadyPurchased ? 'disabled' : 'clickable'}" data-flaw-id="${flaw.id}">
                                    <h5>${flaw.name}</h5>
                                    <p><strong>Gives: +30p</strong></p>
                                    <p>${flaw.description}</p>
                                    ${alreadyPurchased ? '<div class="status-badge">Purchased</div>' : '<div class="status-badge success">Click to Purchase</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderTraitsSection(character, pointInfo) {
        const availableTraits = TraitFlawSystem.getAvailableTraits();
        const purchasedTraits = character.mainPoolPurchases.traits;
        
        return `
            <div class="main-pool-category">
                <h3>Traits (30p each)</h3>
                <p>Conditional bonuses when specific circumstances are met.</p>
                
                <div class="purchased-items">
                    <h4>Purchased Traits (${purchasedTraits.length})</h4>
                    ${purchasedTraits.length > 0 ? `
                        <div class="item-list">
                            ${purchasedTraits.map((trait, index) => `
                                <div class="purchased-item">
                                    <span>${trait.name} (30p)</span>
                                    <button class="btn-danger btn-small remove-trait" data-index="${index}">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="empty-state">No traits purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Traits</h4>
                    <div class="trait-grid">
                        ${availableTraits.map(trait => {
                            const canAfford = pointInfo.remaining >= GameConstants.TRAIT_COST;
                            const alreadyPurchased = purchasedTraits.some(t => t.traitId === trait.id);
                            const canPurchase = canAfford && !alreadyPurchased;
                            
                            return `
                                <div class="trait-card ${canPurchase ? 'clickable' : 'disabled'}" data-trait-id="${trait.id}">
                                    <h5>${trait.name}</h5>
                                    <p><strong>Cost: 30p</strong></p>
                                    <p>${trait.description}</p>
                                    ${alreadyPurchased ? '<div class="status-badge">Purchased</div>' : 
                                      canAfford ? '<div class="status-badge success">Click to Purchase</div>' :
                                      '<div class="status-badge error">Cannot Afford</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderBoonsSection(character, pointInfo) {
        const simpleBoons = UniqueAbilitySystem.getAvailableBoons();
        const purchasedBoons = character.mainPoolPurchases.boons;
        
        return `
            <div class="main-pool-category">
                <h3>Boons (Variable Cost)</h3>
                <p>Permanent abilities and enhancements.</p>
                
                <div class="purchased-items">
                    <h4>Purchased Boons (${purchasedBoons.length})</h4>
                    ${purchasedBoons.length > 0 ? `
                        <div class="item-list">
                            ${purchasedBoons.map((boon, index) => `
                                <div class="purchased-item">
                                    <span>${boon.name} (${boon.cost}p)</span>
                                    <button class="btn-danger btn-small remove-boon" data-index="${index}">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="empty-state">No boons purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Boons</h4>
                    <div class="boon-grid">
                        ${simpleBoons.map(boon => {
                            const canAfford = pointInfo.remaining >= boon.cost;
                            const alreadyPurchased = purchasedBoons.some(b => b.boonId === boon.id);
                            const canPurchase = canAfford && !alreadyPurchased;
                            
                            return `
                                <div class="boon-card ${canPurchase ? 'clickable' : 'disabled'}" data-boon-id="${boon.id}">
                                    <h5>${boon.name}</h5>
                                    <p><strong>Cost: ${boon.cost}p</strong></p>
                                    <p>${boon.description}</p>
                                    ${alreadyPurchased ? '<div class="status-badge">Purchased</div>' : 
                                      canAfford ? '<div class="status-badge success">Click to Purchase</div>' :
                                      '<div class="status-badge error">Cannot Afford</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderUpgradesSection(character, pointInfo) {
        const availableActions = this.getAvailablePrimaryActions();
        const purchasedUpgrades = character.mainPoolPurchases.primaryActionUpgrades;
        
        return `
            <div class="main-pool-category">
                <h3>Primary Action Upgrades (30p each)</h3>
                <p>Convert Primary Actions to Quick Actions.</p>
                
                <div class="purchased-items">
                    <h4>Purchased Upgrades (${purchasedUpgrades.length})</h4>
                    ${purchasedUpgrades.length > 0 ? `
                        <div class="item-list">
                            ${purchasedUpgrades.map((upgrade, index) => `
                                <div class="purchased-item">
                                    <span>${upgrade.actionName} → Quick (30p)</span>
                                    <button class="btn-danger btn-small remove-upgrade" data-index="${index}">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="empty-state">No upgrades purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Actions</h4>
                    <div class="action-grid">
                        ${availableActions.map(action => {
                            const canAfford = pointInfo.remaining >= GameConstants.PRIMARY_TO_QUICK_COST;
                            const alreadyPurchased = purchasedUpgrades.some(u => u.actionId === action.id);
                            const canPurchase = canAfford && !alreadyPurchased;
                            
                            return `
                                <div class="action-card ${canPurchase ? 'clickable' : 'disabled'}" data-action-id="${action.id}">
                                    <h5>${action.name}</h5>
                                    <p><strong>Cost: 30p</strong></p>
                                    <p>${action.description}</p>
                                    ${alreadyPurchased ? '<div class="status-badge">Purchased</div>' : 
                                      canAfford ? '<div class="status-badge success">Click to Purchase</div>' :
                                      '<div class="status-badge error">Cannot Afford</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Continue button
        const continueBtn = document.getElementById('continue-to-special-attacks');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('specialAttacks');
            });
        }

        // FLAW CARDS - Direct purchase with stat selection
        document.querySelectorAll('.flaw-card.clickable').forEach(card => {
            console.log('Adding flaw listener to:', card);
            card.addEventListener('click', (e) => {
                console.log('Flaw card clicked:', e.target);
                const flawId = card.dataset.flawId;
                this.purchaseFlawWithStatSelection(flawId);
            });
        });

        // TRAIT CARDS - Direct purchase
        document.querySelectorAll('.trait-card.clickable').forEach(card => {
            console.log('Adding trait listener to:', card);
            card.addEventListener('click', (e) => {
                console.log('Trait card clicked:', e.target);
                const traitId = card.dataset.traitId;
                this.purchaseTraitDirect(traitId);
            });
        });

        // BOON CARDS - Direct purchase
        document.querySelectorAll('.boon-card.clickable').forEach(card => {
            console.log('Adding boon listener to:', card);
            card.addEventListener('click', (e) => {
                console.log('Boon card clicked:', e.target);
                const boonId = card.dataset.boonId;
                this.purchaseBoonDirect(boonId);
            });
        });

        // ACTION CARDS - Direct purchase
        document.querySelectorAll('.action-card.clickable').forEach(card => {
            console.log('Adding action listener to:', card);
            card.addEventListener('click', (e) => {
                console.log('Action card clicked:', e.target);
                const actionId = card.dataset.actionId;
                this.purchaseActionDirect(actionId);
            });
        });

        // REMOVE BUTTONS
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

        console.log('Event listeners setup complete');
    }

    // PURCHASE METHODS
    purchaseFlawWithStatSelection(flawId) {
        console.log('Purchasing flaw:', flawId);
        
        const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
        if (!flaw) {
            console.error('Flaw not found:', flawId);
            return;
        }

        // Simple stat selection
        const statTargets = ['accuracy', 'damage', 'conditions', 'avoidance', 'durability'];
        const selectedStat = prompt(`Choose stat bonus for ${flaw.name}:\n${statTargets.map((s, i) => `${i+1}. ${s}`).join('\n')}`);
        
        if (!selectedStat) return; // User cancelled
        
        const statIndex = parseInt(selectedStat) - 1;
        if (statIndex < 0 || statIndex >= statTargets.length) {
            alert('Invalid selection');
            return;
        }

        const character = this.builder.currentCharacter;
        
        try {
            const flawPurchase = {
                flawId: flawId,
                name: flaw.name,
                bonus: GameConstants.FLAW_BONUS,
                effect: flaw.effect,
                restriction: flaw.restriction,
                statBonus: statTargets[statIndex],
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.flaws.push(flawPurchase);
            this.builder.updateCharacter();
            this.render();
            
            this.builder.showNotification(`Purchased ${flaw.name} for +${GameConstants.FLAW_BONUS}p!`, 'success');
            
        } catch (error) {
            console.error('Flaw purchase error:', error);
            this.builder.showNotification(`Failed to purchase flaw: ${error.message}`, 'error');
        }
    }

    purchaseTraitDirect(traitId) {
        console.log('Purchasing trait:', traitId);
        
        const trait = TraitFlawSystem.getAvailableTraits().find(t => t.id === traitId);
        if (!trait) {
            console.error('Trait not found:', traitId);
            return;
        }

        const character = this.builder.currentCharacter;
        
        try {
            const traitPurchase = {
                traitId: traitId,
                name: trait.name,
                cost: GameConstants.TRAIT_COST,
                tier: trait.tier,
                condition: trait.condition,
                description: trait.description,
                statBonuses: ['accuracy', 'damage'], // Default bonuses
                purchased: new Date().toISOString()
            };
            
            character.mainPoolPurchases.traits.push(traitPurchase);
            this.builder.updateCharacter();
            this.render();
            
            this.builder.showNotification(`Purchased ${trait.name} for ${GameConstants.TRAIT_COST}p!`, 'success');
            
        } catch (error) {
            console.error('Trait purchase error:', error);
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
        }
    }

    purchaseBoonDirect(boonId) {
        console.log('Purchasing boon:', boonId);
        
        const boon = UniqueAbilitySystem.getAvailableBoons().find(b => b.id === boonId);
        if (!boon) {
            console.error('Boon not found:', boonId);
            return;
        }

        const character = this.builder.currentCharacter;
        
        try {
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
            console.error('Boon purchase error:', error);
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    purchaseActionDirect(actionId) {
        console.log('Purchasing action upgrade:', actionId);
        
        const action = this.getAvailablePrimaryActions().find(a => a.id === actionId);
        if (!action) {
            console.error('Action not found:', actionId);
            return;
        }

        const character = this.builder.currentCharacter;
        
        try {
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
            console.error('Action upgrade purchase error:', error);
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