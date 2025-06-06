// CharacterBuilder.js - COMPLETE REWRITE without validators and with fixed event handling
import { VitalityCharacter } from '../core/VitalityCharacter.js';
import { CharacterLibrary } from './components/CharacterLibrary.js';
// Sidebar components removed

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
        
        // Use event delegation with proper context
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
                '#save-character': () => this.saveCharacter(),
                '#export-json': () => this.exportCharacterJSON(),
                '#delete-character': () => this.deleteCharacter(),

                // ARCHETYPE HANDLERS
                '[data-action="select-archetype"]': (e, element) => {
                    const category = element.dataset.category;
                    const archetypeId = element.dataset.archetype;
                    if (this.tabs.archetypes && category && archetypeId) {
                        this.tabs.archetypes.selectArchetype(category, archetypeId);
                    }
                },

                // ATTRIBUTE BUTTON HANDLERS
                '[data-action="change-attribute-btn"]': (e, element) => {
                    const attrId = element.dataset.attr;
                    const change = parseInt(element.dataset.change);
                    if (this.tabs.attributes && attrId !== undefined && change !== undefined) {
                        console.log(`🎯 Attribute button: ${attrId} ${change > 0 ? '+' : ''}${change}`);
                        this.tabs.attributes.changeAttribute(attrId, change);
                    }
                },

                // CHARACTER LIBRARY HANDLERS
                '[data-action="load-character"]': (e, element) => {
                    const characterId = element.dataset.characterId;
                    if (characterId && this.library) {
                        const character = this.library.getCharacter(characterId);
                        if (character) {
                            this.currentCharacter = character;
                            this.showCharacterBuilder();
                            this.showNotification(`Loaded ${character.name}`, 'success');
                        }
                    }
                },
                '[data-action="delete-from-library"]': (e, element) => {
                    const characterId = element.dataset.characterId;
                    if (characterId && this.library) {
                        const character = this.library.getCharacter(characterId);
                        if (character && confirm(`Delete "${character.name}" from library?`)) {
                            this.library.deleteCharacter(characterId);
                            this.renderCharacterLibrary();
                            this.showNotification('Character deleted from library', 'info');
                        }
                    }
                },

                // NAVIGATION HANDLERS
                '[data-action="continue-to-archetypes"]': () => this.switchTab('archetypes'),
                '[data-action="continue-to-attributes"]': () => this.switchTab('attributes'),
                '[data-action="continue-to-mainpool"]': () => this.switchTab('mainPool'),
                '[data-action="continue-to-special-attacks"]': () => this.switchTab('specialAttacks'),
                '[data-action="continue-to-utility"]': () => this.switchTab('utility'),
                '[data-action="continue-to-summary"]': () => this.switchTab('summary'),

                // UNIQUE ABILITY UPGRADE HANDLERS
                '.upgrade-increase': (e, element) => {
                    e.stopPropagation();
                    if (this.tabs.mainPool && this.tabs.mainPool.activeSection === 'uniqueAbilities') {
                        const section = this.tabs.mainPool.sections.uniqueAbilities;
                        if (section) {
                            section.handleUpgradeIncrease(element);
                        }
                    }
                },
                '.upgrade-decrease': (e, element) => {
                    e.stopPropagation();
                    if (this.tabs.mainPool && this.tabs.mainPool.activeSection === 'uniqueAbilities') {
                        const section = this.tabs.mainPool.sections.uniqueAbilities;
                        if (section) {
                            section.handleUpgradeDecrease(element);
                        }
                    }
                },
                '.upgrade-toggle': (e, element) => {
                    e.stopPropagation();
                    if (this.tabs.mainPool && this.tabs.mainPool.activeSection === 'uniqueAbilities') {
                        const section = this.tabs.mainPool.sections.uniqueAbilities;
                        if (section) {
                            section.handleUpgradeToggle(element);
                        }
                    }
                },
                '.upgrade-card': (e, element) => {
                    // Only handle if click is not on a button
                    if (!e.target.closest('button') && this.tabs.mainPool && this.tabs.mainPool.activeSection === 'uniqueAbilities') {
                        const section = this.tabs.mainPool.sections.uniqueAbilities;
                        if (section) {
                            section.handleUpgradeCardClick(element);
                        }
                    }
                }
            },
            input: {
                '[data-action="update-char-name"]': (e, element) => {
                    if (this.tabs.basicInfo) {
                        this.tabs.basicInfo.updateName(element.value);
                    }
                },
                '[data-action="update-real-name"]': (e, element) => {
                    if (this.tabs.basicInfo) {
                        this.tabs.basicInfo.updateRealName(element.value);
                    }
                },
                
                '[data-action="change-attribute-slider"]': (e, element) => {
                    const attrId = element.dataset.attr;
                    const newValue = element.value;
                    if (this.tabs.attributes && attrId !== undefined && newValue !== undefined) {
                        console.log(`🎯 Attribute slider: ${attrId} = ${newValue}`);
                        this.tabs.attributes.setAttributeViaSlider(attrId, newValue);
                    }
                }
            },
            change: {
                '[data-action="update-tier"]': (e, element) => {
                    if (this.tabs.basicInfo) {
                        this.tabs.basicInfo.updateTier(element.value);
                    }
                }
            }
        }, this); // Pass 'this' as context
        
        // Fallback direct event listener for testing
        const createBtn = document.getElementById('create-new-character');
        if (createBtn) {
            console.log('Found create button, adding direct listener');
            createBtn.addEventListener('click', (e) => {
                console.log('Direct event listener triggered!');
                e.preventDefault();
                this.createNewCharacter();
            });
        } else {
            console.log('Create button not found in DOM');
        }
        
        console.log('setupEventListeners completed with delegation');
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
        console.log('🎯 NEW showCharacterBuilder method called!');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        console.log('🔍 Welcome screen element:', welcomeScreen);
        console.log('🔍 Character builder element:', characterBuilder);
        console.log('🔍 Welcome screen classes before:', welcomeScreen?.className);
        console.log('🔍 Character builder classes before:', characterBuilder?.className);
        
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none'; // Force hide with inline style
            welcomeScreen.classList.add('hidden');
            console.log('✅ Welcome screen hidden');
        } else {
            console.error('❌ Welcome screen element not found');
        }
        
        if (characterBuilder) {
            characterBuilder.style.display = 'block'; // Force show with inline style
            characterBuilder.classList.remove('hidden');
            console.log('✅ Character builder shown');
            console.log('🔍 Character builder classes after:', characterBuilder.className);
        } else {
            console.error('❌ Character builder element not found');
        }
        
        this.updateCharacterHeader();
        
        // Render current tab
        if (this.currentTab) {
            this.switchTab(this.currentTab);
        } else {
            this.switchTab('basicInfo');
        }
        
        console.log('🎯 showCharacterBuilder method completed!');
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
                    // FIX: Make less restrictive - allow if any archetype is selected OR allow anyway
                    const selectedArchetypes = Object.values(this.currentCharacter.archetypes).filter(val => val !== null).length;
                    canAccess = true; // CHANGED: Always allow access, just show warning if incomplete
                    // Add visual indicator if archetypes incomplete
                    if (selectedArchetypes === 0) {
                        btn.classList.add('needs-prerequisites');
                        btn.title = 'Complete archetypes first for best experience';
                    } else {
                        btn.classList.remove('needs-prerequisites');
                        btn.title = '';
                    }
                    break;
                case 'mainPool':
                    // FIX: Make less restrictive - allow access even without attributes
                    canAccess = true; // CHANGED: Always allow access
                    const hasAttributes = Object.values(this.currentCharacter.attributes).some(val => val > 0);
                    if (!hasAttributes) {
                        btn.classList.add('needs-prerequisites');
                        btn.title = 'Assign attributes first for point calculations';
                    } else {
                        btn.classList.remove('needs-prerequisites');
                        btn.title = '';
                    }
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
        this.currentCharacter.updateBuildState(); // Update build state after any change
        
        const changes = this.detectCharacterChanges();
        this.scheduleSelectiveUpdate(changes);
    }

    detectCharacterChanges() {
        const currentHash = this.getCharacterHash();
        const changes = [];
        
        if (this.lastCharacterHash !== currentHash) {
            changes.push('points', 'validation', 'stats', 'basicInfo');
            this.lastCharacterHash = currentHash;
        }
        
        return changes;
    }

    getCharacterHash() {
        if (!this.currentCharacter) return null;
        
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
            const currentTabComponent = this.tabs[this.currentTab];
            if (currentTabComponent && currentTabComponent.onCharacterUpdate) {
                updates.push({ component: currentTabComponent, method: 'onCharacterUpdate', priority: 'normal' });
            }
            
            // FIX: Also update AttributeTab specifically when attributes change
            if (this.tabs.attributes && (changes.includes('points') || this.currentTab === 'attributes')) {
                updates.push({ component: this.tabs.attributes, method: 'onCharacterUpdate', priority: 'normal' });
            }
        }
        
        UpdateManager.batchUpdates(updates);
    }

    scheduleFullUpdate(reason) {
        console.log(`Scheduling full update: ${reason}`);
        
        UpdateManager.batchUpdates([
            { component: this, method: 'updateCharacterHeader', priority: 'high' }
        ]);
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
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Character Management Methods
    showWelcomeScreen() {
        console.log('Showing welcome screen');
        document.getElementById('welcome-screen').style.display = 'block';
        document.getElementById('character-builder').style.display = 'none';
        
        // Render character library
        this.renderCharacterLibrary();
    }

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
            console.log('Character builder shown');
            
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
                    this.currentCharacter = new VitalityCharacter();
                    Object.assign(this.currentCharacter, characterData);
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
        
        const character = this.library.getCharacter(characterId);
        if (character) {
            this.currentCharacter = character;
            this.showCharacterBuilder();
            this.showNotification(`Loaded ${character.name}`, 'success');
        }
    }

}