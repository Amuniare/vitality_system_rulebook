// PointPoolDisplay.js - Sidebar point pool tracking
export class PointPoolDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    update() {
        const character = this.builder.currentCharacter;
        if (!character) {
            this.showEmpty();
            return;
        }

        const pools = this.builder.calculatePointPools();
        this.render(pools);
    }

    render(pools) {
        const container = document.getElementById('point-pools');
        if (!container) return;

        container.innerHTML = `
            <h3>Point Pools</h3>
            <div class="pool-display">
                ${this.renderPool('Combat Attributes', pools.totalSpent.combatAttributes, pools.totalAvailable.combatAttributes)}
                ${this.renderPool('Utility Attributes', pools.totalSpent.utilityAttributes, pools.totalAvailable.utilityAttributes)}
                ${this.renderPool('Main Pool', pools.totalSpent.mainPool, pools.totalAvailable.mainPool)}
                ${this.renderPool('Utility Pool', pools.totalSpent.utilityPool, pools.totalAvailable.utilityPool)}
                ${this.renderPool('Special Attacks', pools.totalSpent.specialAttacks, pools.totalAvailable.specialAttacks)}
                ${this.renderLimitsTotal(pools)}
            </div>
        `;
    }

    renderPool(name, spent, available) {
        const remaining = available - spent;
        const status = remaining < 0 ? 'over-budget' : remaining === 0 ? 'fully-used' : '';
        
        return `
            <div class="pool-item ${status}">
                <span class="pool-name">${name}:</span>
                <span class="pool-values">${spent}/${available}</span>
                ${remaining < 0 ? '<span class="over-indicator">!</span>' : ''}
            </div>
        `;
    }

    renderLimitsTotal(pools) {
        const character = this.builder.currentCharacter;
        let totalLimits = 0;
        
        if (character && character.specialAttacks) {
            totalLimits = character.specialAttacks.reduce((total, attack) => 
                total + (attack.limitPointsTotal || 0), 0);
        }

        return `
            <div class="pool-item limits-total">
                <span class="pool-name">Total Limits:</span>
                <span class="pool-values">${totalLimits}p</span>
            </div>
        `;
    }

    showEmpty() {
        const container = document.getElementById('point-pools');
        if (!container) return;

        container.innerHTML = `
            <h3>Point Pools</h3>
            <div class="pool-display">
                <p class="empty-state">Select a character to view point pools</p>
            </div>
        `;
    }
}