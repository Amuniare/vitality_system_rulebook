// modernApp/app.js - Complete file with CSS loading fix
import { SchemaSystem } from './core/SchemaSystem.js';
import { StateManager } from './core/StateManager.js';
import { EntityLoader } from './core/EntityLoader.js';
import { EventBus } from './core/EventBus.js';
import { NotificationSystem } from './components/NotificationSystem.js';

// Import tabs
import { BasicInfoTab } from './tabs/BasicInfoTab.js';
import { ArchetypeTab } from './tabs/ArchetypeTab.js';
import { MainPoolTab } from './tabs/MainPoolTab.js';

class ModernCharacterBuilder {
    constructor() {
        this.tabs = new Map();
        this.currentTab = 'basic-info';
        this.container = document.getElementById('tab-content');
        this.summaryContainer = document.getElementById('summary-content');
        this.initialized = false;
    }
    
    async init() {
        try {
            console.log('🔵 Initializing Modern Character Builder...');
            
            // ✅ Fix CSS loading issue - Prevent layout forced before load
            document.body.style.visibility = 'hidden';
            
            // Initialize core systems in proper order
            console.log('🔵 Initializing core systems...');
            
            // 1. Schema system first
            await SchemaSystem.init();
            console.log('✅ SchemaSystem initialized');
            
            // 2. Entity loader (loads all game data)
            await EntityLoader.init();
            console.log('✅ EntityLoader initialized');
            
            // 3. State manager
            StateManager.init();
            console.log('✅ StateManager initialized');
            
            // 4. Notification system
            NotificationSystem.init();
            console.log('✅ NotificationSystem initialized');
            
            // Initialize tabs
            this.initializeTabs();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up tab navigation
            this.setupTabNavigation();
            
            // Render initial tab
            this.showTab(this.currentTab);
            
            // Render character summary
            this.updateCharacterSummary();
            
            // Subscribe to character updates
            EventBus.on('character-updated', () => {
                this.updateCharacterSummary();
            });
            
            this.initialized = true;
            
            // ✅ Fix CSS loading - Show content after initialization
            document.body.style.visibility = 'visible';
            document.body.classList.add('loaded');
            
            console.log('✅ Modern Character Builder initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Modern Character Builder:', error);
            this.showInitializationError(error);
        }
    }
    
    initializeTabs() {
        console.log('🔵 Initializing tabs...');
        
        // Initialize all tabs
        this.tabs.set('basic-info', new BasicInfoTab(this.container));
        this.tabs.set('archetypes', new ArchetypeTab(this.container));
        this.tabs.set('main-pool', new MainPoolTab(this.container));
        
        console.log('✅ Tabs initialized:', Array.from(this.tabs.keys()));
    }
    
    setupEventListeners() {
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            NotificationSystem.show(`Error: ${event.error.message}`, 'error');
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            NotificationSystem.show(`Promise error: ${event.reason}`, 'error');
        });
    }
    
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.dataset.tab;
                if (tabId) {
                    this.showTab(tabId);
                }
            });
        });
    }
    
    showTab(tabId) {
        console.log(`🔵 Switching to tab: ${tabId}`);
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Hide all tab content
        this.container.innerHTML = '';
        
        // Show requested tab
        const tab = this.tabs.get(tabId);
        if (tab) {
            this.currentTab = tabId;
            try {
                tab.render();
                console.log(`✅ Tab rendered: ${tabId}`);
            } catch (error) {
                console.error(`❌ Error rendering tab ${tabId}:`, error);
                this.container.innerHTML = `
                    <div class="error-content">
                        <h2>Tab Error</h2>
                        <p>Failed to render ${tabId} tab: ${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
                    </div>
                `;
            }
        } else {
            console.error(`❌ Tab not found: ${tabId}`);
            this.container.innerHTML = `
                <div class="error-content">
                    <h2>Tab Not Found</h2>
                    <p>The requested tab "${tabId}" could not be found.</p>
                </div>
            `;
        }
    }
    
    updateCharacterSummary() {
        if (!this.summaryContainer) return;
        
        try {
            const character = StateManager.getCharacter();
            
            this.summaryContainer.innerHTML = `
                <div class="character-summary">
                    <h3>Character Summary</h3>
                    
                    <div class="summary-section">
                        <h4>Basic Info</h4>
                        <p><strong>Name:</strong> ${character.name || 'Unnamed'}</p>
                        <p><strong>Tier:</strong> ${character.tier}</p>
                    </div>
                    
                    <div class="summary-section">
                        <h4>Archetypes</h4>
                        ${this.renderArchetypesSummary(character)}
                    </div>
                    
                    <div class="summary-section">
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
            console.error('Error updating character summary:', error);
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
            if (!id) return '';
            const entity = EntityLoader.getEntity(id);
            const displayName = entity?.name || id;
            return `<p><strong>${category}:</strong> ${displayName}</p>`;
        }).join('');
    }
    
    renderPointPoolsSummary(character) {
        try {
            // Import PoolCalculator dynamically to avoid circular dependencies
            import('./systems/PoolCalculator.js').then(({ PoolCalculator }) => {
                const pools = PoolCalculator.calculatePools(character);
                
                const poolsHtml = `
                    <p><strong>Main Pool:</strong> ${pools.mainRemaining}/${pools.main}</p>
                    <p><strong>Combat Attr:</strong> ${pools.combatRemaining}/${pools.combat}</p>
                    <p><strong>Utility Attr:</strong> ${pools.utilityRemaining}/${pools.utility}</p>
                `;
                
                const poolsSection = this.summaryContainer.querySelector('.summary-section:nth-child(3)');
                if (poolsSection) {
                    poolsSection.innerHTML = '<h4>Point Pools</h4>' + poolsHtml;
                }
            });
            
            return '<p class="text-muted">Calculating...</p>';
        } catch (error) {
            return '<p class="text-muted">Pool calculation error</p>';
        }
    }
    
    renderProgressSummary(character) {
        const steps = [
            { id: 'basic-info', name: 'Basic Info', completed: !!(character.name && character.tier) },
            { id: 'archetypes', name: 'Archetypes', completed: Object.keys(character.archetypes || {}).length > 0 },
            { id: 'main-pool', name: 'Main Pool', completed: (character.flaws?.length || 0) + (character.traits?.length || 0) > 0 }
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
                    <button onclick="location.reload()" class="btn btn-primary">
                        Reload Page
                    </button>
                </div>
            `;
        }
        
        // ✅ Show content even if there's an error
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
    }
}

// ✅ Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔵 DOM loaded, initializing app...');
    
    try {
        const app = new ModernCharacterBuilder();
        await app.init();
        
        // Make app globally accessible for debugging
        window.modernCharacterBuilder = app;
        
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        
        // ✅ Ensure body is visible even on error
        document.body.style.visibility = 'visible';
        document.body.classList.add('loaded');
        
        // Show basic error message
        const container = document.getElementById('tab-content');
        if (container) {
            container.innerHTML = `
                <div class="error-screen">
                    <h1>Startup Error</h1>
                    <p>The application failed to start.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
});

// ✅ Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.modernCharacterBuilder?.initialized) {
        // Refresh character summary when page becomes visible
        window.modernCharacterBuilder.updateCharacterSummary();
    }
});

// ✅ Export for potential external use
export { ModernCharacterBuilder };