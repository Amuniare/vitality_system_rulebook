// modernApp/tabs/MainPoolTab.js
import { PurchaseCard } from '../components/PurchaseCard.js';
import { Logger } from '../utils/Logger.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { UnifiedPurchaseSystem } from '../systems/UnifiedPurchaseSystem.js';

export class MainPoolTab {
    constructor(container, stateManager) { // constructor signature is already correct
        this.container = container; // Store it
        this.stateManager = stateManager;
        this.currentSectionKey = 'flaws'; 
        
        this.sections = {
            flaws: { title: 'Flaws', entityType: 'flaw', description: 'Flaws COST 30 main pool points each but grant a +Tier stat bonus and add limitations.' },
            traits: { title: 'Traits', entityType: 'trait', description: 'Traits COST 30 main pool points each and provide conditional +Tier bonuses or unique effects.' },
            boons_simple: { title: 'Simple Boons', entityType: 'boon', parentIdFilter: null, description: 'Simple Boons have variable costs and provide straightforward benefits. (Ensure these are top-level boons in JSON)' },
            action_upgrades: { title: 'Action Upgrades', entityType: 'action_upgrade', description: 'Action Upgrades enhance or modify standard character actions. Costs vary.' },
            unique_abilities_purchasable: { title: 'Unique Abilities', entityType: 'unique_ability', parentIdFilter: null, description: 'Powerful, distinct abilities. Costs vary. (Ensure these are top-level unique_abilities)'}
        };
        
        this.eventBusListeners = {
            characterChanged: null,
            entityPurchased: null,
            entityRemoved: null
        };
        this.delegatedGridListener = null;
    }

    async init() {
        this.eventBusListeners.characterChanged = (data) => this.handleCharacterUpdate(data.character);
        this.eventBusListeners.entityPurchased = () => this.handleCharacterUpdate(this.stateManager.getCharacter());
        this.eventBusListeners.entityRemoved = () => this.handleCharacterUpdate(this.stateManager.getCharacter());

        EventBus.on('CHARACTER_CHANGED', this.eventBusListeners.characterChanged);
        EventBus.on('ENTITY_PURCHASED', this.eventBusListeners.entityPurchased);
        EventBus.on('ENTITY_REMOVED', this.eventBusListeners.entityRemoved);
        
        Logger.info('[MainPoolTab] Initialized.');
    }

    handleCharacterUpdate(character) {
        // Only re-render if this tab is currently visible to avoid unnecessary work
        if (this.container && this.container.style.display !== 'none') {
            this.render();
            Logger.debug('[MainPoolTab] Re-rendered due to character/purchase update.');
        }
    }

    render() {
        if (!this.container) {
            Logger.error("[MainPoolTab] Cannot render, container is not set.");
            return;
        }
        const character = this.stateManager.getCharacter();
        const pools = PoolCalculator.calculatePools(character);

        // The main content div *inside* this.container will have the class "main-pool-tab"
        this.container.innerHTML = `
            <div class="main-pool-tab"> 
                <div class="pool-header section-header">
                    <h2>Main Pool</h2>
                    <div class="pool-summary">
                        <div class="pool-info">
                            <span class="pool-label">Points Available:</span>
                            <span class="pool-value" id="main-pool-points-display">${pools.mainRemaining} / ${pools.main}</span>
                        </div>
                        <div class="pool-breakdown">
                            <span>Base Pool: ${pools.main} (Tier ${character.tier || 4})</span>
                        </div>
                    </div>
                </div>
                
                <div class="section-tabs">
                    ${Object.entries(this.sections).map(([key, section]) => `
                        <button class="section-tab ${key === this.currentSectionKey ? 'active' : ''}" 
                                data-section-key="${key}">
                            ${section.title}
                        </button>
                    `).join('')}
                </div>
                
                <div class="section-content-wrapper section-content">
                    <div class="section-header">
                        <h3>${this.sections[this.currentSectionKey].title}</h3>
                        <p>${this.sections[this.currentSectionKey].description}</p>
                    </div>
                    <div class="purchase-grid" id="main-pool-purchase-grid">
                        ${this.renderPurchaseCardsForCurrentSection()}
                    </div>
                </div>
            </div>
        `;
        this.setupEventListeners();
        Logger.debug(`[MainPoolTab] Rendered section: ${this.currentSectionKey}`);
    }

