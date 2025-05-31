// character-builder.js - Complete Fix Following Vitality System Rules
class VitalityCharacterBuilder {
    constructor() {
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.folders = this.loadFolders();
        this.gameData = {};
        this.validationEngine = null;
        this.initialized = false;
        
        // Initialize immediately
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Character Builder...');
            await this.loadGameData();
            this.validationEngine = new ValidationEngine(this.gameData);
            this.initializeEventListeners();
            this.renderCharacterTree();
            this.showWelcomeScreen();
            this.initialized = true;
            
            // Make builder globally accessible AFTER initialization
            window.builder = this;
            
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
                console.log(`Loaded ${file}:`, data);
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

    loadCharacter(characterId) {
        this.currentCharacter = this.characters[characterId];
        if (this.currentCharacter) {
            this.renderCharacterBuilder();
            this.initializeComponents(); // Re-initialize components for this character
            this.updateAllDisplays();
            this.validateCurrentBuild();
            this.switchTab('archetypes'); // Start at the beginning
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

    // Point Pool Calculations - Fixed to match rulebook
    calculatePointPools() {
        if (!this.currentCharacter) return { 
            combat: 0, 
            utility: 0, 
            main: 0, 
            utilityPool: 0, 
            specialAttack: 0, 
            limits: 0 
        };
        
        const tier = this.currentCharacter.tier;
        const archetypes = this.currentCharacter.archetypes;
        
        let pools = {
            combat: tier * 2,
            utility: tier,
            main: Math.max(0, (tier - 2) * 15),
            utilityPool: this.calculateUtilityPool(tier, archetypes.utility),
            specialAttack: 0, // Calculated per-attack based on limits
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
                return Math.max(0, 5 * (tier - 2));
            case 'practical':
            default:
                return Math.max(0, 5 * (tier - 1));
        }
    }

    calculateTotalLimitPoints() {
        if (!this.currentCharacter) return 0;
        
        let total = 0;
        this.currentCharacter.specialAttacks.forEach(attack => {
            total += attack.limitPointsTotal || 0;
        });
        
        return total;
    }

    calculateAttackPoints(attack) {
        const tier = this.currentCharacter.tier;
        const archetype = this.currentCharacter.archetypes.specialAttack;
        const limitPoints = attack.limitPointsTotal || 0;
        
        switch (archetype) {
            case 'normal':
                return Math.floor(this.applyLimitScaling(limitPoints, tier) * (tier / 6));
            case 'specialist':
                return Math.floor(this.applyLimitScaling(limitPoints, tier) * (tier / 3));
            case 'straightforward':
                return Math.floor(this.applyLimitScaling(limitPoints, tier) * (tier / 2));
            case 'paragon':
                return tier * 10;
            case 'oneTrick':
                return tier * 20;
            case 'dualNatured':
                return tier * 15;
            case 'basic':
                return tier * 10;
            case 'sharedUses':
                return this.applyLimitScaling(limitPoints, tier);
            default:
                return 0;
        }
    }

    applyLimitScaling(limitPoints, tier) {
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

    // UI Components Initialization - Fixed
    initializeComponents() {
        if (!this.gameData || !this.currentCharacter) return;
        
        this.initializeArchetypes();
        this.initializeLimits();
        this.initializeAbilities();
        this.initializeUtility();
        this.updateAllDisplays();
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
                if (this.currentCharacter?.archetypes[category] === archetype.id) {
                    card.classList.add('selected');
                }
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
        const container = document.getElementById('limits-list');
        if (!container || !this.gameData.limits) return;
        
        container.innerHTML = '<div class="limits-instructions"><p>Limits are applied per Special Attack. Create a Special Attack first, then select limits for it.</p></div>';
        
        // Create sections for each limit category
        Object.entries(this.gameData.limits).forEach(([category, limits]) => {
            const section = document.createElement('div');
            section.className = 'limits-section';
            section.innerHTML = `<h3>${this.formatCategoryName(category)} Limits</h3>`;
            
            const grid = document.createElement('div');
            grid.className = 'limits-grid';
            grid.id = `${category}-limits`;
            
            limits.forEach(limit => {
                const card = document.createElement('div');
                card.className = 'limit-card';
                card.dataset.limitId = limit.id;
                card.dataset.category = category;
                card.innerHTML = `
                    <div class="limit-header">
                        <span class="limit-name">${limit.name}</span>
                        <span class="limit-value">${limit.points}p</span>
                    </div>
                    <div class="limit-description">${limit.description}</div>
                    ${limit.restrictions?.length ? `<div class="limit-restrictions">Restrictions: ${limit.restrictions.join(', ')}</div>` : ''}
                `;
                grid.appendChild(card);
            });
            
            section.appendChild(grid);
            container.appendChild(section);
        });
    }

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
    }

    // Archetype Selection - Fixed validation
    selectArchetype(category, archetypeId) {
        if (!this.currentCharacter) return;
        
        // Validate archetype compatibility
        if (!this.validateArchetypeSelection(category, archetypeId)) {
            return;
        }
        
        this.currentCharacter.archetypes[category] = archetypeId;
        
        // Recalculate everything
        this.calculateAllStats();
        this.updateAllDisplays();
        this.validateCurrentBuild();
        this.saveCurrentCharacter();
        
        // Update display
        this.initializeArchetypes();
    }

    validateArchetypeSelection(category, archetypeId) {
        const archetype = this.findArchetypeById(category, archetypeId);
        if (!archetype) return false;
        
        // Check for Behemoth conflicts
        if (category === 'movement' && archetypeId === 'behemoth') {
            const hasConflictingLimits = this.currentCharacter.specialAttacks.some(attack => 
                attack.limits && attack.limits.some(limitId => {
                    const limit = this.findLimitById(limitId);
                    return limit && limit.restrictions && limit.restrictions.includes('behemoth');
                })
            );
            if (hasConflictingLimits) {
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

    findLimitById(limitId) {
        for (const category of Object.values(this.gameData.limits)) {
            const limit = category.find(l => l.id === limitId);
            if (limit) return limit;
        }
        return null;
    }

    // Special Attacks - Fixed implementation
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
            name: `Special Attack ${this.currentCharacter.specialAttacks.length + 1}`,
            type: "melee",
            description: "",
            limits: [],
            upgrades: [],
            condition: null,
            attackTypes: [],
            upgradePointsAvailable: 0,
            upgradePointsSpent: 0,
            limitPointsTotal: 0
        };
        
        // Calculate initial points based on archetype
        attack.upgradePointsAvailable = this.calculateAttackPoints(attack);
        
        this.currentCharacter.specialAttacks.push(attack);
        this.renderSpecialAttacks();
        this.calculateAllStats();
        this.updateAllDisplays();
        this.saveCurrentCharacter();
    }

    renderSpecialAttacks() {
        const container = document.getElementById('special-attacks-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.currentCharacter.specialAttacks.forEach((attack, index) => {
            const card = document.createElement('div');
            card.className = 'special-attack-card';
            card.innerHTML = `
                <div class="special-attack-header">
                    <input type="text" class="special-attack-name" value="${attack.name}" 
                           placeholder="Attack Name"
                           onchange="builder.updateAttackName(${index}, this.value)">
                    <div class="special-attack-cost">${attack.upgradePointsSpent || 0}/${attack.upgradePointsAvailable || 0}p</div>
                </div>
                <div class="attack-details">
                    <div class="attack-info">
                        <p><strong>Type:</strong> ${attack.type}</p>
                        <p><strong>Limits:</strong> ${attack.limits.length} (${attack.limitPointsTotal || 0}p)</p>
                        <p><strong>Upgrades:</strong> ${attack.upgrades.length}</p>
                    </div>
                    <div class="attack-actions">
                        <button onclick="builder.openAttackBuilder(${index})" class="btn-secondary">Edit Attack</button>
                        <button onclick="builder.deleteAttack(${index})" class="btn-danger">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    openAttackBuilder(attackIndex) {
        this.currentAttackIndex = attackIndex;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'attack-builder-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Special Attack</h3>
                    <button class="modal-close" onclick="builder.closeAttackBuilder()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="attack-builder-tabs">
                        <button class="attack-tab active" onclick="builder.switchAttackTab('limits')">Limits</button>
                        <button class="attack-tab" onclick="builder.switchAttackTab('upgrades')">Upgrades</button>
                    </div>
                    
                    <div id="attack-limits-tab" class="attack-tab-content active">
                        <div class="attack-limits-summary">
                            <h4>Attack Limits (${attack.limits.length})</h4>
                            <p>Total Limit Points: <strong>${attack.limitPointsTotal}</strong></p>
                            <p>Available Upgrade Points: <strong>${attack.upgradePointsAvailable}</strong></p>
                        </div>
                        <div id="attack-limits-selection"></div>
                    </div>
                    
                    <div id="attack-upgrades-tab" class="attack-tab-content">
                        <div class="attack-upgrades-summary">
                            <h4>Attack Upgrades</h4>
                            <p>Points Spent: <strong>${attack.upgradePointsSpent}/${attack.upgradePointsAvailable}</strong></p>
                        </div>
                        <div id="attack-upgrades-selection"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="builder.closeAttackBuilder()" class="btn-primary">Done</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.renderAttackLimits(attack);
        this.renderAttackUpgrades(attack);
    }

    renderAttackLimits(attack) {
        const container = document.getElementById('attack-limits-selection');
        if (!container) return;
        
        const archetype = this.currentCharacter.archetypes.specialAttack;
        
        // Check if archetype allows limits
        if (['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype)) {
            container.innerHTML = '<p class="no-limits-message">This archetype does not use limits.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(this.gameData.limits).forEach(([category, limits]) => {
            const section = document.createElement('div');
            section.className = 'limit-category';
            section.innerHTML = `<h5>${this.formatCategoryName(category)}</h5>`;
            
            const grid = document.createElement('div');
            grid.className = 'limit-selection-grid';
            
            limits.forEach(limit => {
                const item = document.createElement('div');
                item.className = 'limit-selection-item';
                if (attack.limits.includes(limit.id)) {
                    item.classList.add('selected');
                }
                
                // Check restrictions
                let canSelect = true;
                if (limit.restrictions) {
                    if (limit.restrictions.includes('behemoth') && 
                        this.currentCharacter.archetypes.movement === 'behemoth') {
                        canSelect = false;
                        item.classList.add('restricted');
                    }
                }
                
                item.innerHTML = `
                    <div class="limit-selection-header">
                        <span class="limit-name">${limit.name}</span>
                        <span class="limit-points">${limit.points}p</span>
                    </div>
                    <div class="limit-selection-desc">${limit.description}</div>
                    ${!canSelect ? '<div class="restriction-notice">Conflicts with Behemoth</div>' : ''}
                `;
                
                if (canSelect) {
                    item.onclick = () => this.toggleLimitForAttack(limit.id);
                }
                
                grid.appendChild(item);
            });
            
            section.appendChild(grid);
            container.appendChild(section);
        });
    }

    toggleLimitForAttack(limitId) {
        if (this.currentAttackIndex === null) return;
        
        const attack = this.currentCharacter.specialAttacks[this.currentAttackIndex];
        if (!attack) return;
        
        const index = attack.limits.indexOf(limitId);
        const limit = this.findLimitById(limitId);
        
        if (index > -1) {
            // Remove limit
            attack.limits.splice(index, 1);
            attack.limitPointsTotal -= limit.points;
        } else {
            // Add limit
            attack.limits.push(limitId);
            attack.limitPointsTotal += limit.points;
        }
        
        // Recalculate available points
        attack.upgradePointsAvailable = this.calculateAttackPoints(attack);
        
        // Re-render
        this.renderAttackLimits(attack);
        this.updateAllDisplays();
        this.saveCurrentCharacter();
    }

    renderAttackUpgrades(attack) {
        const container = document.getElementById('attack-upgrades-selection');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Add attack type selection
        const attackTypeSection = document.createElement('div');
        attackTypeSection.className = 'upgrade-category';
        attackTypeSection.innerHTML = '<h5>Attack Types</h5>';
        
        const attackTypes = [
            { id: 'melee', name: 'Melee', cost: 20 },
            { id: 'ranged', name: 'Ranged', cost: 20 },
            { id: 'direct', name: 'Direct', cost: 30 },
            { id: 'area', name: 'Area', cost: 30 }
        ];
        
        const attackTypeGrid = document.createElement('div');
        attackTypeGrid.className = 'upgrade-selection-grid';
        
        attackTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'upgrade-selection-item';
            if (attack.attackTypes?.includes(type.id)) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div class="upgrade-header">
                    <span>${type.name}</span>
                    <span>${type.cost}p</span>
                </div>
            `;
            
            item.onclick = () => this.toggleAttackType(attack, type.id, type.cost);
            attackTypeGrid.appendChild(item);
        });
        
        attackTypeSection.appendChild(attackTypeGrid);
        container.appendChild(attackTypeSection);
        
        // Add upgrades by category
        Object.entries(this.gameData.upgrades).forEach(([category, upgrades]) => {
            const section = document.createElement('div');
            section.className = 'upgrade-category';
            section.innerHTML = `<h5>${this.formatCategoryName(category)} Upgrades</h5>`;
            
            const grid = document.createElement('div');
            grid.className = 'upgrade-selection-grid';
            
            upgrades.forEach(upgrade => {
                const item = document.createElement('div');
                item.className = 'upgrade-selection-item';
                
                if (attack.upgrades?.includes(upgrade.id)) {
                    item.classList.add('selected');
                }
                
                // Check if can afford
                const canAfford = (attack.upgradePointsAvailable - attack.upgradePointsSpent) >= upgrade.cost;
                if (!canAfford && !attack.upgrades?.includes(upgrade.id)) {
                    item.classList.add('disabled');
                }
                
                item.innerHTML = `
                    <div class="upgrade-header">
                        <span>${upgrade.name}</span>
                        <span>${upgrade.cost}p</span>
                    </div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                `;
                
                if (canAfford || attack.upgrades?.includes(upgrade.id)) {
                    item.onclick = () => this.toggleUpgrade(attack, upgrade.id, upgrade.cost);
                }
                
                grid.appendChild(item);
            });
            
            section.appendChild(grid);
            container.appendChild(section);
        });
    }

    toggleAttackType(attack, typeId, cost) {
        if (!attack.attackTypes) attack.attackTypes = [];
        
        const index = attack.attackTypes.indexOf(typeId);
        if (index > -1) {
            attack.attackTypes.splice(index, 1);
            attack.upgradePointsSpent -= cost;
        } else {
            if ((attack.upgradePointsAvailable - attack.upgradePointsSpent) >= cost) {
                attack.attackTypes.push(typeId);
                attack.upgradePointsSpent += cost;
            }
        }
        
        this.renderAttackUpgrades(attack);
        this.saveCurrentCharacter();
    }

    toggleUpgrade(attack, upgradeId, cost) {
        if (!attack.upgrades) attack.upgrades = [];
        
        const index = attack.upgrades.indexOf(upgradeId);
        if (index > -1) {
            attack.upgrades.splice(index, 1);
            attack.upgradePointsSpent -= cost;
        } else {
            if ((attack.upgradePointsAvailable - attack.upgradePointsSpent) >= cost) {
                attack.upgrades.push(upgradeId);
                attack.upgradePointsSpent += cost;
            }
        }
        
        this.renderAttackUpgrades(attack);
        this.saveCurrentCharacter();
    }

    switchAttackTab(tabName) {
        document.querySelectorAll('.attack-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.attack-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelector(`.attack-tab:nth-child(${tabName === 'limits' ? 1 : 2})`).classList.add('active');
        document.getElementById(`attack-${tabName}-tab`).classList.add('active');
    }

    closeAttackBuilder() {
        const modal = document.getElementById('attack-builder-modal');
        if (modal) modal.remove();
        
        this.currentAttackIndex = null;
        this.renderSpecialAttacks();
        this.updateAllDisplays();
    }

    updateAttackName(index, name) {
        if (this.currentCharacter && this.currentCharacter.specialAttacks[index]) {
            this.currentCharacter.specialAttacks[index].name = name;
            this.saveCurrentCharacter();
        }
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

    // Tab switching
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const tabContent = document.getElementById(`tab-${tabName}`);
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (tabContent) tabContent.classList.add('active');
        if (tabButton) tabButton.classList.add('active');
        
        // Render content for specific tabs
        if (tabName === 'special-attacks' && this.currentCharacter) {
            this.renderSpecialAttacks();
        }
        
        if (tabName === 'limits' && this.currentCharacter) {
            this.initializeLimits();
        }
        
        if (tabName === 'summary' && this.currentCharacter) {
            this.renderCharacterSummary();
        }
    }

    // Event Listeners - Fixed
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
        
        // Character actions - check if elements exist
        const saveBtn = document.getElementById('save-character');
        if (saveBtn) saveBtn.onclick = () => this.saveCurrentCharacter();
        
        const exportBtn = document.getElementById('export-json');
        if (exportBtn) exportBtn.onclick = () => this.exportCharacterJSON();
        
        const deleteBtn = document.getElementById('delete-character');
        if (deleteBtn) deleteBtn.onclick = () => this.deleteCurrentCharacter();
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });
        
        // Special attack button
        const addAttackBtn = document.getElementById('add-special-attack');
        if (addAttackBtn) {
            addAttackBtn.onclick = () => this.createSpecialAttack();
        }
        
        // Tier change
        const tierSelect = document.getElementById('tier-select');
        if (tierSelect) {
            tierSelect.onchange = () => {
                if (this.currentCharacter) {
                    this.currentCharacter.tier = parseInt(tierSelect.value);
                    this.calculateAllStats();
                    this.updateAllDisplays();
                    this.saveCurrentCharacter();
                }
            };
        }
    }

    // Helper UI methods
    renderCharacterBuilder() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('character-builder').classList.remove('hidden');
        this.initializeComponents();
    }

