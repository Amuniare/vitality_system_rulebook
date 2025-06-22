// file: modernApp/systems/UnifiedPurchaseSystem.js
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { RequirementSystem } from './RequirementSystem.js';
import { NotificationSystem } from '../components/NotificationSystem.js';

export class UnifiedPurchaseSystem {

    /**
     * Handles the purchase of any entity, orchestrating validation and state updates.
     * @param {string} entityId - The ID of the entity to purchase.
     * @returns {Object} - The result from StateManager.dispatch.
     */
    static purchase(entityId) {
        const character = StateManager.getCharacter();
        const entity = EntityLoader.getEntity(entityId);

        if (!entity) {
            const message = `Purchase failed: Entity with ID "${entityId}" not found.`;
            console.error(message);
            NotificationSystem.show(message, 'error');
            return { success: false, error: message };
        }

        // 1. Check for uniqueness if the entity is not stackable
        const arrayName = this.getArrayForType(entity.type);
        const isStackable = entity.cost?.stackable === true;
        if (arrayName && !isStackable && character[arrayName]?.some(p => p.id === entityId)) {
             const message = `Cannot purchase "${entity.name}": Already purchased.`;
             console.warn(message);
             NotificationSystem.show(message, 'info');
             return { success: false, error: message, alreadyOwned: true };
        }

        // 2. Check Requirements (advisory)
        const reqCheck = RequirementSystem.check(entity.requirements, character);
        if (!reqCheck.areMet) {
            const message = `Requirements not met for ${entity.name}: ${reqCheck.unmet.join(', ')}`;
            console.warn(message);
            NotificationSystem.show(message, 'warning');
            // Per our rules, we don't block the purchase, but the warning is important.
        }

        // 3. Dispatch to StateManager for the actual purchase
        console.log(`[PurchaseSystem] Attempting to purchase ${entity.name} (${entityId})`);
        const result = StateManager.dispatch('PURCHASE_ENTITY', {
            entityId: entity.id,
            entityType: entity.type,
            cost: entity.cost
        });

        if (result.success) {
            NotificationSystem.show(`Purchased: ${entity.name}`, 'success');
        } else {
            NotificationSystem.show(`Failed to purchase: ${entity.name}. ${result.error}`, 'error');
        }

        return result;
    }

    /**
     * Handles the removal of any purchased entity.
     * @param {string} purchaseId - The unique ID of the purchase instance.
     * @param {string} entityType - The type of the entity to help locate it in the character object.
     * @returns {Object} - The result from StateManager.dispatch.
     */
    static remove(purchaseId, entityType) {
        if (!purchaseId || !entityType) {
             const message = `Removal failed: purchaseId and entityType are required.`;
             console.error(message);
             NotificationSystem.show(message, 'error');
             return { success: false, error: message };
        }
        
        // Find the original entity to show its name in the notification
        const arrayNameForLookup = this.getArrayForType(entityType);
        const purchaseInstance = StateManager.getCharacter()[arrayNameForLookup]?.find(p => p.purchaseId === purchaseId);
        const entity = purchaseInstance ? EntityLoader.getEntity(purchaseInstance.id) : null;

        const result = StateManager.dispatch('REMOVE_ENTITY', { purchaseId, entityType });

        if (result.success && entity) {
            NotificationSystem.show(`Removed: ${entity.name}`, 'success');
        } else if (!result.success) {
             NotificationSystem.show(`Failed to remove item. ${result.error}`, 'error');
        }

        return result;
    }

    /**
     * Helper to get the correct character array name from an entity type.
     * Mirrors the logic in StateManager.
     */
    static getArrayForType(entityType) {
        const typeMap = {
            'trait': 'traits',
            'flaw': 'flaws',
            'boon': 'boons',
            'action': 'actions',
            'feature': 'features',
            'sense': 'senses'
        };
        return typeMap[entityType] || null;
    }
}