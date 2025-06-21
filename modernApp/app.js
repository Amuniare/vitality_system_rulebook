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
    }
    
    async init() {
        try {
            // Initialize core systems
            await EntityLoader.init();
            await SchemaSystem.init();
            StateManager.init();
            NotificationSystem.init();
            
            // Initialize tabs
            this.tabs.set('basic-info', new BasicInfoTab(this.container));
            this.tabs.set('archetypes', new ArchetypeTab(this.container));
            this.tabs.set('main-pool', new MainPoolTab(this.container));
            
            // Setup navigation
            this.setupNavigation();
            
            // Subscribe to character updates
            EventBus.on('character-updated', (data) => {
                this.updateSummary();
            });
            
            // Show initial tab
            this.showTab(this.currentTab);
            
            console.log('✅ Modern Character Builder initialized');
        } catch (error) {
            console.error('Failed to initialize:', error);
            NotificationSystem.show('Failed to initialize application', 'error');
        }
    }
    
    setupNavigation() {
        document.querySelector('.tab-navigation').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-tab]');
            if (!btn) return;
            
            const tabId = btn.dataset.tab;
            this.showTab(tabId);
            
            // Update active button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    }
    
    showTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;
        
        this.currentTab = tabId;
        tab.render();
    }
    
    updateSummary() {
        const character = StateManager.getCharacter();
        
        this.summaryContainer.innerHTML = `
            <div class="summary-section">
                <h4>Basic Info</h4>
                <p>Name: ${character.name || 'Unnamed'}</p>
                <p>Tier: ${character.tier || 4}</p>
            </div>
            
            <div class="summary-section">
                <h4>Archetypes</h4>
                ${Object.entries(character.archetypes || {})
                    .map(([cat, id]) => `<p>${cat}: ${id || 'Not selected'}</p>`)
                    .join('')}
            </div>
            
            <div class="summary-section">
                <h4>Points</h4>
                <p>Main Pool: ${character.pools?.main?.remaining || 0}p</p>
            </div>
        `;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new ModernCharacterBuilder();
    await app.init();
});