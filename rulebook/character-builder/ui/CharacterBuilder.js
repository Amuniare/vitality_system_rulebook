// CharacterBuilder.js - Main character builder with real components
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

export class CharacterBuilder {
    constructor() {
        console.log('🟡 CharacterBuilder constructor started');
        this.currentCharacter = null;
        this.library = new CharacterLibrary();
        this.currentTab = 'basicInfo';
        this.initialized = false;
        console.log('✅ CharacterBuilder constructor completed');
    }

    async init() {
        try {
            console.log('🟡 CharacterBuilder.init() started');
            
            // Check if DOM is ready
            if (document.readyState === 'loading') {
                console.log('⚠️ DOM still loading, waiting for DOMContentLoaded');
                return new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('✅ DOMContentLoaded fired, continuing init');
                        this.initAfterDOM().then(resolve);
                    });
                });
            } else {
                console.log('✅ DOM already ready, continuing init');
                await this.initAfterDOM();
            }
            
        } catch (error) {
            console.error('❌ CharacterBuilder initialization failed:', error);
            throw error;
        }
    }

    async initAfterDOM() {
        console.log('🟡 initAfterDOM started');
        
        try {
            // Initialize character library first
            console.log('🟡 Initializing character library...');
            await this.library.init();
            console.log('✅ Character library initialized');

            // Initialize components
            console.log('🟡 Initializing components...');
            this.initializeComponents();
            console.log('✅ Components initialized');

            // Initialize tabs
            console.log('🟡 Initializing tabs...');
            this.initializeTabs();
            console.log('✅ Tabs initialized');
            
            // Set up event listeners
            console.log('🟡 Setting up event listeners...');
            this.setupEventListeners();
            console.log('✅ Event listeners setup completed');
            
            // Show welcome screen
            console.log('🟡 Showing welcome screen...');
            this.showWelcomeScreen();
            console.log('✅ Welcome screen shown');
            
            this.initialized = true;
            console.log('✅ CharacterBuilder fully initialized');
            
        } catch (error) {
            console.error('❌ Error in initAfterDOM:', error);
            throw error;
        }
    }

    initializeComponents() {
        console.log('🟡 Initializing UI components...');
        
        this.characterTree = new CharacterTree(this);
        this.pointPoolDisplay = new PointPoolDisplay(this);
        this.validationDisplay = new ValidationDisplay(this);
        
        // Initialize character tree with library
        this.characterTree.library = this.library;
        
        console.log('✅ Real components created');
    }

    initializeTabs() {
        console.log('🟡 Creating tabs...');
        
        this.tabs = {
            basicInfo: new BasicInfoTab(this),
            archetypes: new ArchetypeTab(this),
            attributes: new AttributeTab(this),
            mainPool: new MainPoolTab(this),
            specialAttacks: new SpecialAttackTab(this),
            utility: new UtilityTab(this),
            summary: new SummaryTab(this)
        };
        
        console.log('✅ All tabs created');
    }

    setupEventListeners() {
        console.log('🟡 setupEventListeners started');
        
        // New character button - wait for characterTree to be ready
        setTimeout(() => {
            const newCharacterBtn = document.getElementById('new-character-btn');
            if (newCharacterBtn) {
                console.log('✅ Found new-character-btn, adding listener');
                newCharacterBtn.addEventListener('click', (e) => {
                    console.log('🎉 NEW CHARACTER BUTTON CLICKED!');
                    try {
                        this.createNewCharacter();
                    } catch (error) {
                        console.error('❌ Error in createNewCharacter:', error);
                    }
                });
            } else {
                console.warn('⚠️ new-character-btn not found in setupEventListeners');
            }
        }, 100);

        // Tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
        });
        
        console.log('✅ setupEventListeners completed');
    }

    createNewCharacter() {
        console.log('🟡 createNewCharacter called');
        
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
            
            this.updateAllDisplays();
            console.log('Displays updated');
            
            console.log('✅ createNewCharacter completed successfully');
            
        } catch (error) {
            console.error('❌ Error in createNewCharacter:', error);
            this.showNotification('Error creating character: ' + error.message, 'error');
        }
    }

    loadCharacter(characterId) {
        console.log('🟡 loadCharacter called with ID:', characterId);
        // For now, this would need library integration
        // this.currentCharacter = this.library.getCharacter(characterId);
        if (this.currentCharacter) {
            this.showCharacterBuilder();
            this.updateAllDisplays();
            this.switchTab('basicInfo');
        }
    }

    showWelcomeScreen() {
        console.log('🟡 showWelcomeScreen called');
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
        console.log('🟡 showCharacterBuilder called');
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
        console.log('🟡 switchTab called with:', tabName);
        
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
                    canAccess = buildOrder?.buildState?.archetypesComplete || false;
                    break;
                case 'mainPool':
                    canAccess = buildOrder?.buildState?.attributesAssigned || false;
                    break;
                case 'specialAttacks':
                    canAccess = buildOrder?.buildState?.archetypesComplete || false;
                    break;
                case 'utility':
                    canAccess = buildOrder?.buildState?.attributesAssigned || false;
                    break;
                case 'summary':
                    canAccess = true;
                    break;
            }
            
            btn.disabled = !canAccess;
            btn.classList.toggle('disabled', !canAccess);
        });
    }

    updateAllDisplays() {
        console.log('🟡 updateAllDisplays called');
        if (!this.currentCharacter) return;
        
        this.pointPoolDisplay.update();
        this.validationDisplay.update();
        if (this.characterTree && this.characterTree.refresh) {
            this.characterTree.refresh();
        }
        this.updateCharacterHeader();
    }

    updateCharacter() {
        console.log('🟡 updateCharacter called');
        if (!this.currentCharacter) return;
        
        this.currentCharacter.touch();
        this.updateAllDisplays();
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

    // Storage methods (simplified for now)
    saveCharacters() {
        console.log('🟡 saveCharacters called');
        // This would integrate with the character library
        if (this.currentCharacter && this.library) {
            this.library.saveCharacter(this.currentCharacter);
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Notification (${type}):`, message);
        
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