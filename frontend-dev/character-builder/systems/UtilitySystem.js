// frontend/character-builder/systems/UtilitySystem.js
// REWORKED with richer skill data and improved archetype logic.
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js';

export class UtilitySystem {
    // --- Getters for available options ---
    static getAvailableFeatures() { return gameDataManager.getAvailableFeatures() || {}; }
    static getAvailableSenses() { return gameDataManager.getAvailableSenses() || {}; }
    static getMovementFeatures() { return gameDataManager.getMovementFeatures() || {}; }
    static getDescriptors() { return gameDataManager.getDescriptors() || {}; }
    
    // MODIFIED: Get full skill data with descriptions from expertise.json
    static getSkills() {
        const expertiseData = gameDataManager.getExpertiseCategories();
        if (!expertiseData || !expertiseData.Expertises?.types?.activityBased?.categories) {
            return [];
        }
        
        const allSkills = [];
        const categories = expertiseData.Expertises.types.activityBased.categories;
        
        for (const attribute in categories) {
            const skillsInCategory = categories[attribute];
            if (Array.isArray(skillsInCategory)) {
                skillsInCategory.forEach(skill => {
                    allSkills.push({
                        id: skill.name.toLowerCase().replace(/\s+/g, ''), // Create a stable ID
                        name: skill.name,
                        description: skill.description,
                        attribute: attribute
                    });
                });
            }
        }
        return allSkills;
    }

    static getAttributes() {
        const attrs = gameDataManager.getAttributes();
        if (!attrs || !attrs.combat || !attrs.utility) return [];
        return [...attrs.combat, ...attrs.utility];
    }
    
    // --- Archetype Configuration Logic ---

    static togglePracticalSkill(character, skillId) {
        if (character.archetypes.utility !== 'practical') {
            throw new Error('This action is only for the Practical archetype.');
        }
        const selections = character.utilityArchetypeSelections.practicalSkills;
        const index = selections.indexOf(skillId);

        if (index > -1) {
            selections.splice(index, 1);
        } else {
            if (selections.length >= 3) {
                throw new Error('Cannot select more than 3 practical skills.');
            }
            selections.push(skillId);
        }
        return character;
    }

    static setSpecializedAttribute(character, attributeId) {
        if (character.archetypes.utility !== 'specialized') {
            throw new Error('This action is only for the Specialized archetype.');
        }
        character.utilityArchetypeSelections.specializedAttribute = attributeId;
        return character;
    }


    // --- Generic Utility Item Purchase Logic ---

    static _findItemDefinition(categoryKey, itemId) {
        const dataSources = {
            features: this.getAvailableFeatures(),
            senses: this.getAvailableSenses(),
            movement: this.getMovementFeatures(),
            descriptors: this.getDescriptors()
        };
        const sourceData = dataSources[categoryKey];
        if (!sourceData) return null;

        for (const tierKey in sourceData) {
            const tierData = sourceData[tierKey];
            const itemsKey = categoryKey;
            const items = tierData[itemsKey];
            if (items && Array.isArray(items)) {
                const item = items.find(i => i.id === itemId);
                if (item) return { ...item, cost: tierData.cost };
            }
        }
        return null;
    }

    static validateItemPurchase(character, categoryKey, itemId) {
        const errors = [];
        if (!this.canPurchaseMultiple(itemId, categoryKey)) {
            const purchasedItems = character.utilityPurchases[categoryKey] || [];
            if (purchasedItems.some(item => (item.id || item) === itemId)) {
                errors.push(`${itemId} has already been purchased.`);
            }
        }

        const itemDef = this._findItemDefinition(categoryKey, itemId);
        if (!itemDef) {
            errors.push(`Invalid item: ${itemId} in ${categoryKey}`);
        }
        
        return { isValid: errors.length === 0, errors, warnings: [], cost: itemDef ? itemDef.cost : 0 };
    }

    static purchaseItem(character, categoryKey, itemId) {
        const validation = this.validateItemPurchase(character, categoryKey, itemId);
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
    
    static canPurchaseMultiple(itemId, categoryKey) {
        const multiPurchaseItems = {
            features: ['multiLimbed'],
        };
        return multiPurchaseItems[categoryKey]?.includes(itemId) || false;
    }
}