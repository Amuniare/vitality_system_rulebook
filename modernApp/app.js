// modernApp/app.js
import { Logger } from './utils/Logger.js';
import { StateManager } from './core/StateManager.js';
import { CharacterManager } from './core/CharacterManager.js';
import { EventBus } from './core/EventBus.js';
import { DataMigration } from './core/DataMigration.js';
import { EntityLoader } from './core/EntityLoader.js';
import { StateConnectorUtils } from './core/StateConnector.js';
import { RenderQueue } from './core/RenderQueue.js';

// Import tabs
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { AttributesTab } from './tabs/AttributesTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';

// Import components
import { TabNavigation } from './components/TabNavigation.js';
import { CharacterHeader } from './components/CharacterHeader.js';
import { CharacterListPanel } from './components/CharacterListPanel.js';
import { NotificationSystem } from './components/NotificationSystem.js';

// Import DOM architecture components
import { DOMVerifier } from './core/DOMVerifier.js';
import { DOMConfig, getElement } from './config/DOMConfig.js';
import { TemplateEngine, AppTemplates } from './core/TemplateEngine.js';

/**
 * Enhanced ModernCharacterBuilder with comprehensive debugging and error handling
 * Main application class that orchestrates all systems and components
 */
class ModernCharacterBuilder {
    constructor() {
        this.appId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.initialized = false;
        this.currentTab = 'basic-info';
        
        // Core systems
        this.characterManager = null;
        this.notificationSystem = null;
        
        // DOM architecture systems
        this.domVerifier = new DOMVerifier();
        this.templateEngine = new TemplateEngine();
        
        // UI components
        this.tabNavigation = null;
        this.characterHeader = null;
        this.characterListPanel = null;
        
        // Active tab instances
        this.tabs = new Map();
        this.activeTabData = null;
        
        // Performance and debugging
        this.initStartTime = 0;
        this.debugMode = false;
        this.errorCount = 0;
        
        // Register templates
        Object.entries(AppTemplates).forEach(([name, template]) => {
            this.templateEngine.registerTemplate(name, template);
        });
        
        Logger.info(`[ModernCharacterBuilder] Application instance created with ID: ${this.appId}`);
    }

    /**
     * Initialize the application with comprehensive error handling and debugging
     */
    async init() {
        this.initStartTime = performance.now();
        Logger.info(`[ModernCharacterBuilder] Starting application initialization...`);
        
        try {
            // Check for debug mode
            this.checkDebugMode();
            
            // Step 1: Verify DOM structure
            this.setupDOMVerification();
            const domResults = this.domVerifier.verify(true); // Auto-create missing elements
            
            if (!domResults.passed) {
                Logger.error('[ModernCharacterBuilder] DOM verification failed');
                Logger.error(this.domVerifier.getReport());
                throw new Error('Required DOM elements are missing');
            }
            
            Logger.info('[ModernCharacterBuilder] DOM verification passed');
            if (domResults.created.length > 0) {
                Logger.warn(`[ModernCharacterBuilder] Auto-created ${domResults.created.length} missing elements`);
            }
            
            // Initialize core systems
            await this.initializeCoreSystems();
            
            // Load game data
            await this.loadGameData();
            
            // Initialize UI components
            await this.initializeUIComponents();
            
            // Setup event handlers
            this.setupGlobalEventHandlers();
            
            // Load initial character
            await this.loadInitialCharacter();
            
            // Switch to initial tab
            await this.switchToTab(this.currentTab);
            
            // Mark as initialized
            this.initialized = true;
            
            const initDuration = performance.now() - this.initStartTime;
            Logger.info(`[ModernCharacterBuilder] Application initialized successfully in ${initDuration.toFixed(2)}ms`);
            
            // Show success notification
            this.notificationSystem.success('Application loaded successfully');
            
            // Emit app ready event
            EventBus.emit('APP_READY', {
                appId: this.appId,
                initDuration: initDuration
            });
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Application initialization failed:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }

    /**
     * Check for debug mode from URL parameters
     */
    checkDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        this.debugMode = urlParams.has('debug') || urlParams.get('debug') === 'true';
        
        if (this.debugMode) {
            Logger.enableDebugMode();
            EventBus.enableDebugMode();
            Logger.info('[ModernCharacterBuilder] Debug mode enabled via URL parameter');
        }
    }

