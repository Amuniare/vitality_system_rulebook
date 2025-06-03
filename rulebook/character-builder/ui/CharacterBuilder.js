// CharacterBuilder.js - REFACTORED to use UpdateManager for central update management
import { VitalityCharacter } from '../core/VitalityCharacter.js';
import { CharacterLibrary } from './components/CharacterLibrary.js';
import { CharacterTree } from './components/CharacterTree.js';
import { PointPoolDisplay } from './components/PointPoolDisplay.js';
import { ValidationDisplay } from './components/ValidationDisplay.js';

// Import all tabs
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { AttributeTab } from './tabs/AttributeTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';
import { SpecialAttackTab } from './tabs/SpecialAttackTab.js';
import { UtilityTab } from './tabs/UtilityTab.js';
import { SummaryTab } from './tabs/SummaryTab.js';

// Import calculation systems
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { StatCalculator } from '../calculators/StatCalculator.js';
import { CharacterValidator } from '../validators/CharacterValidator.js';
import { UpdateManager } from './shared/UpdateManager.js';
import { EventManager } from './shared/EventManager.js';

export class CharacterBuilder {
    constructor() {
        console.log('CharacterBuilder constructor started');
        this.currentCharacter = null;
        this.library = new CharacterLibrary();
        this.currentTab = 'basicInfo';
        this.initialized = false;
        this.lastCharacterHash = null;
        console.log('CharacterBuilder constructor completed');
    }

