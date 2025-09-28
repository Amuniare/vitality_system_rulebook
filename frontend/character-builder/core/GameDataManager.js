// frontend/character-builder/core/GameDataManager.js
class GameDataManager {
    constructor() {
        this.dataCache = new Map();
        this.dataFiles = {
            // Actions & Boons
            actions: 'data/actions.json',
            boons: 'data/boons.json',
            complexUniqueAbilities: 'data/unique_abilities_complex.json',

            // Archetypes
            archetypes: 'data/archetypes.json',

            // Attack & Effect Types, Conditions
            attackTypesDefinitions: 'data/attack_types_definitions.json',
            effectTypesDefinitions: 'data/effect_types_definitions.json',
            basicConditions: 'data/conditions_basic.json',
            advancedConditions: 'data/conditions_advanced.json',

            // Traits & Passive Bonuses
            availablePassiveBonuses: 'data/passive_bonuses.json',
            genericStatOptions: 'data/stat_options_generic.json', // Used by both passive bonuses and traits
            traitConditionTiers: 'data/trait_conditions.json',
            conditionalBonuses: 'data/conditional_bonuses.json',

            // Utility System
            expertiseCategories: 'data/expertise.json',
            availableFeatures: 'data/features.json', // Tiered structure
            availableSenses: 'data/senses.json',     // Tiered structure
            movementFeatures: 'data/movement_features.json', // Tiered structure
            descriptors: 'data/descriptors.json',      // Tiered structure
            skills: 'data/skills.json', // ADDED

            // Special Attack Limits and Upgrades
            limits: 'data/limits.json',
            upgrades: 'data/upgrades.json',

            // Attributes
            attributes: 'data/attributes.json',

            // Character Types
            characterTypes: 'data/character_type.json',

            // Tiers
            tiers: 'data/tiers.json',

            // Biography questionnaire
            bio: 'data/bio.json'

            // GameConstants (optional future externalization)
            // gameConstantsData: 'data/game_constants_data.json',
        };
        this.initialized = false;
        this.initPromise = null;
    }

    async _loadDataFile(key) {
        if (this.dataCache.has(key)) {
            return this.dataCache.get(key);
        }
        const path = this.dataFiles[key];
        if (!path) {
            console.error(`Data file path not defined for key: ${key}`);
            return null;
        }
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
            }
            const data = await response.json();
            this.dataCache.set(key, data);
            // console.log(`Loaded ${key} from ${path}`);
            return data;
        } catch (error) {
            console.error(`Error loading data file for ${key} from ${path}:`, error);
            this.dataCache.set(key, null); // Cache null on error to avoid re-fetching failed files repeatedly
            return null;
        }
    }

    init() {
        if (!this.initPromise) {
            console.log('🟡 GameDataManager: Initializing and loading all data files...');
            const loadPromises = Object.keys(this.dataFiles).map(key => this._loadDataFile(key));
            this.initPromise = Promise.all(loadPromises)
                .then(() => {
                    this.initialized = true;
                    console.log('✅ GameDataManager: All data files processed.');
                })
                .catch(error => {
                    console.error('❌ GameDataManager: Critical error during data file processing.', error);
                    // Potentially re-throw or handle critical failure
                });
        }
        return this.initPromise;
    }

    _getData(key, defaultValue = null) {
        if (!this.initialized) {
            console.warn(`GameDataManager accessed for ${key} before initialization. Call and await init() first.`);
            // For critical data, you might throw an error or return a more specific pending state.
            // However, app.js should await init(), so this ideally shouldn't happen often.
        }
        return this.dataCache.get(key) || defaultValue;
    }

    // Public Getters
    getActions() { return this._getData('actions', []); }
    getBoons() { return this._getData('boons', []); }
    getComplexUniqueAbilities() { return this._getData('complexUniqueAbilities', []); }

    getArchetypes() { return this._getData('archetypes', {}); } // Returns the whole object
    getArchetypesForCategory(category) {
        const archetypes = this.getArchetypes();
        return archetypes[category] || [];
    }

    getAttackTypeDefinitions() { return this._getData('attackTypesDefinitions', {}); }
    getEffectTypeDefinitions() { return this._getData('effectTypesDefinitions', {}); }
    getBasicConditions() { return this._getData('basicConditions', []); }
    getAdvancedConditions() { return this._getData('advancedConditions', []); }

    getAvailablePassiveBonuses() { return this._getData('availablePassiveBonuses', []); }
    // Backward compatibility method for existing code
    getAvailableFlaws() { return this.getAvailablePassiveBonuses(); }
    getGenericStatOptions() { return this._getData('genericStatOptions', []); } // For passive bonuses and traits
    getTraitConditionTiers() { return this._getData('traitConditionTiers', {}); }
    getConditionalBonuses() { return this._getData('conditionalBonuses', []); }

    getExpertiseCategories() { return this._getData('expertiseCategories', {}); }
    getAvailableFeatures() { return this._getData('availableFeatures', {}); }
    getAvailableSenses() { return this._getData('availableSenses', {}); }
    getMovementFeatures() { return this._getData('movementFeatures', {}); }
    getDescriptors() { return this._getData('descriptors', {}); }
    getSkills() { return this._getData('skills', []); } // ADDED

    getLimits() { return this._getData('limits', {}); }
    getUpgrades() { return this._getData('upgrades', {}); }

    // Attributes
    getAttributes() { return this._getData('attributes', {}); }

    // Character Types
    getCharacterTypes() { return this._getData('characterTypes', []); }

    // Tiers
    getTiers() { return this._getData('tiers', {}); }

    // Biography questionnaire
    getBio() { return this._getData('bio', { questionnaire: [] }); }
}

export const gameDataManager = new GameDataManager();