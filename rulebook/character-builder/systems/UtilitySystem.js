// UtilitySystem.js - Utility abilities, expertise, features, and senses
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

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
        return gameDataManager.getAvailableFeatures() || {}; // MODIFIED
    }
    
    // Get available senses
    static getAvailableSenses() {
        return gameDataManager.getAvailableSenses() || {}; // MODIFIED
    }
    
    // Get movement features
    static getMovementFeatures() {
        return gameDataManager.getMovementFeatures() || {}; // MODIFIED
    }
    
    // Get descriptors
    static getDescriptors() {
        return gameDataManager.getDescriptors() || {}; // MODIFIED
    }

    static getExpertiseCost(type, level) { // Helper for UI, assumes structure
        if (type === 'activity') {
            return level === 'basic' ? GameConstants.EXPERTISE_ACTIVITY_BASIC : GameConstants.EXPERTISE_ACTIVITY_MASTERED;
        } else if (type === 'situational') {
            return level === 'basic' ? GameConstants.EXPERTISE_SITUATIONAL_BASIC : GameConstants.EXPERTISE_SITUATIONAL_MASTERED;
        }
        return 0;
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
        
        // Add bonuses from boons (e.g., Utilitarian)
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
        
        // Expertise costs
        Object.entries(character.utilityPurchases.expertise).forEach(([attrKey, category]) => {
             // Ensure basic and mastered are arrays
            const basicExpertise = Array.isArray(category.basic) ? category.basic : [];
            const masteredExpertise = Array.isArray(category.mastered) ? category.mastered : [];

            // Determine if attribute is activity or situational based - simplified: assume all are activity for now
            // This part might need refinement if expertise types (activity/situational) are stored with the purchase.
            // For now, using activity costs as a default if not specified.
            basicExpertise.forEach(expId => {
                const expDef = this.findExpertiseById(attrKey, expId); // Need to find its type
                spent += this.getExpertiseCost(expDef?.type || 'activity', 'basic');
            });
            masteredExpertise.forEach(expId => {
                 const expDef = this.findExpertiseById(attrKey, expId);
                // Mastered cost is total for mastered, not delta.
                // Or it can be calculated as basic_cost + delta.
                // GameConstants store total cost for mastered.
                spent += this.getExpertiseCost(expDef?.type || 'activity', 'mastered') - this.getExpertiseCost(expDef?.type || 'activity', 'basic');
            });
        });
        
        // Feature costs
        character.utilityPurchases.features.forEach(featurePurchase => { // featurePurchase is {id: ..., purchased: ...}
            const featureDef = this.findFeatureById(featurePurchase.id);
            spent += featureDef ? featureDef.cost : 0;
        });
        
        // Sense costs
        character.utilityPurchases.senses.forEach(sensePurchase => {
            const senseDef = this.findSenseById(sensePurchase.id);
            spent += senseDef ? senseDef.cost : 0;
        });
        
        // Movement costs
        character.utilityPurchases.movement.forEach(movementPurchase => {
            const movementDef = this.findMovementById(movementPurchase.id);
            spent += movementDef ? movementDef.cost : 0;
        });
        
        // Descriptor costs
        character.utilityPurchases.descriptors.forEach(descriptorPurchase => {
            const descriptorDef = this.findDescriptorById(descriptorPurchase.id);
            spent += descriptorDef ? descriptorDef.cost : 0;
        });
        
        return spent;
    }

    static findExpertiseById(attrKey, expertiseId) {
        const categories = this.getExpertiseCategories();
        const attrCat = categories[attrKey];
        if (!attrCat) return null;
        let found = (attrCat.activities || []).find(act => act === expertiseId || act.id === expertiseId); // Expertise might be simple strings or objects
        if (found) return { id: expertiseId, name: expertiseId, type: 'activity' }; // Assuming simple string means activity
        
        found = (attrCat.situational || []).find(sit => sit === expertiseId || sit.id === expertiseId);
        if (found) return { id: expertiseId, name: expertiseId, type: 'situational' };
        
        return null; // Or return a default if it's just a string.
    }

    
    // Find feature by ID across all tiers
    static findFeatureById(featureId) {
        const allFeatures = this.getAvailableFeatures(); // from gameDataManager
        for (const tierKey in allFeatures) {
            const tier = allFeatures[tierKey];
            if (tier.features) {
                 const feature = tier.features.find(f => f.id === featureId);
                 if (feature) return { ...feature, cost: tier.cost }; // Add cost from tier
            }
        }
        return null;
    }
    
    // Find sense by ID across all tiers
    static findSenseById(senseId) {
        const allSenses = this.getAvailableSenses(); // from gameDataManager
        for (const tierKey in allSenses) {
            const tier = allSenses[tierKey];
            if (tier.senses) {
                const sense = tier.senses.find(s => s.id === senseId);
                if (sense) return { ...sense, cost: tier.cost }; // Add cost from tier
            }
        }
        return null;
    }
    
    // Find movement by ID
    static findMovementById(movementId) {
        const allMovement = this.getMovementFeatures(); // from gameDataManager
         for (const tierKey in allMovement) {
            const tier = allMovement[tierKey];
            if (tier.features) { // movement features are under 'features' key in JSON
                const movement = tier.features.find(m => m.id === movementId);
                if (movement) return { ...movement, cost: tier.cost }; // Add cost from tier
            }
        }
        return null;
    }
    
    // Find descriptor by ID
    static findDescriptorById(descriptorId) {
        const allDescriptors = this.getDescriptors(); // from gameDataManager
        for (const tierKey in allDescriptors) {
            const tier = allDescriptors[tierKey];
             if (tier.descriptors) {
                const descriptor = tier.descriptors.find(d => d.id === descriptorId);
                if (descriptor) return { ...descriptor, cost: tier.cost }; // Add cost from tier
            }
        }
        return null;
    }
    
    // Validate utility purchase
    static validateUtilityPurchase(character, category, itemId, level = 'basic', itemType = 'activity') { // Added itemType for expertise
        const errors = [];
        const warnings = [];
        
        const available = this.calculateUtilityPool(character);
        const spent = this.calculateUtilityPointsSpent(character);
        
        let cost = 0;
        switch(category) {
            case 'expertise':
                cost = this.getExpertiseCost(itemType, level);
                break;
            case 'features':
                const feature = this.findFeatureById(itemId);
                cost = feature ? feature.cost : 0;
                if (!feature) errors.push('Invalid feature');
                break;
            case 'senses':
                const sense = this.findSenseById(itemId);
                cost = sense ? sense.cost : 0;
                if (!sense) errors.push('Invalid sense');
                break;
            case 'movement':
                const movement = this.findMovementById(itemId);
                cost = movement ? movement.cost : 0;
                if (!movement) errors.push('Invalid movement');
                break;
            case 'descriptors':
                const descriptor = this.findDescriptorById(itemId);
                cost = descriptor ? descriptor.cost : 0;
                if (!descriptor) errors.push('Invalid descriptor');
                break;
            default: errors.push(`Unknown utility category: ${category}`);
        }
        
        if (spent + cost > available) {
            errors.push(`Insufficient utility points (need ${cost}, have ${available - spent})`);
        }
        
        const archetype = character.archetypes.utility;
        if (archetype === 'specialized' && category === 'expertise') {
            // Specialized: "Double Tier bonus to a single chosen stat. May not buy any additional Expertise."
            // This implies that if 'specialized' is chosen, no expertise can be bought.
            // The "double tier bonus" applies to a core attribute, not directly to utility pool.
            // It's a trade-off.
            const purchasedExpertiseCount = Object.values(character.utilityPurchases.expertise)
                                            .reduce((acc, val) => acc + val.basic.length + val.mastered.length, 0);
            if (purchasedExpertiseCount > 0 || (cost > 0 && category === 'expertise')) { // If trying to buy or already bought
                 errors.push('Specialized archetype cannot purchase Expertise.');
            }
        }
        
        if (archetype === 'jackOfAllTrades' && category === 'expertise' && level === 'mastered') {
            errors.push('Jack of All Trades cannot purchase Mastered expertise');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            cost
        };
    }

    // Purchase utility item
    static purchaseItem(character, categoryKey, itemId, itemCost) { // Simplified, assumes itemCost is known
        const validation = this.validateUtilityPurchase(character, categoryKey, itemId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        // itemCost is already determined by findXById, no need to pass separately
        // Or, the UI passes it after looking it up.

        const itemDefinition = this._findItemDefinition(categoryKey, itemId);
        if (!itemDefinition) {
            throw new Error(`Definition for ${itemId} in ${categoryKey} not found.`);
        }


        if (!character.utilityPurchases[categoryKey]) {
            character.utilityPurchases[categoryKey] = [];
        }
        // Ensure no duplicates, especially for non-expertise
        if (character.utilityPurchases[categoryKey].some(purchased => purchased.id === itemId)) {
            throw new Error(`${itemId} already purchased.`);
        }

        character.utilityPurchases[categoryKey].push({ 
            id: itemId, 
            name: itemDefinition.name, // Store name for easier display
            cost: itemDefinition.cost, // Store cost with purchase
            purchased: new Date().toISOString() 
        });
        return character;
    }
    
    static removeItem(character, categoryKey, itemId) {
        if (!character.utilityPurchases[categoryKey]) {
            return character; // Nothing to remove
        }
        const initialLength = character.utilityPurchases[categoryKey].length;
        character.utilityPurchases[categoryKey] = character.utilityPurchases[categoryKey].filter(item => item.id !== itemId);
        if (character.utilityPurchases[categoryKey].length === initialLength) {
            throw new Error(`${itemId} not found in purchased ${categoryKey}.`);
        }
        return character;
    }

    static toggleExpertise(character, attribute, expertiseId, expertiseType, level, isChecked) {
        if (!character.utilityPurchases.expertise[attribute]) {
            character.utilityPurchases.expertise[attribute] = { basic: [], mastered: [] };
        }
        const targetArray = character.utilityPurchases.expertise[attribute][level];
        const cost = this.getExpertiseCost(expertiseType, level);
        const otherLevel = level === 'basic' ? 'mastered' : 'basic';
        const otherArray = character.utilityPurchases.expertise[attribute][otherLevel];

        if (isChecked) { // Adding expertise
            const validation = this.validateUtilityPurchase(character, 'expertise', expertiseId, level, expertiseType);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            if (!targetArray.includes(expertiseId)) {
                targetArray.push(expertiseId);
                // If mastering, ensure basic is also selected
                if (level === 'mastered' && !character.utilityPurchases.expertise[attribute].basic.includes(expertiseId)) {
                     character.utilityPurchases.expertise[attribute].basic.push(expertiseId);
                }
            }
        } else { // Removing expertise
            const index = targetArray.indexOf(expertiseId);
            if (index > -1) {
                targetArray.splice(index, 1);
                // If unchecking basic, also uncheck mastered for that expertise
                if (level === 'basic' && otherArray.includes(expertiseId)) {
                    const masterIndex = otherArray.indexOf(expertiseId);
                    if (masterIndex > -1) otherArray.splice(masterIndex, 1);
                }
            }
        }
        return character;
    }

    static purchaseExpertise(character, attribute, expertiseId, expertiseType, level) {
        if (!character.utilityPurchases.expertise[attribute]) {
            character.utilityPurchases.expertise[attribute] = { basic: [], mastered: [] };
        }
        
        const costs = this.getExpertiseCosts();
        const cost = costs[expertiseType === 'activity' ? 'activityBased' : 'situational']?.[level]?.cost || 0;
        
        // Validation
        const validation = this.validateUtilityPurchase(character, 'expertise', expertiseId, level, expertiseType);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // For mastered, must first have basic
        if (level === 'mastered' && !character.utilityPurchases.expertise[attribute].basic.includes(expertiseId)) {
            // Auto-purchase basic first
            const basicCost = costs[expertiseType === 'activity' ? 'activityBased' : 'situational']?.basic?.cost || 0;
            character.utilityPurchases.expertise[attribute].basic.push(expertiseId);
            character.utilityPointsSpent = (character.utilityPointsSpent || 0) + basicCost;
        }
        
        // Add to appropriate level
        const targetArray = character.utilityPurchases.expertise[attribute][level];
        if (!targetArray.includes(expertiseId)) {
            targetArray.push(expertiseId);
            character.utilityPointsSpent = (character.utilityPointsSpent || 0) + cost;
        }
        
        return character;
    }

    static removeExpertise(character, attribute, expertiseId, expertiseType, level) {
        if (!character.utilityPurchases.expertise[attribute]) return character;
        
        const costs = this.getExpertiseCosts();
        const cost = costs[expertiseType === 'activity' ? 'activityBased' : 'situational']?.[level]?.cost || 0;
        
        const targetArray = character.utilityPurchases.expertise[attribute][level];
        const index = targetArray.indexOf(expertiseId);
        
        if (index !== -1) {
            targetArray.splice(index, 1);
            character.utilityPointsSpent = (character.utilityPointsSpent || 0) - cost;
            
            // If removing basic, also remove mastered
            if (level === 'basic') {
                const masteredArray = character.utilityPurchases.expertise[attribute].mastered;
                const masteredIndex = masteredArray.indexOf(expertiseId);
                if (masteredIndex !== -1) {
                    masteredArray.splice(masteredIndex, 1);
                    const masteredCost = costs[expertiseType === 'activity' ? 'activityBased' : 'situational']?.mastered?.cost || 0;
                    character.utilityPointsSpent = (character.utilityPointsSpent || 0) - masteredCost;
                }
            }
        }
        
        return character;
    }
    
    static _findItemDefinition(categoryKey, itemId) {
        switch(categoryKey) {
            case 'features': return this.findFeatureById(itemId);
            case 'senses': return this.findSenseById(itemId);
            case 'movement': return this.findMovementById(itemId);
            case 'descriptors': return this.findDescriptorById(itemId);
            default: return null;
        }
    }

    
    // Get utility summary
    static getUtilitySummary(character) {
        const available = this.calculateUtilityPool(character);
        const spent = this.calculateUtilityPointsSpent(character);
        
        const expertiseCounts = Object.values(character.utilityPurchases.expertise || {}).reduce(
            (acc, cat) => {
                acc.basic += (cat.basic || []).length;
                acc.mastered += (cat.mastered || []).length;
                return acc;
            },
            { basic: 0, mastered: 0 }
        );

        return {
            pointPool: {
                available,
                spent,
                remaining: available - spent
            },
            expertise: {
                categories: Object.keys(character.utilityPurchases.expertise || {}).length,
                totalBasic: expertiseCounts.basic,
                totalMastered: expertiseCounts.mastered
            },
            features: (character.utilityPurchases.features || []).length,
            senses: (character.utilityPurchases.senses || []).length,
            movement: (character.utilityPurchases.movement || []).length,
            descriptors: (character.utilityPurchases.descriptors || []).length
        };
    }
}