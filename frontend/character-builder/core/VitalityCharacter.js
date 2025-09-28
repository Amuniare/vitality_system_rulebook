// frontend/character-builder/core/VitalityCharacter.js
// VitalityCharacter.js - Core character data model
import { IdGenerator } from '../shared/utils/IdGenerator.js';

export class VitalityCharacter {
    constructor(id = null, name = "New Character", folderId = null) {
        this.id = id || IdGenerator.generateId();
        this.name = name;
        this.realName = "";
        this.playerName = "";
        this.characterType = "player_character";
        this.characterSubType = null; // For "other" category characters
        this.tier = 1; // Starting tier (for combat, attributes, special attacks, display)
        this.level = 1; // Starting level (for main pool calculations only)
        this.folderId = folderId;
        this.version = "2.2-action-rework"; // Version bump for new system
        this.created = new Date().toISOString();
        this.lastModified = new Date().toISOString();
        
        // Biography and character identity details
        this.biographyDetails = {};
        
        // Core character choices - MUST be selected first
        this.archetypes = {
            movement: null,
            attack: null,
            defensive: null,
            utility: null
        };

        // Utility Archetype Selections
        this.utilityArchetypeSelections = {
            practicalSkills: [],       // For 'Practical' archetype
            specializedAttribute: null // For 'Specialized' archetype
        };
        
        // Attributes - cannot be assigned without archetypes
        this.attributes = {
            // Combat Attributes (max: tier, pool: tier * 2)
            focus: 0,
            mobility: 0,
            power: 0,
            endurance: 0,
            // Utility Attributes (max: tier, pool: tier)
            awareness: 0,
            communication: 0,
            intelligence: 0
        };
        
        // Main Pool Purchases (after attributes)
        this.mainPoolPurchases = {
            boons: [], // Various costs from main pool
            conditionalBonuses: [], // New: 1p each, simple 1 condition + 2 stats
            flaws: [] // Passive bonuses: cost 1p each, provide stat bonuses
        };

        
        // Special Attacks - each has own limits and points
        this.specialAttacks = [];
        
        // Utility Purchases
        this.utilityPurchases = {
            features: [],
            senses: [],
            movement: [],
            descriptors: []
        };
        
        // Calculated values (computed, not stored)
        this.calculatedStats = {};
        this.pointPools = {};
        this.validationResults = {
            isValid: false,
            errors: [],
            warnings: [],
            completionStatus: {}
        };
        
        // Build state tracking
        this.buildState = {
            archetypesComplete: false,
            attributesComplete: false,
            mainPoolComplete: false,
            specialAttacksComplete: false,
            utilityComplete: false
        };
    }
    
    // Create a special attack with proper structure
    createSpecialAttack(name = null) {
        const attack = {
            id: IdGenerator.generateId(),
            name: name || `Special Attack ${this.specialAttacks.length + 1}`,
            description: "",
            
            // Attack configuration
            attackTypes: [], // melee, ranged, direct, area
            effectTypes: [], // damage, condition, hybrid
            isHybrid: false,
            
            // Limits and points (per-attack)
            limits: [],
            limitPointsTotal: 0,
            upgradePointsAvailable: 0,
            upgradePointsSpent: 0,
            
            // Shared Uses archetype support
            useCost: null,
            
            // Upgrades purchased
            upgrades: [],
            
            // Conditions (if applicable)
            basicConditions: [],
            advancedConditions: [],
            
            // Special properties
            properties: {
                range: null,
                area: null,
                special: []
            }
        };
        
        this.specialAttacks.push(attack);
        return attack;
    }
    
    // Deep clone for saving/loading
    clone() {
        return JSON.parse(JSON.stringify(this));
    }
    
    // Update last modified timestamp
    touch() {
        this.lastModified = new Date().toISOString();
    }
    
    // Update build state based on current character state
    updateBuildState() {
        // Check archetypes completion
        this.buildState.archetypesComplete = Object.values(this.archetypes).every(archetype => archetype !== null);
        
        // Check attributes completion (all attributes assigned)
        const totalAttributePoints = Object.values(this.attributes).reduce((sum, value) => sum + value, 0);
        this.buildState.attributesComplete = totalAttributePoints > 0;
        
        // Check main pool completion (any purchases made OR explicitly marked complete)
        const hasMainPoolPurchases = this.mainPoolPurchases.boons.length > 0 ||
                                    (this.mainPoolPurchases.conditionalBonuses && this.mainPoolPurchases.conditionalBonuses.length > 0) ||
                                    this.mainPoolPurchases.flaws.length > 0;
        // For now, allow special attacks if any main pool purchases exist OR if attributes are complete
        this.buildState.mainPoolComplete = hasMainPoolPurchases || this.buildState.attributesComplete;
        
        // Check special attacks completion
        this.buildState.specialAttacksComplete = this.specialAttacks.length > 0 && 
                                               this.specialAttacks.every(attack => attack.name && attack.name.trim() !== '');
        
        // Check utility completion
        const hasUtilityPurchases = Object.values(this.utilityPurchases).some(cat => cat.length > 0);
        this.buildState.utilityComplete = hasUtilityPurchases;
    }
    
    // Validate build order is being followed
    canModifySection(section) {
        switch(section) {
            case 'archetypes':
                return true; // Always can modify
            case 'attributes':
                return true; // Always can modify attributes
            case 'mainPool':
                return this.buildState.attributesComplete;
            case 'specialAttacks':
                return this.buildState.mainPoolComplete;
            case 'utility':
                return this.buildState.specialAttacksComplete;
            default:
                return false;
        }
    }
    
    // Export for Roll20 or other systems
    exportForRoll20() {
        return {
            name: this.name,
            tier: this.tier,
            level: this.level,
            attributes: this.attributes,
            calculatedStats: this.calculatedStats,
            specialAttacks: this.specialAttacks.map(attack => ({
                name: attack.name,
                description: attack.description,
                upgrades: attack.upgrades,
                limits: attack.limits
            })),
            archetypes: this.archetypes
        };
    }
}