// PointPoolDisplay.js - Real-time point pool display
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
            return;
        }
        
        const pools = PointPoolCalculator.calculateAllPools(character);
        
        // Only update if pools changed
        if (JSON.stringify(pools) === JSON.stringify(this.lastPools)) {
            return;
        }
        
        this.lastPools = pools;
        container.innerHTML = this.renderPointPools(pools);
        
        console.log('🔄 Point pools updated');
    }
    
    renderPointPools(pools) {
        return `
            <div class="point-pools-section">
                <h3>Point Pools</h3>
                
                ${this.renderAttributePools(pools)}
                ${this.renderMainPool(pools)}
                ${this.renderUtilityPool(pools)}
                ${this.renderSpecialAttackPools(pools)}
                
                <div class="pool-summary">
                    ${this.renderPoolSummary(pools)}
                </div>
            </div>
        `;
    }
    
    renderAttributePools(pools) {
        const combatRemaining = pools.remaining.combatAttributes;
        const utilityRemaining = pools.remaining.utilityAttributes;
        
        return `
            <div class="attribute-pools">
                <h4>Attributes</h4>
                
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.combatAttributes,
                    pools.totalAvailable.combatAttributes,
                    'Combat',
                    { 
                        variant: combatRemaining < 0 ? 'error' : combatRemaining === 0 ? 'warning' : 'default',
                        showRemaining: true
                    }
                )}
                
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.utilityAttributes,
                    pools.totalAvailable.utilityAttributes,
                    'Utility',
                    { 
                        variant: utilityRemaining < 0 ? 'error' : utilityRemaining === 0 ? 'warning' : 'default',
                        showRemaining: true
                    }
                )}
            </div>
        `;
    }
    
    renderMainPool(pools) {
        const remaining = pools.remaining.mainPool;
        
        return `
            <div class="main-pool">
                <h4>Main Pool</h4>
                
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.mainPool,
                    pools.totalAvailable.mainPool,
                    'Main Pool',
                    { 
                        variant: remaining < 0 ? 'error' : remaining === 0 ? 'warning' : 'default',
                        showRemaining: true,
                        showPercentage: true
                    }
                )}
                
                ${pools.flawBonuses > 0 ? `
                    <div class="pool-bonus">
                        <small>+${pools.flawBonuses} from flaws</small>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderUtilityPool(pools) {
        const remaining = pools.remaining.utilityPool;
        
        return `
            <div class="utility-pool">
                <h4>Utility Pool</h4>
                
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.utilityPool,
                    pools.totalAvailable.utilityPool,
                    'Utility Pool',
                    { 
                        variant: remaining < 0 ? 'error' : remaining === 0 ? 'warning' : 'default',
                        showRemaining: true
                    }
                )}
            </div>
        `;
    }
    
    renderSpecialAttackPools(pools) {
        if (!pools.specialAttackPools || pools.specialAttackPools.totalAvailable === 0) {
            return `
                <div class="special-attack-pools">
                    <h4>Special Attacks</h4>
                    <div class="empty-state">No special attacks created</div>
                </div>
            `;
        }
        
        const remaining = pools.remaining.specialAttacks;
        
        return `
            <div class="special-attack-pools">
                <h4>Special Attacks</h4>
                
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.specialAttacks,
                    pools.totalAvailable.specialAttacks,
                    'Total Special Attacks',
                    { 
                        variant: remaining < 0 ? 'error' : remaining === 0 ? 'warning' : 'default',
                        showRemaining: true
                    }
                )}
                
                <div class="individual-attacks">
                    ${pools.specialAttackPools.attackPools.map((attack, index) => `
                        <div class="attack-pool">
                            <div class="attack-name">${attack.attackName || `Attack ${index + 1}`}</div>
                            ${RenderUtils.renderPointDisplay(
                                attack.spent,
                                attack.available,
                                attack.method,
                                { 
                                    variant: attack.remaining < 0 ? 'error' : 'compact',
                                    showRemaining: false
                                }
                            )}
                        </div>
                    `).join('')}
                </div>
                
                <div class="pool-method">
                    <small><strong>Method:</strong> ${pools.specialAttackPools.method}</small>
                </div>
            </div>
        `;
    }
    
    renderPoolSummary(pools) {
        const totalAvailable = Object.values(pools.totalAvailable).reduce((sum, val) => sum + val, 0);
        const totalSpent = Object.values(pools.totalSpent).reduce((sum, val) => sum + val, 0);
        const totalRemaining = totalAvailable - totalSpent;
        const efficiency = totalAvailable > 0 ? (totalSpent / totalAvailable * 100).toFixed(1) : 0;
        
        return `
            <div class="pool-summary-content">
                <h5>Overall</h5>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="stat-value">${totalSpent}</span>
                        <span class="stat-label">Total Spent</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${totalAvailable}</span>
                        <span class="stat-label">Total Available</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value ${totalRemaining < 0 ? 'error' : ''}">${totalRemaining}</span>
                        <span class="stat-label">Remaining</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${efficiency}%</span>
                        <span class="stat-label">Efficiency</span>
                    </div>
                </div>
                
                ${this.renderPoolIssues(pools)}
            </div>
        `;
    }
    
    renderPoolIssues(pools) {
        const issues = [];
        
        Object.entries(pools.remaining).forEach(([pool, remaining]) => {
            if (remaining < 0) {
                issues.push(`${pool}: ${Math.abs(remaining)} over budget`);
            }
        });
        
        if (issues.length === 0) return '';
        
        return `
            <div class="pool-issues">
                <h6>Issues</h6>
                <ul>
                    ${issues.map(issue => `<li class="issue-item">${issue}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    renderEmptyState() {
        return `
            <div class="point-pools-section">
                <h3>Point Pools</h3>
                <div class="empty-state">
                    Create or select a character to see point pools
                </div>
            </div>
        `;
    }
}