    /**
     * Setup DOM verification by registering all required elements from DOMConfig
     */
    setupDOMVerification() {
        // Register all required elements from DOMConfig
        const configs = DOMConfig.getAllConfigs();
        
        configs.forEach(config => {
            if (config.required) {
                this.domVerifier.registerRequired(config.key, config);
            } else {
                this.domVerifier.registerOptional(config.key, config);
            }
        });
    }

    /**
     * Initialize core systems
     */
    async initializeCoreSystems() {
        Logger.info('[ModernCharacterBuilder] Initializing core systems...');
        
        try {
            // Initialize CharacterManager
            Logger.debug('[ModernCharacterBuilder] Initializing CharacterManager...');
            this.characterManager = CharacterManager.getInstance();
            await this.characterManager.init();
            
            // Initialize StateManager with CharacterManager
            Logger.debug('[ModernCharacterBuilder] Initializing StateManager...');
            await StateManager.init(this.characterManager);
            
            // Initialize NotificationSystem
            Logger.debug('[ModernCharacterBuilder] Initializing NotificationSystem...');
            this.notificationSystem = NotificationSystem.getInstance();
            await this.notificationSystem.init();
            
            Logger.info('[ModernCharacterBuilder] Core systems initialized successfully');
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to initialize core systems:', error);
            throw new Error(`Core systems initialization failed: ${error.message}`);
        }
    }

