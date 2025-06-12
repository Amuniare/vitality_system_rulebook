export class PointPoolsSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(pools) {
        if (!pools) {
            return `
                <div class="card">
                    <h3>Point Pools</h3>
                    <div class="card-content">
                        <p>No pool data available</p>
                    </div>
                </div>
            `;
        }

        // Calculate overall budget status
        const isOverBudget = this.checkOverBudget(pools);
        const budgetStatusClass = isOverBudget ? 'budget-over' : 'budget-ok';
        const budgetStatusText = isOverBudget ? 'Over Budget' : 'Within Budget';

        return `
            <div class="card">
                <h3>Point Pools</h3>
                <div class="card-content">
                    <div class="budget-status ${budgetStatusClass}">
                        ${budgetStatusText}
                    </div>
                    ${this.renderPoolItems(pools)}
                </div>
            </div>
        `;
    }

    checkOverBudget(pools) {
        // Check if any pool has negative remaining points
        if (!pools.remaining) return false;
        
        return Object.values(pools.remaining).some(remaining => remaining < 0);
    }

    renderPoolItems(pools) {
        if (!pools.totalAvailable || !pools.totalSpent || !pools.remaining) {
            return '<p>No pool information available</p>';
        }

        let items = '';
        const poolKeys = ['combatAttributes', 'utilityAttributes', 'mainPool', 'utilityPool', 'specialAttacks'];
        
        poolKeys.forEach(poolKey => {
            const available = pools.totalAvailable[poolKey];
            const spent = pools.totalSpent[poolKey];
            const remaining = pools.remaining[poolKey];
            
            if (available !== undefined) {
                const isOverBudget = remaining < 0;
                const itemClass = isOverBudget ? 'summary-item error-text' : 'summary-item';
                const displayName = this.getPoolDisplayName(poolKey);
                
                items += `
                    <div class="${itemClass}">
                        <span class="summary-label">${displayName}</span>
                        <span class="summary-value">${spent || 0} / ${available || 0} (${remaining || 0})</span>
                    </div>
                `;
            }
        });

        return items || '<p>No pool information available</p>';
    }

    getPoolDisplayName(poolKey) {
        const displayNames = {
            combatAttributes: 'Combat Attributes',
            utilityAttributes: 'Utility Attributes', 
            mainPool: 'Main Pool',
            utilityPool: 'Utility Pool',
            specialAttacks: 'Special Attacks'
        };
        return displayNames[poolKey] || poolKey;
    }
}