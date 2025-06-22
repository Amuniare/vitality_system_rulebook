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
import { MainPoolTab } from './tabs/MainPoolTab.js';
import { SummaryPanel } from './components/SummaryPanel.js'; 

/**
 * ModernCharacterBuilder - Main application class
 */
class ModernCharacterBuilder {
    static instance = null;
    
    constructor() {
        if (ModernCharacterBuilder.instance) {
            Logger.warn('[App] Application instance already exists. Returning existing instance.');
            return ModernCharacterBuilder.instance;
        }
        
        ModernCharacterBuilder.instance = this;
        
        this.initialized = false;
        this.tabs = new Map();
        this.activeTab = null;
        this.characterManager = null;
        this.validationSystem = null;
        this.notificationSystem = null;
        this.characterListPanel = null;
        this.summaryPanel = null; 
        
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleCharacterChange = this.handleCharacterChange.bind(this); // Keep if direct reactions needed
        this.handleCharacterListUpdate = this.handleCharacterListUpdate.bind(this);
        
        Logger.info('[App] ModernCharacterBuilder instance created.');
    }
    
    async init() {
        if (this.initialized) {
            Logger.warn('[App] Application already initialized. Skipping initialization.');
            return;
        }
        
        try {
            Logger.info('[App] Initializing Modern CharacterBuilder...');
            
            await SchemaSystem.init();
            Logger.info('[App] SchemaSystem initialized.');
            
            await EntityLoader.init();
            Logger.info('[App] EntityLoader initialized.');
            
            this.notificationSystem = NotificationSystem.getInstance();
            this.notificationSystem.init(); 
            Logger.info('[App] NotificationSystem initialized.');
            
            this.characterManager = CharacterManager.getInstance();
            await this.characterManager.init(); // CharacterManager loads/creates character and sets active
            Logger.info('[App] CharacterManager initialized.');
            
            // StateManager init depends on CharacterManager providing an active character
            await StateManager.init(this.characterManager); 
            Logger.info('[App] StateManager initialized.');
            
            this.validationSystem = ValidationSystem.getInstance();
            this.validationSystem.init(); 
            Logger.info('[App] ValidationSystem initialized.');
            
            await this.initializeUI();
            
            this.setupEventListeners();
            
            document.body.style.visibility = 'visible';
            document.body.classList.add('loaded');
            
            this.initialized = true;
            Logger.info('[App] Modern Character Builder initialized successfully.');
            
        } catch (error) {
            Logger.error('[App] Failed to initialize application:', error);
            this.showError(error);
            throw error;
        }
    }
    
    async initializeUI() {
        this.characterListPanel = new CharacterListPanel(
            'character-list-content',
            'character-list-controls',
            this.characterManager 
        );
        // list panel init is in its constructor
        Logger.info('[App] CharacterListPanel initialized.');

        const summaryContainer = document.getElementById('summary-content');
        if (summaryContainer) {
            this.summaryPanel = new SummaryPanel(summaryContainer);
            this.summaryPanel.init(); 
            Logger.info('[App] SummaryPanel initialized.');
        } else {
            Logger.error('[App] Summary content container #summary-content not found!');
        }

        this.registerAllTabs();

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

        await this.initializeTabInstances();
        
        this.switchTab('basic-info');
    }

    registerAllTabs() {
        Logger.info('[App] Registering tabs...');
        this.registerTab('basic-info', BasicInfoTab, 'Basic Info');
        this.registerTab('archetypes', ArchetypeTab, 'Archetypes');
        this.registerTab('main-pool', MainPoolTab, 'Main Pool');
        Logger.info(`[App] Tabs registered:`, Array.from(this.tabs.keys()));
    }

    async initializeTabInstances() {
        Logger.info('[App] Initializing tab instances...');
        for (const [tabId, tabData] of this.tabs) {
            try {
                const TabClass = tabData.class;
                const tabContainer = tabData.containerElement; 
                let instance;

                if (!tabContainer) {
                    Logger.error(`[App] Container for tab ${tabData.id} not found/created. Skipping initialization.`);
                    continue;
                }

                if (tabId === 'main-pool') {
                    instance = new TabClass(tabContainer, StateManager); // MainPoolTab needs StateManager
                } else { 
                    instance = new TabClass(tabContainer); 
                }

                if (typeof instance.init === 'function') { // Check if init method exists
                    await instance.init();
                }
                tabData.instance = instance;
                Logger.info(`[App] Tab instance initialized: ${tabId}`);
            } catch (error) {
                Logger.error(`[App] Failed to initialize tab instance ${tabId}:`, error);
                if (this.notificationSystem) {
                    this.notificationSystem.error(`Failed to initialize ${tabData.name} tab`);
                } else {
                    console.error(`[App] NotificationSystem not available to report error for tab ${tabId}`);
                }
            }
        }
        Logger.info(`[App] All tab instances initialized.`);
    }
    
    registerTab(id, TabClass, name) {
        this.tabs.set(id, {
            id,
            class: TabClass,
            name,
            instance: null,
            containerElement: null 
        });
    }
    
