// CharacterBuilder.js - COMPLETE REWRITE without validators and with fixed event handling
import { VitalityCharacter } from '../core/VitalityCharacter.js';
import { CharacterLibrary } from '../shared/ui/CharacterLibrary.js';
// Sidebar components removed

// Import all tabs
import { BasicInfoTab } from '../features/basic-info/BasicInfoTab.js';
import { IdentityTab } from '../features/identity/IdentityTab.js';
import { ArchetypeTab } from '../features/archetypes/ArchetypeTab.js';
import { AttributeTab } from '../features/attributes/AttributeTab.js';
import { MainPoolTab } from '../features/main-pool/MainPoolTab.js';
import { SpecialAttackTab } from '../features/special-attacks/SpecialAttackTab.js';
import { UtilityTab } from '../features/utility/UtilityTab.js';
import { SummaryTab } from '../features/summary/SummaryTab.js';

// Import calculation systems
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { StatCalculator } from '../calculators/StatCalculator.js';
import { SpecialAttackSystem } from '../systems/SpecialAttackSystem.js';
import { UpdateManager } from '../shared/utils/UpdateManager.js';
import { EventManager } from '../shared/utils/EventManager.js';

export class CharacterBuilder {
    constructor(gameDataManager) {
        console.log('CharacterBuilder constructor started');
        this.gameDataManager = gameDataManager;
        this.currentCharacter = null;
        this.library = new CharacterLibrary();
        this.currentTab = 'basicInfo';
        this.initialized = false;
        this.lastCharacterHash = null;
        console.log('CharacterBuilder constructor completed with gameDataManager:', !!gameDataManager);
    }

