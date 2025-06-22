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

/**
 * ModernCharacterBuilder - Main application class
 * Implements singleton pattern to prevent multiple initializations
 */
class ModernCharacterBuilder {
    static instance = null;
    
    constructor() {
        // Enforce singleton
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
        
        // Bind methods
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleCharacterChange = this.handleCharacterChange.bind(this);
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
            
            // Initialize core systems in dependency order
            Logger.info('[App] Initializing core systems...');
            
            // 1. Schema System (no dependencies)
            await SchemaSystem.init();
            Logger.info('[App] SchemaSystem initialized.');
            
            // 2. Entity Loader (depends on SchemaSystem)
            await EntityLoader.init();
            Logger.info('[App] EntityLoader initialized.');
            
            // 3. Notification System (no dependencies)
            this.notificationSystem = NotificationSystem.getInstance();
            this.notificationSystem.init();
            Logger.info('[App] NotificationSystem initialized.');
            
            // 4. Character Manager (depends on EventBus)
            this.characterManager = CharacterManager.getInstance();
            await this.characterManager.init();
            Logger.info('[App] CharacterManager initialized.');
            
            // 5. State Manager (depends on CharacterManager)
            await StateManager.init(this.characterManager);
            Logger.info('[App] StateManager initialized.');
            
            // 6. Validation System (depends on StateManager, EventBus)
            this.validationSystem = ValidationSystem.getInstance();
            this.validationSystem.init();
            Logger.info('[App] ValidationSystem initialized.');
            
            // Initialize UI components
            await this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Show the UI
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
        // Initialize character list panel
        // Initialize character list panel
        this.characterListPanel = new CharacterListPanel(
            'character-list-content',      // ID for the list container
            'character-list-controls',     // ID for the controls container
            this.characterManager          // Pass the CharacterManager instance
        );
        await this.characterListPanel.init();
        Logger.info('[App] CharacterListPanel initialized.');
        
        // Initialize tabs
        await this.initializeTabs();
        
        // Switch to default tab
        this.switchTab('basic-info');
    }
    
    async initializeTabs() {
        Logger.info('[App] Initializing tabs...');
        
        // Register all tabs
        this.registerTab('basic-info', BasicInfoTab, 'Basic Info');
        this.registerTab('archetypes', ArchetypeTab, 'Archetypes');
        this.registerTab('main-pool', MainPoolTab, 'Main Pool');
        // Additional tabs can be registered here as they're implemented
        
        // Initialize all registered tabs
        for (const [tabId, tabData] of this.tabs) {
            try {
                
                const TabClass = tabData.class;
                let instance;
                const tabContentElement = document.getElementById(`${tabId}-tab`);

                // Special handling for tabs with specific constructor needs
                if (tabId === 'main-pool') { // Check by tabId for MainPoolTab
                    instance = new TabClass(tabContentElement, StateManager);
                } else if (tabId === 'basic-info') { // BasicInfoTab
                    instance = new TabClass(); // Assuming its init will handle container
                } else {
                    instance = new TabClass(); // Default for other tabs
                }

                await instance.init();
                tabData.instance = instance;
                Logger.info(`[App] Tab initialized: ${tabId}`);
            } catch (error) {
                Logger.error(`[App] Failed to initialize tab ${tabId}:`, error);
                this.notificationSystem.error(`Failed to initialize ${tabData.name} tab`);
            }
        }
        
        Logger.info(`[App] Tabs initialized:`, Array.from(this.tabs.keys()));
    }
    
    registerTab(id, TabClass, name) {
        this.tabs.set(id, {
            id,
            class: TabClass,
            name,
            instance: null
        });
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.addEventListener('click', this.handleTabClick);
        });
        
        // Character events
        EventBus.on('CHARACTER_CHANGED', this.handleCharacterChange);
        EventBus.on('CHARACTER_LIST_UPDATED', this.handleCharacterListUpdate);
        
        // Window events
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
        
        // Update active states
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Render tab
        const tabData = this.tabs.get(tabId);
        if (tabData.instance) {
            try {
                tabData.instance.render();
                Logger.info(`[App] Tab rendered: ${tabId}`);
            } catch (error) {
                Logger.error(`[App] Failed to render tab ${tabId}:`, error);
                this.notificationSystem.error(`Failed to render ${tabData.name} tab`);
            }
        }
        
        this.activeTab = tabId;
        EventBus.emit('TAB_CHANGED', { tabId });
    }
    
    handleCharacterChange(data) {
        Logger.info('[App] Character changed:', data);
        
        // Update character header if it exists
        const headerElement = document.querySelector('.character-header');
        if (headerElement) {
            const character = StateManager.getCharacter();
            headerElement.innerHTML = `
                <h2>${character.name || 'New Character'}</h2>
                <span class="tier">Tier ${character.tier || 4}</span>
            `;
        }
        
        // Re-render active tab
        if (this.activeTab && this.tabs.has(this.activeTab)) {
            const tabData = this.tabs.get(this.activeTab);
            if (tabData.instance) {
                tabData.instance.render();
            }
        }
    }
    
    handleCharacterListUpdate() {
        Logger.info('[App] Character list updated');
        // Character list panel will handle its own updates via events
    }
    
    showError(error) {
        const container = document.getElementById('tab-content') || document.body;
        container.innerHTML = `
            <div class="error-screen" style="padding: 20px; text-align: center;">
                <h1>Application Error</h1>
                <p>The application encountered an error.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre style="text-align: left; max-width: 600px; margin: 20px auto; padding: 10px; background: #f0f0f0; overflow: auto;">
${error.stack || 'No stack trace available'}
                </pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
    }
    
    cleanup() {
        Logger.info('[App] Cleaning up application...');
        
        // Save any pending changes
        StateManager.saveCharacter();
        
        // Clean up event listeners
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.removeEventListener('click', this.handleTabClick);
        });
        
        EventBus.off('CHARACTER_CHANGED', this.handleCharacterChange);
        EventBus.off('CHARACTER_LIST_UPDATED', this.handleCharacterListUpdate);
        
        // Clean up tabs
        for (const [tabId, tabData] of this.tabs) {
            if (tabData.instance && typeof tabData.instance.cleanup === 'function') {
                tabData.instance.cleanup();
            }
        }
        
        Logger.info('[App] Application cleanup complete.');
    }
}

// Single initialization on DOM ready
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
        
        // Make app instance available globally for debugging
        window.modernCharacterBuilder = app;
    } catch (error) {
        Logger.error('[App] Failed to start application:', error);
    }
});

export { ModernCharacterBuilder };