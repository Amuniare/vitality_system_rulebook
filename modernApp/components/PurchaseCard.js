// modernApp/components/PurchaseCard.js
import { Logger } from '../utils/Logger.js';
import { StateManager } from '../core/StateManager.js';
import { RequirementSystem } from '../systems/RequirementSystem.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { UniversalCard } from './UniversalCard.js';

/**
 * A "smart" component wrapper that orchestrates data gathering for a purchasable entity
 * and then uses the "dumb" UniversalCard component for rendering.
 */
export class PurchaseCard {
    /**
     * @param {Object} entity - The entity object from unified-game-data.json.
     * @param {string} entityType - The type of the entity (e.g., 'flaw', 'trait').
     */
    constructor(entity, entityType) {
        if (!entity || !entityType) {
            throw new Error('PurchaseCard requires an entity and entityType.');
        }
        this.entity = entity;
        this.entityType = entityType;
        Logger.debug(`[PurchaseCard] Created for entity: ${entity.name} (${entity.id})`);
    }

    /**
     * Gathers all necessary data from core systems and renders the card.
     * @returns {string} The complete HTML for the card.
     */
    render() {
        const character = StateManager.getCharacter();

        // 1. Check requirements
        const reqCheck = RequirementSystem.check(this.entity.requirements, character);

        // 2. Check affordability (Note: this is a placeholder for where the system call would go)
        // For now, we'll simulate the call. In a full implementation, PoolCalculator would have this method.
        const pools = PoolCalculator.calculatePools(character);
        const poolName = this.entity.cost?.pool || 'main';
        const pool = pools[poolName + 'Remaining'] ?? -Infinity;
        const cost = this.entity.cost?.value || 0;
        const isAffordable = pool >= cost;
        
        // 3. Check if already purchased
        const arrayName = `${this.entityType}s`;
        const isPurchased = character[arrayName]?.some(p => p.id === this.entity.id) || false;

        // 4. Assemble the context object for the "dumb" rendering component
        const context = {
            isPurchased,
            isAffordable,
            areRequirementsMet: reqCheck.areMet,
            unmetRequirements: reqCheck.unmet,
            entityType: this.entityType
        };

        // 5. Delegate rendering to the universal component
        return UniversalCard.render(this.entity, context);
    }
}