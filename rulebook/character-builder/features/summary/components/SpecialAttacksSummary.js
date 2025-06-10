export class SpecialAttacksSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(character) {
        if (!character || !character.specialAttacks) {
            return `
                <div class="card">
                    <h3>Special Attacks</h3>
                    <div class="card-content">
                        <p>No special attack data available</p>
                    </div>
                </div>
            `;
        }

        const attacks = character.specialAttacks;

        if (!Array.isArray(attacks) || attacks.length === 0) {
            return `
                <div class="card">
                    <h3>Special Attacks</h3>
                    <div class="card-content">
                        <p>No special attacks created yet</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3>Special Attacks</h3>
                <div class="card-content">
                    ${this.renderAttacks(attacks)}
                </div>
            </div>
        `;
    }

    renderAttacks(attacks) {
        return attacks.map((attack, index) => {
            const attackName = attack.name || `Unnamed Attack ${index + 1}`;
            const cost = this.calculateAttackCost(attack);
            const limits = this.formatLimits(attack.limits);
            const upgrades = this.formatUpgrades(attack.upgrades);

            return `
                ${index > 0 ? '<hr>' : ''}
                <h4>${attackName}</h4>
                <div class="stat-item">
                    <span>Cost:</span>
                    <strong>${cost}</strong>
                </div>
                <div class="stat-item">
                    <span>Limits:</span>
                    <strong>${limits}</strong>
                </div>
                <div class="stat-item">
                    <span>Upgrades:</span>
                    <strong>${upgrades}</strong>
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
        return limits.map(limit => limit.name || limit).join(', ');
    }

    formatUpgrades(upgrades) {
        if (!upgrades || !Array.isArray(upgrades) || upgrades.length === 0) {
            return 'None';
        }
        return upgrades.map(upgrade => upgrade.name || upgrade).join(', ');
    }
}