    /**
     * Load game data
     */
    async loadGameData() {
        Logger.info('[ModernCharacterBuilder] Loading game data...');
        
        try {
            Logger.startTimer('gameDataLoad');
            
            // Initialize EntityLoader which loads unified game data
            await EntityLoader.init();
            
            // Verify data was loaded
            if (!EntityLoader.entities || EntityLoader.entities.size === 0) {
                throw new Error('No game data loaded');
            }
            
            // Store reference for easy access
            window.gameData = {
                entities: Object.fromEntries(EntityLoader.entities)
            };
            
            const loadDuration = Logger.endTimer('gameDataLoad');
            Logger.info(`[ModernCharacterBuilder] Game data loaded successfully in ${loadDuration.toFixed(2)}ms`);
            Logger.info(`[ModernCharacterBuilder] Loaded ${EntityLoader.entities.size} entities`);
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to load game data:', error);
            throw new Error(`Game data loading failed: ${error.message}`);
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUIComponents() {
        Logger.info('[ModernCharacterBuilder] Initializing UI components...');
        
        try {
            // Initialize CharacterHeader with universal pattern
            const headerContainer = getElement('character.header');
            if (headerContainer) {
                this.characterHeader = new CharacterHeader({
                    character: null, // Will be set when character loads
                    editable: true,
                    showType: true,
                    showTier: true
                }, headerContainer);
                
                await this.characterHeader.init();
                
                // Listen for character name change events
                this.characterHeader.on('character-name-changed', (data) => {
                    this.handleCharacterNameChange(data);
                });
                
                Logger.debug('[ModernCharacterBuilder] Character header initialized');
            } else {
                Logger.warn('[ModernCharacterBuilder] Character header container not found');
            }
            
            // Initialize CharacterListPanel with universal pattern
            const listContainer = getElement('character.listContainer');
            if (listContainer) {
                this.characterListPanel = new CharacterListPanel({
                    characterManager: this.characterManager,
                    activeCharacterId: null, // Will be set when character loads
                    showControls: true,
                    allowDelete: true,
                    allowCreate: true,
                    allowImport: true
                }, listContainer);
                
                await this.characterListPanel.init();
                
                // Listen for character management events
                this.characterListPanel.on('character-create-requested', () => this.handleCharacterCreation());
                this.characterListPanel.on('character-select-requested', (data) => this.handleCharacterSelectionById(data.characterId));
                this.characterListPanel.on('character-delete-requested', (data) => this.handleCharacterDeletion(data.characterId));
                this.characterListPanel.on('character-import-requested', () => this.handleCharacterImport());
                
                Logger.debug('[ModernCharacterBuilder] Character list panel initialized');
            } else {
                Logger.warn('[ModernCharacterBuilder] Character list container not found');
            }
            
            // Initialize TabNavigation with universal pattern
            const tabNavContainer = getElement('navigation.tabContainer');
            if (tabNavContainer) {
                this.tabNavigation = new TabNavigation({
                    tabs: this.getTabConfiguration(),
                    activeTab: this.currentTab,
                    orientation: 'horizontal',
                    allowKeyboardNavigation: true,
                    showBadges: true,
                    showIcons: true
                }, tabNavContainer);
                
                await this.tabNavigation.init();
                
                // Listen for tab switch events
                this.tabNavigation.on('tab-switch-requested', (data) => this.handleTabSwitch(data.newTab));
                
                Logger.debug('[ModernCharacterBuilder] Tab navigation initialized');
            } else {
                throw new Error('Tab navigation container not found');
            }
            
            Logger.info('[ModernCharacterBuilder] UI components initialized successfully');
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to initialize UI components:', error);
            throw new Error(`UI initialization failed: ${error.message}`);
        }
    }

    /**
     * Get tab configuration
     */
    getTabConfiguration() {
        return [
            { id: 'basic-info', label: 'Basic Info', icon: 'user' },
            { id: 'archetypes', label: 'Archetypes', icon: 'puzzle-piece' },
            { id: 'attributes', label: 'Attributes', icon: 'sliders' },
            { id: 'main-pool', label: 'Main Pool', icon: 'star' },
            { id: 'secondary-pool', label: 'Secondary Pool', icon: 'gem', disabled: true },
            { id: 'advantages', label: 'Advantages', icon: 'plus-circle', disabled: true },
            { id: 'disadvantages', label: 'Disadvantages', icon: 'minus-circle', disabled: true },
            { id: 'identity', label: 'Identity', icon: 'id-card', disabled: true },
            { id: 'summary', label: 'Summary', icon: 'file-text', disabled: true }
        ];
    }

    /**
     * Switch to a different tab
     */
    async switchToTab(tabId) {
        Logger.debug(`[ModernCharacterBuilder] Switching to tab: ${tabId}`);
        
        try {
            // Hide current tab
            if (this.activeTabData) {
                this.activeTabData.instance.hide();
                this.activeTabData.container.style.display = 'none';
            }
            
            // Get or create tab instance
            let tabData = this.tabs.get(tabId);
            if (!tabData) {
                tabData = await this.createTabInstance(tabId);
                this.tabs.set(tabId, tabData);
            }
            
            // Show new tab
            tabData.container.style.display = 'block';
            await tabData.instance.show();
            
            // Update state
            this.currentTab = tabId;
            this.activeTabData = tabData;
            
            // Update navigation if needed
            if (this.tabNavigation) {
                this.tabNavigation.setActiveTab(tabId);
            }
            
            Logger.debug(`[ModernCharacterBuilder] Successfully switched to tab: ${tabId}`);
            
            // Emit tab change event
            EventBus.emit('TAB_CHANGED', {
                previousTab: this.currentTab,
                currentTab: tabId
            });
            
        } catch (error) {
            Logger.error(`[ModernCharacterBuilder] Failed to switch to tab ${tabId}:`, error);
            this.notificationSystem.error(`Failed to load ${tabId} tab`);
            throw error;
        }
    }

    /**
     * Create a tab instance
     */
    async createTabInstance(tabId) {
        Logger.debug(`[ModernCharacterBuilder] Creating tab instance: ${tabId}`);
        
        const container = document.getElementById(`${tabId}-content`);
        if (!container) {
            throw new Error(`Tab content container not found: ${tabId}-content`);
        }
        
        let TabClass;
        let props = {};
        
        switch (tabId) {
            case 'basic-info':
                TabClass = BasicInfoTab;
                break;
                
            case 'archetypes':
                TabClass = ArchetypeTab;
                break;
                
            case 'attributes':
                TabClass = AttributesTab;
                break;
                
            case 'main-pool':
                TabClass = MainPoolTab;
                break;
                
            default:
                throw new Error(`Unknown tab: ${tabId}`);
        }
        
        const instance = new TabClass(props, container);
        await instance.init();
        
        return { instance, container };
    }

    /**
     * Handle character selection
     */
    async handleCharacterSelection(character) {
        Logger.info(`[ModernCharacterBuilder] Character selected: ${character.name}`);
        
        try {
            // Load character into state
            await StateManager.updateState(character, 'Character selected');
            
            // Update header
            if (this.characterHeader) {
                this.characterHeader.render(character);
            }
            
            // Refresh current tab
            if (this.activeTabData) {
                await this.activeTabData.instance.refresh();
            }
            
            this.notificationSystem.success(`Loaded character: ${character.name}`);
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to load character:', error);
            this.notificationSystem.error('Failed to load character');
        }
    }

    /**
     * Handle character creation
     */
    async handleCharacterCreation() {
        Logger.info('[ModernCharacterBuilder] Creating new character...');
        
        try {
            const newCharacter = await this.characterManager.createNewCharacter();
            await this.handleCharacterSelection(newCharacter);
            
            // Switch to basic info tab for new character
            await this.switchToTab('basic-info');
            
            this.notificationSystem.success('Created new character');
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to create character:', error);
            this.notificationSystem.error('Failed to create character');
        }
    }

    /**
     * Handle character deletion
     */
    async handleCharacterDeletion(characterId) {
        Logger.info(`[ModernCharacterBuilder] Deleting character: ${characterId}`);
        
        try {
            await this.characterManager.deleteCharacter(characterId);
            
            // If deleted character was active, load another
            if (StateManager.getCharacter()?.id === characterId) {
                const characters = this.characterManager.getAllCharacters();
                if (characters.length > 0) {
                    await this.handleCharacterSelection(characters[0]);
                } else {
                    // No characters left, create a new one
                    await this.handleCharacterCreation();
                }
            }
            
            this.notificationSystem.success('Character deleted');
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to delete character:', error);
            this.notificationSystem.error('Failed to delete character');
        }
    }

    /**
     * Handle tab switch request
     */
    async handleTabSwitch(tabId) {
        Logger.debug(`[ModernCharacterBuilder] Tab switch requested: ${tabId}`);
        
        if (tabId === this.currentTab) {
            Logger.debug(`[ModernCharacterBuilder] Already on tab ${tabId}, ignoring switch`);
            return;
        }
        
        try {
            await this.switchToTab(tabId);
        } catch (error) {
            Logger.error(`[ModernCharacterBuilder] Tab switch failed:`, error);
            // Tab navigation will handle error display
        }
    }

    /**
     * Handle character selection by ID (from universal components)
     */
    async handleCharacterSelectionById(characterId) {
        Logger.debug(`[ModernCharacterBuilder] Character selection by ID requested: ${characterId}`);
        
        try {
            const character = this.characterManager.getCharacter(characterId);
            if (character) {
                await this.handleCharacterSelection(character);
            } else {
                Logger.error(`[ModernCharacterBuilder] Character not found: ${characterId}`);
                this.notificationSystem.error('Character not found');
            }
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to select character by ID:', error);
            this.notificationSystem.error('Failed to select character');
        }
    }

    /**
     * Handle character name change (from CharacterHeader)
     */
    async handleCharacterNameChange(data) {
        Logger.debug(`[ModernCharacterBuilder] Character name change requested: ${data.oldName} -> ${data.newName}`);
        
        try {
            // Update character name through StateManager
            const currentCharacter = StateManager.getCharacter();
            if (currentCharacter && currentCharacter.id === data.characterId) {
                await StateManager.updateCharacter({ name: data.newName });
                this.notificationSystem.success(`Character renamed to "${data.newName}"`);
            } else {
                Logger.error('[ModernCharacterBuilder] Character ID mismatch for name change');
                this.notificationSystem.error('Failed to update character name');
            }
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to update character name:', error);
            this.notificationSystem.error('Failed to update character name');
        }
    }

    /**
     * Handle character import request (from CharacterListPanel)
     */
    async handleCharacterImport() {
        Logger.debug('[ModernCharacterBuilder] Character import requested');
        
        try {
            // Create file input for import
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    const text = await file.text();
                    const characterData = JSON.parse(text);
                    
                    // Import through CharacterManager
                    const importedCharacter = await this.characterManager.importCharacter(characterData);
                    await this.handleCharacterSelection(importedCharacter);
                    
                    this.notificationSystem.success(`Character "${importedCharacter.name}" imported successfully`);
                    
                } catch (importError) {
                    Logger.error('[ModernCharacterBuilder] Failed to import character:', importError);
                    this.notificationSystem.error('Failed to import character. Please check the file format.');
                }
            };
            
            input.click();
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to setup character import:', error);
            this.notificationSystem.error('Failed to setup character import');
        }
    }

