// modernApp/app.js
import { Logger } from './utils/Logger.js';
import { SchemaSystem } from './core/SchemaSystem.js';
import { EntityLoader } from './core/EntityLoader.js';
import { EventBus } from './core/EventBus.js';
import { StateManager } from './core/StateManager.js';
import { CharacterManager } from './core/CharacterManager.js';
import { ValidationSystem } from './core/ValidationSystem.js';
import { NotificationSystem } from './components/NotificationSystem.js';
import { CharacterListPanel } from './components/CharacterListPanel.js';
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { AttributesTab } from './tabs/AttributesTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';
import { SummaryPanel } from './components/SummaryPanel.js';

/**
 * ModernCharacterBuilder - Main application class with proper lifecycle management
 */
class ModernCharacterBuilder {
    static instance = null;
    
    constructor() {
        if (ModernCharacterBuilder.instance) {
            Logger.warn('[App] Application instance already exists. Returning existing instance.');
            return ModernCharacterBuilder.instance;
        }
        
        this.initialized = false;
        this.tabs = new Map();
        this.activeTab = null;
        this.componentRegistry = new Map();
        
        // Core system instances
        this.characterManager = null;
        this.validationSystem = null;
        this.notificationSystem = null;
        
        // UI components
        this.characterListPanel = null;
        this.summaryPanel = null;
        
        // Bind event handlers to maintain context
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleCharacterChange = this.handleCharacterChange.bind(this);
        this.handleCharacterListUpdate = this.handleCharacterListUpdate.bind(this);
        
        ModernCharacterBuilder.instance = this;
        Logger.info('[App] ModernCharacterBuilder instance created with enhanced lifecycle management.');
    }
    
    async init() {
        if (this.initialized) {
            Logger.warn('[App] Application already initialized');
            return;
        }

        try {
            Logger.info('[App] Starting initialization...');
            
            await this.initializeCoreSystems();
            await this.initializeUIComponents();
            
            this.registerAllTabs();
            await this.createTabContainers();
            await this.initializeTabInstances();
            
            await this.setupEventListeners();
            
            this.switchTab('basic-info');
            
            this.initialized = true;
            Logger.info('[App] Application initialization complete.');
            
        } catch (error) {
            Logger.error('[App] Initialization failed:', error);
            if (this.notificationSystem) {
                this.notificationSystem.error('Failed to initialize application');
            }
            throw error;
        }
    }

    async initializeCoreSystems() {
        Logger.info('[App] Initializing core systems...');
        
        await SchemaSystem.init();
        await EntityLoader.init();
        
        // FIXED: Initialize CharacterManager BEFORE StateManager
        this.characterManager = new CharacterManager();
        await this.characterManager.init();
        
        // FIXED: Pass characterManager instance to StateManager
        await StateManager.init(this.characterManager);
        
        this.validationSystem = new ValidationSystem();
        
        // Register core systems in component registry
        this.componentRegistry.set('SchemaSystem', SchemaSystem);
        this.componentRegistry.set('EntityLoader', EntityLoader);
        this.componentRegistry.set('StateManager', StateManager);
        this.componentRegistry.set('CharacterManager', this.characterManager);
        this.componentRegistry.set('ValidationSystem', this.validationSystem);
        
        Logger.info('[App] Core systems initialized.');
    }

    async initializeUIComponents() {
        Logger.info('[App] Initializing UI components...');

        // Initialize NotificationSystem
        const notificationContainer = document.getElementById('notifications');
        if (notificationContainer) {
            this.notificationSystem = new NotificationSystem(notificationContainer);
            this.componentRegistry.set('NotificationSystem', this.notificationSystem);
            Logger.info('[App] NotificationSystem initialized.');
        } else {
            Logger.error('[App] Notification container #notifications not found!');
        }

        // FIXED: Initialize CharacterListPanel with both required containers and characterManager
        const characterListContainer = document.getElementById('character-list-content');
        const characterControlsContainer = document.getElementById('character-list-controls');
        
        if (characterListContainer && characterControlsContainer) {
            this.characterListPanel = new CharacterListPanel(
                'character-list-content', 
                'character-list-controls', 
                this.characterManager
            );
            await this.characterListPanel.init();
            this.componentRegistry.set('CharacterListPanel', this.characterListPanel);
            Logger.info('[App] CharacterListPanel initialized.');
        } else {
            Logger.error('[App] Character list containers not found!', {
                listContainer: !!characterListContainer,
                controlsContainer: !!characterControlsContainer
            });
        }

        // Initialize SummaryPanel
        const summaryContainer = document.getElementById('summary-content');
        if (summaryContainer) {
            this.summaryPanel = new SummaryPanel(summaryContainer);
            this.summaryPanel.init();
            this.componentRegistry.set('SummaryPanel', this.summaryPanel);
            Logger.info('[App] SummaryPanel initialized.');
        } else {
            Logger.error('[App] Summary content container #summary-content not found!');
        }
        
        Logger.info('[App] UI components initialized.');
    }

    registerAllTabs() {
        Logger.info('[App] Registering tabs...');
        this.registerTab('basic-info', BasicInfoTab, 'Basic Info');
        this.registerTab('archetypes', ArchetypeTab, 'Archetypes');
        this.registerTab('attributes', AttributesTab, 'Attributes');
        this.registerTab('main-pool', MainPoolTab, 'Main Pool');
        Logger.info(`[App] Tabs registered:`, Array.from(this.tabs.keys()));
    }

