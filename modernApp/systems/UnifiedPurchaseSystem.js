// modernApp/systems/UnifiedPurchaseSystem.js
import { Logger } from '../utils/Logger.js';
import { StateManager } from '../core/StateManager.js';
import { PoolCalculator } from './PoolCalculator.js';
import { EffectSystem } from './EffectSystem.js';
import { ValidationSystem } from '../core/ValidationSystem.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Enhanced UnifiedPurchaseSystem with comprehensive debugging and improved error handling
 * Handles all entity purchases with proper state management and event emission
 */
export class UnifiedPurchaseSystem {
    static purchaseHistory = [];
    static maxHistorySize = 100;
    static debugMode = false;

    /**
     * Enable debug mode for detailed purchase logging
     */
    static enableDebugMode() {
        this.debugMode = true;
        Logger.info('[UnifiedPurchaseSystem] Debug mode enabled');
    }

    /**
     * Purchase an entity with comprehensive validation and state management
     */
    static async purchase(entity, entityType, context = {}) {
        const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();
        
        Logger.info(`[UnifiedPurchaseSystem] Starting purchase ${purchaseId}: ${entityType} "${entity.name}" (${entity.id})`);
        
        try {
            // Validate inputs
            const validationResult = this.validatePurchaseInputs(entity, entityType, context);
            if (!validationResult.isValid) {
                Logger.error(`[UnifiedPurchaseSystem] Purchase validation failed:`, validationResult.errors);
                return {
                    success: false,
                    error: validationResult.errors.join(', '),
                    purchaseId
                };
            }

            const { character, gameData } = context;
            
            // Get current state
            const currentCharacter = character || StateManager.getState();
            if (!currentCharacter) {
                Logger.error('[UnifiedPurchaseSystem] No character state available for purchase');
                return {
                    success: false,
                    error: 'No character state available',
                    purchaseId
                };
            }

            // Check if already purchased
            if (this.isEntityPurchased(currentCharacter, entity.id, entityType)) {
                Logger.warn(`[UnifiedPurchaseSystem] Entity already purchased: ${entity.id}`);
                return {
                    success: false,
                    error: 'Entity already purchased',
                    purchaseId
                };
            }

            // Calculate costs and validate affordability
            const costResult = this.calculateEntityCost(entity, entityType, currentCharacter);
            if (!costResult.isValid) {
                Logger.warn(`[UnifiedPurchaseSystem] Cannot afford entity:`, costResult);
                return {
                    success: false,
                    error: costResult.error || 'Cannot afford this purchase',
                    purchaseId
                };
            }

            // Create purchase record
            const purchaseRecord = {
                id: purchaseId,
                entityId: entity.id,
                category: entityType,
                entityName: entity.name,
                cost: costResult.totalCost,
                costBreakdown: costResult.breakdown,
                timestamp: Date.now(),
                context: {
                    characterTier: currentCharacter.tier,
                    characterLevel: currentCharacter.level || 1
                }
            };

            // Apply purchase to character
            const updatedCharacter = this.applyPurchaseToCharacter(
                currentCharacter, 
                entity, 
                entityType, 
                purchaseRecord
            );

            // Apply entity effects
            const effectsResult = EffectSystem.applyEntityEffects(updatedCharacter, entity, entityType);
            if (!effectsResult.success) {
                Logger.warn(`[UnifiedPurchaseSystem] Effects application had issues:`, effectsResult.warnings);
            }

            // Update state
            await StateManager.updateState(
                updatedCharacter, 
                `Purchased ${entityType}: ${entity.name}`
            );

            // Add to purchase history
            this.addToPurchaseHistory(purchaseRecord);

            // Run advisory validation
            const validationSystem = ValidationSystem.getInstance();
            if (validationSystem) {
                validationSystem.validateCharacter(updatedCharacter);
            }

            const duration = performance.now() - startTime;
            Logger.info(`[UnifiedPurchaseSystem] Purchase ${purchaseId} completed successfully in ${duration.toFixed(2)}ms`);

            // Emit success event
            EventBus.emit('PURCHASE_COMPLETED', {
                purchaseId,
                entity,
                entityType,
                character: updatedCharacter,
                success: true
            });

            return {
                success: true,
                purchaseId,
                character: updatedCharacter,
                cost: costResult.totalCost,
                duration
            };

        } catch (error) {
            const duration = performance.now() - startTime;
            Logger.error(`[UnifiedPurchaseSystem] Purchase ${purchaseId} failed after ${duration.toFixed(2)}ms:`, error);

            // Emit failure event
            EventBus.emit('PURCHASE_FAILED', {
                purchaseId,
                entity,
                entityType,
                error: error.message,
                success: false
            });

            return {
                success: false,
                error: error.message,
                purchaseId,
                duration
            };
        }
    }

