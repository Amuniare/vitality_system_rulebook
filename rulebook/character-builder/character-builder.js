// character-builder.js - Complete Rework
class VitalityCharacterBuilder {
    constructor() {
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.folders = this.loadFolders();
        this.gameData = {};
        this.validationEngine = null;
        this.currentAttackIndex = null;
        this.stepValidation = new StepValidation();
        
        this.init();
    }

    async init() {
        try {
            await this.loadGameData();
            this.validationEngine = new ValidationEngine(this.gameData);
            this.initializeEventListeners();
            this.initializeComponents();
            this.renderCharacterTree();
            this.updateAllDisplays();
            
            console.log('Character Builder v2.0 initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Character Builder:', error);
            this.showError('Failed to load character builder. Please refresh the page.');
        }
    }

    async loadGameData() {
        const dataFiles = [
            'archetypes.json',
            'upgrades.json', 
            'limits.json',
            'abilities.json',
            'validation-rules.json'
        ];

        for (const file of dataFiles) {
            try {
                const response = await fetch(`data/${file}`);
                if (!response.ok) throw new Error(`Failed to load ${file}`);
                const data = await response.json();
                const key = file.replace('.json', '').replace('-', '_');
                this.gameData[key] = data;
            } catch (error) {
                console.error(`Error loading ${file}:`, error);
                throw error;
            }
        }
    }

    // Character Management
    loadCharacters() {
        const saved = localStorage.getItem('vitality-characters-v2');
        return saved ? JSON.parse(saved) : {};
    }

    saveCharacters() {
        localStorage.setItem('vitality-characters-v2', JSON.stringify(this.characters));
    }

    loadFolders() {
        const saved = localStorage.getItem('vitality-folders-v2');
        return saved ? JSON.parse(saved) : {};
    }

    saveFolders() {
        localStorage.setItem('vitality-folders-v2', JSON.stringify(this.folders));
    }

    createNewCharacter(name = "New Character", folderId = null) {
        const id = Date.now().toString();
        const character = new VitalityCharacter(id, name, folderId);
        
        this.characters[id] = character;
        this.saveCharacters();
        return character;
    }

    createNewFolder(name = "New Folder") {
        const id = Date.now().toString();
        this.folders[id] = {
            id: id,
            name: name,
            expanded: true
        };
        this.saveFolders();
        this.renderCharacterTree();
        return id;
    }

    loadCharacter(characterId) {
        this.currentCharacter = this.characters[characterId];
        if (this.currentCharacter) {
            this.renderCharacterBuilder();
            this.updateAllDisplays();
            this.validateCurrentBuild();
            this.updateProgressIndicator();
        }
    }

    saveCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateAllStats();
        this.validateCurrentBuild();
        
        this.characters[this.currentCharacter.id] = this.currentCharacter;
        this.saveCharacters();
        
        this.renderCharacterTree();
        this.updateAllDisplays();
        
