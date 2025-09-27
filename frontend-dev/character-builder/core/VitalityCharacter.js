// VitalityCharacter.js - Simplified Character Data Model
// Matches the streamlined rulebook (not the archive)
import { IdGenerator } from '../shared/utils/IdGenerator.js';

export class VitalityCharacter {
    constructor(id = null, name = "New Character") {
        this.id = id || IdGenerator.generateId();
        this.name = name;
        this.playerName = "";
        this.characterType = "player_character";
        this.level = 4; // Starting level (1-5)
        this.version = "3.0-simplified"; // New simplified system
        this.created = new Date().toISOString();
        this.lastModified = new Date().toISOString();

        // Biography and character identity details
        this.biographyDetails = {};

        // Simplified 4-archetype system
        this.archetypes = {
            movement: null,    // Movement capabilities
            attack: null,      // Attack approach
            defensive: null,   // Defensive style
            utility: null      // Non-combat skills
        };

        // Attributes - same as before but simpler calculations
        this.attributes = {
            // Combat Attributes (max: tier, pool: tier * 2)
            focus: 0,
            power: 0,
            mobility: 0,
            endurance: 0,
            // Utility Attributes (max: tier, pool: tier)
            awareness: 0,
            communication: 0,
            intelligence: 0
        };

        // Simplified boon system - select boons equal to level
        this.boons = []; // Array of boon IDs, length = level

        // Single special attack for certain archetypes only
        this.specialAttack = null; // Only some archetypes get this

        // Calculated values (computed, not stored)
        this.calculatedStats = {};
        this.validationResults = {
            isValid: false,
            errors: [],
            warnings: []
        };
    }

    // Get tier bonus based on level
    get tier() {
        const tierTable = {
            1: 3, 2: 3, 3: 4, 4: 4, 5: 5
        };
        return tierTable[this.level] || 4;
    }

    // Get maximum boons allowed
    get maxBoons() {
        return this.level;
    }

    // Get combat attribute points available
    get combatAttributePoints() {
        return this.tier * 2;
    }

    // Get utility attribute points available
    get utilityAttributePoints() {
        return this.tier;
    }

    // Create a special attack (only for certain archetypes)
    createSpecialAttack(name = null) {
        if (!this.canHaveSpecialAttack()) {
            return null;
        }

        this.specialAttack = {
            id: IdGenerator.generateId(),
            name: name || "Special Attack",
            description: "",
            attackTypes: [], // melee, ranged, area, direct
            effectType: null, // damage or condition
            conditions: [], // if condition effect
            points: this.getSpecialAttackPoints()
        };

        return this.specialAttack;
    }

    // Check if current archetype allows special attacks
    canHaveSpecialAttack() {
        // Based on new rulebook - only certain attack archetypes get special attacks
        const attackArchetype = this.archetypes.attack;
        return ['focused_attacker', 'dual_natured', 'versatile_master', 'shared_charges'].includes(attackArchetype);
    }

    // Get points available for special attack based on archetype
    getSpecialAttackPoints() {
        const attackArchetype = this.archetypes.attack;
        const tier = this.tier;

        switch(attackArchetype) {
            case 'focused_attacker':
                return tier * 20; // Single attack with lots of points
            case 'dual_natured':
                return tier * 15; // Two attacks
            case 'versatile_master':
                return tier * 10; // Five attacks
            case 'shared_charges':
                return tier * 10; // Shared charge system
            default:
                return 0;
        }
    }

    // Deep clone for saving/loading
    clone() {
        return JSON.parse(JSON.stringify(this));
    }

    // Update last modified timestamp
    touch() {
        this.lastModified = new Date().toISOString();
    }

    // Validate simplified character build
    validate() {
        const errors = [];
        const warnings = [];

        // Check basic requirements
        if (!this.name || this.name.trim() === '') {
            errors.push('Character must have a name');
        }

        // Check archetype completion
        const archetypeCount = Object.values(this.archetypes).filter(v => v !== null).length;
        if (archetypeCount < 4) {
            warnings.push(`Only ${archetypeCount}/4 archetypes selected`);
        }

        // Check attribute allocation
        const combatSpent = this.attributes.focus + this.attributes.power +
                           this.attributes.mobility + this.attributes.endurance;
        const utilitySpent = this.attributes.awareness + this.attributes.communication +
                            this.attributes.intelligence;

        if (combatSpent > this.combatAttributePoints) {
            errors.push(`Combat attributes over budget: ${combatSpent}/${this.combatAttributePoints}`);
        }

        if (utilitySpent > this.utilityAttributePoints) {
            errors.push(`Utility attributes over budget: ${utilitySpent}/${this.utilityAttributePoints}`);
        }

        // Check attribute maximums
        Object.entries(this.attributes).forEach(([attr, value]) => {
            if (value > this.tier) {
                errors.push(`${attr} exceeds tier maximum: ${value}/${this.tier}`);
            }
        });

        // Check boon count
        if (this.boons.length > this.maxBoons) {
            errors.push(`Too many boons selected: ${this.boons.length}/${this.maxBoons}`);
        }

        this.validationResults = {
            isValid: errors.length === 0,
            errors,
            warnings
        };

        return this.validationResults;
    }

    // Export for Roll20 or other systems
    exportForRoll20() {
        return {
            name: this.name,
            level: this.level,
            tier: this.tier,
            attributes: this.attributes,
            archetypes: this.archetypes,
            boons: this.boons,
            specialAttack: this.specialAttack,
            calculatedStats: this.calculatedStats
        };
    }
}