    async init() {
        try {
            console.log('CharacterBuilder.init() started');
            
            if (document.readyState === 'loading') {
                console.log('DOM still loading, waiting for DOMContentLoaded');
                return new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('DOMContentLoaded fired, continuing init');
                        this.initAfterDOM().then(resolve);
                    });
                });
            } else {
                console.log('DOM already ready, continuing init');
                await this.initAfterDOM();
            }
            
        } catch (error) {
            console.error('CharacterBuilder initialization failed:', error);
            throw error;
        }
    }

    async initAfterDOM() {
        const requiredElements = ['#content', '.tab-navigation'];
        const missing = requiredElements.filter(sel => !document.querySelector(sel));
        if (missing.length > 0) {
            console.error('Required DOM elements missing:', missing);
            throw new Error('DOM not ready for initialization');
        }
        console.log('initAfterDOM started');
        
        try {
            console.log('Initializing character library...');
            await this.library.init();
            console.log('Character library initialized');

            console.log('Initializing components...');
            this.initializeComponents();
            console.log('Components initialized');

            console.log('Initializing tabs...');
            this.initializeTabs();
            console.log('Tabs initialized');
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Event listeners setup completed');
            
            console.log('Showing welcome screen...');
            this.showWelcomeScreen();
            console.log('Welcome screen shown');
            
            this.initialized = true;
            console.log('CharacterBuilder fully initialized');
            
        } catch (error) {
            console.error('Error in initAfterDOM:', error);
            throw error;
        }
    }

    initializeComponents() {
        console.log('Initializing UI components...');
        
        // Sidebar components removed - no longer needed
        
        console.log('Components initialized (sidebar removed)');
    }

    initializeTabs() {
        console.log('Creating tabs...');
        
        this.tabs = {
            basicInfo: new BasicInfoTab(this),
            identity: new IdentityTab(this),
            archetypes: new ArchetypeTab(this),
            attributes: new AttributeTab(this),
            mainPool: new MainPoolTab(this),
            specialAttacks: new SpecialAttackTab(this),
            utility: new UtilityTab(this),
            summary: new SummaryTab(this)
        };
        
        console.log('All tabs created');
    }

    setupEventListeners() {
        console.log('setupEventListeners started');
        
        const container = document.body;
        
        // Use event delegation with proper context - LEAN VERSION WITH ONLY TOP-LEVEL ACTIONS
        EventManager.delegateEvents(container, {
            click: {
                '#create-new-character': (e) => {
                    console.log('Create new character button clicked!');
                    e.preventDefault();
                    this.createNewCharacter();
                },
                '#import-character': () => this.handleImportCharacter(),
                '.character-item': (e) => this.handleCharacterSelect(e),
                '.tab-btn': (e, element) => this.handleTabSwitch(e, element),

                // CHARACTER LIBRARY HANDLERS
                '[data-action="load-character"]': (e, element) => {
                    const characterId = element.dataset.characterId;
                    if (characterId && this.library) {
                        const characterData = this.library.getCharacter(characterId);
                        if (characterData) {
                            // Rehydrate the character object to restore VitalityCharacter methods
                            this.currentCharacter = this.rehydrateCharacter(characterData);
                            this.showCharacterBuilder();
                            this.showNotification(`Loaded ${characterData.name}`, 'success');
                        }
                    }
                },
                '[data-action="delete-from-library"]': (e, element) => {
                    e.stopPropagation(); // Prevent event bubbling to parent character item
                    const characterId = element.dataset.characterId;
                    if (characterId && this.library) {
                        const character = this.library.getCharacter(characterId);
                        if (character && confirm(`Delete "${character.name}" from library?`)) {
                            this.library.deleteCharacter(characterId);
                            this.renderCharacterLibrary(); // Re-render the library UI immediately
                            this.showNotification('Character deleted from library', 'info');
                            
                            // If we're viewing the deleted character, return to welcome screen
                            if (this.currentCharacter && this.currentCharacter.id === characterId) {
                                this.currentCharacter = null;
                                this.showWelcomeScreen();
                            }
                        }
                    }
                }
            }
        }, this); // Pass 'this' as context
        
        console.log('setupEventListeners completed with pure delegation');
    }

    handleTabSwitch(e, element) {
        const tabName = element.dataset.tab;
        if (tabName) {
            this.switchTab(tabName);
        }
    }

    showWelcomeScreen() {
        console.log('showWelcomeScreen called');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        console.log('Welcome screen element:', welcomeScreen);
        console.log('Character builder element:', characterBuilder);
        
        if (welcomeScreen) {
            welcomeScreen.classList.remove('hidden');
            console.log('Welcome screen shown');
        } else {
            console.error('Welcome screen element not found');
        }
        
        if (characterBuilder) {
            characterBuilder.classList.add('hidden');
            console.log('Character builder hidden');
        } else {
            console.error('Character builder element not found');
        }
        
        // Render character library
        this.renderCharacterLibrary();
    }

    showCharacterBuilder() {
        console.log('🎯 CORRECTED showCharacterBuilder method called!');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');

        if (welcomeScreen) {
            // GOOD: This correctly hides the welcome screen using the .hidden class.
            welcomeScreen.classList.add('hidden');
            console.log('✅ Welcome screen hidden.');
        } else {
            console.error('❌ Welcome screen element not found');
        }

        if (characterBuilder) {
            // GOOD: This correctly shows the builder screen by removing the .hidden class.
            characterBuilder.classList.remove('hidden');
            console.log('✅ Character builder shown.');
        } else {
            console.error('❌ Character builder element not found');
        }

        this.updateCharacterHeader();

        // Render the current tab to ensure it's populated.
        this.switchTab(this.currentTab || 'basicInfo');
    }

    updateCharacterHeader() {
        if (!this.currentCharacter) return;
        
        const mainHeading = document.getElementById('character-main-heading');
        const playerDisplay = document.getElementById('character-player-display');
        
        if (mainHeading) {
            mainHeading.textContent = `${this.currentCharacter.name} - Tier ${this.currentCharacter.tier}`;
        }
        if (playerDisplay) {
            // Only show player name for Player Characters
            if (this.currentCharacter.characterType === "player_character") {
                const playerText = this.currentCharacter.playerName ? `Player: ${this.currentCharacter.playerName}` : 'Player: ';
                playerDisplay.textContent = playerText;
                playerDisplay.style.display = '';
            } else {
                playerDisplay.style.display = 'none';
            }
        }
    }

    switchTab(tabName) {
        console.log('switchTab called with:', tabName);
        console.log('Current character:', this.currentCharacter);
        
        if (!this.tabs[tabName]) {
            console.error('Tab not found:', tabName);
            return;
        }
        
        // Hide all tab contents using only classes
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content using only classes
        const tabContent = document.getElementById(`tab-${tabName}`);
        console.log(`Tab content element for tab-${tabName}:`, tabContent);
        if (tabContent) {
            tabContent.classList.remove('hidden');
            tabContent.classList.add('active');
            console.log(`✅ Tab content shown for ${tabName}. Classes:`, tabContent.className);
        } else {
            console.error(`❌ Tab content element tab-${tabName} not found in DOM`);
        }
        
        // Activate tab button
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
        
        // Render the tab content
        if (this.tabs[tabName] && this.tabs[tabName].render) {
            console.log(`Rendering ${tabName} tab...`);
            this.tabs[tabName].render();
            console.log(`✅ ${tabName} tab rendered`);
        } else {
            console.error(`❌ Tab ${tabName} has no render method`);
        }
        
        this.currentTab = tabName;
        this.updateTabStates();
    }

    updateTabStates() {
        if (!this.currentCharacter) return;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const tabName = btn.dataset.tab;
            let canAccess = true;
            
            switch(tabName) {
                case 'basicInfo':
                    canAccess = true; // Always accessible
                    break;
                case 'archetypes':
                    canAccess = true; // Always accessible
                    break;
                case 'attributes':
                    canAccess = true; // Always accessible - no warnings
                    // Remove any existing warning indicators
                    btn.classList.remove('needs-prerequisites');
                    btn.title = '';
                    break;
                case 'mainPool':
                    canAccess = true; // Always accessible - no warnings
                    // Remove any existing warning indicators
                    btn.classList.remove('needs-prerequisites');
                    btn.title = '';
                    break;
                case 'specialAttacks':
                case 'utility':
                case 'summary':
                    canAccess = true; // Always accessible
                    break;
            }
            
            btn.disabled = !canAccess;
            btn.classList.toggle('disabled', !canAccess);
        });
    }

    updateCharacter() {
        console.log('updateCharacter called');
        if (!this.currentCharacter) return;
        
        this.currentCharacter.touch();
        this.currentCharacter.updateBuildState();
        
        // Unified update system - always update all necessary components
        this.updateCharacterHeader();
        
        // Update current tab if it has an update method
        const currentTabComponent = this.tabs[this.currentTab];
        if (currentTabComponent?.onCharacterUpdate) {
            currentTabComponent.onCharacterUpdate(this.currentCharacter);
        }
        
        // Save character automatically to localStorage if library exists
        if (this.library && this.currentCharacter) {
            if (!this.currentCharacter.id) {
                // Ensure character has an ID before saving
                this.currentCharacter.id = Date.now().toString();
            }
            
            // Ensure critical properties are never undefined before saving
            if (!this.currentCharacter.talents || !Array.isArray(this.currentCharacter.talents)) {
                console.warn('Fixing missing talents property before save');
                this.currentCharacter.talents = ["", ""];
            }
            
            if (!this.currentCharacter.archetypes || typeof this.currentCharacter.archetypes !== 'object') {
                console.warn('Fixing missing archetypes property before save');
                this.currentCharacter.archetypes = {
                    movement: null,
                    attackType: null,
                    effectType: null,
                    uniqueAbility: null,
                    defensive: null,
                    specialAttack: null,
                    utility: null
                };
            }
            
            if (!this.currentCharacter.utilityPurchases || typeof this.currentCharacter.utilityPurchases !== 'object') {
                console.warn('Fixing missing utilityPurchases property before save');
                this.currentCharacter.utilityPurchases = {
                    features: [],
                    senses: [],
                    movement: [],
                    descriptors: []
                };
            }
            
            if (!this.currentCharacter.utilityArchetypeSelections || typeof this.currentCharacter.utilityArchetypeSelections !== 'object') {
                console.warn('Fixing missing utilityArchetypeSelections property before save');
                this.currentCharacter.utilityArchetypeSelections = {
                    practicalSkills: [],
                    specializedAttribute: null
                };
            }
            
            console.log('Before saving - character properties:', {
                talents: this.currentCharacter.talents,
                archetypes: this.currentCharacter.archetypes,
                utilityPurchases: this.currentCharacter.utilityPurchases
            });
            this.library.saveCharacter(this.currentCharacter);
            console.log('Character saved to library:', this.currentCharacter.name);
        }
    }

    exportCharacter() {
        const character = this.currentCharacter;
        if (!character) {
            this.showNotification('No character to export', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(character, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${character.name.replace(/[^a-z0-9]/gi, '_')}_character.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Character exported successfully!', 'success');
    }

    // Point pool calculations
    calculatePointPools() {
        if (!this.currentCharacter) {
            return {
                totalAvailable: { combatAttributes: 0, utilityAttributes: 0, mainPool: 0, utilityPool: 0, specialAttacks: 0 },
                totalSpent: { combatAttributes: 0, utilityAttributes: 0, mainPool: 0, utilityPool: 0, specialAttacks: 0 },
                remaining: { combatAttributes: 0, utilityAttributes: 0, mainPool: 0, utilityPool: 0, specialAttacks: 0 }
            };
        }
        
        return PointPoolCalculator.calculateAllPools(this.currentCharacter);
    }

    // Character stats calculations
    calculateStats() {
        if (!this.currentCharacter) {
            return { final: {}, breakdown: {} };
        }
        
        return StatCalculator.calculateAllStats(this.currentCharacter);
    }

    // Get detailed stat breakdowns for Summary Tab
    getStatBreakdowns() {
        if (!this.currentCharacter) {
            return {};
        }
        
        const allStats = StatCalculator.calculateAllStats(this.currentCharacter);
        return allStats.breakdown || {};
    }

    // Character validation (without validator dependencies)
    validateCharacter() {
        if (!this.currentCharacter) {
            return { 
                isValid: false, 
                errors: ['No character loaded'], 
                warnings: [], 
                sections: { 
                    buildOrder: { isValid: false, errors: ['No character'], warnings: [] }
                }
            };
        }
        
        const errors = [];
        const warnings = [];
        const pools = this.calculatePointPools();
        
        // Check point pool validation
        Object.entries(pools.remaining).forEach(([pool, remaining]) => {
            if (remaining < 0) {
                errors.push(`${pool} over budget by ${Math.abs(remaining)} points`);
            }
        });
        
        // Check archetype completion
        const archetypeCount = Object.values(this.currentCharacter.archetypes).filter(v => v !== null).length;
        if (archetypeCount < 7) {
            warnings.push(`Only ${archetypeCount}/7 archetypes selected`);
        }
        
        // Check basic character data
        if (!this.currentCharacter.name || this.currentCharacter.name.trim() === '') {
            errors.push('Character must have a name');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sections: {
                buildOrder: { 
                    isValid: archetypeCount > 0, 
                    errors: archetypeCount === 0 ? ['No archetypes selected'] : [], 
                    warnings: archetypeCount < 7 ? [`${archetypeCount}/7 archetypes selected`] : [],
                    buildState: {
                        archetypesComplete: archetypeCount === 7,
                        attributesAssigned: Object.values(this.currentCharacter.attributes).some(val => val > 0),
                        mainPoolPurchases: this.currentCharacter.mainPoolPurchases.boons.length > 0 || 
                                         this.currentCharacter.mainPoolPurchases.traits.length > 0 ||
                                         this.currentCharacter.mainPoolPurchases.flaws.length > 0,
                        hasSpecialAttacks: this.currentCharacter.specialAttacks.length > 0
                    }
                }
            }
        };
    }


    showNotification(message, type = 'info') {
        console.log(`Notification (${type}): ${message}`);
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add test attribute for warning notifications
        if (type === 'warning') {
            notification.setAttribute('data-testid', 'warning-notification');
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-light);
            border: 1px solid var(--accent-primary);
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // =============================================================
    // CENTRALIZED STATE MANAGEMENT METHODS
    // These are the ONLY methods that should modify this.currentCharacter
    // =============================================================
    
    // Basic character information
    setCharacterName(name) {
        if (!this.currentCharacter) return;
        this.currentCharacter.name = name || 'Unnamed Character';
        this.updateCharacter();
    }
    
    setCharacterRealName(realName) {
        if (!this.currentCharacter) return;
        this.currentCharacter.realName = realName;
        this.updateCharacter();
    }
    
    setCharacterPlayerName(playerName) {
        if (!this.currentCharacter) return;
        this.currentCharacter.playerName = playerName;
        this.updateCharacter();
    }
    
    setCharacterType(characterType) {
        if (!this.currentCharacter) return;
        this.currentCharacter.characterType = characterType;
        // Clear player name if not a Player Character
        if (characterType !== "player_character") {
            this.currentCharacter.playerName = "";
        }
        // Clear sub-type if not "other"
        if (characterType !== "other") {
            this.currentCharacter.characterSubType = null;
        }
        this.updateCharacter();
    }
    
    setCharacterSubType(subType) {
        if (!this.currentCharacter) return;
        this.currentCharacter.characterSubType = subType;
        this.updateCharacter();
    }
    
    setCharacterTier(tier) {
        if (!this.currentCharacter) return;
        this.currentCharacter.tier = parseInt(tier);
        this.updateCharacter();
    }
    
    // Biography detail management
    setBiographyDetail(questionId, value) {
        if (!this.currentCharacter) return;
        this.currentCharacter.biographyDetails[questionId] = value;
        this.updateCharacter();
    }
    
    // Archetype management
    setArchetype(category, archetypeId) {
        if (!this.currentCharacter) return;
        this.currentCharacter.archetypes[category] = archetypeId;
    
        // --- THIS IS THE FIX ---
        // If the special attack archetype changes, we MUST recalculate all attack points.
        if (category === 'specialAttack') {
            console.log('🔄 Special Attack archetype changed. Recalculating all attack points...');
            this.currentCharacter.specialAttacks.forEach(attack => {
                // This method updates the attack object in-place with new point values
                SpecialAttackSystem.recalculateAttackPoints(this.currentCharacter, attack);
            });
        }
        // --- END OF FIX ---
    
        this.updateCharacter();
    }


    
    // Attribute management
    setAttribute(attributeId, value) {
        if (!this.currentCharacter) return;
        this.currentCharacter.attributes[attributeId] = parseInt(value);
        this.updateCharacter();
    }
    
    changeAttribute(attributeId, change) {
        if (!this.currentCharacter) return;
        const currentValue = this.currentCharacter.attributes[attributeId] || 0;
        const newValue = Math.max(0, currentValue + change);
        this.setAttribute(attributeId, newValue);
    }
    
    // Main pool purchases
    purchaseBoon(boonId, details = {}) {
        if (!this.currentCharacter) return;
        const purchase = { boonId, ...details, timestamp: Date.now() };
        this.currentCharacter.mainPoolPurchases.boons.push(purchase);
        this.updateCharacter();
    }
    
    removeBoon(index) {
        if (!this.currentCharacter || index < 0 || index >= this.currentCharacter.mainPoolPurchases.boons.length) return;
        this.currentCharacter.mainPoolPurchases.boons.splice(index, 1);
        this.updateCharacter();
    }
    
    purchaseTrait(traitId, details = {}) {
        if (!this.currentCharacter) return;
        const purchase = { traitId, ...details, timestamp: Date.now() };
        this.currentCharacter.mainPoolPurchases.traits.push(purchase);
        this.updateCharacter();
    }
    
    removeTrait(index) {
        if (!this.currentCharacter || index < 0 || index >= this.currentCharacter.mainPoolPurchases.traits.length) return;
        this.currentCharacter.mainPoolPurchases.traits.splice(index, 1);
        this.updateCharacter();
    }
    
    purchaseFlaw(flawId, details = {}) {
        if (!this.currentCharacter) return;
        const purchase = { flawId, ...details, timestamp: Date.now() };
        this.currentCharacter.mainPoolPurchases.flaws.push(purchase);
        this.updateCharacter();
    }
    
    removeFlaw(index) {
        if (!this.currentCharacter || index < 0 || index >= this.currentCharacter.mainPoolPurchases.flaws.length) return;
        this.currentCharacter.mainPoolPurchases.flaws.splice(index, 1);
        this.updateCharacter();
    }
    
    // Special attack management
    createSpecialAttack() {
        if (!this.currentCharacter) return;
        const newAttack = {
            name: '',
            subtitle: '',
            description: '',
            attackTypes: [],
            effectTypes: [],
            limits: [],
            upgrades: [],
            upgradePointsAvailable: 0,
            upgradePointsSpent: 0,
            timestamp: Date.now()
        };
        this.currentCharacter.specialAttacks.push(newAttack);
        this.updateCharacter();
        return this.currentCharacter.specialAttacks.length - 1; // Return index
    }
    
    updateSpecialAttack(index, property, value) {
        if (!this.currentCharacter || index < 0 || index >= this.currentCharacter.specialAttacks.length) return;
        this.currentCharacter.specialAttacks[index][property] = value;
        this.updateCharacter();
    }
    
    removeSpecialAttack(index) {
        if (!this.currentCharacter || index < 0 || index >= this.currentCharacter.specialAttacks.length) return;
        this.currentCharacter.specialAttacks.splice(index, 1);
        this.updateCharacter();
    }
    
    addSpecialAttackLimit(attackIndex, limitId) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack.limits.some(limit => limit.limitId === limitId)) {
            attack.limits.push({ limitId, timestamp: Date.now() });
            this.updateCharacter();
        }
    }
    
    removeSpecialAttackLimit(attackIndex, limitIndex) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (limitIndex >= 0 && limitIndex < attack.limits.length) {
            attack.limits.splice(limitIndex, 1);
            this.updateCharacter();
        }
    }
    
    addSpecialAttackUpgrade(attackIndex, upgradeId) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack.upgrades.some(upgrade => upgrade.upgradeId === upgradeId)) {
            attack.upgrades.push({ upgradeId, timestamp: Date.now() });
            this.updateCharacter();
        }
    }
    
    removeSpecialAttackUpgrade(attackIndex, upgradeIndex) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (upgradeIndex >= 0 && upgradeIndex < attack.upgrades.length) {
            attack.upgrades.splice(upgradeIndex, 1);
            this.updateCharacter();
        }
    }
    
    // Utility purchases
    purchaseUtilityItem(category, itemId, details = {}) {
        if (!this.currentCharacter) return;
        if (!this.currentCharacter.utilityPurchases[category]) {
            this.currentCharacter.utilityPurchases[category] = [];
        }
        const purchase = { itemId, ...details, timestamp: Date.now() };
        this.currentCharacter.utilityPurchases[category].push(purchase);
        this.updateCharacter();
    }
    
    removeUtilityItem(category, index) {
        if (!this.currentCharacter || !this.currentCharacter.utilityPurchases[category]) return;
        if (index >= 0 && index < this.currentCharacter.utilityPurchases[category].length) {
            this.currentCharacter.utilityPurchases[category].splice(index, 1);
            this.updateCharacter();
        }
    }
    
    // Additional special attack management methods for centralization
    updateSpecialAttackProperty(attackIndex, property, value) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        this.currentCharacter.specialAttacks[attackIndex][property] = value;
        this.updateCharacter();
    }
    
    addAttackTypeToAttack(attackIndex, typeId) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack.attackTypes.includes(typeId)) {
            attack.attackTypes.push(typeId);
            this.updateCharacter();
        }
    }
    
    removeAttackTypeFromAttack(attackIndex, typeId) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        attack.attackTypes = attack.attackTypes.filter(id => id !== typeId);
        this.updateCharacter();
    }
    
    addEffectTypeToAttack(attackIndex, typeId) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        if (!attack.effectTypes.includes(typeId)) {
            attack.effectTypes.push(typeId);
            this.updateCharacter();
        }
    }
    
    removeEffectTypeFromAttack(attackIndex, typeId) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        attack.effectTypes = attack.effectTypes.filter(id => id !== typeId);
        this.updateCharacter();
    }
    
    addConditionToAttack(attackIndex, conditionId, isAdvanced = false) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        const conditionsArray = isAdvanced ? attack.advancedConditions : attack.basicConditions;
        if (!conditionsArray.includes(conditionId)) {
            conditionsArray.push(conditionId);
            this.updateCharacter();
        }
    }
    
    removeConditionFromAttack(attackIndex, conditionId, isAdvanced = false) {
        if (!this.currentCharacter || attackIndex < 0 || attackIndex >= this.currentCharacter.specialAttacks.length) return;
        const attack = this.currentCharacter.specialAttacks[attackIndex];
        const arrayName = isAdvanced ? 'advancedConditions' : 'basicConditions';
        attack[arrayName] = attack[arrayName].filter(id => id !== conditionId);
        this.updateCharacter();
    }
    
    // Character Management Methods

    renderCharacterLibrary() {
        const characterList = document.getElementById('character-list');
        if (!characterList || !this.library) return;

        const characters = this.library.getAllCharacters();
        
        if (characters.length === 0) {
            characterList.innerHTML = '<p class="empty-state">No saved characters yet</p>';
            return;
        }

        characterList.innerHTML = characters.map(char => `
            <div class="character-item" data-character-id="${char.id}">
                <div class="character-info">
                    <div class="character-name">${char.name}</div>
                    <div class="character-details">Tier ${char.tier} | ${new Date(char.lastModified).toLocaleDateString()}</div>
                </div>
                <div class="character-actions">
                    <button class="btn btn-small btn-primary" data-action="load-character" data-character-id="${char.id}">Load</button>
                    <button class="btn btn-small btn-danger" data-action="delete-from-library" data-character-id="${char.id}">Delete</button>
                </div>
            </div>
        `).join('');
    }

    createNewCharacter() {
        console.log('Creating new character method called');
        try {
            this.currentCharacter = new VitalityCharacter();
            console.log('VitalityCharacter created:', this.currentCharacter);
            this.showCharacterBuilder();
            
            this.showNotification('New character created!', 'success');
            console.log('Notification shown');
        } catch (error) {
            console.error('Error in createNewCharacter:', error);
            alert('Error creating character: ' + error.message);
        }
    }

    handleImportCharacter() {
        console.log('Import character triggered');
        const fileInput = document.getElementById('import-file');
        fileInput.click();
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const characterData = JSON.parse(event.target.result);
                    // Rehydrate the imported character to restore VitalityCharacter methods
                    this.currentCharacter = this.rehydrateCharacter(characterData);
                    this.showCharacterBuilder();
                    this.showNotification('Character imported successfully!', 'success');
                } catch (error) {
                    console.error('Import error:', error);
                    this.showNotification('Failed to import character', 'error');
                }
            };
            reader.readAsText(file);
        };
    }

    handleCharacterSelect(e) {
        const characterId = e.target.closest('.character-item')?.dataset.characterId;
        if (!characterId) return;
        
        const characterData = this.library.getCharacter(characterId);
        if (characterData) {
            // Rehydrate the character object to restore VitalityCharacter methods
            this.currentCharacter = this.rehydrateCharacter(characterData);
            this.showCharacterBuilder();
            this.showNotification(`Loaded ${characterData.name}`, 'success');
        }
    }

    /**
     * Rehydrate a plain character object to restore VitalityCharacter methods
     * This fixes the "touch is not a function" error when loading from localStorage
     */
    rehydrateCharacter(characterData) {
        // Create a new VitalityCharacter instance with proper defaults
        const character = new VitalityCharacter();
        
        // Copy properties from loaded data, but preserve initialized defaults for missing properties
        Object.keys(characterData).forEach(key => {
            if (characterData[key] !== undefined) {
                character[key] = characterData[key];
            }
        });
        
        // Ensure critical properties exist with proper defaults (for old character data)
        if (!character.talents || !Array.isArray(character.talents)) {
            character.talents = ["", ""];
        }
        
        if (!character.utilityPurchases || typeof character.utilityPurchases !== 'object') {
            character.utilityPurchases = {
                features: [],
                senses: [],
                movement: [],
                descriptors: []
            };
        }
        
        if (!character.utilityArchetypeSelections || typeof character.utilityArchetypeSelections !== 'object') {
            character.utilityArchetypeSelections = {
                practicalSkills: [],
                specializedAttribute: null
            };
        }
        
        // Ensure the character has a proper ID
        if (!character.id) {
            character.id = Date.now().toString();
        }
        
        // Update the modified timestamp
        character.touch();
        
        console.log('Character rehydrated successfully:', character.name);
        return character;
    }

}