        this.showSuccess('Character saved successfully!');
    }

    deleteCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        if (confirm(`Are you sure you want to delete ${this.currentCharacter.name}?`)) {
            delete this.characters[this.currentCharacter.id];
            this.saveCharacters();
            this.currentCharacter = null;
            this.showWelcomeScreen();
            this.renderCharacterTree();
        }
    }

    // Data Gathering
    gatherFormData() {
        if (!this.currentCharacter) return;
        
        // Basic info
        this.currentCharacter.name = document.getElementById('character-name').value;
        this.currentCharacter.realName = document.getElementById('real-name').value;
        this.currentCharacter.tier = parseInt(document.getElementById('tier-select').value);
        
        // Attributes
        const attributes = ['focus', 'mobility', 'power', 'endurance', 'awareness', 'communication', 'intelligence'];
        attributes.forEach(attr => {
            const element = document.getElementById(`attr-${attr}`);
            if (element) {
                this.currentCharacter.attributes[attr] = parseInt(element.value) || 0;
            }
        });

        // Trait bonuses from limits
        const traitBonuses = ['accuracy', 'damage', 'conditions', 'avoidance', 'durability', 'resistance', 'movement'];
        traitBonuses.forEach(bonus => {
            const element = document.getElementById(`trait-${bonus}`);
            if (element) {
                this.currentCharacter.limits.traitBonuses[bonus] = parseInt(element.value) || 0;
            }
        });
    }

    // Point Pool System - Core Implementation
    calculatePointPools() {
        if (!this.currentCharacter) return { combat: 0, utility: 0, main: 0, utilityPool: 0, specialAttack: 0, limits: 0 };
        
        const tier = this.currentCharacter.tier;
        const archetypes = this.currentCharacter.archetypes;
        
        let pools = {
            combat: tier * 2,
            utility: tier,
            main: Math.max(0, (tier - 2) * 15),
            utilityPool: this.calculateUtilityPool(tier, archetypes.utility),
            specialAttack: this.calculateSpecialAttackPoints(),
            limits: this.calculateTotalLimitPoints()
        };

        // Apply archetype modifiers
        if (archetypes.uniqueAbility === 'extraordinary') {
            pools.main += Math.max(0, (tier - 2) * 15);
        }

        return pools;
    }

    calculateUtilityPool(tier, utilityArchetype) {
        switch(utilityArchetype) {
            case 'specialized':
            case 'jackOfAllTrades':
                return Math.max(1, 5 * (tier - 2));
            case 'practical':
            default:
                return Math.max(1, 5 * (tier - 1));
        }
    }

    calculateSpecialAttackPoints() {
        if (!this.currentCharacter) return 0;
        
        const archetype = this.currentCharacter.archetypes.specialAttack;
        const tier = this.currentCharacter.tier;
        const totalLimitPoints = this.calculateTotalLimitPoints();
        
        switch (archetype) {
            case 'normal':
                return this.applyLimitScaling(totalLimitPoints, tier) * (tier / 6);
            case 'specialist':
                return this.applyLimitScaling(totalLimitPoints, tier) * (tier / 3);
            case 'paragon':
                return tier * 10;
            case 'oneTrick':
                return tier * 20;
            case 'straightforward':
                return this.applyLimitScaling(totalLimitPoints, tier) * (tier / 2);
            case 'sharedUses':
                return this.applyLimitScaling(totalLimitPoints, tier);
            case 'dualNatured':
                return tier * 15; // Per attack, character gets 2 attacks
            case 'basic':
                return tier * 10; // For base attack enhancement only
            default:
                return this.applyLimitScaling(totalLimitPoints, tier);
        }
    }

    applyLimitScaling(limitPoints, tier) {
        // Implement proper limit point scaling from rulebook
        let upgradePoints = 0;
        const firstTier = tier * 10;
        const secondTier = tier * 20;
        
        if (limitPoints <= firstTier) {
            upgradePoints = limitPoints;
        } else if (limitPoints <= firstTier + secondTier) {
            upgradePoints = firstTier + (limitPoints - firstTier) * 0.5;
        } else {
            upgradePoints = firstTier + secondTier * 0.5 + (limitPoints - firstTier - secondTier) * 0.25;
        }
        
        return Math.floor(upgradePoints);
    }

    calculateTotalLimitPoints() {
        if (!this.currentCharacter) return 0;
        
        let total = 0;
        this.currentCharacter.specialAttacks.forEach(attack => {
            if (attack.limits) {
                attack.limits.forEach(limitId => {
                    const limit = this.findLimitById(limitId);
                    if (limit) {
                        total += limit.points;
                    }
                });
            }
        });
        
        return total;
    }

    findLimitById(limitId) {
        for (const category of Object.values(this.gameData.limits)) {
            const limit = category.find(l => l.id === limitId);
            if (limit) return limit;
        }
        return null;
    }

    calculatePointsSpent() {
        if (!this.currentCharacter) return;
        
        const spent = {
            combat: 0,
            utility: 0,
            main: 0,
            utilityPool: 0,
            specialAttack: 0
        };
        
        // Combat attributes
        spent.combat = this.currentCharacter.attributes.focus + 
                      this.currentCharacter.attributes.mobility + 
                      this.currentCharacter.attributes.power + 
                      this.currentCharacter.attributes.endurance;
        
        // Utility attributes
        spent.utility = this.currentCharacter.attributes.awareness + 
                       this.currentCharacter.attributes.communication + 
                       this.currentCharacter.attributes.intelligence;
        
        // Main pool (abilities) - properly distinguish traits from boons/flaws
        spent.main = this.calculateMainPoolSpent();
        
        // Utility pool
        spent.utilityPool = this.calculateUtilityPoolSpent();
        
        // Special attacks - sum of all attack costs
        spent.specialAttack = this.calculateSpecialAttackSpent();
        
        this.currentCharacter.pointsSpent = spent;
    }

    calculateMainPoolSpent() {
        if (!this.currentCharacter) return 0;
        
        let total = 0;
        const abilities = this.currentCharacter.abilities;
        
        // Boons - variable costs
        abilities.boons.forEach(boonId => {
            const boon = this.gameData.abilities.boons.find(b => b.id === boonId);
            if (boon) total += boon.cost;
        });
        
        // Traits - 30p each (NOT trait bonuses from limits)
        total += abilities.traits.length * 30;
        
        // Flaws - negative costs (give points back)
        abilities.flaws.forEach(flawId => {
            const flaw = this.gameData.abilities.flaws.find(f => f.id === flawId);
            if (flaw) total += flaw.cost; // Flaws have negative costs
        });
        
        return total;
    }

    calculateUtilityPoolSpent() {
        if (!this.currentCharacter) return 0;
        
        let total = 0;
        const utility = this.currentCharacter.utility;
        const tier = this.currentCharacter.tier;
        
        // Expertise - costs tier points per skill
        Object.values(utility.expertise).forEach(expertiseList => {
            total += expertiseList.length * tier;
        });
        
        // Features, Senses, Descriptors - variable costs
        ['features', 'senses', 'descriptors'].forEach(category => {
            utility[category].forEach(itemId => {
                const item = this.gameData.abilities[category]?.find(i => i.id === itemId);
                if (item) total += item.cost;
            });
        });
        
        return total;
    }

    calculateSpecialAttackSpent() {
        if (!this.currentCharacter) return 0;
        
        return this.currentCharacter.specialAttacks.reduce((total, attack) => {
            return total + (attack.upgradePointsSpent || 0);
        }, 0);
    }

    // Character Stats Calculation
    calculateAllStats() {
        if (!this.currentCharacter) return;
        
        this.calculatePointsSpent();
        this.calculateDerivedStats();
        this.applyArchetypeBonuses();
    }

    calculateDerivedStats() {
        if (!this.currentCharacter) return;
        
        const tier = this.currentCharacter.tier;
        const attrs = this.currentCharacter.attributes;
        const traitBonuses = this.currentCharacter.limits.traitBonuses;
        
        // Calculate base derived statistics according to rulebook
        const stats = {
            // Defense Stats
            avoidance: 10 + tier + attrs.mobility + traitBonuses.avoidance,
            durability: Math.ceil((tier + attrs.endurance) * 1.5) + traitBonuses.durability,
            resolve: 10 + tier + attrs.focus + traitBonuses.resistance,
            stability: 10 + tier + attrs.power + traitBonuses.resistance,
            vitality: 10 + tier + attrs.endurance + traitBonuses.resistance,
            
            // Combat Stats
            movement: tier + attrs.mobility + traitBonuses.movement,
            accuracy: tier + attrs.focus + traitBonuses.accuracy,
            damage: Math.ceil((tier + attrs.power) * 1.5) + traitBonuses.damage,
            conditions: tier * 2 + traitBonuses.conditions,
            initiative: tier + attrs.mobility + attrs.focus + attrs.awareness,
            
            // Health
            maxHP: 100 + (tier * 5),
            currentHP: 100 + (tier * 5)
        };
        
        this.currentCharacter.calculatedStats = stats;
    }

    applyArchetypeBonuses(stats = null) {
        if (!this.currentCharacter) return;
        
        const targetStats = stats || this.currentCharacter.calculatedStats;
        const archetypes = this.currentCharacter.archetypes;
        const tier = this.currentCharacter.tier;
        
        // Movement archetype bonuses
        if (archetypes.movement === 'swift') {
            targetStats.movement += Math.ceil(tier / 2);
        }
        
        // Defensive archetype bonuses
        if (archetypes.defensive === 'resilient') {
            targetStats.durability += tier;
        }
        
        if (archetypes.defensive === 'fortress') {
            targetStats.resolve += tier;
            targetStats.stability += tier;
            targetStats.vitality += tier;
        }
        
        if (archetypes.defensive === 'stalwart') {
            targetStats.avoidance -= tier; // Penalty
            // Note: Damage resistance is handled separately
        }
        
        if (archetypes.defensive === 'juggernaut') {
            targetStats.maxHP += tier * 5;
            targetStats.currentHP += tier * 5;
        }
        
        // Unique ability bonuses
        if (archetypes.uniqueAbility === 'cutAbove') {
            const bonus = tier <= 3 ? 1 : tier <= 6 ? 2 : 3;
            // Add to all core stats
            targetStats.accuracy += bonus;
            targetStats.damage += bonus;
            targetStats.conditions += bonus;
            targetStats.avoidance += bonus;
            targetStats.durability += bonus;
            targetStats.resolve += bonus;
            targetStats.stability += bonus;
            targetStats.vitality += bonus;
            targetStats.initiative += bonus;
            targetStats.movement += bonus;
        }
    }

    // Archetype Selection with Proper Order Enforcement
    selectArchetype(category, archetypeId) {
        if (!this.currentCharacter) return;
        
        // Validate archetype compatibility
        if (!this.validateArchetypeSelection(category, archetypeId)) {
            this.showError('Invalid archetype selection');
            return;
        }
        
        this.currentCharacter.archetypes[category] = archetypeId;
        
        // Recalculate everything that depends on archetypes
        this.calculateAllStats();
        this.updateAllDisplays();
        this.validateCurrentBuild();
        this.updateProgressIndicator();
        this.saveCurrentCharacter();
        
        // Update archetype display
        this.updateArchetypeDisplay(category);
    }

    validateArchetypeSelection(category, archetypeId) {
        const archetype = this.findArchetypeById(category, archetypeId);
        if (!archetype) return false;
        
        // Check for conflicts with existing selections
        if (category === 'movement' && archetypeId === 'behemoth') {
            // Behemoth cannot have movement-restricting limits
            const hasMovementLimits = this.currentCharacter.specialAttacks.some(attack => 
                attack.limits && attack.limits.some(limitId => {
                    const limit = this.findLimitById(limitId);
                    return limit && limit.restrictions && limit.restrictions.includes('behemoth');
                })
            );
            if (hasMovementLimits) {
                this.showError('Behemoth archetype conflicts with existing movement-restricting limits');
                return false;
            }
        }
        
        return true;
    }

    findArchetypeById(category, archetypeId) {
        if (!this.gameData.archetypes || !this.gameData.archetypes[category]) return null;
        return this.gameData.archetypes[category].find(arch => arch.id === archetypeId);
    }

    updateArchetypeDisplay(category) {
        const container = document.getElementById(`${category.replace(/([A-Z])/g, '-$1').toLowerCase()}-archetypes`);
        if (!container) return;
        
        container.querySelectorAll('.archetype-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedId = this.currentCharacter.archetypes[category];
        if (selectedId) {
            const selectedCard = Array.from(container.children).find(card => {
                const archetype = this.findArchetypeByName(category, card.querySelector('h4').textContent);
                return archetype && archetype.id === selectedId;
            });
            if (selectedCard) selectedCard.classList.add('selected');
        }
    }

    findArchetypeByName(category, name) {
        if (!this.gameData.archetypes || !this.gameData.archetypes[category]) return null;
        return this.gameData.archetypes[category].find(arch => arch.name === name);
    }

    // Special Attack System - Per-Attack Limits
    createSpecialAttack() {
        if (!this.currentCharacter) return;
        
        const archetype = this.currentCharacter.archetypes.specialAttack;
        
        // Check archetype restrictions
        if (archetype === 'basic') {
            this.showError('Basic archetype cannot create special attacks');
            return;
        }
        
        if (archetype === 'oneTrick' && this.currentCharacter.specialAttacks.length >= 1) {
            this.showError('One Trick archetype allows only one special attack');
            return;
        }
        
        if (archetype === 'dualNatured' && this.currentCharacter.specialAttacks.length >= 2) {
            this.showError('Dual-Natured archetype allows only two special attacks');
            return;
        }
        
        const attack = {
            id: Date.now().toString(),
            name: "",
            type: "melee",
            description: "",
            limits: [], // Per-attack limits
            upgrades: [], // Purchased upgrades
            condition: null,
            attackTypes: [], // Purchased attack types
            upgradePointsAvailable: 0,
            upgradePointsSpent: 0,
            limitPointsTotal: 0
        };
        
        this.currentCharacter.specialAttacks.push(attack);
        this.renderSpecialAttacks();
        this.calculateAllStats();
        this.updateAllDisplays();
    }

    addLimitToAttack(attackIndex, limitId) {
        if (!this.currentCharacter || !this.currentCharacter.specialAttacks[attackIndex]) return;
        
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        const archetype = this.currentCharacter.archetypes.specialAttack;
        
        // Check if archetype allows limits
        if (['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype)) {
            this.showError('This archetype cannot use limits');
            return;
        }
        
        const limit = this.findLimitById(limitId);
        if (!limit) return;
        
        // Check for conflicts
        if (limit.restrictions) {
            const movementArchetype = this.currentCharacter.archetypes.movement;
            if (limit.restrictions.includes('behemoth') && movementArchetype === 'behemoth') {
                this.showError('This limit conflicts with Behemoth archetype');
                return;
            }
        }
        
        // Add limit to this specific attack
        if (!attack.limits.includes(limitId)) {
            attack.limits.push(limitId);
            this.recalculateAttackPoints(attackIndex);
            this.saveCurrentCharacter();
        }
    }

    removeLimitFromAttack(attackIndex, limitId) {
        if (!this.currentCharacter || !this.currentCharacter.specialAttacks[attackIndex]) return;
        
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        const index = attack.limits.indexOf(limitId);
        
        if (index > -1) {
            attack.limits.splice(index, 1);
            this.recalculateAttackPoints(attackIndex);
            this.saveCurrentCharacter();
        }
    }

    recalculateAttackPoints(attackIndex) {
        if (!this.currentCharacter || !this.currentCharacter.specialAttacks[attackIndex]) return;
        
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        const tier = this.currentCharacter.tier;
        const archetype = this.currentCharacter.archetypes.specialAttack;
        
        // Calculate limit points for this attack
        let limitPoints = 0;
        attack.limits.forEach(limitId => {
            const limit = this.findLimitById(limitId);
            if (limit) limitPoints += limit.points;
        });
        
        attack.limitPointsTotal = limitPoints;
        
        // Calculate available upgrade points based on archetype
        switch (archetype) {
            case 'normal':
                attack.upgradePointsAvailable = this.applyLimitScaling(limitPoints, tier) * (tier / 6);
                break;
            case 'specialist':
                attack.upgradePointsAvailable = this.applyLimitScaling(limitPoints, tier) * (tier / 3);
                break;
            case 'straightforward':
                attack.upgradePointsAvailable = this.applyLimitScaling(limitPoints, tier) * (tier / 2);
                break;
            case 'paragon':
                attack.upgradePointsAvailable = tier * 10;
                break;
            case 'oneTrick':
                attack.upgradePointsAvailable = tier * 20;
                break;
            case 'dualNatured':
                attack.upgradePointsAvailable = tier * 15;
                break;
            case 'basic':
                attack.upgradePointsAvailable = tier * 10;
                break;
            default:
                attack.upgradePointsAvailable = this.applyLimitScaling(limitPoints, tier);
        }
        
        attack.upgradePointsAvailable = Math.floor(attack.upgradePointsAvailable);
        
        // Recalculate total spent points
        this.calculateAllStats();
        this.updateAllDisplays();
    }

    deleteAttack(index) {
        if (!this.currentCharacter) return;
        
        if (confirm('Are you sure you want to delete this attack?')) {
            this.currentCharacter.specialAttacks.splice(index, 1);
            this.renderSpecialAttacks();
            this.calculateAllStats();
            this.updateAllDisplays();
            this.validateCurrentBuild();
            this.saveCurrentCharacter();
        }
    }

    // Limits Selection for Specific Attack
    toggleLimitForAttack(attackIndex, limitId) {
        if (!this.currentCharacter) return;
        
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack) return;
        
        const index = attack.limits.indexOf(limitId);
        if (index > -1) {
            this.removeLimitFromAttack(attackIndex, limitId);
        } else {
            this.addLimitToAttack(attackIndex, limitId);
        }
        
        this.updateLimitDisplaysForAttack(attackIndex);
    }

    updateLimitDisplaysForAttack(attackIndex) {
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack) return;
        
        // Update limit cards to show selection state for this attack
        document.querySelectorAll('.limit-card').forEach(card => {
            card.classList.remove('selected');
            const limitId = card.dataset.limitId;
            
            if (attack.limits.includes(limitId)) {
                card.classList.add('selected');
            }
        });
    }

    // Ability Selection (Traits, Boons, Flaws)
    toggleAbility(category, abilityId) {
        if (!this.currentCharacter) return;
        
        const selected = this.currentCharacter.abilities[category];
        const index = selected.indexOf(abilityId);
        
        if (index > -1) {
            selected.splice(index, 1);
        } else {
            // Check if we can afford this ability
            if (category !== 'flaws' && !this.canAffordAbility(category, abilityId)) {
                this.showError('Not enough points for this ability');
                return;
            }
            
            selected.push(abilityId);
        }
        
        this.updateAbilityDisplay(category);
        this.calculateAllStats();
        this.updateAllDisplays();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    canAffordAbility(category, abilityId) {
        const pools = this.calculatePointPools();
        const spent = this.currentCharacter.pointsSpent;
        const available = pools.main - spent.main;
        
        if (category === 'traits') {
            return available >= 30; // Traits cost 30p each
        }
        
        if (category === 'boons') {
            const boon = this.gameData.abilities.boons.find(b => b.id === abilityId);
            return boon && available >= boon.cost;
        }
        
        return true; // Flaws give points
    }

    updateAbilityDisplay(category) {
        const selected = this.currentCharacter.abilities[category];
        
        document.querySelectorAll(`#${category}-list .ability-item`).forEach(item => {
            item.classList.remove('selected');
            const checkbox = item.querySelector('.ability-checkbox');
            const abilityId = item.dataset.abilityId;
            
            if (selected.includes(abilityId)) {
                item.classList.add('selected');
                if (checkbox) checkbox.checked = true;
            } else {
                if (checkbox) checkbox.checked = false;
            }
        });
    }

    // Utility Selection
    toggleUtility(category, itemId) {
        if (!this.currentCharacter) return;
        
        const selected = this.currentCharacter.utility[category];
        const index = selected.indexOf(itemId);
        
        if (index > -1) {
            selected.splice(index, 1);
        } else {
            if (!this.canAffordUtility(category, itemId)) {
                this.showError('Not enough utility points for this item');
                return;
            }
            
            selected.push(itemId);
        }
        
        this.updateUtilityDisplay(category);
        this.calculateAllStats();
        this.updateAllDisplays();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    canAffordUtility(category, itemId) {
        const pools = this.calculatePointPools();
        const spent = this.currentCharacter.pointsSpent;
        const available = pools.utilityPool - spent.utilityPool;
        
        if (category === 'expertise') {
            return available >= this.currentCharacter.tier;
        }
        
        const item = this.gameData.abilities[category]?.find(i => i.id === itemId);
        return item && available >= item.cost;
    }

    updateUtilityDisplay(category) {
        const selected = this.currentCharacter.utility[category];
        
        document.querySelectorAll(`#${category}-list .utility-item`).forEach(item => {
            item.classList.remove('selected');
            const checkbox = item.querySelector('.utility-checkbox');
            const itemId = item.dataset.itemId;
            
            if (selected.includes(itemId)) {
                item.classList.add('selected');
                if (checkbox) checkbox.checked = true;
            } else {
                if (checkbox) checkbox.checked = false;
            }
        });
    }

    toggleExpertise(attribute, skill) {
        if (!this.currentCharacter) return;
        
        const expertise = this.currentCharacter.utility.expertise[attribute];
        const index = expertise.indexOf(skill);
        
        if (index > -1) {
            expertise.splice(index, 1);
        } else {
            if (!this.canAffordUtility('expertise', null)) {
                this.showError('Not enough utility points for this expertise');
                return;
            }
            
            expertise.push(skill);
        }
        
        this.updateExpertiseDisplay();
        this.calculateAllStats();
        this.updateAllDisplays();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    updateExpertiseDisplay() {
        Object.entries(this.currentCharacter.utility.expertise).forEach(([attr, skills]) => {
            const container = document.querySelector(`#expertise-${attr}`);
            if (!container) return;
            
            container.querySelectorAll('.expertise-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const skillName = item.querySelector('label').textContent;
                
                if (skills.includes(skillName)) {
                    checkbox.checked = true;
                    item.classList.add('selected');
                } else {
                    checkbox.checked = false;
                    item.classList.remove('selected');
                }
            });
        });
    }

    // UI Updates
    updateAllDisplays() {
        if (!this.currentCharacter) return;
        
        // Basic info
        document.getElementById('character-name').value = this.currentCharacter.name;
        document.getElementById('real-name').value = this.currentCharacter.realName;
        document.getElementById('tier-select').value = this.currentCharacter.tier;
        
        // Attributes
        Object.entries(this.currentCharacter.attributes).forEach(([attr, value]) => {
            const element = document.getElementById(`attr-${attr}`);
            if (element) element.value = value;
        });
        
        // Trait bonuses
        Object.entries(this.currentCharacter.limits.traitBonuses).forEach(([bonus, value]) => {
            const element = document.getElementById(`trait-${bonus}`);
            if (element) element.value = value;
        });
        
        // Update all selections
        this.updateArchetypeDisplays();
        this.updateAbilityDisplays();
        this.updateUtilityDisplays();
        
        // Calculate and update points
        this.calculateAllStats();
        this.updatePointPools();
    }

    updateArchetypeDisplays() {
        Object.entries(this.currentCharacter.archetypes).forEach(([category, selectedId]) => {
            this.updateArchetypeDisplay(category);
        });
    }

    updateAbilityDisplays() {
        ['boons', 'traits', 'flaws'].forEach(category => {
            this.updateAbilityDisplay(category);
        });
        this.updateUtilityDisplays();
    }

    updateUtilityDisplays() {
        ['features', 'senses', 'descriptors'].forEach(category => {
            this.updateUtilityDisplay(category);
        });
        this.updateExpertiseDisplay();
    }

    updatePointPools() {
        if (!this.currentCharacter) return;
        
        const pools = this.calculatePointPools();
        const spent = this.currentCharacter.pointsSpent;
        
        // Update pool displays
        this.updatePoolDisplay('combat-points', spent.combat, pools.combat);
        this.updatePoolDisplay('utility-points', spent.utility, pools.utility);
        this.updatePoolDisplay('main-points', spent.main, pools.main);
        this.updatePoolDisplay('utility-pool-points', spent.utilityPool, pools.utilityPool);
        this.updatePoolDisplay('special-attack-points', spent.specialAttack, pools.specialAttack);
        this.updatePoolDisplay('limits-points', 0, pools.limits);
        
        // Update individual tab displays
        document.getElementById('combat-pool-display').textContent = pools.combat - spent.combat;
        document.getElementById('utility-pool-display').textContent = pools.utility - spent.utility;
        document.getElementById('main-pool-display').textContent = pools.main - spent.main;
        document.getElementById('utility-points-display').textContent = pools.utilityPool - spent.utilityPool;
        document.getElementById('special-attack-pool-display').textContent = pools.specialAttack - spent.specialAttack;
        
        // Update limits display
        document.getElementById('total-limit-points').textContent = pools.limits;
        
        // Update trait bonuses
        const totalTraitBonuses = Object.values(this.currentCharacter.limits.traitBonuses).reduce((sum, val) => sum + val, 0);
        const availableTraitBonuses = pools.limits / 15; // Each 15 points of limits gives 2 trait bonuses
        document.getElementById('available-trait-bonuses').textContent = Math.floor(availableTraitBonuses * 2);
        document.getElementById('bonuses-allocated').textContent = totalTraitBonuses;
        document.getElementById('bonuses-available').textContent = Math.floor(availableTraitBonuses * 2);
    }

    updatePoolDisplay(elementId, spent, available) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = `${spent}/${available}`;
        
        const poolItem = element.parentElement;
        poolItem.classList.remove('over-budget', 'fully-used');
        
        if (spent > available) {
            poolItem.classList.add('over-budget');
        } else if (spent === available && available > 0) {
            poolItem.classList.add('fully-used');
        }
    }

    // Progress and Validation
    updateProgressIndicator() {
        const steps = document.querySelectorAll('.progress-step');
        
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (this.isStepCompleted(index + 1)) {
                step.classList.add('completed');
            }
        });
        
        // Mark current active step
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const tabIndex = Array.from(document.querySelectorAll('.tab-btn')).indexOf(activeTab);
            if (steps[tabIndex]) {
                steps[tabIndex].classList.add('active');
            }
        }
    }

    isStepCompleted(stepNumber) {
        if (!this.currentCharacter) return false;
        
        switch (stepNumber) {
            case 1: // Archetypes
                return Object.values(this.currentCharacter.archetypes).every(arch => arch !== null);
            case 2: // Attributes  
                const totalCombat = Object.values(this.currentCharacter.attributes)
                    .slice(0, 4).reduce((sum, val) => sum + val, 0);
                const totalUtility = Object.values(this.currentCharacter.attributes)
                    .slice(4).reduce((sum, val) => sum + val, 0);
                return totalCombat > 0 && totalUtility > 0;
            case 3: // Limits (check if any attacks have limits OR archetype doesn't use limits)
                const archetype = this.currentCharacter.archetypes.specialAttack;
                if (['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype)) {
                    return true; // These don't use limits
                }
                return this.currentCharacter.specialAttacks.some(attack => attack.limits.length > 0);
            case 4: // Abilities
                return this.currentCharacter.abilities.boons.length > 0 ||
                       this.currentCharacter.abilities.traits.length > 0 ||
                       this.currentCharacter.abilities.flaws.length > 0;
            case 5: // Special Attacks
                const specialArchetype = this.currentCharacter.archetypes.specialAttack;
                if (specialArchetype === 'basic') return true; // Basic doesn't create special attacks
                return this.currentCharacter.specialAttacks.length > 0;
            case 6: // Utility
                return Object.values(this.currentCharacter.utility.expertise).some(arr => arr.length > 0) ||
                       this.currentCharacter.utility.features.length > 0 ||
                       this.currentCharacter.utility.senses.length > 0 ||
                       this.currentCharacter.utility.descriptors.length > 0;
            case 7: // Summary
                return this.currentCharacter.validationResults?.isValid || false;
            default:
                return false;
        }
    }

    validateCurrentBuild() {
        if (!this.currentCharacter || !this.validationEngine) return;
        
        const results = this.validationEngine.validateCharacter(this.currentCharacter);
        this.currentCharacter.validationResults = results;
        
        this.displayValidationResults(results);
        this.updateProgressIndicator();
    }

    displayValidationResults(results) {
        const container = document.getElementById('validation-messages');
        container.innerHTML = '';
        
        // Show errors
        results.errors.forEach(error => {
            const div = document.createElement('div');
            div.className = 'validation-message error';
            div.textContent = error;
            container.appendChild(div);
        });
        
        // Show warnings
        results.warnings.forEach(warning => {
            const div = document.createElement('div');
            div.className = 'validation-message warning';
            div.textContent = warning;
            container.appendChild(div);
        });
        
        // Show success message if valid
        if (results.isValid) {
            const div = document.createElement('div');
            div.className = 'validation-message success';
            div.textContent = 'Character build is valid!';
            container.appendChild(div);
        }
    }

    // UI Components Initialization
    initializeComponents() {
        this.initializeArchetypes();
        this.initializeLimits();
        this.initializeAbilities();
        this.initializeUtility();
        this.initializeUpgrades();
    }

    initializeArchetypes() {
        if (!this.gameData.archetypes) return;
        
        Object.entries(this.gameData.archetypes).forEach(([category, archetypes]) => {
            const container = document.getElementById(`${category.replace(/([A-Z])/g, '-$1').toLowerCase()}-archetypes`);
            if (!container) return;
            
            container.innerHTML = '';
            archetypes.forEach(archetype => {
                const card = document.createElement('div');
                card.className = 'archetype-card';
                card.innerHTML = `
                    <h4>${archetype.name}</h4>
                    <p>${archetype.description}</p>
                `;
                card.onclick = () => this.selectArchetype(category, archetype.id);
                container.appendChild(card);
            });
        });
    }

    initializeLimits() {
        if (!this.gameData.limits) return;
        
        Object.entries(this.gameData.limits).forEach(([category, limits]) => {
            const container = document.getElementById(`${category}-limits`);
            if (!container) return;
            
            container.innerHTML = '';
            limits.forEach(limit => {
                const card = document.createElement('div');
                card.className = 'limit-card';
                card.dataset.limitId = limit.id;
                card.innerHTML = `
                    <div class="limit-header">
                        <span class="limit-name">${limit.name}</span>
                        <span class="limit-value">${limit.points}p</span>
                    </div>
                    <div class="limit-description">${limit.description}</div>
                `;
                // Limit selection is handled per-attack in the attack builder
                container.appendChild(card);
            });
        });
    }

    initializeAbilities() {
        if (!this.gameData.abilities) return;
        
        ['boons', 'traits', 'flaws'].forEach(category => {
            const container = document.getElementById(`${category}-list`);
            if (!container || !this.gameData.abilities[category]) return;
            
            container.innerHTML = '';
            this.gameData.abilities[category].forEach(ability => {
                const item = document.createElement('div');
                item.className = 'ability-item';
                item.dataset.abilityId = ability.id;
                
                const costClass = ability.cost < 0 ? 'negative' : '';
                const displayCost = category === 'traits' ? '30' : ability.cost; // Traits always cost 30p
                
                item.innerHTML = `
                    <div class="ability-header">
                        <span class="ability-name">${ability.name}</span>
                        <span class="ability-cost ${costClass}">${displayCost}p</span>
                    </div>
                    <div class="ability-description">${ability.description}</div>
                    <div class="ability-controls">
                        <input type="checkbox" class="ability-checkbox" onchange="builder.toggleAbility('${category}', '${ability.id}')">
                        <label>Select</label>
                    </div>
                `;
                container.appendChild(item);
            });
        });
    }

    initializeUtility() {
        if (!this.gameData.abilities) return;
        
        // Initialize expertise
        this.initializeExpertise();
        
        // Initialize features, senses, descriptors
        ['features', 'senses', 'descriptors'].forEach(category => {
            const container = document.getElementById(`${category}-list`);
            if (!container || !this.gameData.abilities[category]) return;
            
            container.innerHTML = '';
            this.gameData.abilities[category].forEach(item => {
                const div = document.createElement('div');
                div.className = 'utility-item';
                div.dataset.itemId = item.id;
                div.innerHTML = `
                    <div class="utility-info">
                        <div class="utility-name">${item.name}</div>
                        <div class="utility-description">${item.description}</div>
                    </div>
                    <div class="utility-cost">${item.cost}p</div>
                    <input type="checkbox" class="utility-checkbox" onchange="builder.toggleUtility('${category}', '${item.id}')">
                `;
                container.appendChild(div);
            });
        });
    }

    initializeExpertise() {
        const container = document.getElementById('expertise-list');
        if (!container || !this.gameData.abilities.expertise) return;
        
        container.innerHTML = '';
        
        Object.entries(this.gameData.abilities.expertise).forEach(([attribute, skills]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'expertise-category';
            categoryDiv.innerHTML = `
                <h4>${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Expertise 
                    <span class="expertise-cost">${this.currentCharacter?.tier || 4}p each</span>
                </h4>
                <div id="expertise-${attribute}" class="expertise-grid"></div>
            `;
            
            const grid = categoryDiv.querySelector('.expertise-grid');
            skills.forEach(skill => {
                const item = document.createElement('div');
                item.className = 'expertise-item';
                item.innerHTML = `
                    <input type="checkbox" onchange="builder.toggleExpertise('${attribute}', '${skill}')">
                    <label>${skill}</label>
                `;
                grid.appendChild(item);
            });
            
            container.appendChild(categoryDiv);
        });
    }

    initializeUpgrades() {
        // This will be called when opening the attack builder modal
        if (!this.gameData.upgrades) return;
        
        Object.entries(this.gameData.upgrades).forEach(([category, upgrades]) => {
            const container = document.getElementById(`${category}-upgrades`);
            if (!container) return;
            
            container.innerHTML = '';
            upgrades.forEach(upgrade => {
                const div = document.createElement('div');
                div.className = 'upgrade-option';
                div.dataset.upgradeId = upgrade.id;
                div.dataset.category = category;
                div.innerHTML = `
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-cost">${upgrade.cost}p</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                `;
                div.onclick = () => this.toggleUpgrade(upgrade.id, category);
                container.appendChild(div);
            });
        });
    }

    // Event Listeners
    initializeEventListeners() {
        // Character management
        document.getElementById('new-folder-btn').onclick = () => {
            const name = prompt('Folder name:');
            if (name) this.createNewFolder(name);
        };
        
        document.getElementById('new-character-btn').onclick = () => {
            const name = prompt('Character name:');
            if (name) {
                const character = this.createNewCharacter(name);
                this.loadCharacter(character.id);
                this.renderCharacterTree();
            }
        };
        
        document.getElementById('import-character-btn').onclick = () => this.importCharacterJSON();
        
        // Character actions
        document.getElementById('save-character').onclick = () => this.saveCurrentCharacter();
        document.getElementById('export-json').onclick = () => this.exportCharacterJSON();
        document.getElementById('export-roll20').onclick = () => this.exportRoll20JSON();
        document.getElementById('delete-character').onclick = () => this.deleteCurrentCharacter();
        
        // Tier changes trigger full recalculation
        document.getElementById('tier-select').onchange = () => {
            if (this.currentCharacter) {
                this.gatherFormData();
                this.calculateAllStats();
                this.updateAllDisplays();
                this.validateCurrentBuild();
                this.saveCurrentCharacter();
            }
        };
        
        // Attribute changes
        ['focus', 'mobility', 'power', 'endurance', 'awareness', 'communication', 'intelligence'].forEach(attr => {
            const element = document.getElementById(`attr-${attr}`);
            if (element) {
                element.onchange = () => {
                    if (this.currentCharacter) {
                        this.gatherFormData();
                        this.calculateAllStats();
                        this.updateAllDisplays();
                        this.validateCurrentBuild();
                        this.saveCurrentCharacter();
                    }
                };
            }
        });
        
        // Trait bonus changes
        ['accuracy', 'damage', 'conditions', 'avoidance', 'durability', 'resistance', 'movement'].forEach(bonus => {
            const element = document.getElementById(`trait-${bonus}`);
            if (element) {
                element.onchange = () => {
                    if (this.currentCharacter) {
                        this.gatherFormData();
                        this.calculateAllStats();
                        this.updateAllDisplays();
                        this.validateCurrentBuild();
                        this.saveCurrentCharacter();
                    }
                };
            }
        });
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });
        
        // Progress indicator
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.onclick = () => {
                const tabBtns = document.querySelectorAll('.tab-btn');
                if (tabBtns[index]) {
                    this.switchTab(tabBtns[index].dataset.tab);
                }
            };
        });
        
        // Special attack management
        document.getElementById('add-special-attack').onclick = () => this.createSpecialAttack();
        
        // Summary actions
        document.getElementById('calculate-stats').onclick = () => this.calculateFinalStats();
        document.getElementById('validate-build').onclick = () => this.validateBuild();
        document.getElementById('generate-sheet').onclick = () => this.generateCharacterSheet();
        
        // File import
        document.getElementById('import-file-input').onchange = (e) => this.handleFileImport(e);
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update progress indicator
        this.updateProgressIndicator();
        
        // Render special attacks if on that tab
        if (tabName === 'special-attacks' && this.currentCharacter) {
            this.renderSpecialAttacks();
        }
        
        // Render summary if on that tab
        if (tabName === 'summary' && this.currentCharacter) {
            this.renderCharacterSummary();
        }
    }

    renderCharacterBuilder() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('character-builder').classList.remove('hidden');
    }

    showWelcomeScreen() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('character-builder').classList.add('hidden');
    }

    renderCharacterTree() {
        const tree = document.getElementById('character-tree');
        tree.innerHTML = '';
        
        // Render folders and characters
        Object.values(this.folders).forEach(folder => {
            const folderDiv = document.createElement('div');
            folderDiv.className = `folder-item ${folder.expanded ? 'expanded' : ''}`;
            folderDiv.innerHTML = `
                <div class="folder-header">📁 ${folder.name}</div>
                <div class="folder-contents" style="display: ${folder.expanded ? 'block' : 'none'}"></div>
            `;
            
            const folderContents = folderDiv.querySelector('.folder-contents');
            Object.values(this.characters)
                .filter(char => char.folderId === folder.id)
                .forEach(char => {
                    const charDiv = document.createElement('div');
                    charDiv.className = `character-item ${this.currentCharacter?.id === char.id ? 'active' : ''}`;
                    charDiv.textContent = char.name;
                    charDiv.onclick = () => this.loadCharacter(char.id);
                    folderContents.appendChild(charDiv);
                });
            
            folderDiv.querySelector('.folder-header').onclick = () => {
                folder.expanded = !folder.expanded;
                this.saveFolders();
                this.renderCharacterTree();
            };
            
            tree.appendChild(folderDiv);
        });
        
        // Render characters without folders
        Object.values(this.characters)
            .filter(char => !char.folderId)
            .forEach(char => {
                const charDiv = document.createElement('div');
                charDiv.className = `character-item ${this.currentCharacter?.id === char.id ? 'active' : ''}`;
                charDiv.textContent = char.name;
                charDiv.onclick = () => this.loadCharacter(char.id);
                tree.appendChild(charDiv);
            });
    }

    renderSpecialAttacks() {
        const container = document.getElementById('special-attacks-list');
        container.innerHTML = '';
        
        this.currentCharacter.specialAttacks.forEach((attack, index) => {
            const card = document.createElement('div');
            card.className = 'special-attack-card';
            card.innerHTML = `
                <div class="special-attack-header">
                    <input type="text" class="special-attack-name" value="${attack.name}" 
                           onchange="builder.updateAttackName(${index}, this.value)">
                    <div class="special-attack-cost">${attack.upgradePointsSpent || 0}/${attack.upgradePointsAvailable || 0}p</div>
                </div>
                <div class="attack-details">
                    <div class="attack-basic-info">
                        <div><strong>Type:</strong> ${attack.type}</div>
                        <div><strong>Description:</strong> ${attack.description}</div>
                        <div><strong>Limits:</strong> ${attack.limits.length} (${attack.limitPointsTotal || 0}p total)</div>
                    </div>
                    <div class="attack-actions">
                        <button onclick="builder.editAttack(${index})" class="btn-secondary">Edit Attack</button>
                        <button onclick="builder.deleteAttack(${index})" class="btn-danger">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    updateAttackName(index, name) {
        if (this.currentCharacter && this.currentCharacter.specialAttacks[index]) {
            this.currentCharacter.specialAttacks[index].name = name;
            this.saveCurrentCharacter();
        }
    }

    editAttack(index) {
        // TODO: Implement attack editing modal
        this.showInfo('Attack editing modal not yet implemented');
    }

    // Export Functions (Simplified)
    exportCharacterJSON() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateAllStats();
        
        const dataStr = JSON.stringify(this.currentCharacter, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentCharacter.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    exportRoll20JSON() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateAllStats();
        
        const roll20Data = this.convertToRoll20Format(this.currentCharacter);
        
        const dataStr = JSON.stringify(roll20Data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentCharacter.name.replace(/[^a-z0-9]/gi, '_')}_roll20.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    convertToRoll20Format(character) {
        const stats = character.calculatedStats;
        
        return {
            character_name: character.name,
            character_realname: character.realName,
            char_tier: character.tier,
            
            // Core attributes
            char_focus: character.attributes.focus,
            char_mobility: character.attributes.mobility,
            char_power: character.attributes.power,
            char_endurance: character.attributes.endurance,
            char_awareness: character.attributes.awareness,
            char_communication: character.attributes.communication,
            char_intelligence: character.attributes.intelligence,
            
            // Calculated stats
            char_avoidance: stats.avoidance,
            char_durability: stats.durability,
            char_resolve: stats.resolve,
            char_stability: stats.stability,
            char_vitality: stats.vitality,
            char_movement: stats.movement,
            char_accuracy: stats.accuracy,
            char_damage: stats.damage,
            char_conditions: stats.conditions,
            char_initiative: stats.initiative,
            char_hp: stats.currentHP,
            char_hp_max: stats.maxHP,
            
            // Special attacks as abilities
            abilities: character.specialAttacks.map(attack => ({
                name: attack.name,
                content: `Special Attack: ${attack.name}`,
                showInMacroBar: true,
                isTokenAction: true
            }))
        };
    }

    // Import Functions (Simplified)
    importCharacterJSON() {
        document.getElementById('import-file-input').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const character = JSON.parse(e.target.result);
                
                if (this.validateImportedCharacter(character)) {
                    character.id = Date.now().toString();
                    this.characters[character.id] = character;
                    this.saveCharacters();
                    
                    this.loadCharacter(character.id);
                    this.renderCharacterTree();
                    
                    this.showSuccess('Character imported successfully!');
                } else {
                    this.showError('Invalid character file format.');
                }
            } catch (error) {
                this.showError('Failed to parse character file.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Clear the input
        event.target.value = '';
    }

    validateImportedCharacter(character) {
        return character &&
               typeof character.name === 'string' &&
               typeof character.tier === 'number' &&
               character.attributes &&
               character.archetypes;
    }

    // Summary Functions
    calculateFinalStats() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateAllStats();
        this.renderCharacterSummary();
        this.showSuccess('Final stats calculated!');
    }

    validateBuild() {
        this.validateCurrentBuild();
        this.showInfo('Build validation complete. Check the validation panel for results.');
    }

    generateCharacterSheet() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateAllStats();
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(this.generatePrintableSheet());
        newWindow.document.close();
    }

    generatePrintableSheet() {
        const character = this.currentCharacter;
        const stats = character.calculatedStats;
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${character.name} - Character Sheet</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .stat-section { border: 1px solid #000; padding: 10px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${character.name}</h1>
                <p><strong>Real Name:</strong> ${character.realName}</p>
                <p><strong>Tier:</strong> ${character.tier}</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-section">
                    <h3>Attributes</h3>
                    <p>Focus: ${character.attributes.focus}</p>
                    <p>Mobility: ${character.attributes.mobility}</p>
                    <p>Power: ${character.attributes.power}</p>
                    <p>Endurance: ${character.attributes.endurance}</p>
                    <p>Awareness: ${character.attributes.awareness}</p>
                    <p>Communication: ${character.attributes.communication}</p>
                    <p>Intelligence: ${character.attributes.intelligence}</p>
                </div>
                
                <div class="stat-section">
                    <h3>Defense Stats</h3>
                    <p>Avoidance: ${stats.avoidance}</p>
                    <p>Durability: ${stats.durability}</p>
                    <p>Resolve: ${stats.resolve}</p>
                    <p>Stability: ${stats.stability}</p>
                    <p>Vitality: ${stats.vitality}</p>
                </div>
                
                <div class="stat-section">
                    <h3>Combat Stats</h3>
                    <p>Movement: ${stats.movement}</p>
                    <p>Accuracy: ${stats.accuracy}</p>
                    <p>Damage: ${stats.damage}</p>
                    <p>Conditions: ${stats.conditions}</p>
                    <p>Initiative: ${stats.initiative}</p>
                    <p>Hit Points: ${stats.maxHP}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    renderCharacterSummary() {
        const container = document.getElementById('character-summary');
        if (!this.currentCharacter) return;
        
        const character = this.currentCharacter;
        const stats = character.calculatedStats;
        const pools = this.calculatePointPools();
        const spent = character.pointsSpent;
        
        container.innerHTML = `
            <div class="summary-section">
                <h3>Character Overview</h3>
                <div class="summary-item">
                    <span class="label">Name:</span>
                    <span class="value">${character.name}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Real Name:</span>
                    <span class="value">${character.realName}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Tier:</span>
                    <span class="value">${character.tier}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Build Valid:</span>
                    <span class="value">${character.validationResults?.isValid ? 'Yes' : 'No'}</span>
                </div>
            </div>
            
            <div class="summary-section">
                <h3>Point Allocation</h3>
                <div class="summary-item">
                    <span class="label">Combat Attributes:</span>
                    <span class="value">${spent.combat}/${pools.combat}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Utility Attributes:</span>
                    <span class="value">${spent.utility}/${pools.utility}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Main Pool:</span>
                    <span class="value">${spent.main}/${pools.main}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Utility Pool:</span>
                    <span class="value">${spent.utilityPool}/${pools.utilityPool}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Special Attacks:</span>
                    <span class="value">${spent.specialAttack}/${pools.specialAttack}</span>
                </div>
            </div>
            
            <div class="summary-section">
                <h3>Calculated Statistics</h3>
                <div class="calculated-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-name">Avoidance</div>
                            <div class="stat-value">${stats.avoidance || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Durability</div>
                            <div class="stat-value">${stats.durability || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Movement</div>
                            <div class="stat-value">${stats.movement || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Accuracy</div>
                            <div class="stat-value">${stats.accuracy || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Damage</div>
                            <div class="stat-value">${stats.damage || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Hit Points</div>
                            <div class="stat-value">${stats.maxHP || 100}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility Methods
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border: 1px solid var(--accent-primary);
            background: var(--bg-secondary);
            color: var(--text-light);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'error') {
            notification.style.borderColor = '#ff4444';
            notification.style.color = '#ff9999';
        } else if (type === 'success') {
            notification.style.borderColor = '#00ff00';
            notification.style.color = '#99ff99';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Proper Character Data Structure
class VitalityCharacter {
    constructor(id, name, folderId = null) {
        this.id = id;
        this.name = name;
        this.realName = "";
        this.tier = 4;
        this.folderId = folderId;
        this.version = "2.0";
        
        // Archetypes must be selected first
        this.archetypes = {
            movement: null,
            attackType: null,
            effectType: null,
            uniqueAbility: null,
            defensive: null,
            specialAttack: null,
            utility: null
        };
        
        // Attributes
        this.attributes = {
            focus: 0,
            mobility: 0,
            power: 0,
            endurance: 0,
            awareness: 0,
            communication: 0,
            intelligence: 0
        };
        
        // Limits system - properly tracks trait bonuses from limits
        this.limits = {
            traitBonuses: {
                accuracy: 0,
                damage: 0,
                conditions: 0,
                avoidance: 0,
                durability: 0,
                resistance: 0,
                movement: 0
            }
        };
        
        // Main pool purchases - distinguish traits (30p abilities) from trait bonuses
        this.abilities = {
            boons: [],      // Variable costs
            traits: [],     // 30p each (NOT trait bonuses from limits)
            flaws: []       // Negative costs (give points)
        };
        
        // Special attacks with per-attack limits
        this.specialAttacks = [];
        
        // Utility purchases
        this.utility = {
            expertise: {
                awareness: [],
                communication: [],
                intelligence: [],
                focus: [],
                mobility: [],
                endurance: [],
                power: []
            },
            features: [],
            senses: [],
            descriptors: []
        };
        
        // Calculated values
        this.pointsSpent = {
            combat: 0,
            utility: 0,
            main: 0,
            utilityPool: 0,
            specialAttack: 0
        };
        
        this.calculatedStats = {};
        
        this.validationResults = {
            isValid: false,
            errors: [],
            warnings: []
        };
    }
}

// Enhanced Validation Engine
class ValidationEngine {
    constructor(gameData) {
        this.gameData = gameData;
    }

    validateCharacter(character) {
        const errors = [];
        const warnings = [];
        
        // Validate basic info
        if (!character.name || character.name.trim() === '') {
            errors.push('Character name is required');
        }
        
        if (character.tier < 1 || character.tier > 10) {
            errors.push('Character tier must be between 1 and 10');
        }
        
        // Validate archetype completion
        this.validateArchetypes(character, errors, warnings);
        
        // Validate point allocations
        this.validatePointAllocations(character, errors, warnings);
        
        // Validate archetype-specific restrictions
        this.validateArchetypeRestrictions(character, errors, warnings);
        
        // Validate trait bonus allocation
        this.validateTraitBonuses(character, errors, warnings);
        
        // Validate special attack restrictions
        this.validateSpecialAttackRestrictions(character, errors, warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    validateArchetypes(character, errors, warnings) {
        const archetypes = character.archetypes;
        const requiredArchetypes = ['movement', 'attackType', 'effectType', 'uniqueAbility', 'defensive', 'specialAttack', 'utility'];
        
        requiredArchetypes.forEach(type => {
            if (!archetypes[type]) {
                errors.push(`${this.capitalizeWords(type)} archetype is required`);
            }
        });
    }

    validatePointAllocations(character, errors, warnings) {
        const pools = this.calculatePointPools(character);
        const spent = this.calculatePointsSpent(character);
        
        // Check for over-budget spending
        if (spent.combat > pools.combat) {
            errors.push(`Combat attributes over budget: ${spent.combat}/${pools.combat}`);
        }
        
        if (spent.utility > pools.utility) {
            errors.push(`Utility attributes over budget: ${spent.utility}/${pools.utility}`);
        }
        
        if (spent.main > pools.main) {
            errors.push(`Main pool over budget: ${spent.main}/${pools.main}`);
        }
        
        if (spent.utilityPool > pools.utilityPool) {
            errors.push(`Utility pool over budget: ${spent.utilityPool}/${pools.utilityPool}`);
        }
        
        if (spent.specialAttack > pools.specialAttack) {
            errors.push(`Special attack points over budget: ${spent.specialAttack}/${pools.specialAttack}`);
        }
        
        // Check attribute maximums
        Object.entries(character.attributes).forEach(([attr, value]) => {
            if (value > character.tier) {
                errors.push(`${this.capitalizeWords(attr)} cannot exceed tier (${character.tier})`);
            }
        });
    }

    validateArchetypeRestrictions(character, errors, warnings) {
        const archetypes = character.archetypes;
        
        // Special Attack archetype restrictions
        if (archetypes.specialAttack === 'oneTrick' && character.specialAttacks.length > 1) {
            errors.push('One Trick archetype allows only one special attack');
        }
        
        if (archetypes.specialAttack === 'dualNatured' && character.specialAttacks.length !== 2) {
            if (character.specialAttacks.length < 2) {
                warnings.push('Dual-Natured archetype should have exactly 2 special attacks');
            } else {
                errors.push('Dual-Natured archetype allows only 2 special attacks');
            }
        }
        
        if (archetypes.specialAttack === 'basic' && character.specialAttacks.length > 0) {
            errors.push('Basic archetype cannot create special attacks');
        }
        
        // Movement archetype restrictions
        if (archetypes.movement === 'behemoth') {
            // Check for conflicting limits
            character.specialAttacks.forEach(attack => {
                attack.limits.forEach(limitId => {
                    const limit = this.findLimitById(limitId);
                    if (limit && limit.restrictions && limit.restrictions.includes('behemoth')) {
                        errors.push('Behemoth archetype conflicts with movement-restricting limits');
                    }
                });
            });
        }
    }

    validateTraitBonuses(character, errors, warnings) {
        const totalLimitPoints = this.calculateTotalLimitPoints(character);
        const availableBonuses = Math.floor(totalLimitPoints / 15) * 2; // 2 bonuses per 15 points of limits
        const allocatedBonuses = Object.values(character.limits.traitBonuses).reduce((sum, val) => sum + val, 0);
        
        if (allocatedBonuses > availableBonuses) {
            errors.push(`Too many trait bonuses allocated: ${allocatedBonuses}/${availableBonuses}`);
        }
        
        if (allocatedBonuses < availableBonuses && totalLimitPoints > 0) {
            warnings.push(`${availableBonuses - allocatedBonuses} unallocated trait bonuses`);
        }
    }

    validateSpecialAttackRestrictions(character, errors, warnings) {
        const archetype = character.archetypes.specialAttack;
        
        // Validate that limit-using archetypes have limits
        if (['normal', 'specialist', 'straightforward', 'sharedUses'].includes(archetype)) {
            const hasLimits = character.specialAttacks.some(attack => attack.limits && attack.limits.length > 0);
            if (!hasLimits && character.specialAttacks.length > 0) {
                warnings.push('This archetype typically uses limits to generate points for special attacks');
            }
        }
        
        // Validate that non-limit archetypes don't have limits
        if (['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype)) {
            const hasLimits = character.specialAttacks.some(attack => attack.limits && attack.limits.length > 0);
            if (hasLimits) {
                errors.push('This archetype cannot use limits');
            }
        }
    }

    findLimitById(limitId) {
        for (const category of Object.values(this.gameData.limits)) {
            const limit = category.find(l => l.id === limitId);
            if (limit) return limit;
        }
        return null;
    }

    calculatePointPools(character) {
        // Simplified version for validation
        const tier = character.tier;
        return {
            combat: tier * 2,
            utility: tier,
            main: Math.max(0, (tier - 2) * 15),
            utilityPool: Math.max(0, 5 * (tier - 1)),
            specialAttack: this.calculateTotalLimitPoints(character)
        };
    }

    calculatePointsSpent(character) {
        return {
            combat: character.attributes.focus + character.attributes.mobility + 
                   character.attributes.power + character.attributes.endurance,
            utility: character.attributes.awareness + character.attributes.communication + 
                    character.attributes.intelligence,
            main: character.abilities.boons.length * 15 + character.abilities.traits.length * 30 - 
                  character.abilities.flaws.length * 20,
            utilityPool: Object.values(character.utility.expertise).reduce((sum, arr) => sum + arr.length, 0) * character.tier,
            specialAttack: character.specialAttacks.reduce((sum, attack) => sum + (attack.upgradePointsSpent || 0), 0)
        };
    }

    calculateTotalLimitPoints(character) {
        let total = 0;
        character.specialAttacks.forEach(attack => {
            if (attack.limits) {
                attack.limits.forEach(limitId => {
                    const limit = this.findLimitById(limitId);
                    if (limit) total += limit.points;
                });
            }
        });
        return total;
    }

    capitalizeWords(str) {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
}

// Step Validation Helper
class StepValidation {
    constructor() {
        this.stepRequirements = {
            1: 'archetypes', // Must complete before moving to step 2
            2: 'attributes', // Must complete before moving to step 3
            3: 'limits',     // Can work on in parallel with others
            4: 'abilities',  // Can work on in parallel with others  
            5: 'specialAttacks', // Can work on in parallel with others
            6: 'utility',    // Can work on in parallel with others
            7: 'summary'     // Final validation
        };
    }

    canAccessStep(stepNumber, character) {
        if (!character) return stepNumber === 1;
        
        switch (stepNumber) {
            case 1:
                return true; // Always can access archetypes
            case 2:
                return this.isArchetypesComplete(character);
            default:
                return this.isArchetypesComplete(character) && this.isAttributesStarted(character);
        }
    }

    isArchetypesComplete(character) {
        return Object.values(character.archetypes).every(arch => arch !== null);
    }

    isAttributesStarted(character) {
        const totalAttributes = Object.values(character.attributes).reduce((sum, val) => sum + val, 0);
        return totalAttributes > 0;
    }
}

// Initialize the application
let builder;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        builder = new VitalityCharacterBuilder();
        
        // Add global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            builder?.showError('An unexpected error occurred. Please refresh the page.');
        });
        
        console.log('Vitality Character Builder v2.0 initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Character Builder:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ff4444;">
                <h1>Initialization Error</h1>
                <p>Failed to load the Character Builder. Please refresh the page and try again.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
});

// Make builder globally accessible for HTML onclick handlers
window.builder = builder;