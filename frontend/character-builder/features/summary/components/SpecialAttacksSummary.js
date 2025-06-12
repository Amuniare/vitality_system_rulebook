export class SpecialAttacksSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(specialAttacks) {
        if (!specialAttacks || !Array.isArray(specialAttacks) || specialAttacks.length === 0) {
            return `
                <div class="card special-attacks-tall-card">
                    <h3>Special Attacks</h3>
                    <div class="card-content">
                        <p>No special attacks created yet</p>
                        <p class="help-text">Special attacks will appear here once created in the Special Attacks tab.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card special-attacks-tall-card">
                <h3>Special Attacks</h3>
                <div class="card-content">
                    ${this.renderAttacks(specialAttacks)}
                </div>
            </div>
        `;
    }

    renderAttacks(attacks) {
        return attacks.map((attack, index) => {
            const attackName = attack.name || `Unnamed Attack ${index + 1}`;
            const subtitle = attack.subtitle ? ` - ${attack.subtitle}` : '';
            const cost = this.calculateAttackCost(attack);
            const limits = this.formatLimits(attack.limits);
            const upgrades = this.formatUpgrades(attack.upgrades);
            const description = attack.description || '';

            return `
                ${index > 0 ? '<hr class="attack-separator">' : ''}
                <div class="attack-section">
                    <h4 class="attack-name">${attackName}${subtitle}</h4>
                    ${description ? `<p class="attack-description">${description}</p>` : ''}
                    
                    <div class="summary-item">
                        <span class="summary-label">Cost</span>
                        <span class="summary-value">${cost} points</span>
                    </div>
                    
                    <div class="summary-item">
                        <span class="summary-label">Limits</span>
                        <span class="summary-value">${limits}</span>
                    </div>
                    
                    <div class="summary-item">
                        <span class="summary-label">Upgrades</span>
                        <span class="summary-value">${upgrades}</span>
                    </div>
                    
                    ${this.renderAttackTypes(attack)}
                    ${this.renderEffectTypes(attack)}
                </div>
            `;
        }).join('');
    }

    calculateAttackCost(attack) {
        // This component should not calculate costs - it should receive pre-calculated data
        // For now, return a placeholder or use attack.totalCost if available
        if (attack.totalCost !== undefined) {
            return attack.totalCost;
        }
        
        if (attack.upgradePointsSpent !== undefined) {
            return attack.upgradePointsSpent;
        }
        
        // Fallback: basic calculation if cost is not pre-calculated
        let cost = 0;
        if (attack.upgrades && Array.isArray(attack.upgrades)) {
            cost = attack.upgrades.length; // Simple approximation
        }
        return cost;
    }

    formatLimits(limits) {
        if (!limits || !Array.isArray(limits) || limits.length === 0) {
            return 'None';
        }
        return limits.map(limit => {
            if (typeof limit === 'object' && limit.limitId) {
                return limit.limitId; // Use the ID for now, could be enhanced with names
            }
            return limit.name || limit;
        }).join(', ');
    }

    formatUpgrades(upgrades) {
        if (!upgrades || !Array.isArray(upgrades) || upgrades.length === 0) {
            return 'None';
        }
        return upgrades.map(upgrade => {
            if (typeof upgrade === 'object' && upgrade.upgradeId) {
                return upgrade.upgradeId; // Use the ID for now, could be enhanced with names
            }
            return upgrade.name || upgrade;
        }).join(', ');
    }
    
    renderAttackTypes(attack) {
        if (!attack.attackTypes || attack.attackTypes.length === 0) {
            return '';
        }
        
        return `
            <div class="summary-item">
                <span class="summary-label">Attack Types</span>
                <span class="summary-value">${attack.attackTypes.join(', ')}</span>
            </div>
        `;
    }
    
    renderEffectTypes(attack) {
        if (!attack.effectTypes || attack.effectTypes.length === 0) {
            return '';
        }
        
        return `
            <div class="summary-item">
                <span class="summary-label">Effect Types</span>
                <span class="summary-value">${attack.effectTypes.join(', ')}</span>
            </div>
        `;
    }
}