    setupEventListeners() {
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.addEventListener('click', this.handleTabClick);
        });
        
        // CHARACTER_CHANGED is now primarily handled by individual components like SummaryPanel, BasicInfoTab, etc.
        // EventBus.on('CHARACTER_CHANGED', this.handleCharacterChange); // Keep if app.js needs direct reaction
        EventBus.on('CHARACTER_LIST_UPDATED', this.handleCharacterListUpdate);
        
        window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    handleTabClick(event) {
        const tabId = event.currentTarget.dataset.tab;
        this.switchTab(tabId);
    }
    
    switchTab(tabId) {
        if (!this.tabs.has(tabId)) {
            Logger.warn(`[App] Tab not found: ${tabId}`);
            return;
        }
        
        Logger.info(`[App] Switching to tab: ${tabId}`);
        
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });
        
        document.querySelectorAll('.tab-content-panel').forEach(contentPanel => {
            contentPanel.style.display = 'none';
        });
        
        const tabDataToSwitch = this.tabs.get(tabId);
        if (tabDataToSwitch && tabDataToSwitch.containerElement) {
            tabDataToSwitch.containerElement.style.display = 'block';
        } else {
             Logger.warn(`[App] No container element found for tab ${tabId} during switchTab`);
        }
        
        if (tabDataToSwitch && tabDataToSwitch.instance) {
            try {
                // Ensure render method exists before calling
                if (typeof tabDataToSwitch.instance.render === 'function') {
                    tabDataToSwitch.instance.render();
                    Logger.info(`[App] Tab rendered: ${tabId}`);
                } else {
                     Logger.warn(`[App] Tab instance for ${tabId} does not have a render method.`);
                }
            } catch (error) {
                Logger.error(`[App] Failed to render tab ${tabId}:`, error);
                if (this.notificationSystem) {
                    this.notificationSystem.error(`Failed to render ${tabDataToSwitch.name} tab`);
                }
            }
        }
        
        this.activeTab = tabId;
        EventBus.emit('TAB_CHANGED', { tabId });
    }
    
    // This can be simplified or removed if components handle their own updates via EventBus
    handleCharacterChange(data) {
        Logger.info('[App] Character changed event received in app.js (name for debug):', data.character?.name);
        // Most updates should be handled by components listening to CHARACTER_CHANGED or CHARACTER_LOADED.
        // Re-rendering active tab is still a good idea if its content depends directly on character state
        // not managed by its internal listeners.
        if (this.activeTab && this.tabs.has(this.activeTab)) {
            const tabData = this.tabs.get(this.activeTab);
            if (tabData.instance && typeof tabData.instance.render === 'function') {
                tabData.instance.render(); 
            }
        }
    }
    
    handleCharacterListUpdate() {
        Logger.info('[App] Character list updated');
        // CharacterListPanel handles its own updates.
    }
    
    showError(error) {
        const container = document.getElementById('tab-content') || document.body;
        container.innerHTML = `
            <div class="error-screen" style="padding: 20px; text-align: center;">
                <h1>Application Error</h1>
                <p>The application encountered an error and cannot continue.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre style="text-align: left; max-width: 800px; margin: 20px auto; padding: 10px; background: #f0f0f0; color: #333; border: 1px solid #ccc; overflow: auto; white-space: pre-wrap; word-wrap: break-word;">
${error.stack || 'No stack trace available'}
                </pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 4px;">
                    Reload Page
                </button>
            </div>
        `;
        document.body.style.visibility = 'visible'; 
        document.body.classList.add('loaded'); 
    }
    
    cleanup() {
        Logger.info('[App] Cleaning up application...');
        
        if (StateManager.initialized) { // Check if StateManager was initialized
            StateManager.saveCharacter(); 
        }
        
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.removeEventListener('click', this.handleTabClick);
        });
        
        // EventBus.off('CHARACTER_CHANGED', this.handleCharacterChange); // If specific app-level handler removed
        EventBus.off('CHARACTER_LIST_UPDATED', this.handleCharacterListUpdate);
        
        for (const [tabId, tabData] of this.tabs) {
            if (tabData.instance && typeof tabData.instance.cleanup === 'function') {
                tabData.instance.cleanup();
            }
        }

        if (this.summaryPanel && typeof this.summaryPanel.cleanup === 'function') {
            this.summaryPanel.cleanup();
        }
        
        Logger.info('[App] Application cleanup complete.');
    }
}

let appInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (appInitialized) {
        Logger.warn('[App] DOMContentLoaded fired again. Preventing re-initialization.');
        return;
    }
    appInitialized = true;
    
    Logger.info('[App] DOM loaded, initializing app...');
    
    try {
        const app = new ModernCharacterBuilder();
        await app.init();
        
        window.modernCharacterBuilder = app;
    } catch (error) {
        Logger.error('[App] Critical failure during application startup:', error);
        if (!document.querySelector('.error-screen')) {
            console.error("A critical error occurred. Check the console. Error message:", error.message);
            document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Fatal Error</h1><p>Application could not start. Check console.</p><pre>${error.stack}</pre></div>`;
        }
    }
});

export { ModernCharacterBuilder };