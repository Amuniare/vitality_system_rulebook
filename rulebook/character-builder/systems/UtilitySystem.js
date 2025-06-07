// rulebook/character-builder/systems/UtilitySystem.js
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js';

export class UtilitySystem {
    // Get expertise categories and options
    static getExpertiseCategories() {
        const expertiseData = gameDataManager.getExpertiseCategories() || {};
        
        // Transform new JSON structure to expected format
        if (expertiseData.Expertises && expertiseData.Expertises.types) {
            const transformed = {};
            const types = expertiseData.Expertises.types;
            
            // Merge activity-based and situational categories by attribute
            ['Mobility', 'Power', 'Endurance', 'Focus', 'Awareness', 'Communication', 'Intelligence'].forEach(attr => {
                transformed[attr] = {
                    activities: types.activityBased?.categories?.[attr] || [],
                    situational: types.situational?.categories?.[attr] || []
                };
            });
            
            return transformed;
        }
        
        return expertiseData;
    }

    // Get expertise cost information
    static getExpertiseCosts() {
        const expertiseData = gameDataManager.getExpertiseCategories() || {};
        return expertiseData.Expertises?.mechanics?.costs || {
            activityBased: { basic: { cost: 2, effect: 'Add your Tier to relevant checks' }, mastered: { cost: 6, effect: 'Add 2 × your Tier to relevant checks' } },
            situational: { basic: { cost: 1, effect: 'Add your Tier to relevant checks when context matches' }, mastered: { cost: 3, effect: 'Add 2 × your Tier to relevant checks when context matches' } }
        };
    }
    
    // Get available features by cost tier
    static getAvailableFeatures() {
        return gameDataManager.getAvailableFeatures() || {};
    }
    
    // Get available senses
    static getAvailableSenses() {
        return gameDataManager.getAvailableSenses() || {};
    }
    
    // Get movement features
    static getMovementFeatures() {
        return gameDataManager.getMovementFeatures() || {};
    }
    
    // Get descriptors
    static getDescriptors() {
        return gameDataManager.getDescriptors() || {};
    }

    static getExpertiseCost(type, level) {
        const costs = this.getExpertiseCosts();
        const typeKey = type === 'activity' ? 'activityBased' : 'situational';
        return costs[typeKey]?.[level]?.cost || 0;
    }
    
