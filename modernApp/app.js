// modernApp/app.js
let isAppInitializedGlobally = false; 

import { SchemaSystem } from './core/SchemaSystem.js';
import { StateManager } from './core/StateManager.js';
import { EntityLoader } from './core/EntityLoader.js';
import { EventBus } from './core/EventBus.js';
import { NotificationSystem } from './components/NotificationSystem.js';
import { Logger } from './utils/Logger.js';
import { CharacterManager } from './core/CharacterManager.js';
import { Formatters } from './utils/Formatters.js'; // Eager import for Formatters

// Import new component
import { CharacterListPanel } from './components/CharacterListPanel.js';

// Import tabs
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';

class ModernCharacterBuilder {
    constructor() {
        this.tabs = new Map();
        this.currentTab = 'basic-info';
        this.tabContentContainer = document.getElementById('tab-content');
        this.summaryContainer = document.getElementById('summary-content');
        this.characterListContainerId = 'character-list-content';
        this.characterListControlsId = 'character-list-controls';

        this.initialized = false;
        this.characterManager = null; 
        this.characterListPanel = null;
    }
    
    async init() {
        try {
            Logger.info('[App] Initializing Modern CharacterBuilder...');
            document.body.style.visibility = 'hidden';
            
            Logger.info('[App] Initializing core systems...');
            await SchemaSystem.init();
            Logger.info('[App] SchemaSystem initialized.');
            
            await EntityLoader.init();
            Logger.info('[App] EntityLoader initialized.');
            
            NotificationSystem.init();
            Logger.info('[App] NotificationSystem initialized.');

            this.characterManager = new CharacterManager();
            await this.characterManager.init(); 
            Logger.info('[App] CharacterManager (and StateManager via it) initialized.');

            this.characterListPanel = new CharacterListPanel(
                this.characterListContainerId,
                this.characterListControlsId, 
                this.characterManager
            );
            Logger.info('[App] CharacterListPanel initialized.');
            
            await this.initializeTabs();
            
            this.setupEventListeners();
            this.setupTabNavigation();
            
            this.showTab(this.currentTab); 
            await this.updateCharacterSummary(); // Made async due to renderPointPoolsSummary

            EventBus.on('character-updated', async (character) => { // Make callback async
                await this.updateCharacterSummary(character);      // Await the update
            });

            EventBus.on('active-character-changed', (newCharId) => {
                Logger.info(`[App] Active character changed to ${newCharId}. Reloading current tab view.`);
                this.showTab(this.currentTab); 
            });
            
            this.initialized = true;
            document.body.style.visibility = 'visible';
            document.body.classList.add('loaded');
            Logger.info('[App] Modern Character Builder initialized successfully.');
            
        } catch (error) {
            Logger.error('[App] Failed to initialize Modern Character Builder:', error);
            this.showInitializationError(error);
        }
    }
    
    async initializeTabs() {
        Logger.info('[App] Initializing tabs...');
        
        const basicInfoTab = new BasicInfoTab(this.tabContentContainer);
        this.tabs.set('basic-info', basicInfoTab);

        const archetypeTab = new ArchetypeTab(this.tabContentContainer, StateManager); 
        if (archetypeTab.init) await archetypeTab.init();
        this.tabs.set('archetypes', archetypeTab);
        
        const mainPoolTab = new MainPoolTab(this.tabContentContainer, StateManager);
        if (mainPoolTab.init) await mainPoolTab.init();
        this.tabs.set('main-pool', mainPoolTab);
        
        Logger.info('[App] Tabs initialized:', Array.from(this.tabs.keys()));
    }
    
