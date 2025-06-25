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
                Logger.warn(`[ModernCharacterBuilder] Auto-created ${domResults.created.length} missing elements:`);
                domResults.created.forEach(element => {
                    Logger.warn(`  - ${element.name} (${element.selector})`);
                });
            }
            
            // Initialize core systems
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to initialize core systems...');
            try {
                await this.initializeCoreSystems();
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Core systems initialization completed successfully');
            } catch (coreError) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Core systems initialization failed:', coreError);
                throw new Error(`Core systems failed: ${coreError.message}`);
            }
            
            // Load game data
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to load game data...');
            try {
                await this.loadGameData();
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Game data loading completed successfully');
            } catch (dataError) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Game data loading failed:', dataError);
                throw new Error(`Game data loading failed: ${dataError.message}`);
            }
            
            // Initialize UI components
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to initialize UI components...');
            try {
                await this.initializeUIComponents();
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: UI components initialization completed successfully');
            } catch (uiError) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: UI components initialization failed:', uiError);
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: UI Error stack:', uiError.stack);
                throw new Error(`UI components initialization failed: ${uiError.message}`);
            }
            
            // Setup event handlers
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to setup global event handlers...');
            try {
                this.setupGlobalEventHandlers();
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Global event handlers setup completed');
            } catch (eventError) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Global event handlers setup failed:', eventError);
                throw new Error(`Event handlers setup failed: ${eventError.message}`);
            }
            
            // Load initial character
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to load initial character...');
            try {
                await this.loadInitialCharacter();
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Initial character loading completed');
            } catch (charError) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Initial character loading failed:', charError);
                throw new Error(`Initial character loading failed: ${charError.message}`);
            }
            
            // Switch to initial tab
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to switch to initial tab:', this.currentTab);
            try {
                await this.switchToTab(this.currentTab);
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Initial tab switch completed');
            } catch (tabError) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Initial tab switch failed:', tabError);
                throw new Error(`Initial tab switch failed: ${tabError.message}`);
            }
            
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
        
        // Enable debug mode by default for troubleshooting
        Logger.enableDebugMode();
        EventBus.enableDebugMode();
        
        if (this.debugMode) {
            Logger.info('[ModernCharacterBuilder] Debug mode enabled via URL parameter');
        } else {
            Logger.info('[ModernCharacterBuilder] Debug mode enabled by default for troubleshooting');
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
        Logger.info('[ModernCharacterBuilder] ENHANCED DEBUG: ======== GAME DATA LOADING START ========');
        Logger.info('[ModernCharacterBuilder] Loading game data...');
        
        try {
            Logger.startTimer('gameDataLoad');
            
            // Initialize EntityLoader which loads unified game data
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: About to call EntityLoader.init()...');
            await EntityLoader.init();
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: EntityLoader.init() completed');
            
            // Verify data was loaded
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Verifying EntityLoader.entities...', EntityLoader.entities);
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: EntityLoader.entities type:', typeof EntityLoader.entities);
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: EntityLoader.entities size:', EntityLoader.entities?.size);
            
            if (!EntityLoader.entities || EntityLoader.entities.size === 0) {
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: No game data loaded!');
                Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: EntityLoader.entities value:', EntityLoader.entities);
                throw new Error('No game data loaded');
            }
            
            // Store reference for easy access
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Creating window.gameData reference...');
            window.gameData = {
                entities: Object.fromEntries(EntityLoader.entities)
            };
            Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: window.gameData created:', Object.keys(window.gameData.entities).length, 'entities');
            
            const loadDuration = Logger.endTimer('gameDataLoad');
            Logger.info(`[ModernCharacterBuilder] ENHANCED DEBUG: Game data loaded successfully in ${loadDuration.toFixed(2)}ms`);
            Logger.info(`[ModernCharacterBuilder] ENHANCED DEBUG: Loaded ${EntityLoader.entities.size} entities`);
            Logger.info('[ModernCharacterBuilder] ENHANCED DEBUG: ======== GAME DATA LOADING COMPLETE ========');
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: ======== GAME DATA LOADING FAILED ========');
            Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Failed to load game data:', error);
            Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Error type:', typeof error);
            Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Error message:', error.message);
            Logger.error('[ModernCharacterBuilder] ENHANCED DEBUG: Error stack:', error.stack);
            throw new Error(`Game data loading failed: ${error.message}`);
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUIComponents() {
        Logger.info('[ModernCharacterBuilder] ENHANCED DEBUG: ======== UI COMPONENTS INITIALIZATION START ========');
        Logger.info('[ModernCharacterBuilder] Initializing UI components...');
        
        // Initialize CharacterHeader with error handling
        try {
            Logger.debug('[ModernCharacterBuilder] Starting CharacterHeader initialization...');
            const headerContainer = getElement('character.header');
            Logger.debug('[ModernCharacterBuilder] Character header container lookup result:', headerContainer);
            
            if (headerContainer) {
                this.characterHeader = new CharacterHeader({
                    character: null, // Will be set when character loads
                    editable: true,
                    showType: true,
                    showTier: true
                }, headerContainer);
                
                await this.characterHeader.init();
                this.characterHeader.mount(); // Mount the component to make it active
                
                // Listen for character name change events
                this.characterHeader.on('character-name-changed', (data) => {
                    this.handleCharacterNameChange(data);
                });
                
                Logger.debug('[ModernCharacterBuilder] Character header initialized');
            } else {
                Logger.warn('[ModernCharacterBuilder] Character header container not found');
            }
        } catch (headerError) {
            Logger.error('[ModernCharacterBuilder] Failed to initialize CharacterHeader:', headerError);
            // Continue with other components
        }
        
        // Initialize CharacterListPanel with error handling
        try {
            Logger.debug('[ModernCharacterBuilder] Starting CharacterListPanel initialization...');
            const listContainer = getElement('character.listContainer');
            Logger.debug('[ModernCharacterBuilder] Character list container lookup result:', listContainer);
            
            // Also try alternative selectors as fallback
            const fallbackContainer = document.getElementById('character-list') || document.getElementById('character-list-content');
            Logger.debug('[ModernCharacterBuilder] Character list fallback container:', fallbackContainer);
            
            const containerToUse = listContainer || fallbackContainer;
            
            if (containerToUse) {
                this.characterListPanel = new CharacterListPanel({
                    characterManager: this.characterManager,
                    activeCharacterId: null, // Will be set when character loads
                    showControls: true,
                    allowDelete: true,
                    allowCreate: true,
                    allowImport: true
                }, containerToUse);
                
                await this.characterListPanel.init();
                this.characterListPanel.mount(); // Mount the component to make it active
                
                // Listen for character management events
                this.characterListPanel.on('character-create-requested', () => this.handleCharacterCreation());
                this.characterListPanel.on('character-select-requested', (data) => this.handleCharacterSelectionById(data.characterId));
                this.characterListPanel.on('character-delete-requested', (data) => this.handleCharacterDeletion(data.characterId));
                this.characterListPanel.on('character-import-requested', () => this.handleCharacterImport());
                
                Logger.debug('[ModernCharacterBuilder] Character list panel initialized');
            } else {
                Logger.warn('[ModernCharacterBuilder] Character list container not found');
            }
        } catch (listError) {
            Logger.error('[ModernCharacterBuilder] Failed to initialize CharacterListPanel:', listError);
            // Continue with other components
        }
        
        // Initialize TabNavigation with ENHANCED debugging
        try {
            Logger.debug('[ModernCharacterBuilder] Starting TabNavigation initialization...');
            Logger.debug('[ModernCharacterBuilder] Looking for tab navigation container...');
            
            // Step 1: Get tab configuration and validate
            const tabConfig = this.getTabConfiguration();
            Logger.debug('[ModernCharacterBuilder] Tab configuration retrieved:', tabConfig);
            Logger.debug('[ModernCharacterBuilder] Tab configuration length:', tabConfig.length);
            Logger.debug('[ModernCharacterBuilder] Tab configuration type:', typeof tabConfig);
            Logger.debug('[ModernCharacterBuilder] Tab configuration is Array:', Array.isArray(tabConfig));
            
            if (!tabConfig || !Array.isArray(tabConfig) || tabConfig.length === 0) {
                Logger.error('[ModernCharacterBuilder] CRITICAL: Tab configuration is invalid!');
                Logger.error('[ModernCharacterBuilder] Tab config value:', tabConfig);
                throw new Error('Invalid tab configuration');
            }
            
            // Step 2: Find container
            const tabNavContainer = getElement('navigation.tabContainer');
            Logger.debug('[ModernCharacterBuilder] Tab navigation container found:', tabNavContainer);
            
            // Also try direct DOM query as fallback
            const directContainer = document.getElementById('tab-navigation');
            Logger.debug('[ModernCharacterBuilder] Direct DOM query result:', directContainer);
            
            const containerToUse = tabNavContainer || directContainer;
            
            if (containerToUse) {
                Logger.debug('[ModernCharacterBuilder] Using container:', containerToUse);
                Logger.debug('[ModernCharacterBuilder] Container tag name:', containerToUse.tagName);
                Logger.debug('[ModernCharacterBuilder] Container ID:', containerToUse.id);
                Logger.debug('[ModernCharacterBuilder] Container class list:', Array.from(containerToUse.classList));
                
                // Step 3: Create props object and validate
                const tabNavigationProps = {
                    tabs: tabConfig,
                    activeTab: this.currentTab,
                    orientation: 'horizontal',
                    allowKeyboardNavigation: true,
                    showBadges: true,
                    showIcons: true
                };
                
                Logger.debug('[ModernCharacterBuilder] TabNavigation props object:', tabNavigationProps);
                Logger.debug('[ModernCharacterBuilder] Props.tabs:', tabNavigationProps.tabs);
                Logger.debug('[ModernCharacterBuilder] Props.tabs length:', tabNavigationProps.tabs?.length);
                
                // Step 4: Create TabNavigation instance
                Logger.debug('[ModernCharacterBuilder] Creating TabNavigation instance...');
                this.tabNavigation = new TabNavigation(tabNavigationProps, containerToUse);
                
                Logger.debug('[ModernCharacterBuilder] TabNavigation instance created:', this.tabNavigation);
                Logger.debug('[ModernCharacterBuilder] TabNavigation props after creation:', this.tabNavigation.props);
                Logger.debug('[ModernCharacterBuilder] TabNavigation props.tabs after creation:', this.tabNavigation.props?.tabs);
                Logger.debug('[ModernCharacterBuilder] TabNavigation props.tabs length after creation:', this.tabNavigation.props?.tabs?.length);
                
                // Step 5: Call init
                Logger.debug('[ModernCharacterBuilder] Calling TabNavigation.init()...');
                await this.tabNavigation.init();
                
                Logger.debug('[ModernCharacterBuilder] TabNavigation.init() completed');
                Logger.debug('[ModernCharacterBuilder] TabNavigation props after init:', this.tabNavigation.props);
                Logger.debug('[ModernCharacterBuilder] TabNavigation props.tabs after init:', this.tabNavigation.props?.tabs);
                
                // Step 6: Mount the component to trigger initial render
                Logger.debug('[ModernCharacterBuilder] Mounting TabNavigation...');
                this.tabNavigation.mount();
                
                // Step 7: Check container contents after mount
                Logger.debug('[ModernCharacterBuilder] Container innerHTML after mount:', containerToUse.innerHTML);
                Logger.debug('[ModernCharacterBuilder] Container children after mount:', containerToUse.children.length);
                
                // Listen for tab switch events
                Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: Setting up tab-switch-requested listener');
                this.tabNavigation.on('tab-switch-requested', (data) => {
                    Logger.debug('[ModernCharacterBuilder] ENHANCED DEBUG: tab-switch-requested event received:', data);
                    this.handleTabSwitch(data.newTab);
                });
                
                Logger.debug('[ModernCharacterBuilder] Tab navigation initialized successfully');
            } else {
                Logger.error('[ModernCharacterBuilder] Tab navigation container not found with either method');
                Logger.error('[ModernCharacterBuilder] Available elements with "tab" in ID:', 
                    Array.from(document.querySelectorAll('[id*="tab"]')).map(el => el.id));
                Logger.error('[ModernCharacterBuilder] All elements with ID:', 
                    Array.from(document.querySelectorAll('[id]')).map(el => el.id));
                throw new Error('Tab navigation container not found');
            }
        } catch (tabError) {
            Logger.error('[ModernCharacterBuilder] Failed to initialize TabNavigation:', tabError);
            Logger.error('[ModernCharacterBuilder] Error stack:', tabError.stack);
            throw tabError; // Re-throw to see the error in the console
        }
        
        Logger.info('[ModernCharacterBuilder] ENHANCED DEBUG: ======== UI COMPONENTS INITIALIZATION COMPLETE ========');
        Logger.info('[ModernCharacterBuilder] UI components initialization completed');
    }

    /**
     * Get tab configuration
     */
    getTabConfiguration() {
        const tabs = [
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
        
        Logger.debug('[ModernCharacterBuilder] Tab configuration method called');
        Logger.debug('[ModernCharacterBuilder] Tab configuration tabs array:', tabs);
        Logger.debug('[ModernCharacterBuilder] Tab configuration tabs length:', tabs.length);
        Logger.debug('[ModernCharacterBuilder] Tab configuration tabs type:', typeof tabs);
        Logger.debug('[ModernCharacterBuilder] Tab configuration tabs is Array:', Array.isArray(tabs));
        Logger.debug('[ModernCharacterBuilder] Tab configuration tabs[0]:', tabs[0]);
        
        return tabs;
    }

    /**
     * Switch to a different tab
     */
    async switchToTab(tabId) {
        Logger.debug(`[ModernCharacterBuilder] Switching to tab: ${tabId}`);
        
        try {
            // Store previous tab before changing state
            const previousTab = this.currentTab;
            
            // Unmount current tab (proper Component lifecycle)
            if (this.activeTabData) {
                if (this.activeTabData.instance.unmount) {
                    this.activeTabData.instance.unmount();
                }
                this.activeTabData.container.style.display = 'none';
            }
            
            // Get or create tab instance
            let tabData = this.tabs.get(tabId);
            if (!tabData) {
                tabData = await this.createTabInstance(tabId);
                this.tabs.set(tabId, tabData);
            }
            
            // Show and mount new tab (proper Component lifecycle)
            tabData.container.style.display = 'block';
            if (tabData.instance.mount) {
                tabData.instance.mount(); // This will automatically trigger _requestRender()
            }
            
            // Update state
            this.currentTab = tabId;
            this.activeTabData = tabData;
            
            // Update navigation if needed
            if (this.tabNavigation) {
                this.tabNavigation.setActiveTab(tabId);
            }
            
            Logger.debug(`[ModernCharacterBuilder] Successfully switched to tab: ${tabId}`);
            
            // Emit tab change event with correct previous/current tab values
            EventBus.emit('TAB_CHANGED', {
                previousTab: previousTab,
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
        
        const containerSelector = `${tabId}-content`;
        const container = document.getElementById(containerSelector);
        if (!container) {
            Logger.error(`[ModernCharacterBuilder] Container not found: #${containerSelector}`);
            Logger.error(`[ModernCharacterBuilder] Available containers:`, 
                Array.from(document.querySelectorAll('[id*="content"]')).map(el => el.id));
            throw new Error(`Tab content container not found: ${containerSelector}`);
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
        
        const instance = new TabClass(container, props);
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
            
            // StateConnector will automatically update components when state changes
            // No need to manually refresh tabs
            
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
        Logger.info(`[ModernCharacterBuilder] ENHANCED DEBUG: ======== TAB SWITCH REQUEST ========`);
        Logger.info(`[ModernCharacterBuilder] ENHANCED DEBUG: Tab switch requested: ${tabId}`);
        Logger.debug(`[ModernCharacterBuilder] ENHANCED DEBUG: Current tab: ${this.currentTab}`);
        Logger.debug(`[ModernCharacterBuilder] ENHANCED DEBUG: Tab IDs equal: ${tabId === this.currentTab}`);
        
        if (tabId === this.currentTab) {
            Logger.debug(`[ModernCharacterBuilder] ENHANCED DEBUG: Already on tab ${tabId}, ignoring switch`);
            return;
        }
        
        try {
            Logger.debug(`[ModernCharacterBuilder] ENHANCED DEBUG: Calling switchToTab(${tabId})`);
            await this.switchToTab(tabId);
            Logger.info(`[ModernCharacterBuilder] ENHANCED DEBUG: Tab switch completed successfully: ${tabId}`);
        } catch (error) {
            Logger.error(`[ModernCharacterBuilder] ENHANCED DEBUG: Tab switch failed:`, error);
            console.error('Tab switch error details:', error);
            this.notificationSystem?.error(`Failed to switch to ${tabId} tab: ${error.message}`);
        }
        
        Logger.info(`[ModernCharacterBuilder] ENHANCED DEBUG: ======== END TAB SWITCH REQUEST ========`);
    }

    /**
     * Handle character selection by ID (from universal components)
     */
    async handleCharacterSelectionById(characterId) {
        Logger.info(`[ModernCharacterBuilder] Character selection by ID requested: ${characterId}`);
        
        try {
            // Use StateManager.loadCharacter() to handle the complete workflow
            const character = await StateManager.loadCharacter(characterId);
            
            Logger.info(`[ModernCharacterBuilder] Character selection completed: ${character.name}`);
            this.notificationSystem.success(`Loaded character: ${character.name}`);
            
        } catch (error) {
            Logger.error('[ModernCharacterBuilder] Failed to select character by ID:', error);
            console.error('Character selection error details:', error);
            this.notificationSystem.error(`Failed to select character: ${error.message}`);
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
                const updatedCharacter = { ...currentCharacter, name: data.newName };
                await StateManager.updateState(updatedCharacter, `Character renamed to "${data.newName}"`);
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
            },
            // Debug functions for TabNavigation issue
            testTabConfiguration: () => {
                console.log('=== TESTING TAB CONFIGURATION ===');
                try {
                    const config = app.getTabConfiguration();
                    console.log('✓ Tab config:', config);
                    console.log('✓ Tab config length:', config?.length);
                    console.log('✓ Tab config type:', typeof config);
                    console.log('✓ Tab config is Array:', Array.isArray(config));
                    console.log('✓ First tab:', config?.[0]);
                    return config;
                } catch (error) {
                    console.error('✗ Tab configuration test failed:', error);
                    return null;
                }
            },
            testTabNavigation: () => {
                console.log('=== TESTING TAB NAVIGATION INSTANCE ===');
                try {
                    console.log('✓ TabNavigation instance exists:', !!app.tabNavigation);
                    console.log('✓ TabNavigation instance:', app.tabNavigation);
                    if (app.tabNavigation) {
                        console.log('✓ TabNavigation props:', app.tabNavigation.props);
                        console.log('✓ TabNavigation props.tabs:', app.tabNavigation.props?.tabs);
                        console.log('✓ TabNavigation props.tabs length:', app.tabNavigation.props?.tabs?.length);
                        console.log('✓ TabNavigation container:', app.tabNavigation.container);
                        console.log('✓ TabNavigation componentId:', app.tabNavigation.componentId);
                        if (app.tabNavigation.container) {
                            console.log('✓ Container innerHTML:', app.tabNavigation.container.innerHTML);
                            console.log('✓ Container children count:', app.tabNavigation.container.children.length);
                            console.log('✓ Container classList:', Array.from(app.tabNavigation.container.classList));
                        }
                    }
                    return app.tabNavigation;
                } catch (error) {
                    console.error('✗ TabNavigation test failed:', error);
                    return null;
                }
            },
            testDOMElements: () => {
                console.log('=== TESTING DOM ELEMENTS ===');
                const navContainer = document.getElementById('tab-navigation');
                console.log('✓ #tab-navigation exists:', !!navContainer);
                console.log('✓ #tab-navigation element:', navContainer);
                if (navContainer) {
                    console.log('✓ Container innerHTML:', navContainer.innerHTML);
                    console.log('✓ Container children:', navContainer.children.length);
                    console.log('✓ Container classList:', Array.from(navContainer.classList));
                }
                
                const tabContent = document.getElementById('tab-content');
                console.log('✓ #tab-content exists:', !!tabContent);
                console.log('✓ #tab-content children:', tabContent?.children.length);
                
                // Check for any elements with data-tab
                const tabElements = document.querySelectorAll('[data-tab]');
                console.log('✓ Elements with [data-tab]:', tabElements.length);
                tabElements.forEach((el, i) => {
                    console.log(`  ${i + 1}. ${el.tagName} data-tab="${el.dataset.tab}" text="${el.textContent?.trim()}"`);
                });
                
                return { navContainer, tabContent, tabElements };
            },
            forceTabRender: () => {
                console.log('=== FORCING TAB NAVIGATION RENDER ===');
                try {
                    if (app.tabNavigation) {
                        console.log('✓ Calling render...');
                        if (app.tabNavigation.render) {
                            app.tabNavigation.render();
                            console.log('✓ Render completed');
                        } else {
                            console.error('✗ No render method found');
                        }
                    } else {
                        console.error('✗ No TabNavigation instance');
                    }
                } catch (error) {
                    console.error('✗ Force render failed:', error);
                }
            },
            debugAppState: () => {
                console.log('=== APP STATE DEBUG ===');
                console.log('✓ App initialized:', app.initialized);
                console.log('✓ Current tab:', app.currentTab);
                console.log('✓ TabNavigation exists:', !!app.tabNavigation);
                console.log('✓ CharacterManager exists:', !!app.characterManager);
                console.log('✓ NotificationSystem exists:', !!app.notificationSystem);
                console.log('✓ Active character:', StateManager.getCharacter()?.name);
                console.log('✓ Error count:', app.errorCount);
                return app.getDebugInfo();
            },
            recreateTabNavigation: async () => {
                console.log('=== RECREATING TAB NAVIGATION ===');
                try {
                    // Clear existing instance
                    if (app.tabNavigation) {
                        console.log('✓ Cleaning up existing TabNavigation...');
                        await app.tabNavigation.cleanup?.();
                        app.tabNavigation = null;
                    }
                    
                    // Get container
                    const container = document.getElementById('tab-navigation');
                    if (!container) {
                        console.error('✗ No container found');
                        return;
                    }
                    
                    // Clear container
                    container.innerHTML = '';
                    console.log('✓ Container cleared');
                    
                    // Get tab config
                    const tabConfig = app.getTabConfiguration();
                    console.log('✓ Tab config retrieved:', tabConfig?.length, 'tabs');
                    
                    // Create new instance
                    const { TabNavigation } = await import('./components/TabNavigation.js');
                    const props = {
                        tabs: tabConfig,
                        activeTab: app.currentTab,
                        orientation: 'horizontal',
                        allowKeyboardNavigation: true,
                        showBadges: true,
                        showIcons: true
                    };
                    
                    console.log('✓ Creating new TabNavigation instance...');
                    app.tabNavigation = new TabNavigation(props, container);
                    
                    console.log('✓ Initializing...');
                    await app.tabNavigation.init();
                    
                    console.log('✓ Mounting...');
                    app.tabNavigation.mount();
                    
                    console.log('✓ TabNavigation recreated successfully');
                    return app.tabNavigation;
                    
                } catch (error) {
                    console.error('✗ Failed to recreate TabNavigation:', error);
                    return null;
                }
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