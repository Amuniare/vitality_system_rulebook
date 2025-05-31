// CharacterBuilder.js - Main UI controller
import { VitalityCharacter } from '../core/VitalityCharacter.js';
import { CharacterValidator } from '../validators/CharacterValidator.js';
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { StatCalculator } from '../calculators/StatCalculator.js';

// Import tab components
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { AttributeTab } from './tabs/AttributeTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';
import { SpecialAttackTab } from './tabs/SpecialAttackTab.js';
import { UtilityTab } from './tabs/UtilityTab.js';
import { SummaryTab } from './tabs/SummaryTab.js';

// Import UI components
import { CharacterTree } from './components/CharacterTree.js';
import { PointPoolDisplay } from './components/PointPoolDisplay.js';
import { ValidationDisplay } from './components/ValidationDisplay.js';

export class CharacterBuilder {
    constructor() {
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.currentTab = 'basicInfo';
        
        // UI Components
        this.characterTree = null;
        this.pointPoolDisplay = null;
        this.validationDisplay = null;
        
        // Tab controllers
        this.tabs = {};
        
        this.initialized = false;
    }

    async init() {
        try {
            console.log('Initializing CharacterBuilder...');
            
            // Initialize UI components
            this.initializeComponents();
            
            // Initialize tabs
            this.initializeTabs();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Show welcome screen initially
            this.showWelcomeScreen();
            
            this.initialized = true;
            console.log('✅ CharacterBuilder initialized');
            
        } catch (error) {
            console.error('❌ CharacterBuilder initialization failed:', error);
            throw error;
        }
    }

    initializeComponents() {
        // Initialize sidebar components
        this.characterTree = new CharacterTree(this);
        this.pointPoolDisplay = new PointPoolDisplay(this);
        this.validationDisplay = new ValidationDisplay(this);
    }

