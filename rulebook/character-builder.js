class VitalityCharacterBuilder {
    constructor() {
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.folders = this.loadFolders();
        
        this.initializeEventListeners();
        this.initializeArchetypes();
        this.initializeAbilities();
        this.renderCharacterTree();
        this.updatePointPools();
    }

    // Save/Load System
    loadCharacters() {
        const saved = localStorage.getItem('vitality-characters');
        return saved ? JSON.parse(saved) : {};
    }

    saveCharacters() {
        localStorage.setItem('vitality-characters', JSON.stringify(this.characters));
    }

    loadFolders() {
        const saved = localStorage.getItem('vitality-folders');
        return saved ? JSON.parse(saved) : {};
    }

    saveFolders() {
        localStorage.setItem('vitality-folders', JSON.stringify(this.folders));
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
            abilities: {
                boons: [],
                traits: [],
                flaws: []
            },
            specialAttacks: [],
            utility: {
                expertise: [],
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
        this.renderCharacterBuilder();
        this.updateAllDisplays();
    }

    saveCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        // Gather data from form
        this.currentCharacter.name = document.getElementById('character-name').value;
        this.currentCharacter.realName = document.getElementById('real-name').value;
        this.currentCharacter.tier = parseInt(document.getElementById('tier-select').value);
        
        // Save attributes
        const attributes = ['focus', 'mobility', 'power', 'endurance', 'awareness', 'communication', 'intelligence'];
        attributes.forEach(attr => {
            const element = document.getElementById(`attr-${attr}`);
            if (element) {
                this.currentCharacter.attributes[attr] = parseInt(element.value) || 0;
            }
        });
        
        this.calculatePointsSpent();
        this.characters[this.currentCharacter.id] = this.currentCharacter;
        this.saveCharacters();
        this.renderCharacterTree();
        this.updatePointPools();
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

    exportCharacterJSON() {
        if (!this.currentCharacter) return;
        
        const dataStr = JSON.stringify(this.currentCharacter, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentCharacter.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Point Pool Calculations
    calculatePointPools() {
        if (!this.currentCharacter) return { combat: 0, utility: 0, main: 0, utilityPool: 0, specialAttack: 0 };
        
        const tier = this.currentCharacter.tier;
        return {
            combat: tier * 2,
            utility: tier,
            main: Math.max(0, (tier - 2) * 15),
            utilityPool: Math.max(0, 5 * (tier - 1)),
            specialAttack: this.calculateSpecialAttackPoints()
        };
    }

    calculateSpecialAttackPoints() {
        if (!this.currentCharacter) return 0;
        
        const archetype = this.currentCharacter.archetypes.specialAttack;
        const tier = this.currentCharacter.tier;
        
        switch (archetype) {
            case 'normal': return 0; // Points from limits
            case 'specialist': return 0; // Points from limits
            case 'paragon': return tier * 10;
            case 'oneTrick': return tier * 20;
            case 'straightforward': return 0; // Points from limits
            case 'sharedUses': return 0; // Special calculation
            case 'dualNatured': return tier * 15 * 2; // 15 per attack, 2 attacks
            case 'basic': return tier * 10;
            default: return 0;
        }
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
        // Implementation would calculate costs from selected abilities
        return 0; // Placeholder
    }

    calculateUtilityCosts() {
        // Implementation would calculate costs from selected utility options
        return 0; // Placeholder
    }

    calculateSpecialAttackCosts() {
        // Implementation would calculate costs from special attacks
        return 0; // Placeholder
    }

    // UI Updates
    updatePointPools() {
        if (!this.currentCharacter) return;
        
        const pools = this.calculatePointPools();
        const spent = this.currentCharacter.pointsSpent;
        
        document.getElementById('combat-points').textContent = `${spent.combat}/${pools.combat}`;
        document.getElementById('utility-points').textContent = `${spent.utility}/${pools.utility}`;
        document.getElementById('main-points').textContent = `${spent.main}/${pools.main}`;
        document.getElementById('utility-pool-points').textContent = `${spent.utilityPool}/${pools.utilityPool}`;
        document.getElementById('special-attack-points').textContent = `${spent.specialAttack}/${pools.specialAttack}`;
        
        // Update individual displays
        document.getElementById('combat-pool-display').textContent = pools.combat - spent.combat;
        document.getElementById('utility-pool-display').textContent = pools.utility - spent.utility;
        document.getElementById('main-pool-display').textContent = pools.main - spent.main;
        document.getElementById('utility-points-display').textContent = pools.utilityPool - spent.utilityPool;
        document.getElementById('special-attack-pool-display').textContent = pools.specialAttack - spent.specialAttack;
        
        // Add over-budget warning
        document.querySelectorAll('.pool-item').forEach(item => item.classList.remove('over-budget'));
        if (spent.combat > pools.combat) document.querySelector('#combat-points').parentElement.classList.add('over-budget');
        if (spent.utility > pools.utility) document.querySelector('#utility-points').parentElement.classList.add('over-budget');
        if (spent.main > pools.main) document.querySelector('#main-points').parentElement.classList.add('over-budget');
        if (spent.utilityPool > pools.utilityPool) document.querySelector('#utility-pool-points').parentElement.classList.add('over-budget');
        if (spent.specialAttack > pools.specialAttack) document.querySelector('#special-attack-points').parentElement.classList.add('over-budget');
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
        
        this.calculatePointsSpent();
        this.updatePointPools();
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

    // Initialize Data
    initializeArchetypes() {
        this.archetypes = {
            movement: [
                { id: 'swift', name: 'Swift', description: 'Increased movement speed by half Tier (round up)' },
                { id: 'skirmisher', name: 'Skirmisher', description: 'Immune to opportunity attacks, +1 space attack reach' },
                { id: 'behemoth', name: 'Behemoth', description: 'Cannot be Grabbed, Moved, knocked Prone, or Stunned' },
                { id: 'bulwark', name: 'Bulwark', description: 'Enemies starting adjacent have half movement speed' },
                { id: 'vanguard', name: 'Vanguard', description: 'Add Endurance to movement speed' },
                { id: 'mole', name: 'Mole', description: 'Move through earth and stone at full/half speed' },
                { id: 'flight', name: 'Flight', description: 'Move in any direction, ignore obstacles' },
                { id: 'teleportation', name: 'Teleportation', description: 'Instant movement to visible locations, -2 Sp penalty' },
                { id: 'portal', name: 'Portal', description: 'Create linked portals for team movement' },
                { id: 'swinging', name: 'Swinging', description: 'Requires anchor points, +1-2 Sp bonus' },
                { id: 'superJump', name: 'Super Jump', description: 'Jump distance equals full movement, +1-2 Sp bonus' }
            ],
            attackType: [
                { id: 'aoeSpecialist', name: 'AOE Specialist', description: 'Free AOE attack type, crowd control focus' },
                { id: 'directSpecialist', name: 'Direct Specialist', description: 'Free Direct attack type, reliable delivery' },
                { id: 'singleTarget', name: 'Single Target', description: 'Free Melee and Ranged attack types' }
            ],
            effectType: [
                { id: 'damageSpecialist', name: 'Damage Specialist', description: 'Maximum damage potential, Basic Conditions separate' },
                { id: 'hybridSpecialist', name: 'Hybrid Specialist', description: 'All attacks combine damage and conditions' },
                { id: 'crowdControl', name: 'Crowd Control', description: 'Free 2 Advanced conditions, -Tier to Damage' }
            ],
            uniqueAbility: [
                { id: 'versatileMaster', name: 'Versatile Master', description: '2 Quick Actions per turn, extra at Tier 8' },
                { id: 'extraordinary', name: 'Extraordinary', description: 'Additional (Tier-2)×15 points for complex builds' },
                { id: 'cutAbove', name: 'Cut Above', description: '+1-3 to all core stats based on Tier' }
            ],
            defensive: [
                { id: 'stalwart', name: 'Stalwart', description: '-Tier Avoidance, half damage from chosen type' },
                { id: 'resilient', name: 'Resilient', description: '+Tier to Durability against all damage' },
                { id: 'fortress', name: 'Fortress', description: '+Tier to all Secondary Resistances' },
                { id: 'immutable', name: 'Immutable', description: 'Immunity to chosen resistance category' },
                { id: 'juggernaut', name: 'Juggernaut', description: '+5×Tier maximum Health Pool' }
            ],
            specialAttack: [
                { id: 'normal', name: 'Normal', description: '3 Specialty Upgrades at half cost, flexible limits' },
                { id: 'specialist', name: 'Specialist', description: '3 specific Limits, higher returns, focused style' },
                { id: 'paragon', name: 'Paragon', description: '10×Tier points per attack, no Limits' },
                { id: 'oneTrick', name: 'One Trick', description: 'Single attack with Tier×20 points, no Limits' },
                { id: 'straightforward', name: 'Straightforward', description: 'Single Limit, simple but effective' },
                { id: 'sharedUses', name: 'Shared Uses', description: '10 shared uses, resource management focus' },
                { id: 'dualNatured', name: 'Dual-Natured', description: 'Two attacks with 15×Tier points each' },
                { id: 'basic', name: 'Basic', description: 'Enhances base attacks, Tier×10 points' }
            ],
            utility: [
                { id: 'specialized', name: 'Specialized', description: 'Double Tier bonus for one stat, no additional Expertise' },
                { id: 'practical', name: 'Practical', description: 'Balanced access, standard point pool' },
                { id: 'jackOfAllTrades', name: 'Jack of All Trades', description: 'Tier bonus to ALL checks, no specialized Expertise' }
            ]
        };
        
        this.renderArchetypes();
    }

    renderArchetypes() {
        Object.entries(this.archetypes).forEach(([category, archetypes]) => {
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

    selectArchetype(category, archetypeId) {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.archetypes[category] = archetypeId;
        this.updateArchetypeDisplay(category);
        this.calculatePointsSpent();
        this.updatePointPools();
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
                const archetype = this.archetypes[category].find(a => a.id === selectedId);
                return archetype && card.querySelector('h4').textContent === archetype.name;
            });
            if (selectedCard) selectedCard.classList.add('selected');
        }
    }

    initializeAbilities() {
        // Initialize ability data - this would be a large dataset
        this.abilities = {
            boons: [
                { id: 'dynamicEntry', name: 'Dynamic Entry', cost: 10, description: 'Move allies on first turn of combat' },
                { id: 'psychic', name: 'Psychic', cost: 0, description: 'All conditions target resolve' },
                { id: 'robot', name: 'Robot', cost: 30, description: 'Immunity to most conditions, special vulnerabilities' },
                // Add more boons...
            ],
            traits: [
                { id: 'rooted', name: 'Rooted', cost: 30, description: 'Cannot move this turn - Tier 1 condition', bonuses: 2 },
                { id: 'vengeful', name: 'Vengeful', cost: 30, description: 'Must have been hit since last turn - Tier 1', bonuses: 2 },
                // Add more traits...
            ],
            flaws: [
                { id: 'balanced', name: 'Balanced', cost: -30, description: 'Must have half Tier in each Combat Attribute' },
                { id: 'slow', name: 'Slow', cost: -30, description: 'No movement archetype' },
                // Add more flaws...
            ]
        };
        
        this.renderAbilities();
    }

    renderAbilities() {
        Object.entries(this.abilities).forEach(([category, abilities]) => {
            const container = document.getElementById(`${category}-list`);
            if (!container) return;
            
            container.innerHTML = '';
            abilities.forEach(ability => {
                const item = document.createElement('div');
                item.className = 'ability-item';
                item.innerHTML = `
                    <div class="ability-header">
                        <span class="ability-name">${ability.name}</span>
                        <span class="ability-cost">${ability.cost}p</span>
                    </div>
                    <div class="ability-description">${ability.description}</div>
                    <div class="ability-controls">
                        <input type="checkbox" ${this.isAbilitySelected(category, ability.id) ? 'checked' : ''} 
                               onchange="builder.toggleAbility('${category}', '${ability.id}')">
                        <label>Select</label>
                    </div>
                `;
                container.appendChild(item);
            });
        });
    }

    isAbilitySelected(category, abilityId) {
        return this.currentCharacter?.abilities[category]?.includes(abilityId) || false;
    }

    toggleAbility(category, abilityId) {
        if (!this.currentCharacter) return;
        
        if (!this.currentCharacter.abilities[category]) {
            this.currentCharacter.abilities[category] = [];
        }
        
        const index = this.currentCharacter.abilities[category].indexOf(abilityId);
        if (index > -1) {
            this.currentCharacter.abilities[category].splice(index, 1);
        } else {
            this.currentCharacter.abilities[category].push(abilityId);
        }
        
        this.calculatePointsSpent();
        this.updatePointPools();
        this.renderAbilities();
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
        
        // Character actions
        document.getElementById('save-character').onclick = () => this.saveCurrentCharacter();
        document.getElementById('export-json').onclick = () => this.exportCharacterJSON();
        document.getElementById('delete-character').onclick = () => this.deleteCurrentCharacter();
        
        // Tier changes
        document.getElementById('tier-select').onchange = () => {
            if (this.currentCharacter) {
                this.currentCharacter.tier = parseInt(document.getElementById('tier-select').value);
                this.calculatePointsSpent();
                this.updatePointPools();
            }
        };
        
        // Attribute changes
        ['focus', 'mobility', 'power', 'endurance', 'awareness', 'communication', 'intelligence'].forEach(attr => {
            const element = document.getElementById(`attr-${attr}`);
            if (element) {
                element.onchange = () => {
                    if (this.currentCharacter) {
                        this.calculatePointsSpent();
                        this.updatePointPools();
                    }
                };
            }
        });
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
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
    }
}

// Initialize the character builder
let builder;
document.addEventListener('DOMContentLoaded', () => {
    builder = new VitalityCharacterBuilder();
});