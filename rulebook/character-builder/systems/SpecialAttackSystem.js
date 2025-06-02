// SpecialAttackTab.js - Special attack creation and management with limits and upgrades
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { LimitCalculator } from '../../calculators/LimitCalculator.js';
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';

export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedAttackIndex = 0;
        this.showingLimitModal = false;
        this.showingUpgradeModal = false;
    }

    render() {
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        tabContent.innerHTML = `
            <div class="special-attacks-section">
                <h2>Special Attacks</h2>
                <p class="section-description">
                    Create unique combat abilities using your special attack archetype rules.
                    Use limits to generate upgrade points, then purchase enhancements.
                </p>
                
                ${this.renderArchetypeInfo(character)}
                ${this.renderAttackManagement(character)}
                ${character.specialAttacks.length > 0 ? this.renderAttackBuilder(character) : ''}
                ${this.renderLimitModal()}
                ${this.renderUpgradeModal()}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Configure utility abilities and expertise.</p>
                    <button id="continue-to-utility" class="btn-primary">Continue to Utility →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderArchetypeInfo(character) {
        const archetype = character.archetypes.specialAttack;
        const method = SpecialAttackSystem.getSpecialAttackPointMethod ? 
            SpecialAttackSystem.getSpecialAttackPointMethod(character) : 
            { method: 'unknown' };

        return `
            <div class="archetype-info">
                <h3>Special Attack Archetype: ${this.formatArchetypeName(archetype)}</h3>
                <div class="archetype-details">
                    ${this.getArchetypeDescription(archetype, character)}
                </div>
            </div>
        `;
    }

    getArchetypeDescription(archetype, character) {
        const tier = character.tier;
        
        switch(archetype) {
            case 'normal':
                return `<p>Create flexible attacks using limits. Points from limits × (Tier ÷ 6) = ${Math.floor(tier / 6)} multiplier</p>`;
            case 'specialist':
                return `<p>Use 3 specific limits consistently. Points from limits × (Tier ÷ 3) = ${Math.floor(tier / 3)} multiplier</p>`;
            case 'straightforward':
                return `<p>Single limit per attack. Points from limits × (Tier ÷ 2) = ${Math.floor(tier / 2)} multiplier</p>`;
            case 'paragon':
                return `<p>Each attack gets ${tier * 10} points. Cannot use limits.</p>`;
            case 'oneTrick':
                return `<p>Single attack with ${tier * 20} points. Cannot use limits.</p>`;
            case 'dualNatured':
                return `<p>Two attacks with ${tier * 15} points each. Cannot use limits.</p>`;
            case 'basic':
                return `<p>Enhance base attacks only with ${tier * 10} points. No special attacks.</p>`;
            case 'sharedUses':
                return `<p>Shared resource pool. 10 uses, points from limits (no multiplier).</p>`;
            default:
                return '<p>Select a special attack archetype to see point calculation method.</p>';
        }
    }

    renderAttackManagement(character) {
        const archetype = character.archetypes.specialAttack;
        const canCreate = this.canCreateNewAttack(character);
        const attacks = character.specialAttacks;

        return `
            <div class="attack-management">
                <div class="attack-header">
                    <h3>Special Attacks (${attacks.length})</h3>
                    ${canCreate.allowed ? `
                        <button id="create-attack-btn" class="btn-primary">+ Create Attack</button>
                    ` : `
                        <div class="cannot-create">
                            <span class="reason">${canCreate.reason}</span>
                        </div>
                    `}
                </div>
                
                ${attacks.length > 0 ? `
                    <div class="attack-tabs">
                        ${attacks.map((attack, index) => `
                            <div class="attack-tab ${index === this.selectedAttackIndex ? 'active' : ''}" 
                                 data-attack-index="${index}">
                                <span class="attack-name">${attack.name}</span>
                                <div class="attack-points">${attack.upgradePointsSpent}/${attack.upgradePointsAvailable}p</div>
                                <button class="btn-small btn-danger" data-action="delete-attack" data-index="${index}">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-attacks">
                        <p>No special attacks created yet.</p>
                        ${canCreate.allowed ? '<p>Click "Create Attack" to begin.</p>' : ''}
                    </div>
                `}
            </div>
        `;
    }

    renderAttackBuilder(character) {
        if (character.specialAttacks.length === 0) return '';
        
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return '';

        return `
            <div class="attack-builder">
                ${this.renderAttackBasics(attack, character)}
                ${this.renderLimitsSection(attack, character)}
                ${this.renderUpgradesSection(attack, character)}
                ${this.renderPointsSummary(attack, character)}
            </div>
        `;
    }

    renderAttackBasics(attack, character) {
        return `
            <div class="attack-basics">
                <div class="form-group">
                    <label for="attack-name-${this.selectedAttackIndex}">Attack Name</label>
                    <input type="text" 
                           id="attack-name-${this.selectedAttackIndex}" 
                           value="${attack.name}" 
                           placeholder="Enter attack name">
                </div>
                
                <div class="form-group">
                    <label for="attack-description-${this.selectedAttackIndex}">Description</label>
                    <textarea id="attack-description-${this.selectedAttackIndex}" 
                              placeholder="Describe your attack...">${attack.description || ''}</textarea>
                </div>
            </div>
        `;
    }

    renderLimitsSection(attack, character) {
        const archetype = character.archetypes.specialAttack;
        const canUseLimits = !['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype);
        
        if (!canUseLimits) {
            return `
                <div class="limits-section disabled">
                    <h4>Limits</h4>
                    <p class="archetype-restriction">${archetype} archetype cannot use limits.</p>
                </div>
            `;
        }

        const limitBreakdown = this.calculateLimitBreakdown(attack, character);

        return `
            <div class="limits-section">
                <div class="section-header">
                    <h4>Limits (${attack.limits.length})</h4>
                    <button id="add-limit-btn" class="btn-secondary">+ Add Limit</button>
                </div>
                
                <div class="limits-list">
                    ${attack.limits.length > 0 ? `
                        ${attack.limits.map((limit, index) => this.renderLimitItem(limit, index)).join('')}
                    ` : `
                        <div class="empty-limits">
                            <p>No limits selected. Add limits to generate upgrade points.</p>
                        </div>
                    `}
                </div>
                
                ${attack.limits.length > 0 ? `
                    <div class="limit-calculation">
                        <h5>Point Calculation</h5>
                        <div class="calculation-breakdown">
                            <div class="calc-line">
                                <span>Total Limit Points:</span>
                                <span>${attack.limitPointsTotal || 0}</span>
                            </div>
                            <div class="calc-line">
                                <span>After Scaling:</span>
                                <span>${limitBreakdown.scaledPoints}</span>
                            </div>
                            <div class="calc-line">
                                <span>Archetype Multiplier:</span>
                                <span>×${limitBreakdown.archetypeMultiplier}</span>
                            </div>
                            <div class="calc-line total">
                                <span>Upgrade Points:</span>
                                <span>${limitBreakdown.finalPoints}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderLimitItem(limit, index) {
        return `
            <div class="limit-item">
                <div class="limit-header">
                    <span class="limit-name">${limit.name}</span>
                    <span class="limit-points">${limit.points}p</span>
                    <button class="btn-small btn-danger" data-action="remove-limit" data-index="${index}">×</button>
                </div>
                <div class="limit-description">${limit.description}</div>
            </div>
        `;
    }

    renderUpgradesSection(attack, character) {
        const remaining = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        
        return `
            <div class="upgrades-section">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining">
                        Points Remaining: <span class="${remaining < 0 ? 'over-budget' : ''}">${remaining}</span>
                    </div>
                </div>
                
                <div class="upgrades-purchased">
                    <h5>Purchased Upgrades (${attack.upgrades?.length || 0})</h5>
                    ${attack.upgrades && attack.upgrades.length > 0 ? `
                        <div class="upgrade-list">
                            ${attack.upgrades.map((upgrade, index) => this.renderPurchasedUpgrade(upgrade, index)).join('')}
                        </div>
                    ` : `
                        <div class="empty-upgrades">
                            <p>No upgrades purchased yet.</p>
                        </div>
                    `}
                </div>
                
                <div class="upgrade-categories">
                    <button id="browse-upgrades-btn" class="btn-secondary">Browse Available Upgrades</button>
                </div>
            </div>
        `;
    }

    renderPurchasedUpgrade(upgrade, index) {
        return `
            <div class="purchased-upgrade">
                <div class="upgrade-header">
                    <span class="upgrade-name">${upgrade.name}</span>
                    <span class="upgrade-cost">${upgrade.cost}p</span>
                    <button class="btn-small btn-danger" data-action="remove-upgrade" data-index="${index}">×</button>
                </div>
                <div class="upgrade-description">${upgrade.description || upgrade.effect}</div>
            </div>
        `;
    }

    renderPointsSummary(attack, character) {
        const remaining = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        const status = remaining < 0 ? 'over-budget' : remaining === 0 ? 'fully-used' : 'available';
        
        return `
            <div class="points-summary ${status}">
                <h4>Point Summary</h4>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span>Available:</span>
                        <span>${attack.upgradePointsAvailable}</span>
                    </div>
                    <div class="summary-item">
                        <span>Spent:</span>
                        <span>${attack.upgradePointsSpent}</span>
                    </div>
                    <div class="summary-item ${status}">
                        <span>Remaining:</span>
                        <span>${remaining}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderLimitModal() {
        const allLimits = LimitCalculator.getAllLimits();
        
        return `
            <div id="limit-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Limit</h3>
                        <button id="close-limit-modal" class="btn-small">×</button>
                    </div>
                    
                    <div class="modal-body">
                        ${Object.entries(allLimits).map(([category, limits]) => `
                            <div class="limit-category">
                                <h4>${this.formatCategoryName(category)}</h4>
                                <div class="limit-options">
                                    ${limits.map(limit => `
                                        <div class="limit-option" data-limit-id="${limit.id}">
                                            <div class="limit-option-header">
                                                <span class="limit-option-name">${limit.name}</span>
                                                <span class="limit-option-points">${limit.points}p</span>
                                            </div>
                                            <div class="limit-option-description">${limit.description}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderUpgradeModal() {
        // Simplified upgrade categories for now
        const upgradeCategories = {
            accuracy: [
                { id: 'accurate-attack', name: 'Accurate Attack', cost: 10, description: '+Tier to Accuracy, -Tier to Damage/Conditions' },
                { id: 'critical-accuracy', name: 'Critical Accuracy', cost: 30, description: 'Critical hit on 15-20' },
                { id: 'ricochet', name: 'Ricochet', cost: 20, description: 'Critical hits bounce to another target' }
            ],
            damage: [
                { id: 'power-attack', name: 'Power Attack', cost: 10, description: '+Tier to Damage, -Tier to Accuracy' },
                { id: 'brutal', name: 'Brutal', cost: 40, description: 'Extra damage when exceeding Durability by 10+' },
                { id: 'armor-piercing', name: 'Armor Piercing', cost: 30, description: 'Ignore Endurance bonus to Durability' }
            ],
            conditions: [
                { id: 'critical-condition', name: 'Critical Condition', cost: 30, description: 'Condition crits on 15-20' },
                { id: 'lasting-condition', name: 'Lasting Condition', cost: 20, description: 'Extend duration when exceeding resistance by 10+' }
            ],
            special: [
                { id: 'extra-attack', name: 'Extra Attack', cost: 60, description: 'Successful hit allows identical attack against same target' },
                { id: 'splash-damage', name: 'Splash Damage', cost: 20, description: 'Adjacent targets take Tier+1d6 damage' }
            ]
        };

        return `
            <div id="upgrade-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Purchase Upgrades</h3>
                        <button id="close-upgrade-modal" class="btn-small">×</button>
                    </div>
                    
                    <div class="modal-body">
                        ${Object.entries(upgradeCategories).map(([category, upgrades]) => `
                            <div class="upgrade-category">
                                <h4>${this.formatCategoryName(category)}</h4>
                                <div class="upgrade-options">
                                    ${upgrades.map(upgrade => `
                                        <div class="upgrade-option" data-upgrade-id="${upgrade.id}">
                                            <div class="upgrade-option-header">
                                                <span class="upgrade-option-name">${upgrade.name}</span>
                                                <span class="upgrade-option-cost">${upgrade.cost}p</span>
                                            </div>
                                            <div class="upgrade-option-description">${upgrade.description}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Continue button
        const continueBtn = document.getElementById('continue-to-utility');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('utility');
            });
        }

        // Create attack
        const createBtn = document.getElementById('create-attack-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createNewAttack());
        }

        // Attack tabs
        document.querySelectorAll('.attack-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.selectedAttackIndex = parseInt(tab.dataset.attackIndex);
                this.render();
            });
        });

        // Delete attack
        document.querySelectorAll('[data-action="delete-attack"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.deleteAttack(index);
            });
        });

        // Attack name/description
        const nameInput = document.getElementById(`attack-name-${this.selectedAttackIndex}`);
        if (nameInput) {
            nameInput.addEventListener('input', (e) => this.updateAttackName(e.target.value));
        }

        const descInput = document.getElementById(`attack-description-${this.selectedAttackIndex}`);
        if (descInput) {
            descInput.addEventListener('input', (e) => this.updateAttackDescription(e.target.value));
        }

        // Limits
        const addLimitBtn = document.getElementById('add-limit-btn');
        if (addLimitBtn) {
            addLimitBtn.addEventListener('click', () => this.openLimitModal());
        }

        document.querySelectorAll('[data-action="remove-limit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.removeLimit(index);
            });
        });

        // Upgrades
        const browseUpgradesBtn = document.getElementById('browse-upgrades-btn');
        if (browseUpgradesBtn) {
            browseUpgradesBtn.addEventListener('click', () => this.openUpgradeModal());
        }

        document.querySelectorAll('[data-action="remove-upgrade"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.removeUpgrade(index);
            });
        });

        // Modal handlers
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Limit modal
        const limitModal = document.getElementById('limit-modal');
        const closeLimitBtn = document.getElementById('close-limit-modal');
        
        if (closeLimitBtn) {
            closeLimitBtn.addEventListener('click', () => this.closeLimitModal());
        }

        document.querySelectorAll('.limit-option').forEach(option => {
            option.addEventListener('click', () => {
                const limitId = option.dataset.limitId;
                this.addLimit(limitId);
            });
        });

        // Upgrade modal
        const upgradeModal = document.getElementById('upgrade-modal');
        const closeUpgradeBtn = document.getElementById('close-upgrade-modal');
        
        if (closeUpgradeBtn) {
            closeUpgradeBtn.addEventListener('click', () => this.closeUpgradeModal());
        }

        document.querySelectorAll('.upgrade-option').forEach(option => {
            option.addEventListener('click', () => {
                const upgradeId = option.dataset.upgradeId;
                this.addUpgrade(upgradeId);
            });
        });

        // Close modals on background click
        if (limitModal) {
            limitModal.addEventListener('click', (e) => {
                if (e.target === limitModal) this.closeLimitModal();
            });
        }

        if (upgradeModal) {
            upgradeModal.addEventListener('click', (e) => {
                if (e.target === upgradeModal) this.closeUpgradeModal();
            });
        }
    }

    // Attack Management Methods
    canCreateNewAttack(character) {
        const archetype = character.archetypes.specialAttack;
        const currentCount = character.specialAttacks.length;

        switch(archetype) {
            case 'basic':
                return { allowed: false, reason: 'Basic archetype cannot create special attacks' };
            case 'oneTrick':
                return currentCount >= 1 ? 
                    { allowed: false, reason: 'One Trick allows only one attack' } :
                    { allowed: true };
            case 'dualNatured':
                return currentCount >= 2 ? 
                    { allowed: false, reason: 'Dual-Natured allows only two attacks' } :
                    { allowed: true };
            default:
                return { allowed: true };
        }
    }

    createNewAttack() {
        const character = this.builder.currentCharacter;
        const newAttack = {
            id: Date.now().toString(),
            name: `Special Attack ${character.specialAttacks.length + 1}`,
            description: '',
            attackTypes: [],
            effectTypes: [],
            limits: [],
            limitPointsTotal: 0,
            upgradePointsAvailable: 0,
            upgradePointsSpent: 0,
            upgrades: []
        };

        // Calculate initial points based on archetype
        this.recalculateAttackPoints(character, newAttack);
        
        character.specialAttacks.push(newAttack);
        this.selectedAttackIndex = character.specialAttacks.length - 1;
        
        this.builder.updateCharacter();
        this.render();
    }

    deleteAttack(index) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[index];
        
        if (confirm(`Delete "${attack.name}"?`)) {
            character.specialAttacks.splice(index, 1);
            
            if (this.selectedAttackIndex >= character.specialAttacks.length) {
                this.selectedAttackIndex = Math.max(0, character.specialAttacks.length - 1);
            }
            
            this.builder.updateCharacter();
            this.render();
        }
    }

    updateAttackName(newName) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack) {
            attack.name = newName || `Special Attack ${this.selectedAttackIndex + 1}`;
            this.builder.updateCharacter();
        }
    }

    updateAttackDescription(newDescription) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack) {
            attack.description = newDescription;
            this.builder.updateCharacter();
        }
    }

    // Limits Methods
    openLimitModal() {
        const modal = document.getElementById('limit-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.showingLimitModal = true;
        }
    }

    closeLimitModal() {
        const modal = document.getElementById('limit-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.showingLimitModal = false;
        }
    }

    addLimit(limitId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (!attack) return;

        const allLimits = LimitCalculator.getAllLimits();
        let limitDef = null;
        
        // Find the limit definition
        for (const category of Object.values(allLimits)) {
            limitDef = category.find(l => l.id === limitId);
            if (limitDef) break;
        }

        if (!limitDef) {
            this.builder.showNotification('Limit not found', 'error');
            return;
        }

        // Check if already added
        if (attack.limits.some(l => l.id === limitId)) {
            this.builder.showNotification('Limit already applied', 'warning');
            return;
        }

        // Add the limit
        attack.limits.push({
            id: limitId,
            name: limitDef.name,
            description: limitDef.description,
            points: limitDef.points
        });

        // Recalculate points
        this.recalculateAttackPoints(character, attack);
        
        this.builder.updateCharacter();
        this.closeLimitModal();
        this.render();
    }

    removeLimit(index) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack && index >= 0 && index < attack.limits.length) {
            attack.limits.splice(index, 1);
            this.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
            this.render();
        }
    }

    // Upgrades Methods
    openUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.showingUpgradeModal = true;
        }
    }

    closeUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.showingUpgradeModal = false;
        }
    }

    addUpgrade(upgradeId) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (!attack) return;

        // Find upgrade definition (simplified for now)
        const upgradeDefinitions = {
            'accurate-attack': { name: 'Accurate Attack', cost: 10, description: '+Tier to Accuracy, -Tier to Damage/Conditions' },
            'critical-accuracy': { name: 'Critical Accuracy', cost: 30, description: 'Critical hit on 15-20' },
            'ricochet': { name: 'Ricochet', cost: 20, description: 'Critical hits bounce to another target' },
            'power-attack': { name: 'Power Attack', cost: 10, description: '+Tier to Damage, -Tier to Accuracy' },
            'brutal': { name: 'Brutal', cost: 40, description: 'Extra damage when exceeding Durability by 10+' },
            'armor-piercing': { name: 'Armor Piercing', cost: 30, description: 'Ignore Endurance bonus to Durability' },
            'critical-condition': { name: 'Critical Condition', cost: 30, description: 'Condition crits on 15-20' },
            'lasting-condition': { name: 'Lasting Condition', cost: 20, description: 'Extend duration when exceeding resistance by 10+' },
            'extra-attack': { name: 'Extra Attack', cost: 60, description: 'Successful hit allows identical attack against same target' },
            'splash-damage': { name: 'Splash Damage', cost: 20, description: 'Adjacent targets take Tier+1d6 damage' }
        };

        const upgradeDef = upgradeDefinitions[upgradeId];
        if (!upgradeDef) {
            this.builder.showNotification('Upgrade not found', 'error');
            return;
        }

        // Check if can afford
        const remaining = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        if (upgradeDef.cost > remaining) {
            this.builder.showNotification(`Insufficient points (need ${upgradeDef.cost}, have ${remaining})`, 'error');
            return;
        }

        // Check if already purchased
        if (attack.upgrades && attack.upgrades.some(u => u.id === upgradeId)) {
            this.builder.showNotification('Upgrade already purchased', 'warning');
            return;
        }

        // Add the upgrade
        if (!attack.upgrades) attack.upgrades = [];
        attack.upgrades.push({
            id: upgradeId,
            name: upgradeDef.name,
            description: upgradeDef.description,
            cost: upgradeDef.cost
        });

        attack.upgradePointsSpent += upgradeDef.cost;
        
        this.builder.updateCharacter();
        this.closeUpgradeModal();
        this.render();
    }

    removeUpgrade(index) {
        const character = this.builder.currentCharacter;
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        if (attack && attack.upgrades && index >= 0 && index < attack.upgrades.length) {
            const upgrade = attack.upgrades[index];
            attack.upgradePointsSpent -= upgrade.cost;
            attack.upgrades.splice(index, 1);
            
            this.builder.updateCharacter();
            this.render();
        }
    }

    // Calculation Methods
    calculateLimitBreakdown(attack, character) {
        const limitPoints = attack.limits.reduce((total, limit) => total + limit.points, 0);
        attack.limitPointsTotal = limitPoints;

        if (limitPoints === 0) {
            return { scaledPoints: 0, archetypeMultiplier: 0, finalPoints: 0 };
        }

        // Use LimitCalculator if available
        if (LimitCalculator.calculateCompleteConversion) {
            return LimitCalculator.calculateCompleteConversion(character, attack);
        }

        // Fallback calculation
        const tier = character.tier;
        const firstTier = tier * 10;
        const secondTier = tier * 20;
        
        let scaledPoints = 0;
        if (limitPoints <= firstTier) {
            scaledPoints = limitPoints;
        } else if (limitPoints <= firstTier + secondTier) {
            scaledPoints = firstTier + (limitPoints - firstTier) * 0.5;
        } else {
            scaledPoints = firstTier + secondTier * 0.5 + (limitPoints - firstTier - secondTier) * 0.25;
        }

        const archetype = character.archetypes.specialAttack;
        let archetypeMultiplier = 0;
        
        switch(archetype) {
            case 'normal': archetypeMultiplier = tier / 6; break;
            case 'specialist': archetypeMultiplier = tier / 3; break;
            case 'straightforward': archetypeMultiplier = tier / 2; break;
            case 'sharedUses': archetypeMultiplier = 1; break;
            default: archetypeMultiplier = 0; break;
        }

        const finalPoints = Math.floor(scaledPoints * archetypeMultiplier);

        return { scaledPoints: Math.floor(scaledPoints), archetypeMultiplier, finalPoints };
    }

    recalculateAttackPoints(character, attack) {
        const archetype = character.archetypes.specialAttack;
        const tier = character.tier;

        // Reset points
        attack.upgradePointsAvailable = 0;

        // Calculate based on archetype
        switch(archetype) {
            case 'paragon':
                attack.upgradePointsAvailable = tier * 10;
                break;
            case 'oneTrick':
                attack.upgradePointsAvailable = tier * 20;
                break;
            case 'dualNatured':
                attack.upgradePointsAvailable = tier * 15;
                break;
            case 'basic':
                attack.upgradePointsAvailable = tier * 10;
                break;
            default:
                // Calculate from limits
                const breakdown = this.calculateLimitBreakdown(attack, character);
                attack.upgradePointsAvailable = breakdown.finalPoints;
                break;
        }

        // Ensure spent doesn't exceed available
        if (attack.upgradePointsSpent > attack.upgradePointsAvailable) {
            // Would need to remove upgrades or show warning
            // For now, just cap it
            attack.upgradePointsSpent = Math.min(attack.upgradePointsSpent, attack.upgradePointsAvailable);
        }
    }

    // Utility Methods
    formatArchetypeName(archetypeId) {
        if (!archetypeId) return 'None Selected';
        return archetypeId.replace(/([A-Z])/g, ' $1')
                         .replace(/^./, str => str.toUpperCase());
    }

    formatCategoryName(categoryName) {
        return categoryName.replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase());
    }
}