    renderPurchaseCardsForCurrentSection() {
        const sectionConfig = this.sections[this.currentSectionKey];
        if (!sectionConfig) {
            Logger.error(`[MainPoolTab] No section config found for key: ${this.currentSectionKey}`);
            return '<p class="no-items">Error: Section configuration not found.</p>';
        }

        const entityType = sectionConfig.entityType;
        let entities = EntityLoader.getEntitiesByType(entityType);
        
        // Apply parentIdFilter if specified (for unique_abilities vs upgrades)
        if (sectionConfig.parentIdFilter !== undefined) {
            entities = entities.filter(e => e.parentId === sectionConfig.parentIdFilter);
        }
        
        if (!entities || entities.length === 0) {
            return `<p class="no-items">No items available in the "${sectionConfig.title}" category (type: ${entityType}). Check unified-game-data.json and filters.</p>`;
        }

        const character = this.stateManager.getCharacter();
        const purchaseArrayName = `${entityType}s`;

        return entities.map(entity => {
            const purchaseInstance = character[purchaseArrayName]?.find(p => p.id === entity.id);
            const card = new PurchaseCard(entity, entityType); 
            return card.render(); 
        }).join('');
    }

    setupEventListeners() {
        if (!this.container) return;

        this.container.querySelectorAll('.section-tab').forEach(tabButton => {
            if (!tabButton.hasAttribute('data-listener-attached')) {
                tabButton.addEventListener('click', (e) => {
                    const sectionKey = e.currentTarget.dataset.sectionKey;
                    if (sectionKey && sectionKey !== this.currentSectionKey) {
                        this.currentSectionKey = sectionKey;
                        this.render(); 
                    }
                });
                tabButton.setAttribute('data-listener-attached', 'true');
            }
        });

        const purchaseGrid = this.container.querySelector('#main-pool-purchase-grid');
        if (purchaseGrid) {
            if (this.delegatedGridListener) {
                purchaseGrid.removeEventListener('click', this.delegatedGridListener);
            }
            this.delegatedGridListener = (e) => {
                const button = e.target.closest('.purchase-btn');
                if (button && !button.disabled) {
                    e.preventDefault();
                    const action = button.dataset.action;
                    const entityId = button.dataset.entityId;
                    const entityTypeFromCard = button.dataset.entityType; 
                    
                    if (!entityId || !entityTypeFromCard) {
                        Logger.error("[MainPoolTab] Clicked button without entityId or entityType in dataset", button);
                        return;
                    }
                    
                    if (action === 'purchase') {
                        this.handlePurchase(entityId, entityTypeFromCard);
                    } else if (action === 'remove') {
                        const character = this.stateManager.getCharacter();
                        const purchaseArrayName = `${entityTypeFromCard}s`;
                        const purchaseInstance = character[purchaseArrayName]?.find(p => p.id === entityId);

                        if (purchaseInstance && purchaseInstance.purchaseId) {
                            this.handleRemove(purchaseInstance.purchaseId, entityTypeFromCard);
                        } else {
                            Logger.warn(`[MainPoolTab] Could not find purchaseId for entity ${entityId} of type ${entityTypeFromCard} to remove. This might happen if it was an old purchase before purchaseIds were implemented.`);
                            // Fallback or error notification could go here. For now, we log.
                        }
                    }
                }
            };
            purchaseGrid.addEventListener('click', this.delegatedGridListener);
        }
        Logger.debug('[MainPoolTab] Event listeners set up.');
    }

    handlePurchase(entityId, entityType) {
        Logger.info(`[MainPoolTab] Attempting purchase: Entity ID - ${entityId}, Type - ${entityType}`);
        // UnifiedPurchaseSystem calls StateManager.dispatch, which will trigger EventBus events
        UnifiedPurchaseSystem.purchase(entityId); 
    }

    handleRemove(purchaseId, entityType) {
        Logger.info(`[MainPoolTab] Attempting removal: Purchase ID - ${purchaseId}, Type - ${entityType}`);
        UnifiedPurchaseSystem.remove(purchaseId, entityType);
    }
    
    cleanup() { // Changed from destroy to cleanup
        if (this.eventBusListeners.characterChanged) {
            EventBus.off('CHARACTER_CHANGED', this.eventBusListeners.characterChanged);
        }
        if (this.eventBusListeners.entityPurchased) {
            EventBus.off('ENTITY_PURCHASED', this.eventBusListeners.entityPurchased);
        }
        if (this.eventBusListeners.entityRemoved) {
            EventBus.off('ENTITY_REMOVED', this.eventBusListeners.entityRemoved);
        }
        this.eventBusListeners = {};

        const purchaseGrid = this.container?.querySelector('#main-pool-purchase-grid');
        if (purchaseGrid && this.delegatedGridListener) {
            purchaseGrid.removeEventListener('click', this.delegatedGridListener);
            this.delegatedGridListener = null;
        }
        Logger.info('[MainPoolTab] Cleanup called, listeners removed.');
    }
}