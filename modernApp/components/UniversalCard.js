// modernApp/components/UniversalCard.js
// No changes were strictly needed here for the described issues,
// as the data-action attributes it generates ('purchase_entity', 'select_archetype')
// are correct. The fix is in how the consuming tabs interpret these.
// For completeness and to ensure it's aligned with the consuming tabs,
// here is the original UniversalCard.js content provided in the codebase.txt
// as it appears to be correctly generating the necessary data attributes.

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
     * @param {boolean} context.isPurchased - Whether the character has this entity or it's the selected one in a category.
     * @param {boolean} [context.isAffordable=true] - Whether the character can afford this entity (defaults to true for non-purchasables).
     * @param {boolean} [context.areRequirementsMet=true] - Whether the character meets all prerequisites (defaults to true).
     * @param {string[]} [context.unmetRequirements=[]] - A list of unmet requirement descriptions.
     * @param {string} context.entityType - The type of the entity (e.g., 'flaw', 'trait', 'archetype').
     * @param {string} [context.interactionType='purchase'] - The type of interaction ('purchase' or 'select').
     * @param {string} [context.categoryKey=''] - The category key, useful for select interactions (e.g., 'movement' for movement archetypes).
     * @returns {string} The complete HTML for the card.
     */
    static render(entity, context) {
        if (!entity || !context) {
            Logger.error('[UniversalCard] Render called with missing entity or context.');
            return '<div class="purchase-card error"><p>Error: Card data missing.</p></div>';
        }

        const {
            isPurchased, // True if selected (for archetypes) or owned (for purchasables)
            isAffordable = true, // Default to true, relevant for 'purchase' type
            areRequirementsMet = true, // Default to true
            unmetRequirements = [],
            entityType,
            interactionType = 'purchase', // Default to 'purchase'
            categoryKey = '' // Used for select_archetype data attribute
        } = context;

        const cardClasses = [
            'purchase-card', // Base class
            interactionType === 'select' ? 'selectable-card' : 'purchasable-card',
            !isAffordable && interactionType === 'purchase' && !isPurchased ? 'unaffordable' : '',
            !areRequirementsMet ? 'requirements-unmet' : '',
            isPurchased ? 'purchased' : '', // 'purchased' class also means 'selected' for archetypes
        ].filter(Boolean).join(' ');

        // Since nothing is truly permanent, the button is never disabled for interaction.
        const isButtonDisabled = false;

        let buttonText = '';
        let buttonAction = '';

        if (interactionType === 'select') {
            if (isPurchased) { 
                buttonText = 'Selected'; 
                buttonAction = ''; // No action if already selected, or perhaps 'deselect_archetype' if desired
            } else {
                buttonText = 'Select';
                buttonAction = 'select_archetype';
            }
        } else { // Default 'purchase' interaction
            if (isPurchased) {
                buttonText = 'Remove';
                buttonAction = 'remove_entity';
            } else {
                buttonText = 'Purchase';
                buttonAction = 'purchase_entity';
            }
        }
        
        let actionButtonHtml = '';
        if (interactionType === 'select' && isPurchased) {
            actionButtonHtml = `<button class="btn btn-primary purchase-btn selected-indicator" disabled>${buttonText}</button>`;
        } else if (buttonAction) { 
             actionButtonHtml = `
                <button class="btn btn-primary purchase-btn" 
                        data-action="${buttonAction}"
                        data-entity-id="${entity.id}"
                        data-entity-type="${entityType}"
                        ${categoryKey ? `data-category-key="${categoryKey}"` : ''}
                        ${isButtonDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            `;
        }


        return `
            <div class="${cardClasses}" data-entity-id="${entity.id}" data-entity-type="${entityType}" ${categoryKey ? `data-category-key="${categoryKey}"` : ''}>
                ${this._renderHeader(entity, interactionType)}
                ${this._renderDescription(entity.description)}
                ${this._renderEffects(entity.effects)}
                ${this._renderRequirements(unmetRequirements)}
                ${this._renderStatus(isPurchased, isAffordable, interactionType)}
                ${actionButtonHtml}
            </div>
        `;
    }

    static _renderHeader(entity, interactionType) {
        const costDisplay = (interactionType === 'select' && entity.cost?.display === "Choice") 
            ? '<span>Choice</span>' 
            : `<span class="cost">${Formatters.formatCost(entity.cost)}</span>`;

        return `
            <div class="card-header">
                <h4>${entity.name}</h4>
                ${costDisplay}
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

    static _renderStatus(isPurchased, isAffordable, interactionType) {
        if (isPurchased && interactionType === 'select') {
            return '<p class="purchased-indicator">✓ Selected</p>';
        }
        if (isPurchased && interactionType === 'purchase') {
            return '<p class="purchased-indicator">✓ Purchased</p>';
        }
        if (!isAffordable && interactionType === 'purchase') {
            return '<p class="requirement-warning">Cannot afford</p>';
        }
        return '';
    }
}