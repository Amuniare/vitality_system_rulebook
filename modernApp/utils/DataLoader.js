// utils/DataLoader.js
export class DataLoader {
    constructor() {
        this.cache = {};
    }

    async loadFlaws() {
        if (this.cache.flaws) return this.cache.flaws;
        
        try {
            const response = await fetch('/data/flaws.json');
            const data = await response.json();
            this.cache.flaws = this.processEntities(data.flaws || data, 'flaw');
            return this.cache.flaws;
        } catch (error) {
            console.error('Error loading flaws:', error);
            return [];
        }
    }

    async loadTraits() {
        if (this.cache.traits) return this.cache.traits;
        
        try {
            const response = await fetch('/data/traits.json');
            const data = await response.json();
            this.cache.traits = this.processEntities(data.traits || data, 'trait');
            return this.cache.traits;
        } catch (error) {
            console.error('Error loading traits:', error);
            return [];
        }
    }

    async loadBoons() {
        if (this.cache.boons) return this.cache.boons;
        
        try {
            const response = await fetch('/data/boons.json');
            const data = await response.json();
            this.cache.boons = this.processEntities(data.boons || data, 'boon');
            return this.cache.boons;
        } catch (error) {
            console.error('Error loading boons:', error);
            return [];
        }
    }

    async loadActionUpgrades() {
        if (this.cache.actions) return this.cache.actions;
        
        try {
            const response = await fetch('/data/action-upgrades.json');
            const data = await response.json();
            this.cache.actions = this.processEntities(data.actions || data.actionUpgrades || data, 'action');
            return this.cache.actions;
        } catch (error) {
            console.error('Error loading action upgrades:', error);
            return [];
        }
    }

    processEntities(entities, type) {
        if (!Array.isArray(entities)) {
            entities = Object.values(entities);
        }
        
        return entities.map(entity => ({
            ...entity,
            id: entity.id || this.generateId(entity.name, type),
            cost: entity.cost || 30,
            type: type,
            effects: this.normalizeEffects(entity.effects),
            requirements: entity.requirements || []
        }));
    }

    normalizeEffects(effects) {
        if (!effects) return [];
        if (Array.isArray(effects)) return effects;
        if (typeof effects === 'object') return [effects];
        if (typeof effects === 'string') return [effects];
        return [];
    }

    generateId(name, type) {
        return `${type}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
    }

    // Add these methods to the existing DataLoader class

    async loadArchetypes() {
        if (this.cache.archetypes) return this.cache.archetypes;
        
        try {
            const response = await fetch('/data/archetypes.json');
            const data = await response.json();
            this.cache.archetypes = this.processArchetypes(data.archetypes || data);
            return this.cache.archetypes;
        } catch (error) {
            console.error('Error loading archetypes:', error);
            return [];
        }
    }

    async loadUniqueAbilities() {
        if (this.cache.uniqueAbilities) return this.cache.uniqueAbilities;
        
        try {
            const response = await fetch('/data/unique-abilities.json');
            const data = await response.json();
            this.cache.uniqueAbilities = this.processEntities(data.abilities || data, 'uniqueAbility');
            return this.cache.uniqueAbilities;
        } catch (error) {
            console.error('Error loading unique abilities:', error);
            return [];
        }
    }

    async loadSpecialAttacks() {
        if (this.cache.specialAttacks) return this.cache.specialAttacks;
        
        try {
            const response = await fetch('/data/special-attacks.json');
            const data = await response.json();
            this.cache.specialAttacks = this.processEntities(data.attacks || data, 'specialAttack');
            return this.cache.specialAttacks;
        } catch (error) {
            console.error('Error loading special attacks:', error);
            return [];
        }
    }

    async loadArchetypeTraits() {
        if (this.cache.archetypeTraits) return this.cache.archetypeTraits;
        
        try {
            const response = await fetch('/data/archetype-traits.json');
            const data = await response.json();
            this.cache.archetypeTraits = this.processEntities(data.traits || data, 'archetypeTrait');
            return this.cache.archetypeTraits;
        } catch (error) {
            console.error('Error loading archetype traits:', error);
            return [];
        }
    }

    async loadArchetypeUpgrades() {
        if (this.cache.archetypeUpgrades) return this.cache.archetypeUpgrades;
        
        try {
            const response = await fetch('/data/archetype-upgrades.json');
            const data = await response.json();
            this.cache.archetypeUpgrades = this.processEntities(data.upgrades || data, 'archetypeUpgrade');
            return this.cache.archetypeUpgrades;
        } catch (error) {
            console.error('Error loading archetype upgrades:', error);
            return [];
        }
    }

    processArchetypes(archetypes) {
        if (!Array.isArray(archetypes)) {
            archetypes = Object.values(archetypes);
        }
        
        return archetypes.map(arch => ({
            ...arch,
            id: arch.id || this.generateId(arch.name, 'archetype'),
            stats: arch.stats || {},
            growth: arch.growth || {},
            features: arch.features || [],
            playstyle: arch.playstyle || ''
        }));
    }

}

