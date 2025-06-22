// modernApp/app.js
import { SchemaSystem } from './core/SchemaSystem.js';
import { StateManager } from './core/StateManager.js';
import { EntityLoader } from './core/EntityLoader.js';
import { EventBus } from './core/EventBus.js';
import { NotificationSystem } from './components/NotificationSystem.js';
import { Logger } from './utils/Logger.js';
import { Formatters } from './utils/Formatters.js';
// DataLoader is used by EntityLoader, not directly needed here for tab instantiation

// Import tabs
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';

class ModernCharacterBuilder {
    constructor() {
        this.tabs = new Map();
        this.currentTab = 'basic-info';
        this.container = document.getElementById('tab-content');
        this.summaryContainer = document.getElementById('summary-content'); // Corrected ID
        this.initialized = false;
    }
    
    async init() {
        try {
            Logger.info('[App] Initializing Modern Character Builder...');
            document.body.style.visibility = 'hidden';
            
            Logger.info('[App] Initializing core systems...');
            await SchemaSystem.init();
            Logger.info('[App] SchemaSystem initialized.');
            
            await EntityLoader.init();
            Logger.info('[App] EntityLoader initialized.');
            
            StateManager.init();
            Logger.info('[App] StateManager initialized.');
            
            NotificationSystem.init();
            Logger.info('[App] NotificationSystem initialized.');
            
            await this.initializeTabs();
            
            this.setupEventListeners();
            this.setupTabNavigation();
            this.showTab(this.currentTab); // Render initial tab
            this.updateCharacterSummary(); // Initial summary render
            
            EventBus.on('character-updated', (character) => {
                this.updateCharacterSummary(character);
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
        
        const basicInfoTab = new BasicInfoTab(this.container);
        // if (basicInfoTab.init) await basicInfoTab.init(); // If BasicInfoTab had an async init
        this.tabs.set('basic-info', basicInfoTab);

        const archetypeTab = new ArchetypeTab(this.container, StateManager);
        if (archetypeTab.init) await archetypeTab.init();
        this.tabs.set('archetypes', archetypeTab);
        
        const mainPoolTab = new MainPoolTab(this.container, StateManager);
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
    }
    
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.dataset.tab;
                if (tabId && tabId !== this.currentTab) { // Only switch if different
                    this.showTab(tabId);
                }
            });
        });
    }
    
    showTab(tabId) {
        Logger.info(`[App] Switching to tab: ${tabId}`);
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Clear previous tab content
        this.container.innerHTML = ''; 
        
        const tab = this.tabs.get(tabId);
        if (tab) {
            this.currentTab = tabId;
            try {
                if (typeof tab.render === 'function') {
                    tab.render(); 
                    Logger.info(`[App] Tab rendered: ${tabId}`);
                } else {
                    Logger.warn(`[App] Tab ${tabId} has no render method.`);
                    this.container.innerHTML = `<p>Tab ${tabId} content cannot be rendered.</p>`;
                }
            } catch (error) {
                Logger.error(`[App] Error rendering tab ${tabId}:`, error);
                this.container.innerHTML = `
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
            this.container.innerHTML = `
                <div class="error-content">
                    <h2>Tab Not Found</h2>
                    <p>The requested tab "${tabId}" could not be found.</p>
                </div>
            `;
        }
    }
    
    updateCharacterSummary(charData) {
        if (!this.summaryContainer) {
            Logger.warn('[App] Summary container not found for updateCharacterSummary.');
            return;
        }
        
        try {
            const character = charData || StateManager.getCharacter();
            
            this.summaryContainer.innerHTML = `
                <div class="character-summary-content"> <!-- Added a wrapper class -->
                    <h3>Character Summary</h3>
                    
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
                        <h4>Point Pools</h4>
                        ${this.renderPointPoolsSummary(character)} 
                    </div>
                    
                    <div class="summary-section">
                        <h4>Progress</h4>
                        ${this.renderProgressSummary(character)}
                    </div>
                </div>
            `;
        } catch (error) {
            Logger.error('[App] Error updating character summary:', error);
            this.summaryContainer.innerHTML = `
                <div class="error-content">
                    <p>Error loading character summary</p>
                </div>
            `;
        }
    }
    
    renderArchetypesSummary(character) {
        const archetypes = character.archetypes || {};
        const archetypeEntries = Object.entries(archetypes);
        
        if (archetypeEntries.length === 0) {
            return '<p class="text-muted">No archetypes selected</p>';
        }
        
        return archetypeEntries.map(([category, id]) => {
            if (!id) return ''; // Skip if no archetype selected for a category
            const entity = EntityLoader.getEntity(id);
            const displayName = entity?.name || id;
            return `<p><strong>${Formatters.capitalize(category)}:</strong> ${displayName}</p>`;
        }).join('');
    }
    
    renderPointPoolsSummary(character) {
        // This method will show "Calculating..." and then be updated by the async import
        // Ensure the target element for update exists
        const targetElementId = 'summary-point-pools-section';
        
        // Schedule the async update
        import('./systems/PoolCalculator.js').then(({ PoolCalculator }) => {
            const pools = PoolCalculator.calculatePools(character);
            const poolsHtml = `
                <p><strong>Main Pool:</strong> ${pools.mainRemaining}/${pools.main}</p>
                <p><strong>Combat Attr:</strong> ${pools.combatRemaining}/${pools.combat}</p>
                <p><strong>Utility Attr:</strong> ${pools.utilityRemaining}/${pools.utility}</p>
            `;
            
            const poolsSection = document.getElementById(targetElementId);
            if (poolsSection) {
                poolsSection.innerHTML = '<h4>Point Pools</h4>' + poolsHtml;
            }
        }).catch(error => {
            Logger.error('[App] Error loading or using PoolCalculator for summary:', error);
            const poolsSection = document.getElementById(targetElementId);
            if (poolsSection) {
                poolsSection.innerHTML = '<h4>Point Pools</h4><p class="text-muted">Pool calculation error.</p>';
            }
        });
        
        return '<p class="text-muted">Calculating...</p>'; // Initial placeholder
    }
    
    renderProgressSummary(character) {
        const steps = [
            { id: 'basic-info', name: 'Basic Info', completed: !!(character.name && character.tier) },
            { id: 'archetypes', name: 'Archetypes', completed: Object.values(character.archetypes || {}).some(val => !!val) },
            { 
                id: 'main-pool', 
                name: 'Main Pool Items', 
                completed: [
                    ...(character.flaws || []),
                    ...(character.traits || []),
                    ...(character.boons || []),
                    ...(character.action_upgrades || [])
                ].length > 0 
            }
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
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-screen">
                    <h1>Initialization Error</h1>
                    <p>Failed to load the Modern Character Builder.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error.stack || error.message}</pre>
                    </details>
                    <button onclick="location.reload()" class.btn btn-primary">
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
    Logger.info('[App] DOM loaded, initializing app...');
    
    try {
        const app = new ModernCharacterBuilder();
        await app.init();
        window.modernCharacterBuilder = app; // Make app globally accessible for debugging
    } catch (error) {
        Logger.error('[App] Failed to start application:', error);
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
        const container = document.getElementById('tab-content') || document.body;
        container.innerHTML = `
            <div class="error-screen" style="padding: 20px; text-align: center;">
                <h1>Startup Error</h1>
                <p>The application failed to start.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <pre>${error.stack || 'No stack trace'}</pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.modernCharacterBuilder?.initialized) {
        window.modernCharacterBuilder.updateCharacterSummary();
    }
});

export { ModernCharacterBuilder };