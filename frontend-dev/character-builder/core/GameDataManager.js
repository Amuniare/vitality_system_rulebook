// GameDataManager.js - Simplified for new streamlined system
class GameDataManager {
    constructor() {
        this.dataCache = new Map();
        this.dataFiles = {
            // Core simplified system files
            archetypes: 'data/archetypes.json',      // New 4-category system
            boons: 'data/boons.json',                // Unified boon system (replaces traits/flaws/actions)

            // Attack system (simplified)
            basicConditions: 'data/conditions_basic.json',
            advancedConditions: 'data/conditions_advanced.json',

            // Utility system (kept from archive for now)
            availableFeatures: 'data/features.json',
            availableSenses: 'data/senses.json',
            movementFeatures: 'data/movement_features.json',
            descriptors: 'data/descriptors.json',

            // Character basics
            attributes: 'data/attributes.json',
            characterTypes: 'data/character_type.json',
            bio: 'data/bio.json',

            // REMOVED from simplified system:
            // - actions.json (quick actions removed)
            // - limits.json (complex limits system removed)
            // - upgrades.json (complex upgrade system removed)
            // - flaws.json (merged into boons)
            // - traits.json (merged into boons)
            // - complex unique abilities (simplified)
            // - attack/effect type definitions (simplified)
            // - expertise.json (simplified skill system)
            // - tiers.json (simplified to level 1-5)
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
            console.log(`📚 Loaded simplified ${key} data`);
            return data;
        } catch (error) {
            console.error(`Error loading data file for ${key} from ${path}:`, error);
            this.dataCache.set(key, null);
            return null;
        }
    }

    init() {
        if (!this.initPromise) {
            console.log('🚀 GameDataManager: Initializing simplified data system...');
            const loadPromises = Object.keys(this.dataFiles).map(key => this._loadDataFile(key));
            this.initPromise = Promise.all(loadPromises)
                .then(() => {
                    this.initialized = true;
                    console.log('✅ GameDataManager: Simplified system ready!');
                    this._logSystemStatus();
                })
                .catch(error => {
                    console.error('❌ GameDataManager: Critical error during data loading.', error);
                });
        }
        return this.initPromise;
    }

    _logSystemStatus() {
        const archetypes = this.getArchetypes();
        const boons = this.getBoons();

        console.log('📊 Simplified System Status:');
        console.log(`  - Movement Archetypes: ${archetypes.movement?.length || 0}`);
        console.log(`  - Attack Archetypes: ${archetypes.attack?.length || 0}`);
        console.log(`  - Defensive Archetypes: ${archetypes.defensive?.length || 0}`);
        console.log(`  - Utility Archetypes: ${archetypes.utility?.length || 0}`);
        console.log(`  - Available Boons: ${boons.length}`);
    }

    _getData(key, defaultValue = null) {
        if (!this.initialized) {
            console.warn(`GameDataManager accessed for ${key} before initialization. Call and await init() first.`);
        }
        return this.dataCache.get(key) || defaultValue;
    }

    // Simplified Public Getters

    // Archetype system (4 categories)
    getArchetypes() {
        return this._getData('archetypes', {
            movement: [],
            attack: [],
            defensive: [],
            utility: []
        });
    }

    getArchetypesForCategory(category) {
        const archetypes = this.getArchetypes();
        return archetypes[category] || [];
    }

    // Unified boon system
    getBoons() {
        return this._getData('boons', []);
    }

    getBoonsByCategory(category) {
        const boons = this.getBoons();
        return boons.filter(boon => boon.category === category);
    }

    getBoonById(id) {
        const boons = this.getBoons();
        return boons.find(boon => boon.id === id);
    }

    // Condition system (kept for special attacks)
    getBasicConditions() {
        return this._getData('basicConditions', []);
    }

    getAdvancedConditions() {
        return this._getData('advancedConditions', []);
    }

    // Utility system (kept from archive)
    getAvailableFeatures() {
        return this._getData('availableFeatures', {});
    }

    getAvailableSenses() {
        return this._getData('availableSenses', {});
    }

    getMovementFeatures() {
        return this._getData('movementFeatures', {});
    }

    getDescriptors() {
        return this._getData('descriptors', {});
    }

    // Character basics
    getAttributes() {
        return this._getData('attributes', {});
    }

    getCharacterTypes() {
        return this._getData('characterTypes', []);
    }

    getBio() {
        return this._getData('bio', { questionnaire: [] });
    }

    // Simplified level system
    getLevelInfo(level) {
        const tierTable = {
            1: { tier: 3, boons: 1 },
            2: { tier: 3, boons: 2 },
            3: { tier: 4, boons: 3 },
            4: { tier: 4, boons: 4 },
            5: { tier: 5, boons: 5 }
        };
        return tierTable[level] || { tier: 4, boons: 4 };
    }

    // Validation helpers
    validateArchetypeSelection(archetypes) {
        const required = ['movement', 'attack', 'defensive', 'utility'];
        const missing = required.filter(category => !archetypes[category]);
        return {
            isValid: missing.length === 0,
            missing: missing
        };
    }

    validateBoonSelection(boons, level) {
        const maxBoons = this.getLevelInfo(level).boons;
        return {
            isValid: boons.length <= maxBoons,
            current: boons.length,
            max: maxBoons,
            remaining: maxBoons - boons.length
        };
    }

    // REMOVED GETTERS (no longer part of simplified system):
    // - getActions() - Quick actions removed
    // - getLimits() - Complex limits removed
    // - getUpgrades() - Complex upgrades removed
    // - getAvailableFlaws() - Merged into boons
    // - getComplexUniqueAbilities() - Simplified
    // - getAttackTypeDefinitions() - Simplified
    // - getEffectTypeDefinitions() - Simplified
    // - getExpertiseCategories() - Simplified skill system
    // - getTiers() - Simple level 1-5 system
}

export const gameDataManager = new GameDataManager();