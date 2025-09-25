// frontend/character-builder/shared/ui/PointPoolDisplay.js
import { RenderUtils } from '../utils/RenderUtils.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';

export class PointPoolDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.lastPools = null;
    }

    update() {
        const container = document.getElementById('point-pools');
        if (!container) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            container.innerHTML = this.renderEmptyState();
            this.lastPools = null; // Reset cache when no character
            return;
        }

        const pools = PointPoolCalculator.calculateAllPools(character);

        // Granular update approach - only update changed pools
        if (!this.lastPools) {
            // First render - use innerHTML
            container.innerHTML = this.renderPointPools(pools);
            this.lastPools = pools;
            return;
        }

        // Check what changed and update only those parts
        this.updateChangedPools(pools);
        this.lastPools = pools;
    }

    updateChangedPools(newPools) {
        // Update individual pool displays only if they changed
        this.updatePoolIfChanged('combatAttributes', newPools.totalSpent.combatAttributes, newPools.totalAvailable.combatAttributes, newPools.remaining.combatAttributes);
        this.updatePoolIfChanged('utilityAttributes', newPools.totalSpent.utilityAttributes, newPools.totalAvailable.utilityAttributes, newPools.remaining.utilityAttributes);
        this.updatePoolIfChanged('mainPool', newPools.totalSpent.mainPool, newPools.totalAvailable.mainPool, newPools.remaining.mainPool);
        this.updatePoolIfChanged('utilityPool', newPools.totalSpent.utilityPool, newPools.totalAvailable.utilityPool, newPools.remaining.utilityPool);
        this.updatePoolIfChanged('specialAttacks', newPools.totalSpent.specialAttacks, newPools.totalAvailable.specialAttacks, newPools.remaining.specialAttacks);
    }

    updatePoolIfChanged(poolType, spent, available, remaining) {
        const lastPool = this.lastPools;
        if (!lastPool || 
            lastPool.totalSpent[poolType] !== spent || 
            lastPool.totalAvailable[poolType] !== available || 
            lastPool.remaining[poolType] !== remaining) {
            
            // Update just this pool's display
            const poolElement = document.querySelector(`[data-pool="${poolType}"]`);
            if (poolElement) {
                this.updatePoolElement(poolElement, spent, available, remaining);
            }
        }
    }

    updatePoolElement(element, spent, available, remaining) {
        // Update spent value
        const spentElement = element.querySelector('.pool-spent');
        if (spentElement) spentElement.textContent = spent;

        // Update available value
        const availableElement = element.querySelector('.pool-available');
        if (availableElement) availableElement.textContent = available;

        // Update remaining value and status
        const remainingElement = element.querySelector('.pool-remaining');
        if (remainingElement) {
            remainingElement.textContent = remaining;
            // Update status classes
            remainingElement.className = 'pool-remaining ' + (remaining < 0 ? 'over-budget' : remaining === 0 ? 'exactly-spent' : 'under-budget');
        }
    }

    renderPointPools(pools) {
        return `
            <div class="point-pools-section">
                <h3>Point Pools</h3>
                ${this.renderAttributePools(pools)}
                ${this.renderMainPool(pools)}
                ${this.renderUtilityPool(pools)}
                ${this.renderSpecialAttackPools(pools)}
                ${this.renderOverallSummary(pools)}
            </div>
        `;
    }

    renderAttributePools(pools) {
        return `
            <div class="attribute-pools pool-category">
                <h4>Attributes</h4>
                ${this.renderGranularPool('combatAttributes', pools.totalSpent.combatAttributes, pools.totalAvailable.combatAttributes, pools.remaining.combatAttributes, 'Combat Attr.')}
                ${this.renderGranularPool('utilityAttributes', pools.totalSpent.utilityAttributes, pools.totalAvailable.utilityAttributes, pools.remaining.utilityAttributes, 'Utility Attr.')}
            </div>
        `;
    }

    renderGranularPool(poolType, spent, available, remaining, label) {
        const variant = remaining < 0 ? 'error' : remaining === 0 ? 'warning' : 'default';
        return `
            <div class="point-display ${variant}" data-pool="${poolType}">
                <div class="point-display-label">${label}</div>
                <div class="point-display-values">
                    <span class="pool-spent">${spent}</span> / <span class="pool-available">${available}</span>
                    <span class="pool-remaining ${remaining < 0 ? 'over-budget' : remaining === 0 ? 'exactly-spent' : 'under-budget'}" data-testid="remaining-points">(${remaining >= 0 ? '+' : ''}${remaining})</span>
                </div>
                ${remaining < 0 ? `<div class="budget-warning" data-testid="budget-warning">Over budget by ${Math.abs(remaining)} points</div>` : ''}
            </div>
        `;
    }

    renderMainPool(pools) {
         // Flaw economics: Flaws COST points, give stat bonus. No point bonus from flaws here.
        const flawCost = pools.totalSpent.mainPoolFlaws || 0; // Assuming PointPoolCalculator provides this

        return `
            <div class="main-pool pool-category">
                <h4>Main Pool</h4>
                ${this.renderGranularPool('mainPool', pools.totalSpent.mainPool, pools.totalAvailable.mainPool, pools.remaining.mainPool, 'Main Pool')}
                ${flawCost > 0 ? `<div class="pool-detail"><small>(${flawCost}p spent on Flaws)</small></div>` : ''}
            </div>
        `;
    }


    renderUtilityPool(pools) {
        return `
            <div class="utility-pool pool-category">
                <h4>Utility Pool</h4>
                ${this.renderGranularPool('utilityPool', pools.totalSpent.utilityPool, pools.totalAvailable.utilityPool, pools.remaining.utilityPool, 'Utility Pool')}
            </div>
        `;
    }

    renderSpecialAttackPools(pools) {
        if (!pools.specialAttackPools || pools.specialAttackPools.totalAvailable === 0 && pools.totalSpent.specialAttacks === 0) {
            return `
                <div class="special-attack-pools pool-category">
                    <h4>Special Attacks</h4>
                    <div class="empty-state-small">No special attacks or points allocated.</div>
                </div>
            `;
        }
        return `
            <div class="special-attack-pools pool-category">
                <h4>Special Attacks</h4>
                ${this.renderGranularPool('specialAttacks', pools.totalSpent.specialAttacks, pools.totalAvailable.specialAttacks, pools.remaining.specialAttacks, 'Total SA Points')}
                <div class="pool-method-display">
                    <small>Method: ${pools.specialAttackPools.method || 'N/A'}</small>
                </div>
                ${pools.specialAttackPools.attackPools && pools.specialAttackPools.attackPools.length > 0 ? `
                    <div class="individual-attack-pools">
                        ${pools.specialAttackPools.attackPools.map((attack, index) => `
                            <div class="attack-pool-item">
                                <span class="attack-pool-name">${attack.attackName || `Attack ${index + 1}`}</span>
                                <span class="attack-pool-values">${attack.spent}/${attack.available}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderOverallSummary(pools) {
        const totalAvailable = Object.values(pools.totalAvailable).reduce((sum, val) => sum + (val || 0), 0);
        const totalSpent = Object.values(pools.totalSpent).reduce((sum, val) => sum + (val || 0), 0);
        const totalRemaining = totalAvailable - totalSpent;
        
        let issuesHtml = '';
        const issues = [];
        Object.entries(pools.remaining).forEach(([poolName, remainingValue]) => {
            if (remainingValue < 0) {
                issues.push(`${this.formatPoolName(poolName)}: ${Math.abs(remainingValue)} over budget`);
            }
        });
        if (issues.length > 0) {
            issuesHtml = `<div class="pool-issues error-text"><strong>Issues:</strong> ${issues.join('; ')}</div>`;
        }

        return `
            <div class="overall-summary pool-category">
                <h4>Overall Status</h4>
                <div class="summary-line">
                    <span>Total Points Spent:</span> <span class="value">${totalSpent}</span>
                </div>
                <div class="summary-line">
                    <span>Total Points Available:</span> <span class="value">${totalAvailable}</span>
                </div>
                <div class="summary-line ${totalRemaining < 0 ? 'error-text' : ''}">
                    <span>Overall Remaining:</span> <span class="value">${totalRemaining}</span>
                </div>
                ${issuesHtml}
            </div>
        `;
    }
    
    formatPoolName(poolId) {
        return poolId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }


    renderEmptyState() {
        return `
            <div class="point-pools-section">
                <h3>Point Pools</h3>
                <div class="empty-state">Create or select a character to see point pools.</div>
            </div>
        `;
    }
}
