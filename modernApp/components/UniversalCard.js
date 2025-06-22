// modernApp/components/UniversalCard.js
import { Logger } from '../utils/Logger.js';
import { Formatters } from '../utils/Formatters.js';

/**
 * A "dumb" static component for rendering any game entity as a card.
 * It contains no business logic and relies on a pre-computed `context` object for its state.
 */
export class UniversalCard {
    /**
     * Renders the card's HTML based on entity data and pre-calculated context.
     * @param {Object} entity - The raw entity data from unified-game-data.json.
     * @param {Object} context - A pre-computed context object.
     * @param {boolean} context.isPurchased - Whether the character has this entity.
     * @param {boolean} context.isAffordable - Whether the character can afford this entity.
     * @param {boolean} context.areRequirementsMet - Whether the character meets all prerequisites.
     * @param {string[]} context.unmetRequirements - A list of unmet requirement descriptions.
     * @param {string} context.entityType - The type of the entity (e.g., 'flaw', 'trait').
     * @returns {string} The complete HTML for the card.
     */
    static render(entity, context) {
        if (!entity || !context) {
            Logger.error('[UniversalCard] Render called with missing entity or context.');
            return '<div class="purchase-card error"><p>Error: Card data missing.</p></div>';
        }

        const {
            isPurchased,
            isAffordable,
            areRequirementsMet,
            unmetRequirements,
            entityType
        } = context;

        const cardClasses = [
            'purchase-card',
            !isAffordable && !isPurchased ? 'unaffordable' : '',
            !areRequirementsMet ? 'requirements-unmet' : '',
            isPurchased ? 'purchased' : '',
        ].filter(Boolean).join(' ');

        // The button is only truly disabled if it's a non-removable, purchased item (like a Flaw).
        // Otherwise, it's always clickable per "Advisory Validation" principle.
        const isButtonDisabled = isPurchased && entityType === 'flaw';

        return `
            <div class="${cardClasses}" data-entity-id="${entity.id}" data-entity-type="${entityType}">
                ${this._renderHeader(entity)}
                ${this._renderDescription(entity.description)}
                ${this._renderEffects(entity.effects)}
                ${this._renderRequirements(unmetRequirements)}
                ${this._renderStatus(isPurchased, isAffordable)}
                <button class="btn btn-primary purchase-btn" 
                        data-action="${isPurchased ? 'remove' : 'purchase'}"
                        data-entity-id="${entity.id}"
                        data-entity-type="${entityType}"
                        ${isButtonDisabled ? 'disabled' : ''}>
                    ${isPurchased ? 'Remove' : 'Purchase'}
                </button>
            </div>
        `;
    }

    static _renderHeader(entity) {
        return `
            <div class="card-header">
                <h4>${entity.name}</h4>
                <span class="cost">${Formatters.formatCost(entity.cost)}</span>
            </div>
        `;
    }

    static _renderDescription(description) {
        if (!description) return '';
        return `<p class="card-description">${description}</p>`;
    }

    static _renderEffects(effects) {
        if (!effects || effects.length === 0) return '';
        return `
            <div class="card-effects">
                <strong>Effects:</strong>
                <ul>
                    ${effects.map(effect => `<li>${effect.display || effect.type}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    static _renderRequirements(unmetRequirements) {
        if (!unmetRequirements || unmetRequirements.length === 0) return '';
        return `
            <div class="card-requirements">
                <strong>Requirements not met:</strong>
                <ul>
                    ${unmetRequirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    static _renderStatus(isPurchased, isAffordable) {
        if (isPurchased) {
            return '<p class="purchased-indicator">✓ Purchased</p>';
        }
        if (!isAffordable) {
            return '<p class="requirement-warning">Cannot afford</p>';
        }
        return '';
    }
}