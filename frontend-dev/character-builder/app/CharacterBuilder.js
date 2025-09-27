// CharacterBuilder.js - Simplified for new streamlined system
import { VitalityCharacter } from '../core/VitalityCharacter.js';
import { CharacterLibrary } from '../shared/ui/CharacterLibrary.js';

// Import simplified tabs (Special Attacks tab now conditional)
import { BasicInfoTab } from '../features/basic-info/BasicInfoTab.js';
import { IdentityTab } from '../features/identity/IdentityTab.js';
import { ArchetypeTab } from '../features/archetypes/ArchetypeTab.js';
import { AttributeTab } from '../features/attributes/AttributeTab.js';
import { MainPoolTab } from '../features/main-pool/MainPoolTab.js'; // Now boon selection
import { UtilityTab } from '../features/utility/UtilityTab.js';
import { SummaryTab } from '../features/summary/SummaryTab.js';

// Import calculation systems
import { StatCalculator } from '../calculators/StatCalculator.js';
import { EventManager } from '../shared/utils/EventManager.js';
import { gameDataManager } from '../core/GameDataManager.js';

export class CharacterBuilder {
    constructor() {
        console.log('CharacterBuilder constructor started (simplified system)');
        this.currentCharacter = null;
        this.library = new CharacterLibrary();
        this.currentTab = 'basicInfo';
        this.initialized = false;
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
            console.log('Library before init:', this.library);
            console.log('Library methods before init:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.library)));
            await this.library.init();
            console.log('Character library initialized');
            console.log('Library after init:', this.library);
            console.log('Library methods after init:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.library)));

            console.log('Initializing simplified tabs...');
            this.initializeTabs();
            console.log('Tabs initialized');

            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Event listeners setup completed');

            console.log('Showing welcome screen...');
            this.showWelcomeScreen();
            console.log('Welcome screen shown');

            this.initialized = true;
            console.log('CharacterBuilder fully initialized (simplified system)');

        } catch (error) {
            console.error('Error in initAfterDOM:', error);
            throw error;
        }
    }

    initializeTabs() {
        console.log('Creating simplified tabs...');

        // Simplified tab system (removed Special Attacks as mandatory tab)
        this.tabs = {
            basicInfo: new BasicInfoTab(this),
            identity: new IdentityTab(this),
            archetypes: new ArchetypeTab(this),
            attributes: new AttributeTab(this),
            mainPool: new MainPoolTab(this), // Now boon selection
            utility: new UtilityTab(this),
            summary: new SummaryTab(this)
        };

        console.log('Simplified tabs created:', Object.keys(this.tabs));
    }

    setupEventListeners() {
        console.log('setupEventListeners started');

        const container = document.body;

        // Event delegation for simplified system
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
                            this.currentCharacter = this.rehydrateCharacter(characterData);
                            this.showCharacterBuilder();
                            this.showNotification(`Loaded ${characterData.name}`, 'success');
                        }
                    }
                },
                '[data-action="delete-from-library"]': (e, element) => {
                    e.stopPropagation();
                    const characterId = element.dataset.characterId;
                    if (characterId && this.library) {
                        const character = this.library.getCharacter(characterId);
                        if (character && confirm(`Delete "${character.name}" from library?`)) {
                            this.library.deleteCharacter(characterId);
                            this.renderCharacterLibrary();
                            this.showNotification('Character deleted from library', 'info');

                            if (this.currentCharacter && this.currentCharacter.id === characterId) {
                                this.currentCharacter = null;
                                this.showWelcomeScreen();
                            }
                        }
                    }
                }
            }
        }, this);

        console.log('setupEventListeners completed (simplified system)');
    }

    createNewCharacter() {
        console.log('Creating new simplified character...');
        try {
            this.currentCharacter = new VitalityCharacter();
            console.log('VitalityCharacter created:', this.currentCharacter);
            this.showCharacterBuilder();

            this.showNotification('New character created! (Simplified system)', 'success');
            console.log('Character creation completed');
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
                    this.currentCharacter = this.rehydrateCharacter(characterData);
                    this.showCharacterBuilder();
                    this.showNotification(`Imported ${characterData.name}`, 'success');
                } catch (error) {
                    console.error('Import failed:', error);
                    alert('Failed to import character: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
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

        if (welcomeScreen) {
            welcomeScreen.classList.remove('hidden');
            this.renderCharacterLibrary();
            console.log('Welcome screen shown');
        }

        if (characterBuilder) {
            characterBuilder.classList.add('hidden');
            console.log('Character builder hidden');
        }
    }

    showCharacterBuilder() {
        console.log('showCharacterBuilder called');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');

        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }

        if (characterBuilder) {
            characterBuilder.classList.remove('hidden');
            console.log('Character builder shown');
        }

        this.updateCharacterHeader();
        this.switchTab('basicInfo'); // Start with basic info
        this.updateTabStates();
    }

    updateCharacterHeader() {
        if (!this.currentCharacter) return;

        const nameDisplay = document.getElementById('character-name-display');
        const levelDisplay = document.getElementById('character-level-display');
        const playerDisplay = document.getElementById('player-name-display');

        if (nameDisplay) {
            nameDisplay.textContent = this.currentCharacter.name || 'Unnamed Character';
        }

        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.currentCharacter.level} (Tier +${this.currentCharacter.tier})`;
        }

        if (playerDisplay) {
            if (this.currentCharacter.playerName) {
                playerDisplay.textContent = this.currentCharacter.playerName;
                playerDisplay.style.display = '';
            } else {
                playerDisplay.style.display = 'none';
            }
        }
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
            content.classList.add('hidden');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
            tabContent.classList.add('active');
            console.log(`✅ Tab content shown for ${tabName}`);
        } else {
            console.error(`❌ Tab content element tab-${tabName} not found`);
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
        }

        this.currentTab = tabName;
        this.updateTabStates();
    }

    updateTabStates() {
        if (!this.currentCharacter) return;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            const tabName = btn.dataset.tab;
            let canAccess = true;

            // Simplified system - all tabs are accessible
            // (No complex prerequisites)
            switch(tabName) {
                case 'basicInfo':
                case 'identity':
                case 'archetypes':
                case 'attributes':
                case 'mainPool': // Boon selection
                case 'utility':
                case 'summary':
                    canAccess = true;
                    break;
            }

            btn.disabled = !canAccess;
            btn.classList.toggle('disabled', !canAccess);
        });
    }

    updateCharacter() {
        console.log('updateCharacter called (simplified system)');
        if (!this.currentCharacter) return;

        this.currentCharacter.touch();

        // Update character header
        this.updateCharacterHeader();

        // Update current tab if it has an update method
        const currentTabComponent = this.tabs[this.currentTab];
        if (currentTabComponent?.onCharacterUpdated) {
            currentTabComponent.onCharacterUpdated();
        }

        // Auto-save to library
        if (this.library && this.currentCharacter) {
            if (!this.currentCharacter.id) {
                this.currentCharacter.id = Date.now().toString();
            }

            this.library.saveCharacter(this.currentCharacter);
            console.log('Character auto-saved to library');
        }

        this.updateTabStates();
    }

    // Character rehydration for loading from storage
    rehydrateCharacter(characterData) {
        console.log('Rehydrating character:', characterData);

        // Create new VitalityCharacter and copy data
        const character = new VitalityCharacter(characterData.id, characterData.name);

        // Copy all properties from saved data
        Object.assign(character, characterData);

        // Ensure simplified structure
        if (!character.version || !character.version.includes('simplified')) {
            console.log('Converting legacy character to simplified system');
            character.version = '3.0-simplified';

            // Convert old archetype system to new 4-category system
            if (character.archetypes) {
                const oldArchetypes = character.archetypes;
                character.archetypes = {
                    movement: oldArchetypes.movement || null,
                    attack: null, // Will need manual conversion
                    defensive: oldArchetypes.defensive || null,
                    utility: oldArchetypes.utility || null
                };
            }

            // Convert old purchases to boons
            if (!character.boons) {
                character.boons = [];
            }

            // Ensure new structure
            if (!character.specialAttack) {
                character.specialAttack = null;
            }
        }

        console.log('Character rehydrated:', character);
        return character;
    }

    renderCharacterLibrary() {
        console.log('renderCharacterLibrary called');
        console.log('this.library:', this.library);
        console.log('this.library.renderLibrary:', this.library?.renderLibrary);

        if (this.library && typeof this.library.renderLibrary === 'function') {
            this.library.renderLibrary();
        } else {
            console.error('Library renderLibrary method not available:', {
                library: this.library,
                hasRenderLibrary: this.library?.renderLibrary,
                libraryType: typeof this.library
            });

            // Fallback: render empty library message
            const container = document.getElementById('character-list');
            if (container) {
                container.innerHTML = '<p class="empty-library">Character library temporarily unavailable.</p>';
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log(`Notification (${type}): ${message}`);
        // Simple notification - could be enhanced later
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Export functionality
    exportCharacter() {
        if (!this.currentCharacter) return;

        const exportData = this.currentCharacter.exportForRoll20();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentCharacter.name || 'character'}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('Character exported!', 'success');
    }
}