    /**
     * Remove a purchased entity
     */
    static async remove(entityId, entityType, context = {}) {
        const removalId = `removal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();
        
        Logger.info(`[UnifiedPurchaseSystem] Starting removal ${removalId}: ${entityType} ${entityId}`);

        try {
            const { character } = context;
            const currentCharacter = character || StateManager.getState();
            
            if (!currentCharacter) {
                Logger.error('[UnifiedPurchaseSystem] No character state available for removal');
                return {
                    success: false,
                    error: 'No character state available',
                    removalId
                };
            }

            // Check if entity is purchased
            if (!this.isEntityPurchased(currentCharacter, entityId, entityType)) {
                Logger.warn(`[UnifiedPurchaseSystem] Entity not purchased: ${entityId}`);
                return {
                    success: false,
                    error: 'Entity not purchased',
                    removalId
                };
            }

            // Find the purchase record
            const purchaseRecord = this.findPurchaseRecord(currentCharacter, entityId, entityType);
            if (!purchaseRecord) {
                Logger.error(`[UnifiedPurchaseSystem] Purchase record not found for: ${entityId}`);
                return {
                    success: false,
                    error: 'Purchase record not found',
                    removalId
                };
            }

            // Remove purchase from character
            const updatedCharacter = this.removePurchaseFromCharacter(
                currentCharacter,
                entityId,
                entityType,
                purchaseRecord
            );

            // Remove entity effects
            const effectsResult = EffectSystem.removeEntityEffects(updatedCharacter, entityId, entityType);
            if (!effectsResult.success) {
                Logger.warn(`[UnifiedPurchaseSystem] Effects removal had issues:`, effectsResult.warnings);
            }

            // Update state
            await StateManager.updateState(
                updatedCharacter,
                `Removed ${entityType}: ${purchaseRecord.entityName || entityId}`
            );

            const duration = performance.now() - startTime;
            Logger.info(`[UnifiedPurchaseSystem] Removal ${removalId} completed successfully in ${duration.toFixed(2)}ms`);

            // Emit success event
            EventBus.emit('PURCHASE_REMOVED', {
                removalId,
                entityId,
                entityType,
                character: updatedCharacter,
                success: true
            });

            return {
                success: true,
                removalId,
                character: updatedCharacter,
                refund: purchaseRecord.cost || 0,
                duration
            };

        } catch (error) {
            const duration = performance.now() - startTime;
            Logger.error(`[UnifiedPurchaseSystem] Removal ${removalId} failed after ${duration.toFixed(2)}ms:`, error);

            // Emit failure event
            EventBus.emit('REMOVAL_FAILED', {
                removalId,
                entityId,
                entityType,
                error: error.message,
                success: false
            });

            return {
                success: false,
                error: error.message,
                removalId,
                duration
            };
        }
    }

    /**
     * Validate purchase inputs
     */
    static validatePurchaseInputs(entity, entityType, context) {
        const errors = [];

        if (!entity) {
            errors.push('Entity is required');
        } else {
            if (!entity.id) errors.push('Entity must have an id');
            if (!entity.name) errors.push('Entity must have a name');
        }

        if (!entityType || typeof entityType !== 'string') {
            errors.push('Entity type must be a string');
        }

        if (!context.character && !StateManager.getState()) {
            errors.push('Character context or state is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate the total cost of purchasing an entity
     */
    static calculateEntityCost(entity, entityType, character) {
        try {
            const breakdown = {};
            let totalCost = 0;

            // Base cost
            const baseCost = entity.cost || 0;
            breakdown.baseCost = baseCost;
            totalCost += baseCost;

            // Special cost calculations for different entity types
            switch (entityType) {
                case 'flaw':
                    // Flaws always cost 30 points
                    totalCost = 30;
                    breakdown.baseCost = 30;
                    breakdown.notes = 'Flaws have a fixed cost of 30 points';
                    break;

                case 'trait':
                    // Traits always cost 30 points
                    totalCost = 30;
                    breakdown.baseCost = 30;
                    breakdown.notes = 'Traits have a fixed cost of 30 points';
                    break;

                case 'uniqueAbility':
                    // Variable cost based on tier
                    if (entity.costPerTier && character.tier) {
                        totalCost = entity.costPerTier * character.tier;
                        breakdown.tierMultiplier = entity.costPerTier;
                        breakdown.characterTier = character.tier;
                        breakdown.notes = `Cost scales with character tier (${entity.costPerTier} × ${character.tier})`;
                    }
                    break;
            }

            // Check affordability
            const currentPools = PoolCalculator.calculatePools(character);
            const canAfford = currentPools.mainPool.available >= totalCost;

            return {
                isValid: canAfford,
                totalCost,
                breakdown,
                availablePoints: currentPools.mainPool.available,
                error: canAfford ? null : `Insufficient points: need ${totalCost}, have ${currentPools.mainPool.available}`
            };

        } catch (error) {
            Logger.error('[UnifiedPurchaseSystem] Error calculating entity cost:', error);
            return {
                isValid: false,
                totalCost: 0,
                breakdown: {},
                error: 'Failed to calculate cost'
            };
        }
    }

    /**
     * Apply purchase to character data
     */
    static applyPurchaseToCharacter(character, entity, entityType, purchaseRecord) {
        const updatedCharacter = JSON.parse(JSON.stringify(character)); // Deep copy

        // Initialize unified purchases if not exists
        if (!updatedCharacter.unifiedPurchases) {
            updatedCharacter.unifiedPurchases = [];
        }

        // Add purchase record
        updatedCharacter.unifiedPurchases.push(purchaseRecord);

        // Apply specific logic based on entity type
        switch (entityType) {
            case 'flaw':
                this.applyFlawPurchase(updatedCharacter, entity, purchaseRecord);
                break;
            case 'trait':
                this.applyTraitPurchase(updatedCharacter, entity, purchaseRecord);
                break;
            case 'boon':
                this.applyBoonPurchase(updatedCharacter, entity, purchaseRecord);
                break;
            case 'uniqueAbility':
                this.applyUniqueAbilityPurchase(updatedCharacter, entity, purchaseRecord);
                break;
            case 'actionUpgrade':
                this.applyActionUpgradePurchase(updatedCharacter, entity, purchaseRecord);
                break;
        }

        Logger.debug(`[UnifiedPurchaseSystem] Applied ${entityType} purchase to character:`, entity.name);
        return updatedCharacter;
    }

    /**
     * Apply flaw-specific purchase logic
     */
    static applyFlawPurchase(character, flaw, purchaseRecord) {
        // Flaws cost 30 points and provide tier-based stat bonuses
        if (flaw.statBonus) {
            if (!character.flawBonuses) {
                character.flawBonuses = {};
            }
            
            if (flaw.statBonus.type === 'choice') {
                // Store for later assignment
                character.flawBonuses[flaw.id] = {
                    type: 'choice',
                    options: flaw.statBonus.options,
                    value: flaw.statBonus.value === 'tier' ? character.tier : flaw.statBonus.value,
                    assigned: false
                };
            } else {
                // Direct stat bonus
                Object.entries(flaw.statBonus).forEach(([stat, bonus]) => {
                    const bonusValue = bonus === 'tier' ? character.tier : bonus;
                    character.flawBonuses[`${flaw.id}_${stat}`] = {
                        stat,
                        value: bonusValue,
                        assigned: true
                    };
                });
            }
        }
    }

    /**
     * Apply trait-specific purchase logic
     */
    static applyTraitPurchase(character, trait, purchaseRecord) {
        // Traits cost 30 points - no special logic needed beyond the purchase record
        Logger.debug(`[UnifiedPurchaseSystem] Applied trait purchase: ${trait.name}`);
    }

    /**
     * Remove purchase from character data
     */
    static removePurchaseFromCharacter(character, entityId, entityType, purchaseRecord) {
        const updatedCharacter = JSON.parse(JSON.stringify(character)); // Deep copy

        // Remove from unified purchases
        updatedCharacter.unifiedPurchases = updatedCharacter.unifiedPurchases.filter(
            purchase => !(purchase.entityId === entityId && purchase.category === entityType)
        );

        // Apply specific removal logic
        switch (entityType) {
            case 'flaw':
                this.removeFlawFromCharacter(updatedCharacter, entityId);
                break;
            // Add other entity type removals as needed
        }

        Logger.debug(`[UnifiedPurchaseSystem] Removed ${entityType} from character:`, entityId);
        return updatedCharacter;
    }

    /**
     * Remove flaw-specific data
     */
    static removeFlawFromCharacter(character, flawId) {
        if (character.flawBonuses) {
            // Remove any bonuses from this flaw
            Object.keys(character.flawBonuses).forEach(key => {
                if (key.startsWith(flawId)) {
                    delete character.flawBonuses[key];
                }
            });
        }
    }

    /**
     * Check if an entity is already purchased
     */
    static isEntityPurchased(character, entityId, entityType) {
        if (!character || !character.unifiedPurchases) {
            return false;
        }

        return character.unifiedPurchases.some(
            purchase => purchase.entityId === entityId && purchase.category === entityType
        );
    }

    /**
     * Find a purchase record
     */
    static findPurchaseRecord(character, entityId, entityType) {
        if (!character || !character.unifiedPurchases) {
            return null;
        }

        return character.unifiedPurchases.find(
            purchase => purchase.entityId === entityId && purchase.category === entityType
        );
    }

    /**
     * Add purchase to history for debugging
     */
    static addToPurchaseHistory(purchaseRecord) {
        this.purchaseHistory.push({
            ...purchaseRecord,
            historyTimestamp: Date.now()
        });

        // Limit history size
        if (this.purchaseHistory.length > this.maxHistorySize) {
            this.purchaseHistory.shift();
        }
    }

    // Additional placeholder methods for other entity types
    static applyBoonPurchase(character, boon, purchaseRecord) {
        Logger.debug(`[UnifiedPurchaseSystem] Applied boon purchase: ${boon.name}`);
    }

    static applyUniqueAbilityPurchase(character, ability, purchaseRecord) {
        Logger.debug(`[UnifiedPurchaseSystem] Applied unique ability purchase: ${ability.name}`);
    }

    static applyActionUpgradePurchase(character, upgrade, purchaseRecord) {
        Logger.debug(`[UnifiedPurchaseSystem] Applied action upgrade purchase: ${upgrade.name}`);
    }

    /**
     * Get purchase statistics for debugging
     */
    static getPurchaseStats() {
        const categoryStats = {};
        
        this.purchaseHistory.forEach(purchase => {
            const category = purchase.category;
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    count: 0,
                    totalCost: 0,
                    averageCost: 0
                };
            }
            
            categoryStats[category].count++;
            categoryStats[category].totalCost += purchase.cost || 0;
            categoryStats[category].averageCost = categoryStats[category].totalCost / categoryStats[category].count;
        });

        return {
            totalPurchases: this.purchaseHistory.length,
            categoryStats,
            recentPurchases: this.purchaseHistory.slice(-10)
        };
    }

    /**
     * Clear purchase history
     */
    static clearHistory() {
        this.purchaseHistory = [];
        Logger.info('[UnifiedPurchaseSystem] Purchase history cleared');
    }
}