    async init() {
        try {
            console.log('CharacterBuilder.init() started');
            
            // Check if DOM is ready
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
        console.log('initAfterDOM started');
        
        try {
            // Initialize character library first
            console.log('Initializing character library...');
            await this.library.init();
            console.log('Character library initialized');

            // Initialize components
            console.log('Initializing components...');
            this.initializeComponents();
            console.log('Components initialized');

            // Initialize tabs
            console.log('Initializing tabs...');
            this.initializeTabs();
            console.log('Tabs initialized');
            
            // Set up event listeners
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Event listeners setup completed');
            
            // Show welcome screen
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
        
        this.characterTree = new CharacterTree(this);
        this.pointPoolDisplay = new PointPoolDisplay(this);
        this.validationDisplay = new ValidationDisplay(this);
        
        // Initialize character tree with library
        this.characterTree.library = this.library;
        
        console.log('Real components created');
    }

    initializeTabs() {
        console.log('Creating tabs...');
        
        this.tabs = {
            basicInfo: new BasicInfoTab(this),
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
        
        // Use event delegation instead of static listeners
        EventManager.delegateEvents(container, {
            click: {
                '#new-character-btn': this.createNewCharacter.bind(this),
                '.tab-btn': this.handleTabSwitch.bind(this),
                '#save-character': this.saveCharacter.bind(this),
                '#export-json': this.exportCharacterJSON.bind(this),
                '#delete-character': this.deleteCharacter.bind(this),
                '[data-action="select-archetype"]': (e, element) => {
                    console.log('🎯 Archetype selection clicked!');
                    console.log('🔍 Clicked element:', element);
                    console.log('🔍 Element dataset:', element.dataset);
                    console.log('🔍 Element tagName:', element.tagName);
                    console.log('🔍 Element classes:', element.className);
                    
                    const category = element.dataset.category;
                    const archetypeId = element.dataset.archetype;
                    
                    if (this.tabs.archetypes && category && archetypeId) {
                        console.log(`🎯 Calling selectArchetype(${category}, ${archetypeId})`);
                        this.tabs.archetypes.selectArchetype(category, archetypeId);
                    } else {
                        console.error('❌ Missing data for archetype selection:', { 
                            category, 
                            archetypeId, 
                            hasArchetypeTab: !!this.tabs.archetypes,
                            elementDataset: element.dataset 
                        });
                    }
                },
                '[data-action="continue-to-archetypes"]': (e, element) => {
                    console.log('🎯 Continue to archetypes clicked!');
                    this.switchTab('archetypes');
                },
                '[data-action="continue-to-attributes"]': (e, element) => {
                    console.log('🎯 Continue to attributes clicked!');
                    this.switchTab('attributes');
                },
                '[data-action="continue-to-mainpool"]': (e, element) => {
                    console.log('🎯 Continue to mainpool clicked!');
                    this.switchTab('mainPool');
                },
                '[data-action="continue-to-special-attacks"]': (e, element) => {
                    console.log('🎯 Continue to special attacks clicked!');
                    this.switchTab('specialAttacks');
                },
                '[data-action="continue-to-utility"]': (e, element) => {
                    console.log('🎯 Continue to utility clicked!');
                    this.switchTab('utility');
                },
                '[data-action="continue-to-summary"]': (e, element) => {
                    console.log('🎯 Continue to summary clicked!');
                    this.switchTab('summary');
                }
            },
            input: {
                '[data-action="update-char-name"]': (e, element) => {
                    console.log('🎯 Character name changed!', element.value);
                    if (this.tabs.basicInfo) {
                        this.tabs.basicInfo.updateName(element.value);
                    }
                },
                '[data-action="update-real-name"]': (e, element) => {
                    console.log('🎯 Real name changed!', element.value);
                    if (this.tabs.basicInfo) {
                        this.tabs.basicInfo.updateRealName(element.value);
                    }
                }
            },
            change: {
                '[data-action="update-tier"]': (e, element) => {
                    console.log('🎯 Tier changed!', element.value);
                    if (this.tabs.basicInfo) {
                        this.tabs.basicInfo.updateTier(element.value);
                    }
                }
            }
        });
        
        console.log('setupEventListeners completed with delegation');
    }
        
        

    createNewCharacter() {
        console.log('createNewCharacter called');
        
        try {
            const name = prompt('Character name:') || 'New Character';
            console.log('Character name entered:', name);
            
            const character = new VitalityCharacter(null, name);
            console.log('VitalityCharacter created:', character);
            
            this.currentCharacter = character;
            console.log('Character set as current');
            
            this.showCharacterBuilder();
            console.log('Character builder shown');
            
            this.switchTab('basicInfo');
            console.log('Switched to basic info tab');
            
            // Use UpdateManager for initial display update
            this.scheduleFullUpdate('character_created');
            console.log('Displays updated');
            
            console.log('createNewCharacter completed successfully');
            
        } catch (error) {
            console.error('Error in createNewCharacter:', error);
            this.showNotification('Error creating character: ' + error.message, 'error');
        }
    }

    handleTabSwitch(e, element) {
        const tabName = element.dataset.tab;
        if (tabName) {
            this.switchTab(tabName);
        }
    }

    loadCharacter(characterId) {
        console.log('loadCharacter called with ID:', characterId);
        
        try {
            this.currentCharacter = this.library.getCharacter(characterId);
            if (this.currentCharacter) {
                this.showCharacterBuilder();
                this.scheduleFullUpdate('character_loaded');
                this.switchTab('basicInfo');
            }
        } catch (error) {
            console.error('Error loading character:', error);
            this.showNotification('Error loading character', 'error');
        }
    }

    showWelcomeScreen() {
        console.log('showWelcomeScreen called');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (characterBuilder) characterBuilder.classList.add('hidden');
        
        // Initialize character tree
        if (this.characterTree && this.characterTree.init) {
            this.characterTree.init();
        }
    }

    showCharacterBuilder() {
        console.log('showCharacterBuilder called');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (characterBuilder) characterBuilder.classList.remove('hidden');
        
        // Update character header
        this.updateCharacterHeader();
    }

    updateCharacterHeader() {
        if (!this.currentCharacter) return;
        
        const nameDisplay = document.getElementById('character-name-display');
        const tierDisplay = document.getElementById('character-tier-display');
        
        if (nameDisplay) nameDisplay.textContent = this.currentCharacter.name;
        if (tierDisplay) tierDisplay.textContent = `Tier ${this.currentCharacter.tier}`;
    }

    switchTab(tabName) {
        console.log('switchTab called with:', tabName);
        
        if (!this.tabs[tabName]) {
            console.error('Tab not found:', tabName);
            return;
        }
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) {
            tabContent.classList.add('active');
            tabContent.style.display = 'block';
        }
        
        // Activate tab button
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
        
        // Render the tab content
        if (this.tabs[tabName] && this.tabs[tabName].render) {
            this.tabs[tabName].render();
        }
        
        this.currentTab = tabName;
        this.updateTabStates();
    }



    updateTabStates() {
        if (!this.currentCharacter) return;
        
        const validation = this.validateCharacter();
        const buildOrder = validation.sections?.buildOrder;
        
        // Enable/disable tabs based on build order
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const tabName = btn.dataset.tab;
            let canAccess = true;
            
            switch(tabName) {
                case 'basicInfo':
                    canAccess = true;
                    break;
                case 'archetypes':
                    canAccess = true;
                    break;
                case 'attributes':
                    // CHANGED: Allow access with partial archetypes
                    const selectedArchetypes = Object.values(this.currentCharacter.archetypes).filter(val => val !== null).length;
                    canAccess = selectedArchetypes > 0; // Need at least one archetype
                    break;
                case 'mainPool':
                    // CHANGED: Allow access with basic attributes assigned
                    const hasAttributes = Object.values(this.currentCharacter.attributes).some(val => val > 0);
                    canAccess = hasAttributes;
                    break;
                case 'specialAttacks':
                    // CHANGED: Always allow if archetypes started
                    canAccess = Object.values(this.currentCharacter.archetypes).some(val => val !== null);
                    break;
                case 'utility':
                    canAccess = true; // Always allow
                    break;
                case 'summary':
                    canAccess = true; // Always allow
                    break;
            }
            
            btn.disabled = !canAccess;
            btn.classList.toggle('disabled', !canAccess);
        });
    }

