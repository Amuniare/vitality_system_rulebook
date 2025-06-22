// tabs/MainPoolTab.js
import { PurchaseCard } from '../components/purchaseCard.js';

export class MainPoolTab {
    constructor(container, stateManager, dataLoader) {
        this.container = container;
        this.stateManager = stateManager;
        this.dataLoader = dataLoader;
        this.currentSection = 'flaws';
        
        this.sections = {
            flaws: { title: 'Flaws', cost: '30p' },
            traits: { title: 'Traits', cost: '30p' },
            boons: { title: 'Boons', cost: 'Variable' },
            actions: { title: 'Action Upgrades', cost: 'Variable' }
        };
        
        this.unsubscribe = null;
    }

    async init() {
        // Load all entities
        await this.loadAllEntities();
        
        // Subscribe to state changes
        this.unsubscribe = this.stateManager.subscribe(() => {
            this.updatePointsDisplay();
            this.updatePurchaseCards();
        });
        
        // Set up event delegation
        this.setupEventDelegation();
    }

    async loadAllEntities() {
        try {
            const [flaws, traits, boons, actions] = await Promise.all([
                this.dataLoader.loadFlaws(),
                this.dataLoader.loadTraits(),
                this.dataLoader.loadBoons(),
                this.dataLoader.loadActionUpgrades()
            ]);

            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'flaws', entities: flaws }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'traits', entities: traits }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'boons', entities: boons }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'actions', entities: actions }
            });
        } catch (error) {
            console.error('Error loading entities:', error);
        }
    }

    render() {
        const state = this.stateManager.getState();
        const mainPool = state.pools.main;
        const availablePoints = this.stateManager.getAvailablePoints('main');

        this.container.innerHTML = `
            <div class="tab-content main-pool-tab">
                <div class="pool-header">
                    <h2>Main Pool</h2>
                    <div class="pool-summary">
                        <div class="pool-info">
                            <span class="pool-label">Points Available:</span>
                            <span class="pool-value" id="main-pool-points">${availablePoints} / ${mainPool.total}</span>
                        </div>
                        <div class="pool-breakdown">
                            <span>✅ Base: (${state.character.tier} - ${state.character.powerLevel}) × 15 = ${mainPool.total}</span>
                        </div>
                    </div>
                </div>
                
                <div class="section-tabs">
                    ${Object.entries(this.sections).map(([key, section]) => `
                        <button class="section-tab ${key === this.currentSection ? 'active' : ''}" 
                                data-section="${key}">
                            ${section.title} (Cost: ${section.cost})
                        </button>
                    `).join('')}
                </div>
                
                <div class="section-content">
                    <div class="section-header">
                        <h3>${this.sections[this.currentSection].title}</h3>
                        <p>${this.getSectionDescription()}</p>
                    </div>
                    <div class="purchase-grid" id="purchase-grid">
                        ${this.renderPurchaseCards()}
                    </div>
                </div>
                
                <div class="summary-section">
                    <h4>Point Pools</h4>
                    <p id="pool-summary">${this.renderPoolSummary()}</p>
                </div>
            </div>
        `;

        // Re-setup event listeners after render
        this.setupSectionTabs();
    }

    renderPurchaseCards() {
        const state = this.stateManager.getState();
        const entities = state.entities[this.currentSection] || [];
        
        if (entities.length === 0) {
            return '<p class="no-items">No items available in this category.</p>';
        }

        return entities
            .map(entity => {
                const card = new PurchaseCard(entity, this.currentSection.slice(0, -1), this.stateManager);
                return card.render();
            })
            .join('');
    }

    renderPoolSummary() {
        const state = this.stateManager.getState();
        const summaries = [];
        
        Object.entries(state.pools).forEach(([poolName, pool]) => {
            if (pool.total > 0) {
                const available = this.stateManager.getAvailablePoints(poolName);
                summaries.push(`${poolName.charAt(0).toUpperCase() + poolName.slice(1)}: ${available}/${pool.total}`);
            }
        });
        
        return summaries.length > 0 ? summaries.join(' | ') : 'No pools available';
    }

    getSectionDescription() {
        const descriptions = {
            flaws: 'Flaws provide extra points by adding limitations to your character.',
            traits: 'Traits define your character\'s core abilities and characteristics.',
            boons: 'Boons have variable costs and provide unique benefits.',
            actions: 'Action upgrades expand your combat options with special maneuvers.'
        };
        return descriptions[this.currentSection] || '';
    }

    setupEventDelegation() {
        // Remove any existing listener
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            // Handle purchase/remove buttons
            if (e.target.classList.contains('purchase-btn')) {
                e.preventDefault();
                const action = e.target.dataset.action;
                const entityId = e.target.dataset.entityId;
                const entityType = e.target.dataset.entityType;
                
                if (action === 'purchase') {
                    this.handlePurchase(entityId, entityType);
                } else if (action === 'remove') {
                    this.handleRemove(entityId, entityType);
                }
            }
        };

        this.container.addEventListener('click', this.clickHandler);
    }

    setupSectionTabs() {
        const tabs = this.container.querySelectorAll('.section-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                if (section && section !== this.currentSection) {
                    this.currentSection = section;
                    this.updateSection();
                }
            });
        });
    }

    handlePurchase(entityId, entityType) {
        this.stateManager.dispatch({
            type: 'PURCHASE_ENTITY',
            payload: { entityId, entityType }
        });
    }

    handleRemove(entityId, entityType) {
        const purchase = this.stateManager.getPurchaseForEntity(entityId, entityType);
        if (purchase) {
            this.stateManager.dispatch({
                type: 'REMOVE_ENTITY',
                payload: { purchaseId: purchase.id, entityType }
            });
        }
    }

    updateSection() {
        // Update active tab
        const tabs = this.container.querySelectorAll('.section-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === this.currentSection);
        });

        // Update section header
        const header = this.container.querySelector('.section-header h3');
        const description = this.container.querySelector('.section-header p');
        if (header) header.textContent = this.sections[this.currentSection].title;
        if (description) description.textContent = this.getSectionDescription();

        // Update purchase cards
        this.updatePurchaseCards();
    }

    updatePurchaseCards() {
        const grid = this.container.querySelector('#purchase-grid');
        if (grid) {
            grid.innerHTML = this.renderPurchaseCards();
        }
    }

    updatePointsDisplay() {
        const state = this.stateManager.getState();
        const mainPool = state.pools.main;
        const availablePoints = this.stateManager.getAvailablePoints('main');
        
        // Update main pool display
        const pointsDisplay = this.container.querySelector('#main-pool-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = `${availablePoints} / ${mainPool.total}`;
        }

        // Update pool summary
        const poolSummary = this.container.querySelector('#pool-summary');
        if (poolSummary) {
            poolSummary.textContent = this.renderPoolSummary();
        }
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }
    }
}