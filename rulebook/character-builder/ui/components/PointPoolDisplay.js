// rulebook/character-builder/ui/components/PointPoolDisplay.js
import { RenderUtils } from '../shared/RenderUtils.js';
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

        // Only update if pools stringified are different (simple deep comparison)
        const currentPoolsString = JSON.stringify(pools);
        if (currentPoolsString === this.lastPools) {
            return; // No change, no re-render
        }
        this.lastPools = currentPoolsString; // Cache the new state

        container.innerHTML = this.renderPointPools(pools);
        // console.log('🔄 Point pools display updated');
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
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.combatAttributes,
                    pools.totalAvailable.combatAttributes,
                    'Combat Attr.',
                    { variant: pools.remaining.combatAttributes < 0 ? 'error' : pools.remaining.combatAttributes === 0 ? 'warning' : 'default', showRemaining: true }
                )}
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.utilityAttributes,
                    pools.totalAvailable.utilityAttributes,
                    'Utility Attr.',
                    { variant: pools.remaining.utilityAttributes < 0 ? 'error' : pools.remaining.utilityAttributes === 0 ? 'warning' : 'default', showRemaining: true }
                )}
            </div>
        `;
    }

    renderMainPool(pools) {
         // Flaw economics: Flaws COST points, give stat bonus. No point bonus from flaws here.
        const flawCost = pools.totalSpent.mainPoolFlaws || 0; // Assuming PointPoolCalculator provides this

        return `
            <div class="main-pool pool-category">
                <h4>Main Pool</h4>
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.mainPool,
                    pools.totalAvailable.mainPool, // This should NOT include flaw costs as a bonus
                    'Main Pool',
                    { variant: pools.remaining.mainPool < 0 ? 'error' : pools.remaining.mainPool === 0 ? 'warning' : 'default', showRemaining: true, showPercentage: true }
                )}
                ${flawCost > 0 ? `<div class="pool-detail"><small>(${flawCost}p spent on Flaws)</small></div>` : ''}
            </div>
        `;
    }


    renderUtilityPool(pools) {
        return `
            <div class="utility-pool pool-category">
                <h4>Utility Pool</h4>
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.utilityPool,
                    pools.totalAvailable.utilityPool,
                    'Utility Pool',
                    { variant: pools.remaining.utilityPool < 0 ? 'error' : pools.remaining.utilityPool === 0 ? 'warning' : 'default', showRemaining: true }
                )}
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
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.specialAttacks,
                    pools.totalAvailable.specialAttacks,
                    'Total SA Points',
                    { variant: pools.remaining.specialAttacks < 0 ? 'error' : pools.remaining.specialAttacks === 0 ? 'warning' : 'default', showRemaining: true }
                )}
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