    // OPTIMIZED UPDATE SYSTEM using UpdateManager
    updateCharacter() {
        console.log('updateCharacter called');
        if (!this.currentCharacter) return;
        
        this.currentCharacter.touch();
        
        // Detect what changed and update only relevant components
        const changes = this.detectCharacterChanges();
        this.scheduleSelectiveUpdate(changes);
    }

    detectCharacterChanges() {
        const currentHash = this.getCharacterHash();
        const changes = [];
        
        if (this.lastCharacterHash !== currentHash) {
            // For now, assume all components might need updates
            // In future, could implement more granular change detection
            changes.push('points', 'validation', 'stats', 'basicInfo');
            this.lastCharacterHash = currentHash;
        }
        
        return changes;
    }

    getCharacterHash() {
        if (!this.currentCharacter) return null;
        
        // Simple hash of character state for change detection
        return JSON.stringify({
            tier: this.currentCharacter.tier,
            name: this.currentCharacter.name,
            archetypes: this.currentCharacter.archetypes,
            attributes: this.currentCharacter.attributes,
            mainPoolPurchases: this.currentCharacter.mainPoolPurchases,
            specialAttacks: this.currentCharacter.specialAttacks.length,
            lastModified: this.currentCharacter.lastModified
        });
    }

    scheduleSelectiveUpdate(changes) {
        const updates = [];
        
        if (changes.includes('points')) {
            updates.push({ component: this.pointPoolDisplay, method: 'update', priority: 'high' });
        }
        
        if (changes.includes('validation')) {
            updates.push({ component: this.validationDisplay, method: 'update', priority: 'normal' });
        }
        
        if (changes.includes('basicInfo')) {
            updates.push({ component: this, method: 'updateCharacterHeader', priority: 'high' });
        }
        
        if (changes.includes('stats')) {
            // Notify current tab that stats may have changed
            const currentTabComponent = this.tabs[this.currentTab];
            if (currentTabComponent && currentTabComponent.onCharacterUpdate) {
                updates.push({ component: currentTabComponent, method: 'onCharacterUpdate', priority: 'normal' });
            }
        }
        
        // Only update character tree on save, not every change
        // if (changes.includes('save')) {
        //     updates.push({ component: this.characterTree, method: 'refresh', priority: 'low' });
        // }
        
        UpdateManager.batchUpdates(updates);
    }

    scheduleFullUpdate(reason) {
        console.log(`Scheduling full update: ${reason}`);
        
        UpdateManager.batchUpdates([
            { component: this.pointPoolDisplay, method: 'update', priority: 'high' },
            { component: this.validationDisplay, method: 'update', priority: 'normal' },
            { component: this, method: 'updateCharacterHeader', priority: 'high' },
            { component: this.characterTree, method: 'refresh', priority: 'low' }
        ]);
    }

    // Point pool calculations
    calculatePointPools() {
        if (!this.currentCharacter) {
            return {
                totalAvailable: { combatAttributes: 0, utilityAttributes: 0, mainPool: 0, utilityPool: 0, specialAttacks: 0 },
                totalSpent: { combatAttributes: 0, utilityAttributes: 0, mainPool: 0, utilityPool: 0, specialAttacks: 0 }
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

    // Character validation
    validateCharacter() {
        if (!this.currentCharacter) {
            return { isValid: false, errors: ['No character loaded'], warnings: [], sections: {} };
        }
        
        return CharacterValidator.validateCharacter(this.currentCharacter);
    }

    // Character export
    exportCharacterJSON() {
        if (!this.currentCharacter) {
            this.showNotification('No character to export', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(this.currentCharacter, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentCharacter.name.replace(/[^a-z0-9]/gi, '_')}_character.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Character exported successfully!', 'success');
    }

    // Storage methods
    saveCharacter() {
        console.log('saveCharacter called');
        if (this.currentCharacter && this.library) {
            try {
                this.library.saveCharacter(this.currentCharacter);
                this.showNotification('Character saved successfully!', 'success');
                
                // Update character tree
                UpdateManager.scheduleUpdate(this.characterTree, 'refresh', 'normal');
            } catch (error) {
                console.error('Error saving character:', error);
                this.showNotification('Error saving character', 'error');
            }
        }
    }

    deleteCharacter() {
        if (!this.currentCharacter) return;
        
        if (confirm(`Delete character "${this.currentCharacter.name}"? This cannot be undone.`)) {
            try {
                this.library.deleteCharacter(this.currentCharacter.id);
                this.currentCharacter = null;
                this.showWelcomeScreen();
                this.showNotification('Character deleted', 'info');
            } catch (error) {
                console.error('Error deleting character:', error);
                this.showNotification('Error deleting character', 'error');
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log(`Notification (${type}): ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}