    // Calculate utility pool points
    static calculateUtilityPool(character) {
        const tier = character.tier;
        const archetype = character.archetypes.utility;
        
        let basePool;
        switch(archetype) {
            case 'specialized':
            case 'jackOfAllTrades':
                basePool = Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_SPECIALIZED_BASE));
                break;
            case 'practical':
            default:
                basePool = Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_PRACTICAL_BASE));
                break;
        }
        
        let boonBonus = 0;
        const simpleBoons = gameDataManager.getSimpleBoons() || [];
        const utilitarianBoon = simpleBoons.find(b => b.id === 'utilitarian');
        if (utilitarianBoon && character.mainPoolPurchases.boons.some(pBoon => pBoon.boonId === 'utilitarian')) {
            boonBonus += (utilitarianBoon.bonus?.utilityPoints || 0);
        }
        
        return basePool + boonBonus;
    }
    
    // Calculate points spent on utility
    static calculateUtilityPointsSpent(character) {
        let spent = 0;
        const expertiseData = gameDataManager.getExpertiseCategories();

        // Expertise costs
        Object.entries(character.utilityPurchases.expertise).forEach(([attrKey, category]) => {
            const basicExpertise = Array.isArray(category.basic) ? category.basic : [];
            const masteredExpertise = Array.isArray(category.mastered) ? category.mastered : [];

            basicExpertise.forEach(expId => {
                const expDef = this.findExpertiseDefinition(expertiseData, expId);
                spent += this.getExpertiseCost(expDef?.type || 'activity', 'basic');
            });
            masteredExpertise.forEach(expId => {
                const expDef = this.findExpertiseDefinition(expertiseData, expId);
                // The cost of mastered is the total, so we subtract the basic cost if it was already paid
                const basicCost = this.getExpertiseCost(expDef?.type || 'activity', 'basic');
                const masteredCost = this.getExpertiseCost(expDef?.type || 'activity', 'mastered');
                spent += (masteredCost - basicCost);
            });
        });

        // Other utility costs
        ['features', 'senses', 'movement', 'descriptors'].forEach(categoryKey => {
            (character.utilityPurchases[categoryKey] || []).forEach(purchase => {
                spent += purchase.cost || 0;
            });
        });
        
        return spent;
    }

    static findExpertiseDefinition(expertiseData, expertiseId) {
        if (!expertiseData || !expertiseData.Expertises || !expertiseData.Expertises.types) return null;
        const types = expertiseData.Expertises.types;
        for (const attrCategory in types.activityBased?.categories) {
            if (types.activityBased.categories[attrCategory].some(e => e.id === expertiseId || e.name === expertiseId)) {
                return { id: expertiseId, type: 'activity', name: (types.activityBased.categories[attrCategory].find(e => e.id === expertiseId || e.name === expertiseId))?.name };
            }
        }
        for (const attrCategory in types.situational?.categories) {
            if (types.situational.categories[attrCategory].some(e => e.id === expertiseId || e.name === expertiseId)) {
                return { id: expertiseId, type: 'situational', name: (types.situational.categories[attrCategory].find(e => e.id === expertiseId || e.name === expertiseId))?.name };
            }
        }
        return null;
    }
    
    static _findItemDefinition(categoryKey, itemId) {
        const finders = {
            features: this.findFeatureById,
            senses: this.findSenseById,
            movement: this.findMovementById,
            descriptors: this.findDescriptorById,
        };
        const finder = finders[categoryKey];
        return finder ? finder.call(this, itemId) : null;
    }

    static findFeatureById(featureId) {
        const allTiers = this.getAvailableFeatures();
        for (const tierKey in allTiers) {
            const feature = allTiers[tierKey].features.find(f => f.id === featureId);
            if (feature) return { ...feature, cost: allTiers[tierKey].cost };
        }
        return null;
    }

    static findSenseById(senseId) {
        const allTiers = this.getAvailableSenses();
        for (const tierKey in allTiers) {
            const sense = allTiers[tierKey].senses.find(s => s.id === senseId);
            if (sense) return { ...sense, cost: allTiers[tierKey].cost };
        }
        return null;
    }

    static findMovementById(movementId) {
        const allTiers = this.getMovementFeatures();
        for (const tierKey in allTiers) {
            const movement = allTiers[tierKey].features.find(m => m.id === movementId);
            if (movement) return { ...movement, cost: allTiers[tierKey].cost };
        }
        return null;
    }

    static findDescriptorById(descriptorId) {
        const allTiers = this.getDescriptors();
        for (const tierKey in allTiers) {
            const descriptor = allTiers[tierKey].descriptors.find(d => d.id === descriptorId);
            if (descriptor) return { ...descriptor, cost: allTiers[tierKey].cost };
        }
        return null;
    }
    
    static validateUtilityPurchase(character, categoryKey, itemId, level = 'basic', itemType = 'activity') {
        const errors = [];
        const warnings = [];
        const available = this.calculateUtilityPool(character);
        const spent = this.calculateUtilityPointsSpent(character);

        // 1. Check for duplicates
        if (!this.canPurchaseMultiple(itemId, categoryKey)) {
             const purchasedItems = categoryKey === 'expertise' 
                ? (character.utilityPurchases.expertise[itemType] || {basic:[], mastered:[]})[level] 
                : (character.utilityPurchases[categoryKey] || []);
            
            if (purchasedItems.some(item => (typeof item === 'string' ? item : item.id) === itemId)) {
                 errors.push(`${itemId} has already been purchased.`);
            }
        }
        
        // 2. Calculate cost and check affordability
        let cost = 0;
        if (categoryKey === 'expertise') {
            cost = this.getExpertiseCost(itemType, level);
            if (level === 'mastered') {
                 // Cost of mastering is the difference if basic is already owned
                 if (character.utilityPurchases.expertise[itemType]?.basic.includes(itemId)) {
                     cost -= this.getExpertiseCost(itemType, 'basic');
                 }
            }
        } else {
            const itemDef = this._findItemDefinition(categoryKey, itemId);
            cost = itemDef ? itemDef.cost : 0;
            if (!itemDef) errors.push(`Invalid item: ${itemId} in ${categoryKey}`);
        }
        
        if (spent + cost > available) {
            errors.push(`Insufficient utility points (need ${cost}, have ${available - spent})`);
        }
        
        // 3. Check archetype restrictions
        const archetype = character.archetypes.utility;
        if (archetype === 'specialized' && categoryKey === 'expertise') {
            errors.push('Specialized archetype cannot purchase Expertise.');
        }
        if (archetype === 'jackOfAllTrades' && categoryKey === 'expertise' && level === 'mastered') {
            errors.push('Jack of All Trades cannot purchase Mastered expertise.');
        }

        return { isValid: errors.length === 0, errors, warnings, cost };
    }

    static purchaseItem(character, categoryKey, itemId) {
        const validation = this.validateUtilityPurchase(character, categoryKey, itemId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const itemDefinition = this._findItemDefinition(categoryKey, itemId);
        if (!itemDefinition) {
            throw new Error(`Definition for ${itemId} not found.`);
        }

        if (!character.utilityPurchases[categoryKey]) {
            character.utilityPurchases[categoryKey] = [];
        }
        
        character.utilityPurchases[categoryKey].push({ 
            id: itemId, 
            name: itemDefinition.name,
            cost: itemDefinition.cost,
            purchased: new Date().toISOString() 
        });
        return character;
    }
    
    static removeItem(character, categoryKey, itemId) {
        if (!character.utilityPurchases[categoryKey]) {
            return character;
        }
        const initialLength = character.utilityPurchases[categoryKey].length;
        character.utilityPurchases[categoryKey] = character.utilityPurchases[categoryKey].filter(item => item.id !== itemId);
        if (character.utilityPurchases[categoryKey].length === initialLength) {
            throw new Error(`${itemId} not found in purchased ${categoryKey}.`);
        }
        return character;
    }

    static purchaseExpertise(character, attribute, expertiseId, expertiseType, level) {
        const validation = this.validateUtilityPurchase(character, 'expertise', expertiseId, level, expertiseType);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        if (!character.utilityPurchases.expertise[attribute]) {
            character.utilityPurchases.expertise[attribute] = { basic: [], mastered: [] };
        }
        
        if (level === 'mastered' && !character.utilityPurchases.expertise[attribute].basic.includes(expertiseId)) {
            const basicValidation = this.validateUtilityPurchase(character, 'expertise', expertiseId, 'basic', expertiseType);
            if (!basicValidation.isValid) {
                throw new Error(`Cannot master ${expertiseId}: Failed to auto-purchase basic level. ${basicValidation.errors.join(', ')}`);
            }
            character.utilityPurchases.expertise[attribute].basic.push(expertiseId);
        }
        
        const targetArray = character.utilityPurchases.expertise[attribute][level];
        if (!targetArray.includes(expertiseId)) {
            targetArray.push(expertiseId);
        }
        
        return character;
    }
    
    static canPurchaseMultiple(itemId, categoryKey) {
        const multiPurchaseItems = {
            features: ['multiLimbed'],
        };
        return multiPurchaseItems[categoryKey]?.includes(itemId) || false;
    }
}