    async createTabContainers() {
        const mainTabContentDiv = document.getElementById('tab-content');
        if (mainTabContentDiv) {
            this.tabs.forEach(tabData => {
                const specificTabDiv = document.createElement('div');
                specificTabDiv.id = `${tabData.id}-tab-panel`;
                specificTabDiv.className = 'tab-content-panel';
                specificTabDiv.style.display = 'none';
                mainTabContentDiv.appendChild(specificTabDiv);
                tabData.containerElement = specificTabDiv;
                Logger.debug(`[App] Created panel for tab: ${tabData.id}-tab-panel`);
            });
        } else {
            Logger.error("[App] Main tab content container #tab-content not found!");
        }
    }

    async initializeTabInstances() {
        Logger.info('[App] Initializing tab instances...');
        
        for (const [tabId, tabData] of this.tabs) {
            try {
                if (tabData.containerElement) {
                    const TabClass = tabData.class;
                    tabData.instance = new TabClass(tabData.containerElement);
                    
                    // CRITICAL FIX: Ensure the component is properly mounted
                    if (typeof tabData.instance.mount === 'function') {
                        tabData.instance.mount(tabData.containerElement);
                    } else {
                        // For components without explicit mount method
                        tabData.instance.container = tabData.containerElement;
                        tabData.instance.isMounted = true;
                    }
                    
                    Logger.debug(`[App] Initialized tab instance: ${tabId}`);
                } else {
                    Logger.error(`[App] No container element for tab: ${tabId}`);
                }
            } catch (error) {
                Logger.error(`[App] Failed to initialize tab ${tabId}:`, error);
            }
        }
    }

    registerTab(id, tabClass, name) {
        this.tabs.set(id, {
            id,
            class: tabClass,
            name,
            instance: null,
            containerElement: null
        });
    }

    async setupEventListeners() {
        // Set up tab navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', this.handleTabClick);
        });

        // Set up character management events
        EventBus.on('CHARACTER_CHANGED', this.handleCharacterChange);
        EventBus.on('CHARACTER_LIST_UPDATED', this.handleCharacterListUpdate);
        
        Logger.info('[App] Event listeners set up.');
    }

    handleTabClick(event) {
        const tabId = event.target.dataset.tab;
        if (tabId && this.tabs.has(tabId)) {
            this.switchTab(tabId);
        }
    }

    switchTab(tabId) {
        if (!this.tabs.has(tabId)) {
            Logger.error(`[App] Unknown tab: ${tabId}`);
            return;
        }

        // Hide current tab
        if (this.activeTab && this.tabs.has(this.activeTab)) {
            const currentTabData = this.tabs.get(this.activeTab);
            if (currentTabData.containerElement) {
                currentTabData.containerElement.style.display = 'none';
            }
        }

        // Update active tab
        this.activeTab = tabId;
        const newTabData = this.tabs.get(tabId);
        
        // Show new tab
        if (newTabData.containerElement) {
            newTabData.containerElement.style.display = 'block';
        }

        // Update tab navigation UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // CRITICAL FIX: Ensure tab is mounted and initialized before rendering
        if (newTabData.instance) {
            // Double-check mounting for safety
            if (!newTabData.instance.isMounted && newTabData.containerElement) {
                if (typeof newTabData.instance.mount === 'function') {
                    newTabData.instance.mount(newTabData.containerElement);
                } else {
                    newTabData.instance.container = newTabData.containerElement;
                    newTabData.instance.isMounted = true;
                }
                Logger.debug(`[App] Re-mounted tab: ${tabId}`);
            }

            // Initialize tab if not already done
            if (!newTabData.instance.initialized && typeof newTabData.instance.init === 'function') {
                try {
                    newTabData.instance.init();
                    newTabData.instance.initialized = true;
                    Logger.debug(`[App] Late-initialized tab: ${tabId}`);
                } catch (error) {
                    Logger.error(`[App] Error initializing tab ${tabId}:`, error);
                }
            }
        }

        Logger.debug(`[App] Switched to tab: ${tabId}`);
    }

    handleCharacterChange(data) {
        Logger.debug('[App] Character changed:', data);
        // Handle character change events
    }

    handleCharacterListUpdate(data) {
        Logger.debug('[App] Character list updated:', data);
        // Handle character list updates
    }

    // Cleanup method for proper application shutdown
    cleanup() {
        Logger.info('[App] Starting application cleanup...');
        
        try {
            // Cleanup event listeners
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                button.removeEventListener('click', this.handleTabClick);
            });

            EventBus.off('CHARACTER_CHANGED', this.handleCharacterChange);
            EventBus.off('CHARACTER_LIST_UPDATED', this.handleCharacterListUpdate);

            // Cleanup all components
            this.componentRegistry.forEach((component, name) => {
                if (component && typeof component.cleanup === 'function') {
                    try {
                        component.cleanup();
                        Logger.debug(`[App] Cleaned up component: ${name}`);
                    } catch (error) {
                        Logger.warn(`[App] Error cleaning up component ${name}:`, error);
                    }
                }
            });

            this.componentRegistry.clear();
            this.tabs.clear();
            
            this.initialized = false;
            ModernCharacterBuilder.instance = null;
            
            Logger.info('[App] Application cleanup completed.');
            
        } catch (error) {
            Logger.error('[App] Error during cleanup:', error);
        }
    }

    // Debug helper methods
    getComponentRegistry() {
        return Array.from(this.componentRegistry.entries());
    }

    getActiveTabInfo() {
        const activeTabData = this.tabs.get(this.activeTab);
        return {
            id: this.activeTab,
            name: activeTabData?.name,
            instance: activeTabData?.instance,
            hasContainer: !!activeTabData?.containerElement,
            isMounted: activeTabData?.instance?.isMounted || false
        };
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new ModernCharacterBuilder();
        await app.init();
        Logger.info('[App] Application started successfully.');
        
        // Expose app instance for debugging
        window.app = app;
        
    } catch (error) {
        Logger.error('[App] Failed to start application:', error);
        console.error('Application startup failed:', error);
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