// VitalityCharacter.js - Core character data model
export class VitalityCharacter {
    constructor(id = null, name = "New Character", folderId = null) {
        this.id = id || Date.now().toString();
        this.name = name;
        this.realName = "";
        this.playerName = "";
        this.characterType = "Player Character";
        this.tier = 4; // Starting tier
        this.folderId = folderId;
        this.version = "2.0";
        this.created = new Date().toISOString();
        this.lastModified = new Date().toISOString();
        
        // Core character choices - MUST be selected first
        this.archetypes = {
            movement: null,
            attackType: null,
            effectType: null,
            uniqueAbility: null,
            defensive: null,
            specialAttack: null,
            utility: null
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
            traits: [], // 30p each, conditional bonuses
            flaws: [], // Give 30p each, restrictions
            primaryActionUpgrades: [] // 30p to make Primary → Quick
        };
        
        // Special Attacks - each has own limits and points
        this.specialAttacks = [];
        
        // Utility Purchases
        this.utilityPurchases = {
            expertise: {
                // Activity-based expertises (unchanged)
                awareness: { basic: [], mastered: [] },
                communication: { basic: [], mastered: [] },
                intelligence: { basic: [], mastered: [] },
                focus: { basic: [], mastered: [] },
                mobility: { basic: [], mastered: [] },
                endurance: { basic: [], mastered: [] },
                power: { basic: [], mastered: [] },
                // New situational expertises (max 3)
                situational: []
            },
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
            id: Date.now().toString() + Math.random(),
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
    
    // Create a situational expertise with custom talents
    createSituationalExpertise(attribute, level = 'basic', talents = ['', '', '']) {
        const expertise = {
            id: Date.now().toString() + Math.random(),
            attribute: attribute,
            level: level,
            talents: [...talents], // Copy array to avoid reference issues
            purchaseDate: Date.now()
        };
        
        return expertise;
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
                                    this.mainPoolPurchases.traits.length > 0 ||
                                    this.mainPoolPurchases.flaws.length > 0 ||
                                    this.mainPoolPurchases.primaryActionUpgrades.length > 0;
        // For now, allow special attacks if any main pool purchases exist OR if attributes are complete
        this.buildState.mainPoolComplete = hasMainPoolPurchases || this.buildState.attributesComplete;
        
        // Check special attacks completion
        this.buildState.specialAttacksComplete = this.specialAttacks.length > 0 && 
                                               this.specialAttacks.every(attack => attack.name && attack.name.trim() !== '');
        
        // Check utility completion
        const hasActivityBasedExpertise = ['awareness', 'communication', 'intelligence', 'focus', 'mobility', 'endurance', 'power']
                                          .some(attr => this.utilityPurchases.expertise[attr].basic.length > 0 || 
                                                       this.utilityPurchases.expertise[attr].mastered.length > 0);
        const hasSituationalExpertise = this.utilityPurchases.expertise.situational.length > 0;
        const hasUtilityPurchases = hasActivityBasedExpertise || hasSituationalExpertise ||
                                  this.utilityPurchases.features.length > 0 ||
                                  this.utilityPurchases.senses.length > 0 ||
                                  this.utilityPurchases.movement.length > 0 ||
                                  this.utilityPurchases.descriptors.length > 0 ||
                                  (this.wealth && this.wealth.level);
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