    initializeTabs() {
        this.tabs = {
            basicInfo: new BasicInfoTab(this),
            archetypes: new ArchetypeTab(this),
            attributes: new AttributeTab(this),
            mainPool: new MainPoolTab(this),
            specialAttacks: new SpecialAttackTab(this),
            utility: new UtilityTab(this),
            summary: new SummaryTab(this)
        };
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Character management buttons
        const newCharacterBtn = document.getElementById('new-character-btn');
        if (newCharacterBtn) {
            newCharacterBtn.addEventListener('click', () => this.createNewCharacter());
        }

        const saveCharacterBtn = document.getElementById('save-character');
        if (saveCharacterBtn) {
            saveCharacterBtn.addEventListener('click', () => this.saveCurrentCharacter());
        }

        const exportJsonBtn = document.getElementById('export-json');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.exportCharacterJSON());
        }

        const deleteCharacterBtn = document.getElementById('delete-character');
        if (deleteCharacterBtn) {
            deleteCharacterBtn.addEventListener('click', () => this.deleteCurrentCharacter());
        }
    }

    // CHARACTER MANAGEMENT
    createNewCharacter() {
        const name = prompt('Character name:') || 'New Character';
        const character = new VitalityCharacter(null, name);
        
        this.characters[character.id] = character;
        this.saveCharacters();
        this.loadCharacter(character.id);
        this.characterTree.render();
    }

    loadCharacter(characterId) {
        this.currentCharacter = this.characters[characterId];
        if (this.currentCharacter) {
            this.showCharacterBuilder();
            this.updateAllDisplays();
            this.switchTab('basicInfo');
        }
    }


    // CHARACTER MANAGEMENT
    saveCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.touch();
        
        // Generate filename for characters_data/web_exports/
        const safeName = this.currentCharacter.name.replace(/[^a-z0-9]/gi, '_');
        const filename = `${safeName}_tier${this.currentCharacter.tier}_${this.currentCharacter.id}.json`;
        
        // Create download
        const dataStr = JSON.stringify(this.currentCharacter, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        this.updateAllDisplays();
        this.showNotification(`Character saved as ${filename}! Place in characters_data/web_exports/`, 'success');
    }

    // STORAGE - Replace localStorage with in-memory only
    loadCharacters() {
        return {}; // Start with empty character list - users load files manually
    }

    saveCharacters() {
        // No-op - we only download individual files now
        // Characters persist in memory until page refresh
    }



    deleteCurrentCharacter() {
        if (!this.currentCharacter) return;
        
        if (confirm(`Delete "${this.currentCharacter.name}"? This cannot be undone.`)) {
            delete this.characters[this.currentCharacter.id];
            this.saveCharacters();
            this.currentCharacter = null;
            this.showWelcomeScreen();
            this.characterTree.render();
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

    // TAB MANAGEMENT
    switchTab(tabName) {
        if (!this.canAccessTab(tabName)) {
            this.showNotification('Complete previous steps before accessing this section', 'warning');
            return;
        }

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

        this.currentTab = tabName;

        // Render tab content
        if (this.tabs[tabName]) {
            this.tabs[tabName].render();
        }

        this.updateTabStates();
    }

    canAccessTab(tabName) {
        if (!this.currentCharacter) return tabName === 'basicInfo';
        
        const validation = CharacterValidator.validateCharacter(this.currentCharacter);
        const buildOrder = validation.sections.buildOrder;
        
        switch(tabName) {
            case 'basicInfo':
                return true;
            case 'archetypes':
                return true;
            case 'attributes':
                return buildOrder.buildState.archetypesComplete;
            case 'mainPool':
                return buildOrder.buildState.attributesAssigned;
            case 'specialAttacks':
                return buildOrder.buildState.archetypesComplete;
            case 'utility':
                return buildOrder.buildState.attributesAssigned;
            case 'summary':
                return true;
            default:
                return false;
        }
    }

    updateTabStates() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const tabName = btn.dataset.tab;
            const canAccess = this.canAccessTab(tabName);
            
            btn.classList.toggle('disabled', !canAccess);
            if (!canAccess) {
                btn.title = 'Complete previous steps to access this section';
            } else {
                btn.title = '';
            }
        });
    }

    // UI STATE MANAGEMENT
    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (characterBuilder) characterBuilder.classList.add('hidden');
        
        this.characterTree.render();
    }

    showCharacterBuilder() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (characterBuilder) characterBuilder.classList.remove('hidden');
    }

    updateAllDisplays() {
        if (!this.currentCharacter) return;
        
        // Update all UI components
        this.pointPoolDisplay.update();
        this.validationDisplay.update();
        this.characterTree.render();
        
        // Update current tab
        if (this.tabs[this.currentTab]) {
            this.tabs[this.currentTab].render();
        }
        
        this.updateTabStates();
    }

    // CHARACTER MODIFICATION
    updateCharacter() {
        if (!this.currentCharacter) return;
        
        this.currentCharacter.touch();
        this.updateAllDisplays();
    }

    // UTILITY METHODS
    calculatePointPools() {
        if (!this.currentCharacter) return {};
        return PointPoolCalculator.calculateAllPools(this.currentCharacter);
    }

    validateCharacter() {
        if (!this.currentCharacter) return { isValid: true, errors: [], warnings: [] };
        return CharacterValidator.validateCharacter(this.currentCharacter);
    }

    calculateStats() {
        if (!this.currentCharacter) return {};
        return StatCalculator.calculateAllStats(this.currentCharacter);
    }

    // STORAGE
    loadCharacters() {
        const saved = localStorage.getItem('vitality-characters-v2');
        return saved ? JSON.parse(saved) : {};
    }

    saveCharacters() {
        localStorage.setItem('vitality-characters-v2', JSON.stringify(this.characters));
    }

    // NOTIFICATIONS
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
            border-radius: 4px;
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'error') {
            notification.style.borderColor = '#ff4444';
            notification.style.color = '#ff9999';
        } else if (type === 'success') {
            notification.style.borderColor = '#00ff00';
            notification.style.color = '#99ff99';
        } else if (type === 'warning') {
            notification.style.borderColor = '#ffaa00';
            notification.style.color = '#ffcc99';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}