    setupEventListeners() {
        window.addEventListener('error', (event) => {
            Logger.error('Global unhandled error:', event.error);
            NotificationSystem.show(`Error: ${event.error.message}`, 'error');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            Logger.error('Unhandled promise rejection:', event.reason);
            NotificationSystem.show(`Promise error: ${event.reason.message || event.reason}`, 'error');
        });

        EventBus.on('character-updated', (characterData) => {
            if (this.characterManager && characterData && characterData.id) {
                this.characterManager.saveCharacter(characterData); 
            }
        });
    }
    
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-navigation .tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.dataset.tab;
                if (tabId && tabId !== this.currentTab) { 
                    this.showTab(tabId);
                }
            });
        });
    }
    
    showTab(tabId) {
        Logger.info(`[App] Switching to tab: ${tabId}`);
        
        document.querySelectorAll('.tab-navigation .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        this.tabContentContainer.innerHTML = ''; 
        
        const tab = this.tabs.get(tabId);
        if (tab) {
            this.currentTab = tabId;
            try {
                if (typeof tab.render === 'function') {
                    tab.render(); 
                    Logger.info(`[App] Tab rendered: ${tabId}`);
                } else {
                    Logger.warn(`[App] Tab ${tabId} has no render method.`);
                    this.tabContentContainer.innerHTML = `<p>Tab ${tabId} content cannot be rendered.</p>`;
                }
            } catch (error) {
                Logger.error(`[App] Error rendering tab ${tabId}:`, error);
                this.tabContentContainer.innerHTML = `
                    <div class="error-content">
                        <h2>Tab Error</h2>
                        <p>Failed to render ${tabId} tab: ${error.message}</p>
                        <pre>${error.stack || 'No stack trace'}</pre>
                        <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
                    </div>
                `;
            }
        } else {
            Logger.error(`[App] Tab not found: ${tabId}`);
            this.tabContentContainer.innerHTML = `
                <div class="error-content">
                    <h2>Tab Not Found</h2>
                    <p>The requested tab "${tabId}" could not be found.</p>
                </div>
            `;
        }
    }
    
    async updateCharacterSummary(charData) { // Marked async because it calls other async functions
        if (!this.summaryContainer) {
            Logger.warn('[App] Summary container not found for updateCharacterSummary.');
            return;
        }
        
        try {
            const character = charData || StateManager.getCharacter(); 
            
            if (!character || !character.id) {
                this.summaryContainer.innerHTML = `
                    <div class="character-summary-content">
                        <p class="text-muted">No character loaded or character data is invalid.</p>
                    </div>`;
                return;
            }

            this.summaryContainer.innerHTML = `
                <div class="character-summary-content">
                    <div class="summary-section">
                        <h4>Basic Info</h4>
                        <p><strong>Name:</strong> ${character.name || 'Unnamed'}</p>
                        <p><strong>Tier:</strong> ${character.tier || 'N/A'}</p>
                    </div>
                    <div class="summary-section">
                        <h4>Archetypes</h4>
                        ${this.renderArchetypesSummary(character)} 
                    </div>
                    <div class="summary-section" id="summary-point-pools-section">
                        <!-- Content will be dynamically updated by renderPointPoolsSummary -->
                    </div>
                    <div class="summary-section">
                        <h4>Progress</h4>
                        ${this.renderProgressSummary(character)}
                    </div>
                </div>
            `;
            await this.renderPointPoolsSummary(character); // Await this async function

        } catch (error) {
            Logger.error('[App] Error updating character summary:', error);
            this.summaryContainer.innerHTML = `
                <div class="error-content">
                    <p>Error loading character summary</p>
                </div>
            `;
        }
    }
    
    renderArchetypesSummary(character) { // Not async anymore
        const archetypes = character.archetypes || {};
        const archetypeEntries = Object.entries(archetypes).filter(([_, id]) => id);
        
        if (archetypeEntries.length === 0) {
            return '<p class="text-muted">No archetypes selected</p>';
        }
        // Formatters is now available in the module scope
        return archetypeEntries.map(([category, id]) => {
            const entity = EntityLoader.getEntity(id);
            const displayName = entity?.name || id;
            const formattedCategory = Formatters.camelToTitle(category);
            return `<p><strong>${formattedCategory}:</strong> ${displayName}</p>`;
        }).join('');
    }
    
    async renderPointPoolsSummary(character) { 
        const targetElement = document.getElementById('summary-point-pools-section');
        if (!targetElement) {
            Logger.warn('[App] Point pools summary target element not found.');
            return;
        }
        
        targetElement.innerHTML = '<h4>Point Pools</h4><p class="text-muted">Calculating...</p>';

        try {
            const { PoolCalculator } = await import('./systems/PoolCalculator.js');
            const pools = PoolCalculator.calculatePools(character);
            const poolsHtml = `
                <p><strong>Main Pool:</strong> ${pools.mainRemaining}/${pools.main}</p>
                <p><strong>Combat Attr:</strong> ${pools.combatRemaining}/${pools.combat}</p>
                <p><strong>Utility Attr:</strong> ${pools.utilityRemaining}/${pools.utility}</p>
            `;
            targetElement.innerHTML = '<h4>Point Pools</h4>' + poolsHtml;
        } catch (error) {
            Logger.error('[App] Error loading or using PoolCalculator for summary:', error);
            targetElement.innerHTML = '<h4>Point Pools</h4><p class="text-muted">Pool calculation error.</p>';
        }
    }
    
    renderProgressSummary(character) { 
        const archetypesSelected = character && character.archetypes && Object.values(character.archetypes).some(val => !!val);
        const mainPoolItemsSelected = character && [
            ...(character.flaws || []), ...(character.traits || []), ...(character.boons || []),
            ...(character.action_upgrades || [])
        ].length > 0;

        const steps = [
            { id: 'basic-info', name: 'Basic Info', completed: !!(character && character.name && character.tier) },
            { id: 'archetypes', name: 'Archetypes', completed: archetypesSelected },
            { id: 'main-pool', name: 'Main Pool Items', completed: mainPoolItemsSelected }
        ];
        
        return steps.map(step => `
            <p>
                <span class="progress-indicator ${step.completed ? 'completed' : 'pending'}">
                    ${step.completed ? '✅' : '⏳'}
                </span>
                ${step.name}
            </p>
        `).join('');
    }

    showInitializationError(error) { 
        const container = this.tabContentContainer || document.body;
        if (container) {
            container.innerHTML = `
                <div class="error-screen">
                    <h1>Initialization Error</h1>
                    <p>Failed to load the Modern Character Builder.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error.stack || error.message}</pre>
                    </details>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Reload Page
                    </button>
                </div>
            `;
        }
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    if (isAppInitializedGlobally) {
        Logger.warn('[App] DOMContentLoaded fired, but app already initialized. Preventing re-initialization.');
        return;
    }
    isAppInitializedGlobally = true;
    Logger.info('[App] DOM loaded, initializing app instance...');
    
    try {
        const app = new ModernCharacterBuilder();
        await app.init();
        window.modernCharacterBuilder = app; 
    } catch (error) {
        Logger.error('[App] Failed to start application instance:', error);
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
        const container = document.getElementById('tab-content') || document.body;
        container.innerHTML = `
            <div class="error-screen" style="padding: 20px; text-align: center;">
                <h1>Application Startup Error</h1>
                <p>The application failed to start correctly.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre>${error.stack || 'No stack trace'}</pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});

export { ModernCharacterBuilder };