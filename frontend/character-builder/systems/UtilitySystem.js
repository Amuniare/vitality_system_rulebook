// frontend/character-builder/systems/UtilitySystem.js
// NO CHANGES REQUIRED. The existing methods support the refactored UI.
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
            activityBased: { basic: { cost: 2, effect: 'Add your Tier to relevant checks' }, mastered: { cost: 4, effect: 'Add 2 × your Tier to relevant checks' } },
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
            // Handle situational expertises (new format)
            if (attrKey === 'situational' && Array.isArray(category)) {
                category.forEach(expertise => {
                    if (expertise.level === 'basic') {
                        spent += this.getExpertiseCost('situational', 'basic');
                    } else if (expertise.level === 'mastered') {
                        spent += this.getExpertiseCost('situational', 'mastered');
                    }
                });
                return;
            }
            
            // Handle activity-based expertises (old format)
            const basicExpertise = Array.isArray(category.basic) ? category.basic : [];
            const masteredExpertise = Array.isArray(category.mastered) ? category.mastered : [];

            basicExpertise.forEach(expId => {
                const expDef = this.findExpertiseDefinition(expertiseData, expId);
                spent += this.getExpertiseCost(expDef?.type || 'activity', 'basic');
            });
            masteredExpertise.forEach(expId => {
                const expDef = this.findExpertiseDefinition(expertiseData, expId);
                const masteredCost = this.getExpertiseCost(expDef?.type || 'activity', 'mastered');
                
                // If character already has basic level, only pay the difference
                if (basicExpertise.includes(expId)) {
                    const basicCost = this.getExpertiseCost(expDef?.type || 'activity', 'basic');
                    spent += (masteredCost - basicCost);
                } else {
                    // If they don't have basic, pay full mastered cost
                    spent += masteredCost;
                }
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

        // 1. Check for duplicates
        if (!this.canPurchaseMultiple(itemId, categoryKey)) {
             const purchasedItems = categoryKey === 'expertise' 
                ? (character.utilityPurchases.expertise[itemType] || {basic:[], mastered:[]})[level] 
                : (character.utilityPurchases[categoryKey] || []);
            
            if (purchasedItems.some(item => (typeof item === 'string' ? item : item.id) === itemId)) {
                 errors.push(`${itemId} has already been purchased.`);
            }
        }
        
        // 2. Calculate cost and validate item
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

    static removeExpertise(character, attribute, expertiseId, level) {
        if (!character.utilityPurchases.expertise[attribute]) {
            throw new Error(`No expertises found for ${attribute} attribute.`);
        }

        const targetArray = character.utilityPurchases.expertise[attribute][level];
        if (!targetArray || !targetArray.includes(expertiseId)) {
            throw new Error(`${expertiseId} (${level}) not found in ${attribute} expertises.`);
        }

        // If removing mastered level, also remove basic level
        if (level === 'mastered') {
            const basicArray = character.utilityPurchases.expertise[attribute].basic;
            const basicIndex = basicArray.indexOf(expertiseId);
            if (basicIndex > -1) {
                basicArray.splice(basicIndex, 1);
            }
        }

        // Remove the expertise from the target level
        const index = targetArray.indexOf(expertiseId);
        targetArray.splice(index, 1);

        return character;
    }

    // Situational Expertise Methods
    static addSituationalExpertise(character, attribute = 'mobility') {
        if (!character.utilityPurchases.expertise.situational) {
            character.utilityPurchases.expertise.situational = [];
        }
        
        const maxCount = 3;
        if (character.utilityPurchases.expertise.situational.length >= maxCount) {
            throw new Error(`Cannot add more than ${maxCount} situational expertises`);
        }
        
        const newExpertise = character.createSituationalExpertise(attribute, 'none', ['', '', '']);
        character.utilityPurchases.expertise.situational.push(newExpertise);
        
        return character;
    }
    
    static updateSituationalTalent(character, expertiseId, talentIndex, talentValue) {
        // Initialize situational array if needed
        if (!character.utilityPurchases.expertise.situational) {
            character.utilityPurchases.expertise.situational = [];
        }
        
        const expertise = character.utilityPurchases.expertise.situational.find(e => e.id === expertiseId);
        if (!expertise) {
            throw new Error(`Situational expertise ${expertiseId} not found`);
        }
        
        if (talentIndex < 0 || talentIndex > 2) {
            throw new Error(`Invalid talent index: ${talentIndex}`);
        }
        
        expertise.talents[talentIndex] = talentValue;
        return character;
    }
    
    static purchaseSituationalExpertise(character, expertiseId, level) {
        // Initialize situational array if needed
        if (!character.utilityPurchases.expertise.situational) {
            character.utilityPurchases.expertise.situational = [];
        }
        
        const expertise = character.utilityPurchases.expertise.situational.find(e => e.id === expertiseId);
        if (!expertise) {
            throw new Error(`Situational expertise ${expertiseId} not found`);
        }
        
        if (level === 'mastered' && expertise.level !== 'basic') {
            // Auto-purchase basic first
            expertise.level = 'basic';
        }
        
        expertise.level = level;
        return character;
    }
    
    static removeSituationalExpertise(character, expertiseId) {
        // Initialize situational array if needed
        if (!character.utilityPurchases.expertise.situational) {
            character.utilityPurchases.expertise.situational = [];
        }
        
        if (character.utilityPurchases.expertise.situational.length === 0) {
            throw new Error('No situational expertises found');
        }
        
        const index = character.utilityPurchases.expertise.situational.findIndex(e => e.id === expertiseId);
        if (index === -1) {
            throw new Error(`Situational expertise ${expertiseId} not found`);
        }
        
        character.utilityPurchases.expertise.situational.splice(index, 1);
        return character;
    }
    
    static canPurchaseMultiple(itemId, categoryKey) {
        const multiPurchaseItems = {
            features: ['multiLimbed'],
        };
        return multiPurchaseItems[categoryKey]?.includes(itemId) || false;
    }

    static validateCustomItemPurchase(character, customItemData) {
        const errors = [];
        const warnings = [];

        // 1. Validate item data
        if (!customItemData.name || customItemData.name.length < 1) {
            errors.push('Item name is required');
        }
        
        if (customItemData.name && customItemData.name.length > 50) {
            errors.push('Item name must be 50 characters or less');
        }

        if (!customItemData.description || customItemData.description.length < 1) {
            errors.push('Item description is required');
        }

        if (customItemData.description && customItemData.description.length > 300) {
            errors.push('Item description must be 300 characters or less');
        }

        if (!customItemData.cost || isNaN(customItemData.cost) || customItemData.cost < 1) {
            errors.push('Item cost must be at least 1 point');
        }

        if (customItemData.cost && customItemData.cost > 50) {
            errors.push('Item cost cannot exceed 50 points');
        }

        if (!customItemData.category) {
            errors.push('Item category is required');
        }

        const validCategories = ['features', 'senses', 'movement', 'descriptors'];
        if (customItemData.category && !validCategories.includes(customItemData.category)) {
            errors.push('Invalid item category');
        }

        // 2. Check archetype restrictions
        const archetype = character.archetypes.utility;
        if (archetype === 'specialized') {
            errors.push('Specialized archetype cannot purchase custom utility items.');
        }

        return { isValid: errors.length === 0, errors, warnings, cost: customItemData.cost || 0 };
    }

    static purchaseCustomItem(character, customItemData) {
        const validation = this.validateCustomItemPurchase(character, customItemData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const categoryKey = customItemData.category;
        
        if (!character.utilityPurchases[categoryKey]) {
            character.utilityPurchases[categoryKey] = [];
        }

        const customItem = {
            id: `custom_${Date.now()}`,
            name: customItemData.name,
            description: customItemData.description,
            cost: customItemData.cost,
            isCustom: true,
            purchased: new Date().toISOString()
        };
        
        character.utilityPurchases[categoryKey].push(customItem);
        return character;
    }
}