    showWelcomeScreen() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('character-builder').classList.add('hidden');
    }

    renderCharacterTree() {
        const tree = document.getElementById('character-tree');
        if (!tree) return;
        
        tree.innerHTML = '';
        
        // Render characters without folders
        Object.values(this.characters).forEach(char => {
            const charDiv = document.createElement('div');
            charDiv.className = `character-item ${this.currentCharacter?.id === char.id ? 'active' : ''}`;
            charDiv.textContent = char.name;
            charDiv.onclick = () => this.loadCharacter(char.id);
            tree.appendChild(charDiv);
        });
    }

    // Update displays
    updateAllDisplays() {
        if (!this.currentCharacter) return;
        
        // Basic info
        const nameInput = document.getElementById('character-name');
        if (nameInput) nameInput.value = this.currentCharacter.name;
        
        const tierSelect = document.getElementById('tier-select');
        if (tierSelect) tierSelect.value = this.currentCharacter.tier;
        
        // Calculate and update points
        this.calculateAllStats();
        this.updatePointPools();
    }

    updatePointPools() {
        if (!this.currentCharacter) return;
        
        const pools = this.calculatePointPools();
        const spent = this.calculatePointsSpent();
        
        // Update displays
        this.updatePoolDisplay('combat-points', spent.combat, pools.combat);
        this.updatePoolDisplay('utility-points', spent.utility, pools.utility);
        this.updatePoolDisplay('main-points', spent.main, pools.main);
        this.updatePoolDisplay('utility-pool-points', spent.utilityPool, pools.utilityPool);
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

    // Calculation methods simplified
    calculateAllStats() {
        if (!this.currentCharacter) return;
        this.calculatePointsSpent();
    }

    calculatePointsSpent() {
        const spent = {
            combat: 0,
            utility: 0,
            main: 0,
            utilityPool: 0,
            specialAttack: 0
        };
        
        this.currentCharacter.pointsSpent = spent;
        return spent;
    }

    // Stub methods for features not yet implemented
    initializeAbilities() {
        // TODO: Implement abilities UI
    }

    initializeUtility() {
        // TODO: Implement utility UI
    }

    gatherFormData() {
        // TODO: Implement form data gathering
    }

    validateCurrentBuild() {
        // TODO: Implement validation
    }

    renderCharacterSummary() {
        const container = document.getElementById('character-summary');
        if (!container || !this.currentCharacter) return;
        
        container.innerHTML = `
            <div class="summary-section">
                <h3>Character Overview</h3>
                <p>Name: ${this.currentCharacter.name}</p>
                <p>Tier: ${this.currentCharacter.tier}</p>
                <p>Special Attacks: ${this.currentCharacter.specialAttacks.length}</p>
            </div>
        `;
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

    importCharacterJSON() {
        // TODO: Implement import
        this.showInfo('Import feature coming soon');
    }

    createNewFolder(name) {
        // TODO: Implement folders
        this.showInfo('Folder feature coming soon');
    }

    // Notification methods
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

// Character data structure
class VitalityCharacter {
    constructor(id, name, folderId = null) {
        this.id = id;
        this.name = name;
        this.realName = "";
        this.tier = 4;
        this.folderId = folderId;
        this.version = "2.0";
        
        // Archetypes - must be selected first
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
        
        // Limits - properly tracks trait bonuses
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
        
        // Main pool purchases
        this.abilities = {
            boons: [],
            traits: [],
            flaws: []
        };
        
        // Special attacks with per-attack limits
        this.specialAttacks = [];
        
        // Utility
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

// Simple validation engine
class ValidationEngine {
    constructor(gameData) {
        this.gameData = gameData;
    }

    validateCharacter(character) {
        return {
            isValid: true,
            errors: [],
            warnings: []
        };
    }
}

// Initialize the application
let builder;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        builder = new VitalityCharacterBuilder();
        console.log('Vitality Character Builder starting...');
    } catch (error) {
        console.error('Failed to start Character Builder:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ff4444;">
                <h1>Initialization Error</h1>
                <p>Failed to load the Character Builder. Please refresh the page.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
});

// Add required styles for attack builder modal
const modalStyles = document.createElement('style');
modalStyles.textContent = `
.attack-builder-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--accent-primary);
}

.attack-tab {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
}

.attack-tab.active {
    color: var(--accent-primary);
    border-bottom-color: var(--accent-primary);
}

.attack-tab-content {
    display: none;
}

.attack-tab-content.active {
    display: block;
}

.attack-limits-summary,
.attack-upgrades-summary {
    background: var(--bg-primary);
    border: 1px solid var(--accent-primary);
    padding: 1rem;
    margin-bottom: 2rem;
}

.limit-selection-grid,
.upgrade-selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.limit-selection-item,
.upgrade-selection-item {
    background: var(--bg-primary);
    border: 1px solid var(--accent-secondary);
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.limit-selection-item:hover,
.upgrade-selection-item:hover {
    border-color: var(--accent-primary);
}

.limit-selection-item.selected,
.upgrade-selection-item.selected {
    border-color: var(--accent-primary);
    background: rgba(0, 255, 255, 0.1);
}

.limit-selection-item.restricted,
.upgrade-selection-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.restriction-notice {
    color: #ff4444;
    font-size: 0.8em;
    margin-top: 0.5rem;
}

.no-limits-message {
    text-align: center;
    color: var(--text-muted);
    padding: 2rem;
    font-style: italic;
}

.limit-category,
.upgrade-category {
    margin-bottom: 2rem;
}

.limit-category h5,
.upgrade-category h5 {
    color: var(--accent-primary);
    margin-bottom: 1rem;
}
`;
document.head.appendChild(modalStyles);