    /**
     * Setup global event handlers
     */
    setupGlobalEventHandlers() {
        Logger.debug('[ModernCharacterBuilder] Setting up global event handlers...');
        
        // Listen for character changes to update components
        EventBus.on('CHARACTER_CHANGED', (data) => {
            Logger.debug('[ModernCharacterBuilder] Character changed, updating components');
            
            // Update CharacterHeader with new character data
            if (this.characterHeader && data.character) {
                this.characterHeader.updateProps({ character: data.character });
            }
            
            // Update CharacterListPanel with new active character
            if (this.characterListPanel && data.character) {
                this.characterListPanel.updateProps({ activeCharacterId: data.character.id });
            }
        });
        
        // Listen for critical errors
        EventBus.on('CRITICAL_ERROR', (data) => {
            this.errorCount++;
            Logger.error('[ModernCharacterBuilder] Critical error received:', data);
            this.showCriticalError(data.message, data.error);
        });
        
        // Global error handler
        window.addEventListener('error', (event) => {
            this.errorCount++;
            Logger.error('[ModernCharacterBuilder] Global error:', event.error);
            this.notificationSystem?.error('An unexpected error occurred');
        });
        
        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.errorCount++;
            Logger.error('[ModernCharacterBuilder] Unhandled promise rejection:', event.reason);
            this.notificationSystem?.error('An unexpected error occurred');
        });
        
        Logger.debug('[ModernCharacterBuilder] Global event handlers setup complete');
    }

    /**
     * Load initial character
     */
    async loadInitialCharacter() {
        Logger.info('[ModernCharacterBuilder] Loading initial character...');
        
        try {
            const activeCharacter = await this.characterManager.getActiveCharacter();
            
            if (activeCharacter) {
                Logger.info(`[ModernCharacterBuilder] Loaded active character: ${activeCharacter.name}`);
                await StateManager.updateState(activeCharacter, 'Initial character loaded');
                
                // Update header
                if (this.characterHeader) {
                    this.characterHeader.render(activeCharacter);
                }
            } else {
                Logger.info('[ModernCharacterBuilder] No active character found, creating new one');
                await this.handleCharacterCreation();
            }
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to load initial character:', error);
            // Try to create a new character as fallback
            try {
                await this.handleCharacterCreation();
            } catch (createError) {
                Logger.error('[ModernCharacterBuilder] Failed to create fallback character:', createError);
                throw new Error('Unable to load or create character');
            }
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        const initDuration = performance.now() - this.initStartTime;
        Logger.error(`[ModernCharacterBuilder] Application initialization failed after ${initDuration.toFixed(2)}ms:`, error);
        
        // Show error in UI if possible
        if (this.notificationSystem) {
            this.notificationSystem.error(`Application failed to start: ${error.message}`);
        }
        
        // Show critical error
        this.showCriticalError('Application failed to start', error);
    }

    /**
     * Show critical error to user
     */
    showCriticalError(message, error) {
        Logger.error(`[ModernCharacterBuilder] CRITICAL ERROR: ${message}`, error);
        
        // Try notification system first
        if (this.notificationSystem) {
            this.notificationSystem.error(message, 0); // 0 duration = permanent
        }
        
        // Show in critical error container as fallback
        const errorContainer = document.getElementById('critical-error');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>${message}</h4>
                    <p><strong>Error:</strong> ${error?.message || 'Unknown error'}</p>
                    <p><small>Check console for details</small></p>
                    <button onclick="location.reload()" class="btn btn-primary mt-2">Reload Page</button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            appId: this.appId,
            initialized: this.initialized,
            currentTab: this.currentTab,
            errorCount: this.errorCount,
            debugMode: this.debugMode,
            activeCharacter: StateManager.getCharacter()?.name || 'None',
            loadedTabs: Array.from(this.tabs.keys()),
            uptime: this.initialized ? performance.now() - this.initStartTime : 0,
            systems: {
                characterManager: !!this.characterManager,
                stateManager: !!StateManager.initialized,
                eventBus: EventBus.getStats(),
                entityLoader: EntityLoader.entities?.size || 0,
                notificationSystem: !!this.notificationSystem
            }
        };
    }

    /**
     * Cleanup application
     */
    async cleanup() {
        Logger.info('[ModernCharacterBuilder] Starting application cleanup...');
        
        try {
            // Cleanup tabs
            for (const [tabId, tabData] of this.tabs) {
                try {
                    await tabData.instance.cleanup();
                    Logger.debug(`[ModernCharacterBuilder] Cleaned up tab: ${tabId}`);
                } catch (error) {
                    Logger.error(`[ModernCharacterBuilder] Error cleaning up tab ${tabId}:`, error);
                }
            }
            this.tabs.clear();
            
            // Cleanup UI components
            if (this.tabNavigation) {
                await this.tabNavigation.cleanup();
            }
            if (this.characterHeader) {
                await this.characterHeader.cleanup();
            }
            if (this.characterListPanel) {
                await this.characterListPanel.cleanup();
            }
            
            // Clear references
            this.characterManager = null;
            this.notificationSystem = null;
            this.tabNavigation = null;
            this.characterHeader = null;
            this.characterListPanel = null;
            this.activeTabData = null;
            
            Logger.info('[ModernCharacterBuilder] Application cleanup complete');
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Error during cleanup:', error);
        }
    }
}

// Application entry point
document.addEventListener('DOMContentLoaded', async () => {
    try {
        Logger.info('[App] DOM ready, starting application...');
        
        const app = new ModernCharacterBuilder();
        await app.init();
        
        // Expose app instance for debugging
        window.app = app;
        window.debugApp = {
            getAppDebugInfo: () => app.getDebugInfo(),
            getRenderQueueStats: () => RenderQueue.getStats(),
            getStateConnectorStats: () => StateConnectorUtils.getGlobalStats(),
            getEventBusStats: () => EventBus.getStats(),
            forceStateUpdate: () => StateManager.forceNotifyStateChange(),
            enableDebug: () => {
                Logger.enableDebugMode();
                EventBus.enableDebugMode();
                app.debugMode = true;
            }
        };
        
        Logger.info('[App] Application started successfully');
        
    } catch (error) {
        Logger.error('[App] Failed to start application:', error);
        console.error('Application startup failed:', error);
        
        // Show error to user
        const errorContainer = document.getElementById('critical-error');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Application Failed to Start</h4>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }
});

// Handle module loading errors
window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('.js')) {
        Logger.error('[App] Module loading error:', event.error);
        console.error('Module loading failed:', event.filename, event.error);
    }
});

export { ModernCharacterBuilder };