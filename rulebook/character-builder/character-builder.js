// character-builder.js
class VitalityCharacterBuilder {
    constructor() {
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.folders = this.loadFolders();
        this.gameData = {};
        this.validationEngine = null;
        this.currentAttackIndex = 0;
        
        this.init();
    }

    async init() {
        try {
            // Load all game data
            await this.loadGameData();
            
            // Initialize validation engine
            this.validationEngine = new ValidationEngine(this.gameData);
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Initialize UI components
            this.initializeComponents();
            
            // Render initial state
            this.renderCharacterTree();
            this.updateAllDisplays();
            
            console.log('Character Builder initialized successfully');
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

    // Save/Load System
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

    // Character Management
    createNewCharacter(name = "New Character", folderId = null) {
        const id = Date.now().toString();
        const character = {
            id: id,
            name: name,
            realName: "",
            tier: 4,
            folderId: folderId,
            version: "2.0",
            archetypes: {
                movement: null,
                attackType: null,
                effectType: null,
                uniqueAbility: null,
                defensive: null,
                specialAttack: null,
                utility: null
            },
            attributes: {
                focus: 0,
                mobility: 0,
                power: 0,
                endurance: 0,
                awareness: 0,
                communication: 0,
                intelligence: 0
            },
            limits: {
                selected: [],
                traitBonuses: {
                    accuracy: 0,
                    damage: 0,
                    conditions: 0,
                    avoidance: 0,
                    durability: 0,
                    resistance: 0,
                    movement: 0
                }
            },
            abilities: {
                boons: [],
                traits: [],
                flaws: []
            },
            specialAttacks: [],
            utility: {
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
            },
            pointsSpent: {
                combat: 0,
                utility: 0,
                main: 0,
                utilityPool: 0,
                specialAttack: 0
            },
            calculatedStats: {},
            validationResults: {
                isValid: false,
                errors: [],
                warnings: []
            }
        };
        
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
        
        // Gather data from form
        this.gatherFormData();
        
        // Calculate derived values
        this.calculatePointsSpent();
        this.calculateStats();
        
        // Validate build
        this.validateCurrentBuild();
        
        // Save to storage
        this.characters[this.currentCharacter.id] = this.currentCharacter;
        this.saveCharacters();
        
        // Update displays
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

        // Trait bonuses
        const traitBonuses = ['accuracy', 'damage', 'conditions', 'avoidance', 'durability', 'resistance', 'movement'];
        traitBonuses.forEach(bonus => {
            const element = document.getElementById(`trait-${bonus}`);
            if (element) {
                this.currentCharacter.limits.traitBonuses[bonus] = parseInt(element.value) || 0;
            }
        });
    }

    // Point Pool Calculations
    calculatePointPools() {
        if (!this.currentCharacter) return { combat: 0, utility: 0, main: 0, utilityPool: 0, specialAttack: 0 };
        
        const tier = this.currentCharacter.tier;
        const archetypes = this.currentCharacter.archetypes;
        
        let pools = {
            combat: tier * 2,
            utility: tier,
            main: Math.max(0, (tier - 2) * 15),
            utilityPool: Math.max(0, 5 * (tier - 1)),
            specialAttack: this.calculateSpecialAttackPoints(),
            limits: this.calculateLimitPoints()
        };

        // Apply archetype modifiers
        if (archetypes.uniqueAbility === 'extraordinary') {
            pools.main += Math.max(0, (tier - 2) * 15);
        }

        return pools;
    }

    calculateSpecialAttackPoints() {
        if (!this.currentCharacter) return 0;
        
        const archetype = this.currentCharacter.archetypes.specialAttack;
        const tier = this.currentCharacter.tier;
        const limitPoints = this.calculateLimitPoints();
        
        switch (archetype) {
            case 'normal': return limitPoints;
            case 'specialist': return Math.floor(limitPoints * 1.5);
            case 'paragon': return tier * 10;
            case 'oneTrick': return tier * 20;
            case 'straightforward': return limitPoints * 2;
            case 'sharedUses': return limitPoints;
            case 'dualNatured': return tier * 15 * 2;
            case 'basic': return tier * 10;
            default: return limitPoints;
        }
    }

    calculateLimitPoints() {
        if (!this.currentCharacter || !this.gameData.limits) return 0;
        
        let total = 0;
        const selectedLimits = this.currentCharacter.limits.selected || [];
        
        selectedLimits.forEach(limitId => {
            const limit = this.findLimitById(limitId);
            if (limit) {
                total += limit.points;
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
        
        // Main pool (abilities)
        spent.main = this.calculateAbilityCosts();
        
        // Utility pool
        spent.utilityPool = this.calculateUtilityCosts();
        
        // Special attacks
        spent.specialAttack = this.calculateSpecialAttackCosts();
        
        this.currentCharacter.pointsSpent = spent;
    }

    calculateAbilityCosts() {
        if (!this.currentCharacter) return 0;
        
        let total = 0;
        const abilities = this.currentCharacter.abilities;
        
        // Boons
        abilities.boons.forEach(boonId => {
            const boon = this.gameData.abilities.boons.find(b => b.id === boonId);
            if (boon) total += boon.cost;
        });
        
        // Traits
        abilities.traits.forEach(traitId => {
            const trait = this.gameData.abilities.traits.find(t => t.id === traitId);
            if (trait) total += trait.cost;
        });
        
        // Flaws (negative cost)
        abilities.flaws.forEach(flawId => {
            const flaw = this.gameData.abilities.flaws.find(f => f.id === flawId);
            if (flaw) total += flaw.cost; // Flaws have negative costs
        });
        
        return total;
    }

    calculateUtilityCosts() {
        if (!this.currentCharacter) return 0;
        
        let total = 0;
        const utility = this.currentCharacter.utility;
        
        // Expertise (each costs 1 point per tier)
        Object.values(utility.expertise).forEach(expertiseList => {
            total += expertiseList.length * this.currentCharacter.tier;
        });
        
        // Features
        utility.features.forEach(featureId => {
            const feature = this.gameData.abilities.features.find(f => f.id === featureId);
            if (feature) total += feature.cost;
        });
        
        // Senses
        utility.senses.forEach(senseId => {
            const sense = this.gameData.abilities.senses.find(s => s.id === senseId);
            if (sense) total += sense.cost;
        });
        
        // Descriptors
        utility.descriptors.forEach(descriptorId => {
            const descriptor = this.gameData.abilities.descriptors.find(d => d.id === descriptorId);
            if (descriptor) total += descriptor.cost;
        });
        
        return total;
    }

    calculateSpecialAttackCosts() {
        if (!this.currentCharacter) return 0;
        
        return this.currentCharacter.specialAttacks.reduce((total, attack) => {
            return total + (attack.totalCost || 0);
        }, 0);
    }

    calculateStats() {
        if (!this.currentCharacter) return;
        
        const tier = this.currentCharacter.tier;
        const attrs = this.currentCharacter.attributes;
        const traitBonuses = this.currentCharacter.limits.traitBonuses;
        
        // Calculate derived statistics
        const stats = {
            // Defense Stats
            avoidance: 10 + tier + attrs.mobility + traitBonuses.avoidance,
            durability: Math.ceil((tier + attrs.endurance + traitBonuses.durability) * 1.5),
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
        
        // Apply archetype bonuses
        this.applyArchetypeBonuses(stats);
        
        this.currentCharacter.calculatedStats = stats;
    }

    applyArchetypeBonuses(stats) {
        if (!this.currentCharacter) return;
        
        const archetypes = this.currentCharacter.archetypes;
        const tier = this.currentCharacter.tier;
        
        // Apply specific archetype bonuses
        if (archetypes.movement === 'swift') {
            stats.movement += Math.ceil(tier / 2);
        }
        
        if (archetypes.defensive === 'resilient') {
            stats.durability += tier;
        }
        
        if (archetypes.defensive === 'fortress') {
            stats.resolve += tier;
            stats.stability += tier;
            stats.vitality += tier;
        }
        
        if (archetypes.defensive === 'juggernaut') {
            stats.maxHP += tier * 5;
            stats.currentHP += tier * 5;
        }
        
        if (archetypes.uniqueAbility === 'cutAbove') {
            const bonus = tier <= 3 ? 1 : tier <= 6 ? 2 : 3;
            Object.keys(this.currentCharacter.attributes).forEach(attr => {
                this.currentCharacter.attributes[attr] += bonus;
            });
        }
    }

    // UI Updates
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
        const availableTraitBonuses = this.currentCharacter.limits.selected.length * 2;
        document.getElementById('available-trait-bonuses').textContent = availableTraitBonuses;
        document.getElementById('bonuses-allocated').textContent = totalTraitBonuses;
        document.getElementById('bonuses-available').textContent = availableTraitBonuses;
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
        
        // Update selections
        this.updateArchetypeDisplays();
        this.updateLimitDisplays();
        this.updateAbilityDisplays();
        
        // Calculate and update points
        this.calculatePointsSpent();
        this.updatePointPools();
    }

    updateArchetypeDisplays() {
        Object.entries(this.currentCharacter.archetypes).forEach(([category, selectedId]) => {
            const container = document.getElementById(`${category.replace(/([A-Z])/g, '-$1').toLowerCase()}-archetypes`);
            if (!container) return;
            
            container.querySelectorAll('.archetype-card').forEach(card => {
                card.classList.remove('selected');
                const archetype = this.findArchetypeByName(category, card.querySelector('h4').textContent);
                if (archetype && archetype.id === selectedId) {
                    card.classList.add('selected');
                }
            });
        });
    }

    updateLimitDisplays() {
        const selectedLimits = this.currentCharacter.limits.selected;
        
        document.querySelectorAll('.limit-card').forEach(card => {
            card.classList.remove('selected');
            const limitId = card.dataset.limitId;
            if (selectedLimits.includes(limitId)) {
                card.classList.add('selected');
            }
        });
    }

    updateAbilityDisplays() {
        // Update boons
        this.updateAbilityCategory('boons');
        this.updateAbilityCategory('traits');
        this.updateAbilityCategory('flaws');
        
        // Update utility items
        this.updateUtilityDisplays();
    }

    updateAbilityCategory(category) {
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

    updateUtilityDisplays() {
        // Update expertise
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
        
        // Update features, senses, descriptors
        ['features', 'senses', 'descriptors'].forEach(category => {
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
        });
    }

    findArchetypeByName(category, name) {
        if (!this.gameData.archetypes || !this.gameData.archetypes[category]) return null;
        return this.gameData.archetypes[category].find(arch => arch.name === name);
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

    // Initialize Components
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
                card.onclick = () => this.toggleLimit(limit.id);
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
                
                item.innerHTML = `
                    <div class="ability-header">
                        <span class="ability-name">${ability.name}</span>
                        <span class="ability-cost ${costClass}">${ability.cost}p</span>
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

    // Selection Methods
    selectArchetype(category, archetypeId) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.archetypes[category] = archetypeId;
        this.updateArchetypeDisplay(category);
        this.gatherFormData();
        this.calculatePointsSpent();
        this.updatePointPools();
        this.validateCurrentBuild();
        this.updateProgressIndicator();
        this.saveCurrentCharacter();
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

    toggleLimit(limitId) {
        if (!this.currentCharacter) return;
        
        const selected = this.currentCharacter.limits.selected;
        const index = selected.indexOf(limitId);
        
        if (index > -1) {
            selected.splice(index, 1);
        } else {
            selected.push(limitId);
        }
        
        this.updateLimitDisplays();
        this.gatherFormData();
        this.calculatePointsSpent();
        this.updatePointPools();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    toggleAbility(category, abilityId) {
        if (!this.currentCharacter) return;
        
        const selected = this.currentCharacter.abilities[category];
        const index = selected.indexOf(abilityId);
        
        if (index > -1) {
            selected.splice(index, 1);
        } else {
            selected.push(abilityId);
        }
        
        this.updateAbilityCategory(category);
        this.gatherFormData();
        this.calculatePointsSpent();
        this.updatePointPools();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    toggleExpertise(attribute, skill) {
        if (!this.currentCharacter) return;
        
        const expertise = this.currentCharacter.utility.expertise[attribute];
        const index = expertise.indexOf(skill);
        
        if (index > -1) {
            expertise.splice(index, 1);
        } else {
            expertise.push(skill);
        }
        
        this.updateUtilityDisplays();
        this.gatherFormData();
        this.calculatePointsSpent();
        this.updatePointPools();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    toggleUtility(category, itemId) {
        if (!this.currentCharacter) return;
        
        const selected = this.currentCharacter.utility[category];
        const index = selected.indexOf(itemId);
        
        if (index > -1) {
            selected.splice(index, 1);
        } else {
            selected.push(itemId);
        }
        
        this.updateUtilityDisplays();
        this.gatherFormData();
        this.calculatePointsSpent();
        this.updatePointPools();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    // Special Attack Management
    openAttackBuilder(attackIndex = null) {
        this.currentAttackIndex = attackIndex;
        const modal = document.getElementById('attack-builder-modal');
        modal.classList.remove('hidden');
        
        if (attackIndex !== null) {
            this.loadAttackIntoBuilder(this.currentCharacter.specialAttacks[attackIndex]);
        } else {
            this.resetAttackBuilder();
        }
        
        this.updateAttackBuilderDisplay();
    }

    closeAttackBuilder() {
        document.getElementById('attack-builder-modal').classList.add('hidden');
        this.currentAttackIndex = null;
    }

    loadAttackIntoBuilder(attack) {
        document.getElementById('attack-name').value = attack.name || '';
        document.getElementById('attack-type').value = attack.type || 'melee';
        document.getElementById('attack-description').value = attack.description || '';
        
        // Load selected upgrades
        if (attack.upgrades) {
            attack.upgrades.forEach(upgradeId => {
                const upgradeElement = document.querySelector(`[data-upgrade-id="${upgradeId}"]`);
                if (upgradeElement) {
                    upgradeElement.classList.add('selected');
                }
            });
        }
        
        // Load condition settings
        if (attack.condition) {
            document.getElementById('condition-type').value = attack.condition.type || 'none';
            if (attack.condition.type === 'weaken') {
                document.getElementById('weaken-target').value = attack.condition.target || 'accuracy';
                document.getElementById('weaken-amount').value = attack.condition.amount || 1;
                document.getElementById('weaken-options').classList.remove('hidden');
            }
        }
    }

    resetAttackBuilder() {
        document.getElementById('attack-name').value = '';
        document.getElementById('attack-type').value = 'melee';
        document.getElementById('attack-description').value = '';
        document.getElementById('condition-type').value = 'none';
        document.getElementById('weaken-options').classList.add('hidden');
        
        // Clear all upgrade selections
        document.querySelectorAll('.upgrade-option').forEach(option => {
            option.classList.remove('selected');
        });
    }

    updateAttackBuilderDisplay() {
        const pools = this.calculatePointPools();
        const spent = this.calculateSpecialAttackCosts();
        const available = pools.specialAttack - spent;
        
        document.getElementById('attack-points-available').textContent = available;
        
        this.updateAttackCostBreakdown();
        this.updateUpgradeConflicts();
    }

    updateAttackCostBreakdown() {
        const breakdown = document.getElementById('attack-cost-breakdown');
        breakdown.innerHTML = '';
        
        let totalCost = 0;
        const selectedUpgrades = document.querySelectorAll('.upgrade-option.selected');
        
        selectedUpgrades.forEach(option => {
            const upgradeId = option.dataset.upgradeId;
            const category = option.dataset.category;
            const upgrade = this.gameData.upgrades[category].find(u => u.id === upgradeId);
            
            if (upgrade) {
                totalCost += upgrade.cost;
                
                const costItem = document.createElement('div');
                costItem.className = 'cost-item';
                costItem.innerHTML = `
                    <span>${upgrade.name}</span>
                    <span>${upgrade.cost}p</span>
                `;
                breakdown.appendChild(costItem);
            }
        });
        
        const totalItem = document.createElement('div');
        totalItem.className = 'cost-item total';
        totalItem.innerHTML = `
            <span><strong>Total Cost</strong></span>
            <span><strong>${totalCost}p</strong></span>
        `;
        breakdown.appendChild(totalItem);
    }

    updateUpgradeConflicts() {
        const selectedUpgrades = Array.from(document.querySelectorAll('.upgrade-option.selected'))
            .map(el => el.dataset.upgradeId);
        
        document.querySelectorAll('.upgrade-option').forEach(option => {
            option.classList.remove('conflict', 'disabled');
            
            const upgradeId = option.dataset.upgradeId;
            const category = option.dataset.category;
            const upgrade = this.gameData.upgrades[category].find(u => u.id === upgradeId);
            
            if (upgrade && upgrade.conflicts) {
                const hasConflict = upgrade.conflicts.some(conflictId => 
                    selectedUpgrades.includes(conflictId)
                );
                
                if (hasConflict && !selectedUpgrades.includes(upgradeId)) {
                    option.classList.add('disabled');
                } else if (hasConflict && selectedUpgrades.includes(upgradeId)) {
                    option.classList.add('conflict');
                }
            }
        });
    }

    toggleUpgrade(upgradeId, category) {
        const option = document.querySelector(`[data-upgrade-id="${upgradeId}"]`);
        if (!option || option.classList.contains('disabled')) return;
        
        option.classList.toggle('selected');
        this.updateAttackBuilderDisplay();
    }

    saveAttack() {
        if (!this.currentCharacter) return;
        
        const attack = {
            name: document.getElementById('attack-name').value || 'Unnamed Attack',
            type: document.getElementById('attack-type').value,
            description: document.getElementById('attack-description').value || '',
            upgrades: Array.from(document.querySelectorAll('.upgrade-option.selected'))
                .map(el => el.dataset.upgradeId),
            condition: this.getSelectedCondition(),
            totalCost: this.calculateCurrentAttackCost()
        };
        
        if (this.currentAttackIndex !== null) {
            this.currentCharacter.specialAttacks[this.currentAttackIndex] = attack;
        } else {
            this.currentCharacter.specialAttacks.push(attack);
        }
        
        this.closeAttackBuilder();
        this.renderSpecialAttacks();
        this.gatherFormData();
        this.calculatePointsSpent();
        this.updatePointPools();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
    }

    getSelectedCondition() {
        const conditionType = document.getElementById('condition-type').value;
        
        if (conditionType === 'none') {
            return null;
        }
        
        const condition = { type: conditionType };
        
        if (conditionType === 'weaken') {
            condition.target = document.getElementById('weaken-target').value;
            condition.amount = parseInt(document.getElementById('weaken-amount').value) || 1;
        }
        
        return condition;
    }

    calculateCurrentAttackCost() {
        return Array.from(document.querySelectorAll('.upgrade-option.selected'))
            .reduce((total, option) => {
                const upgradeId = option.dataset.upgradeId;
                const category = option.dataset.category;
                const upgrade = this.gameData.upgrades[category].find(u => u.id === upgradeId);
                return total + (upgrade ? upgrade.cost : 0);
            }, 0);
    }

    renderSpecialAttacks() {
        const container = document.getElementById('special-attacks-list');
        container.innerHTML = '';
        
        this.currentCharacter.specialAttacks.forEach((attack, index) => {
            const card = document.createElement('div');
            card.className = 'special-attack-card';
            card.innerHTML = `
                <div class="special-attack-header">
                    <input type="text" class="special-attack-name" value="${attack.name}" readonly>
                    <div class="special-attack-cost">${attack.totalCost}p</div>
                </div>
                <div class="attack-details">
                    <div class="attack-basic-info">
                        <div><strong>Type:</strong> ${attack.type}</div>
                        <div><strong>Description:</strong> ${attack.description}</div>
                        ${attack.condition ? `<div><strong>Condition:</strong> ${this.formatCondition(attack.condition)}</div>` : ''}
                    </div>
                    <div class="attack-upgrades">
                        <h5>Upgrades:</h5>
                        <div class="upgrade-list">
                            ${attack.upgrades.map(upgradeId => {
                                const upgrade = this.findUpgradeById(upgradeId);
                                return upgrade ? `<span class="upgrade-tag">${upgrade.name}</span>` : '';
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="attack-actions">
                    <button onclick="builder.openAttackBuilder(${index})" class="btn-secondary">Edit</button>
                    <button onclick="builder.deleteAttack(${index})" class="btn-danger">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    findUpgradeById(upgradeId) {
        for (const category of Object.values(this.gameData.upgrades)) {
            const upgrade = category.find(u => u.id === upgradeId);
            if (upgrade) return upgrade;
        }
        return null;
    }

    formatCondition(condition) {
        if (condition.type === 'weaken') {
            return `Weaken ${condition.target} by ${condition.amount}`;
        }
        return condition.type.charAt(0).toUpperCase() + condition.type.slice(1);
    }

    deleteAttack(index) {
        if (confirm('Are you sure you want to delete this attack?')) {
            this.currentCharacter.specialAttacks.splice(index, 1);
            this.renderSpecialAttacks();
            this.gatherFormData();
            this.calculatePointsSpent();
            this.updatePointPools();
            this.validateCurrentBuild();
            this.saveCurrentCharacter();
        }
    }

    // Validation System
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

    updateProgressIndicator() {
        const steps = document.querySelectorAll('.progress-step');
        
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            // Mark as completed based on character data
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
            case 3: // Limits
                return this.currentCharacter.limits.selected.length > 0;
            case 4: // Abilities
                return this.currentCharacter.abilities.boons.length > 0 ||
                       this.currentCharacter.abilities.traits.length > 0 ||
                       this.currentCharacter.abilities.flaws.length > 0;
            case 5: // Special Attacks
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

    // Export Functions
    exportCharacterJSON() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateStats();
        
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
        this.calculateStats();
        
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
            char_efforts: 2,
            
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
                content: this.generateScriptCardsTemplate(attack),
                showInMacroBar: true,
                isTokenAction: true
            })),
            
            // Repeating sections would be added here
            repeating: {
                traits: this.convertTraitsToRoll20(character),
                uniqueAbilities: this.convertAbilitiesToRoll20(character),
                features: this.convertFeaturesToRoll20(character)
            }
        };
    }

    generateScriptCardsTemplate(attack) {
        // Generate ScriptCards macro for the attack
        let template = `!script {{ --#title|${attack.name} --#subtitle|@{character_name} `;
        
        // Add attack roll
        template += `--=AttackRoll|1d20 + @{char_accuracy} `;
        
        // Add upgrades effects
        attack.upgrades.forEach(upgradeId => {
            const upgrade = this.findUpgradeById(upgradeId);
            if (upgrade) {
                template += `--#${upgrade.effect}|${upgrade.value} `;
            }
        });
        
        template += `}}`;
        
        return template;
    }

    convertTraitsToRoll20(character) {
        return character.abilities.traits.map(traitId => {
            const trait = this.gameData.abilities.traits.find(t => t.id === traitId);
            return {
                traitActive: 1,
                traitName: trait?.name || traitId,
                traitAcBonus: 0, // Would need to be calculated based on trait bonuses
                traitDgBonus: 0,
                traitCnBonus: 0,
                // ... other bonuses
            };
        });
    }

    convertAbilitiesToRoll20(character) {
        return character.abilities.boons.map(boonId => {
            const boon = this.gameData.abilities.boons.find(b => b.id === boonId);
            return {
                char_uniqueAbilities: boon?.name || boonId,
                uniqueAbilitiesDesc: boon?.description || ''
            };
        });
    }

    convertFeaturesToRoll20(character) {
        return character.utility.features.map(featureId => {
            const feature = this.gameData.abilities.features.find(f => f.id === featureId);
            return {
                char_features: feature?.name || featureId,
                featuresDesc: feature?.description || ''
            };
        });
    }

    // Import Functions
    importCharacterJSON() {
        const input = document.getElementById('import-file-input');
        input.click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const character = JSON.parse(e.target.result);
                
                // Validate imported character
                if (this.validateImportedCharacter(character)) {
                    // Generate new ID and add to characters
                    character.id = Date.now().toString();
                    this.characters[character.id] = character;
                    this.saveCharacters();
                    
                    // Load the imported character
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
        // Basic validation of imported character structure
        return character &&
               typeof character.name === 'string' &&
               typeof character.tier === 'number' &&
               character.attributes &&
               character.archetypes &&
               character.abilities;
    }

    // Summary Tab Functions
    calculateFinalStats() {
        if (!this.currentCharacter) return;
        
        this.gatherFormData();
        this.calculateStats();
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
        this.calculateStats();
        
        // Open a new window with a printable character sheet
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
                .special-attacks { margin-top: 20px; }
                .attack { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
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
            
            <div class="special-attacks">
                <h3>Special Attacks</h3>
                ${character.specialAttacks.map(attack => `
                    <div class="attack">
                        <h4>${attack.name}</h4>
                        <p><strong>Type:</strong> ${attack.type}</p>
                        <p><strong>Description:</strong> ${attack.description}</p>
                        <p><strong>Upgrades:</strong> ${attack.upgrades.map(id => this.findUpgradeById(id)?.name || id).join(', ')}</p>
                    </div>
                `).join('')}
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
                            <div class="stat-name">Resolve</div>
                            <div class="stat-value">${stats.resolve || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Stability</div>
                            <div class="stat-value">${stats.stability || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Vitality</div>
                            <div class="stat-value">${stats.vitality || 0}</div>
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
                            <div class="stat-name">Conditions</div>
                            <div class="stat-value">${stats.conditions || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Initiative</div>
                            <div class="stat-value">${stats.initiative || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-name">Hit Points</div>
                            <div class="stat-value">${stats.maxHP || 100}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="summary-section">
                <h3>Archetypes</h3>
                ${Object.entries(character.archetypes).map(([category, archetypeId]) => {
                    const archetype = this.findArchetypeById(category, archetypeId);
                    return `
                        <div class="summary-item">
                            <span class="label">${this.capitalizeWords(category)}:</span>
                            <span class="value">${archetype?.name || 'None'}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="summary-section">
                <h3>Special Attacks (${character.specialAttacks.length})</h3>
                ${character.specialAttacks.map(attack => `
                    <div class="summary-item">
                        <span class="label">${attack.name}:</span>
                        <span class="value">${attack.totalCost}p</span>
                    </div>
                `).join('') || '<p>No special attacks created.</p>'}
            </div>
        `;
    }

    findArchetypeById(category, archetypeId) {
        if (!this.gameData.archetypes || !this.gameData.archetypes[category]) return null;
        return this.gameData.archetypes[category].find(arch => arch.id === archetypeId);
    }

    capitalizeWords(str) {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
        
        // Tier changes
        document.getElementById('tier-select').onchange = () => {
            if (this.currentCharacter) {
                this.gatherFormData();
                this.calculatePointsSpent();
                this.updatePointPools();
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
                        this.calculatePointsSpent();
                        this.updatePointPools();
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
                        this.calculatePointsSpent();
                        this.updatePointPools();
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
        
        // Special attack builder
        document.getElementById('add-special-attack').onclick = () => this.openAttackBuilder();
        document.getElementById('save-attack').onclick = () => this.saveAttack();
        document.getElementById('cancel-attack').onclick = () => this.closeAttackBuilder();
        
        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = () => {
                btn.closest('.modal').classList.add('hidden');
            };
        });
        
        // Condition type change
        document.getElementById('condition-type').onchange = (e) => {
            const weakenOptions = document.getElementById('weaken-options');
            if (e.target.value === 'weaken') {
                weakenOptions.classList.remove('hidden');
            } else {
                weakenOptions.classList.add('hidden');
            }
        };
        
        // Summary actions
        document.getElementById('calculate-stats').onclick = () => this.calculateFinalStats();
        document.getElementById('validate-build').onclick = () => this.validateBuild();
        document.getElementById('generate-sheet').onclick = () => this.generateCharacterSheet();
        
        // File import
        document.getElementById('import-file-input').onchange = (e) => this.handleFileImport(e);
        
        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
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

// Validation Engine Class
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
        
        // Validate point allocations
        this.validatePointAllocations(character, errors, warnings);
        
        // Validate archetype selections
        this.validateArchetypes(character, errors, warnings);
        
        // Validate upgrade conflicts
        this.validateUpgradeConflicts(character, errors, warnings);
        
        // Validate trait bonus allocation
        this.validateTraitBonuses(character, errors, warnings);
        
        // Validate ability requirements
        this.validateAbilityRequirements(character, errors, warnings);
        
        // Validate special attack archetype restrictions
        this.validateSpecialAttackRestrictions(character, errors, warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    validatePointAllocations(character, errors, warnings) {
        const pools = this.calculatePointPools(character);
        const spent = this.calculatePointsSpent(character);
        
        // Combat attributes
        if (spent.combat > pools.combat) {
            errors.push(`Combat attributes over budget: ${spent.combat}/${pools.combat}`);
        }
        
        // Utility attributes
        if (spent.utility > pools.utility) {
            errors.push(`Utility attributes over budget: ${spent.utility}/${pools.utility}`);
        }
        
        // Main pool
        if (spent.main > pools.main) {
            errors.push(`Main pool over budget: ${spent.main}/${pools.main}`);
        }
        
        // Utility pool
        if (spent.utilityPool > pools.utilityPool) {
            errors.push(`Utility pool over budget: ${spent.utilityPool}/${pools.utilityPool}`);
        }
        
        // Special attacks
        if (spent.specialAttack > pools.specialAttack) {
            errors.push(`Special attack points over budget: ${spent.specialAttack}/${pools.specialAttack}`);
        }
        
        // Check for unspent points (warnings)
        if (pools.combat - spent.combat > 0) {
            warnings.push(`${pools.combat - spent.combat} unspent combat attribute points`);
        }
        if (pools.utility - spent.utility > 0) {
            warnings.push(`${pools.utility - spent.utility} unspent utility attribute points`);
        }
    }

    validateArchetypes(character, errors, warnings) {
        const archetypes = character.archetypes;
        
        // Check required archetypes
        const requiredArchetypes = ['movement', 'attackType', 'effectType', 'uniqueAbility', 'defensive', 'specialAttack', 'utility'];
        requiredArchetypes.forEach(type => {
            if (!archetypes[type]) {
                errors.push(`${this.capitalizeWords(type)} archetype is required`);
            }
        });
        
        // Check archetype-specific restrictions
        if (archetypes.movement === 'behemoth') {
            // Behemoth can't take movement-related limits
            const movementLimits = ['immobilized'];
            character.limits.selected.forEach(limitId => {
                if (movementLimits.includes(limitId)) {
                    errors.push('Behemoth archetype cannot take movement-restricting limits');
                }
            });
        }
        
        // Check for archetype combinations that don't make sense
        if (archetypes.defensive === 'stalwart' && archetypes.movement === 'swift') {
            warnings.push('Stalwart and Swift archetypes may conflict (-Avoidance vs +Movement)');
        }
    }

    validateUpgradeConflicts(character, errors, warnings) {
        const conflictRules = this.gameData.validation_rules?.upgrade_conflicts || [];
        
        character.specialAttacks.forEach((attack, attackIndex) => {
            const selectedUpgrades = attack.upgrades || [];
            
            conflictRules.forEach(([upgrade1, upgrade2]) => {
                if (selectedUpgrades.includes(upgrade1) && selectedUpgrades.includes(upgrade2)) {
                    errors.push(`Attack "${attack.name}" has conflicting upgrades: ${upgrade1} and ${upgrade2}`);
                }
            });
        });
    }

    validateTraitBonuses(character, errors, warnings) {
        const totalLimits = character.limits.selected.length;
        const availableBonuses = totalLimits * 2;
        const allocatedBonuses = Object.values(character.limits.traitBonuses).reduce((sum, val) => sum + val, 0);
        
        if (allocatedBonuses > availableBonuses) {
            errors.push(`Too many trait bonuses allocated: ${allocatedBonuses}/${availableBonuses}`);
        }
        
        if (allocatedBonuses < availableBonuses && totalLimits > 0) {
            warnings.push(`${availableBonuses - allocatedBonuses} unallocated trait bonuses`);
        }
    }

    validateAbilityRequirements(character, errors, warnings) {
        // Check trait requirements
        character.abilities.traits.forEach(traitId => {
            const trait = this.gameData.abilities.traits.find(t => t.id === traitId);
            if (trait && trait.requirements) {
                if (trait.requirements.includes('limit_required') && character.limits.selected.length === 0) {
                    errors.push(`Trait "${trait.name}" requires at least one limit`);
                }
            }
        });
        
        // Check flaw restrictions
        character.abilities.flaws.forEach(flawId => {
            const flaw = this.gameData.abilities.flaws.find(f => f.id === flawId);
            if (flaw && flaw.id === 'balanced') {
                // Balanced flaw requires half tier in each combat attribute
                const requiredMin = Math.floor(character.tier / 2);
                const combatAttrs = ['focus', 'mobility', 'power', 'endurance'];
                combatAttrs.forEach(attr => {
                    if (character.attributes[attr] < requiredMin) {
                        errors.push(`Balanced flaw requires at least ${requiredMin} in ${attr}`);
                    }
                });
            }
            if (flaw && flaw.id === 'slow') {
                // Slow flaw forbids movement archetypes
                if (character.archetypes.movement && character.archetypes.movement !== 'none') {
                    errors.push('Slow flaw forbids movement archetypes');
                }
            }
        });
    }

    validateSpecialAttackRestrictions(character, errors, warnings) {
        const specialAttackArchetype = character.archetypes.specialAttack;
        
        if (specialAttackArchetype === 'oneTrick' && character.specialAttacks.length > 1) {
            errors.push('One Trick archetype allows only one special attack');
        }
        
        if (specialAttackArchetype === 'dualNatured' && character.specialAttacks.length !== 2) {
            if (character.specialAttacks.length < 2) {
                warnings.push('Dual-Natured archetype should have exactly 2 special attacks');
            } else {
                errors.push('Dual-Natured archetype allows only 2 special attacks');
            }
        }
        
        if (specialAttackArchetype === 'paragon' && character.limits.selected.length > 0) {
            warnings.push('Paragon archetype typically does not use limits');
        }
    }

    calculatePointPools(character) {
        // Simplified calculation - would use the main builder's logic
        const tier = character.tier;
        const limitPoints = character.limits.selected.length * 30; // Simplified
        
        let pools = {
            combat: tier * 2,
            utility: tier,
            main: Math.max(0, (tier - 2) * 15),
            utilityPool: Math.max(0, 5 * (tier - 1)),
            specialAttack: limitPoints
        };

        // Apply archetype modifiers
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            pools.main += Math.max(0, (tier - 2) * 15);
        }

        return pools;
    }

    calculatePointsSpent(character) {
        const spent = {
            combat: character.attributes.focus + character.attributes.mobility + 
                    character.attributes.power + character.attributes.endurance,
            utility: character.attributes.awareness + character.attributes.communication + 
                    character.attributes.intelligence,
            main: 0,
            utilityPool: 0,
            specialAttack: 0
        };
        
        // Calculate main pool spending (simplified)
        spent.main += character.abilities.boons.length * 15; // Simplified
        spent.main += character.abilities.traits.length * 30; // Simplified
        spent.main += character.abilities.flaws.reduce((sum, flawId) => {
            if (flawId === 'balanced') return sum - 30;
            if (flawId === 'slow') return sum - 30;
            return sum - 20; // Average flaw cost
        }, 0);
        
        // Calculate utility pool spending
        Object.values(character.utility.expertise).forEach(skills => {
            spent.utilityPool += skills.length * character.tier;
        });
        spent.utilityPool += character.utility.features.length * 10; // Simplified
        spent.utilityPool += character.utility.senses.length * 15; // Simplified
        spent.utilityPool += character.utility.descriptors.length * 5; // Simplified
        
        // Calculate special attack spending
        spent.specialAttack = character.specialAttacks.reduce((sum, attack) => {
            return sum + (attack.totalCost || 0);
        }, 0);
        
        return spent;
    }

    capitalizeWords(str) {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
}

// Auto-save functionality
class AutoSaveManager {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.saveTimeout = null;
        this.autoSaveEnabled = true;
        this.autoSaveDelay = 2000; // 2 seconds
        
        this.initializeAutoSave();
    }

    initializeAutoSave() {
        // Set up auto-save for form inputs
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', () => this.scheduleAutoSave());
            input.addEventListener('change', () => this.scheduleAutoSave());
        });
    }

    scheduleAutoSave() {
        if (!this.autoSaveEnabled || !this.builder.currentCharacter) return;
        
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Schedule new save
        this.saveTimeout = setTimeout(() => {
            this.performAutoSave();
        }, this.autoSaveDelay);
    }

    performAutoSave() {
        try {
            this.builder.gatherFormData();
            this.builder.calculatePointsSpent();
            this.builder.characters[this.builder.currentCharacter.id] = this.builder.currentCharacter;
            this.builder.saveCharacters();
            
            // Visual feedback
            this.showAutoSaveIndicator();
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.textContent = 'Auto-saved';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--accent-secondary);
            color: var(--text-light);
            padding: 0.5rem 1rem;
            font-size: 0.8em;
            border-radius: 4px;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Animate in
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
            }, 300);
        }, 2000);
    }

    disable() {
        this.autoSaveEnabled = false;
    }

    enable() {
        this.autoSaveEnabled = true;
    }
}

// Keyboard shortcuts
class KeyboardShortcuts {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.initializeShortcuts();
    }

    initializeShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S - Save character
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.builder.saveCurrentCharacter();
                this.builder.showSuccess('Character saved! (Ctrl+S)');
            }
            
            // Ctrl+E - Export JSON
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.builder.exportCharacterJSON();
            }
            
            // Ctrl+I - Import character
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                this.builder.importCharacterJSON();
            }
            
            // Ctrl+N - New character
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const name = prompt('Character name:');
                if (name) {
                    const character = this.builder.createNewCharacter(name);
                    this.builder.loadCharacter(character.id);
                    this.builder.renderCharacterTree();
                }
            }
            
            // Ctrl+1-7 - Switch tabs
            if (e.ctrlKey && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                const tabBtns = document.querySelectorAll('.tab-btn');
                if (tabBtns[tabIndex]) {
                    this.builder.switchTab(tabBtns[tabIndex].dataset.tab);
                }
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    e.preventDefault();
                    openModal.classList.add('hidden');
                }
            }
        });
    }
}

// Theme manager for additional customization
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('vitality-theme') || 'neonoir';
        this.initializeTheme();
    }

    initializeTheme() {
        this.applyTheme(this.currentTheme);
        
        // Add theme switcher if needed
        this.createThemeSwitcher();
    }

    createThemeSwitcher() {
        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'theme-switcher';
        themeSwitcher.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            display: flex;
            gap: 0.5rem;
        `;
        
        const themes = [
            { id: 'neonoir', name: 'Neo Noir', colors: { primary: '#00ffff', secondary: '#007a7a' } },
            { id: 'synthwave', name: 'Synthwave', colors: { primary: '#ff0080', secondary: '#800040' } },
            { id: 'matrix', name: 'Matrix', colors: { primary: '#00ff00', secondary: '#008000' } }
        ];
        
        themes.forEach(theme => {
            const btn = document.createElement('button');
            btn.textContent = theme.name;
            btn.className = 'theme-btn';
            btn.style.cssText = `
                background: var(--bg-primary);
                border: 1px solid ${theme.colors.primary};
                color: ${theme.colors.primary};
                padding: 0.5rem;
                cursor: pointer;
                font-size: 0.8em;
            `;
            
            if (theme.id === this.currentTheme) {
                btn.style.background = theme.colors.primary;
                btn.style.color = 'var(--bg-primary)';
            }
            
            btn.onclick = () => this.switchTheme(theme.id);
            themeSwitcher.appendChild(btn);
        });
        
        document.body.appendChild(themeSwitcher);
    }

    switchTheme(themeId) {
        this.currentTheme = themeId;
        localStorage.setItem('vitality-theme', themeId);
        this.applyTheme(themeId);
        
        // Update theme switcher buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.style.background = 'var(--bg-primary)';
            btn.style.color = btn.style.borderColor;
        });
        
        const activeBtn = Array.from(document.querySelectorAll('.theme-btn'))
            .find(btn => btn.textContent.toLowerCase().includes(themeId));
        if (activeBtn) {
            activeBtn.style.background = activeBtn.style.borderColor;
            activeBtn.style.color = 'var(--bg-primary)';
        }
    }

    applyTheme(themeId) {
        const root = document.documentElement;
        
        switch (themeId) {
            case 'synthwave':
                root.style.setProperty('--accent-primary', '#ff0080');
                root.style.setProperty('--accent-secondary', '#800040');
                root.style.setProperty('--accent-highlight', '#ff80c0');
                break;
            case 'matrix':
                root.style.setProperty('--accent-primary', '#00ff00');
                root.style.setProperty('--accent-secondary', '#008000');
                root.style.setProperty('--accent-highlight', '#80ff80');
                break;
            default: // neonoir
                root.style.setProperty('--accent-primary', '#00ffff');
                root.style.setProperty('--accent-secondary', '#007a7a');
                root.style.setProperty('--accent-highlight', '#80ffff');
                break;
        }
    }
}

// Performance monitoring for large character builds
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            renderTime: [],
            calculateTime: [],
            saveTime: []
        };
        this.isMonitoring = false;
    }

    startMonitoring() {
        this.isMonitoring = true;
        console.log('Performance monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.logMetrics();
    }

    measureRender(callback) {
        if (!this.isMonitoring) return callback();
        
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        
        this.metrics.renderTime.push(end - start);
        return result;
    }

    measureCalculation(callback) {
        if (!this.isMonitoring) return callback();
        
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        
        this.metrics.calculateTime.push(end - start);
        return result;
    }

    measureSave(callback) {
        if (!this.isMonitoring) return callback();
        
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        
        this.metrics.saveTime.push(end - start);
        return result;
    }

    logMetrics() {
        Object.entries(this.metrics).forEach(([metric, times]) => {
            if (times.length > 0) {
                const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
                const max = Math.max(...times);
                console.log(`${metric}: avg ${avg.toFixed(2)}ms, max ${max.toFixed(2)}ms, samples ${times.length}`);
            }
        });
    }
}

// Initialize the application
let builder;
let autoSaveManager;
let keyboardShortcuts;
let themeManager;
let performanceMonitor;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize performance monitoring
        performanceMonitor = new PerformanceMonitor();
        
        // Initialize theme manager
        themeManager = new ThemeManager();
        
        // Initialize main character builder
        builder = new VitalityCharacterBuilder();
        
        // Initialize auto-save
        autoSaveManager = new AutoSaveManager(builder);
        
        // Initialize keyboard shortcuts
        keyboardShortcuts = new KeyboardShortcuts(builder);
        
        // Add global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            builder?.showError('An unexpected error occurred. Please refresh the page.');
        });
        
        // Add unload warning for unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (builder?.currentCharacter && autoSaveManager?.autoSaveEnabled) {
                // Auto-save is enabled, no warning needed
                return;
            }
            
            // Warn about unsaved changes
            e.preventDefault();
            e.returnValue = '';
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

// Export classes for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VitalityCharacterBuilder,
        ValidationEngine,
        AutoSaveManager,
        KeyboardShortcuts,
        ThemeManager,
        PerformanceMonitor
    };
}