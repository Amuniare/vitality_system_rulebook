// components/PurchaseCard.js
export class PurchaseCard {
    constructor(entity, entityType, stateManager) {
        this.entity = entity;
        this.entityType = entityType;
        this.stateManager = stateManager;
    }

    render() {
        const state = this.stateManager.getState();
        const poolType = this.getPoolType();
        const availablePoints = this.stateManager.getAvailablePoints(poolType);
        const isPurchased = this.stateManager.hasPurchased(this.entity.id, this.entityType);
        const canAfford = availablePoints >= this.entity.cost;
        const isDisabled = (!canAfford && !isPurchased) || (isPurchased && this.entityType === 'flaw');

        return `
            <div class="purchase-card ${isDisabled ? 'disabled' : ''} ${isPurchased ? 'purchased' : ''}" 
                 data-entity-id="${this.entity.id}" 
                 data-entity-type="${this.entityType}">
                <div class="card-header">
                    <h4>${this.entity.name}</h4>
                    <span class="cost">${this.entity.cost}p</span>
                </div>
                <p class="card-description">${this.entity.description || ''}</p>
                ${this.renderEffects()}
                ${this.renderRequirements()}
                ${!canAfford && !isPurchased ? '<p class="requirement-warning">Not enough points</p>' : ''}
                ${isPurchased ? '<p class="purchased-indicator">✓ Purchased</p>' : ''}
                <button class="btn btn-primary purchase-btn" 
                        data-action="${isPurchased ? 'remove' : 'purchase'}"
                        data-entity-id="${this.entity.id}"
                        data-entity-type="${this.entityType}"
                        ${isDisabled ? 'disabled' : ''}>
                    ${isPurchased ? 'Remove' : 'Purchase'}
                </button>
            </div>
        `;
    }




    renderRequirements() {
        if (!this.entity.requirements || this.entity.requirements.length === 0) {
            return '';
        }

        const reqList = this.entity.requirements.map(req => `<li>${req}</li>`).join('');
        return `
            <div class="card-requirements">
                <strong>Requirements:</strong>
                <ul>${reqList}</ul>
            </div>
        `;
    }

    // Update the getPoolType method in PurchaseCard

    getPoolType() {
        const poolMapping = {
            'flaw': 'main',
            'trait': 'main',
            'boon': 'main',
            'action': 'main',
            'uniqueAbility': 'main',
            'specialAttack': 'main',
            'archetypeUpgrade': 'main',
            'trait2': 'secondary',
            'companion': 'companion'
        };
        return poolMapping[this.entityType] || 'main';
    }

    // Update renderEffects to handle more complex effect types
    renderEffects() {
        if (!this.entity.effects || this.entity.effects.length === 0) {
            return '';
        }

        const effectsList = this.entity.effects.map(effect => {
            if (typeof effect === 'string') {
                return `<li>${effect}</li>`;
            } else if (effect.description) {
                return `<li>${effect.description}${effect.value ? ` (${effect.value})` : ''}</li>`;
            } else if (effect.stat && effect.modifier) {
                return `<li>${effect.stat}: ${effect.modifier > 0 ? '+' : ''}${effect.modifier}</li>`;
            }
            return '';
        }).join('');

        return effectsList ? `
            <div class="card-effects">
                <strong>Effects:</strong>
                <ul>${effectsList}</ul>
            </div>
        ` : '';
    }





}