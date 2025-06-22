// modernApp/systems/UnifiedPurchaseSystem.js
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { RequirementSystem } from './RequirementSystem.js';
import { NotificationSystem } from '../components/NotificationSystem.js';
import { Logger } from '../utils/Logger.js';

/**
 * Orchestrates the purchase and removal of entities, handling advisory validation and user feedback.
 * It does not contain state or business logic itself, delegating to other systems.
 */
export class UnifiedPurchaseSystem {

    /**
     * Handles the purchase of any entity.
     * @param {string} entityId - The ID of the entity to purchase.
     * @returns {Object} - The result from StateManager.dispatch.
     */
    static purchase(entityId) {
        const character = StateManager.getCharacter();
        const entity = EntityLoader.getEntity(entityId);

        if (!entity) {
            const message = `Purchase failed: Entity with ID "${entityId}" not found.`;
            Logger.error(`[PurchaseSystem] ${message}`);
            NotificationSystem.getInstance().error(message); // Corrected
            return { success: false, error: message };
        }

        // 1. Check for uniqueness if the entity is not stackable
        const arrayName = `${entity.type}s`;
        const isStackable = entity.cost?.stackable === true;
        if (character[arrayName] && !isStackable && character[arrayName].some(p => p.id === entityId)) {
             const message = `Cannot purchase "${entity.name}": This is a unique item you already own.`;
             Logger.info(`[PurchaseSystem] ${message}`);
             NotificationSystem.getInstance().info(message); // Corrected
             return { success: false, alreadyOwned: true };
        }

        // 2. Perform ADVISORY check for requirements
        const reqCheck = RequirementSystem.check(entity.requirements, character);
        if (!reqCheck.areMet) {
            const message = `Requirements not met for ${entity.name}: ${reqCheck.unmet.join(', ')}`;
            Logger.warn(`[PurchaseSystem] ${message}`);
            NotificationSystem.getInstance().warning(message, 5000); // Corrected (using helper with duration)
        }

        // 3. Dispatch the purchase action to the StateManager.
        // NO affordability check here. The system allows the purchase regardless of point cost.
        Logger.info(`[PurchaseSystem] Dispatching purchase for ${entity.name} (${entityId})`);
        const result = StateManager.dispatch('PURCHASE_ENTITY', {
            entityId: entity.id,
            entityType: entity.type
        });

        if (result.success) {
            NotificationSystem.getInstance().success(`Purchased: ${entity.name}`); // Corrected
        } else {
            NotificationSystem.getInstance().error(`Failed to purchase: ${entity.name}. ${result.error}`); // Corrected
        }

        return result;
    }

    /**
     * Handles the removal of any purchased entity.
     * @param {string} purchaseId - The unique ID of the purchase instance.
     * @param {string} entityType - The type of the entity to help locate it.
     * @returns {Object} - The result from StateManager.dispatch.
     */
    static remove(purchaseId, entityType) {
        if (!purchaseId || !entityType) {
             const message = `Removal failed: purchaseId and entityType are required.`;
             Logger.error(`[PurchaseSystem] ${message}`);
             NotificationSystem.getInstance().error(message); // Corrected
             return { success: false, error: message };
        }

        // Find the original entity name for the notification before removing it.
        const character = StateManager.getCharacter();
        const arrayName = `${entityType}s`;
        const purchaseInstance = character[arrayName]?.find(p => p.purchaseId === purchaseId);
        const entity = purchaseInstance ? EntityLoader.getEntity(purchaseInstance.id) : null;
        
        const result = StateManager.dispatch('REMOVE_ENTITY', { purchaseId, entityType });

        if (result.success && entity) {
            NotificationSystem.getInstance().success(`Removed: ${entity.name}`); // Corrected
        } else if (!result.success) {
             NotificationSystem.getInstance().error(`Failed to remove item. ${result.error}`); // Corrected
        }

        return result;
    }
}