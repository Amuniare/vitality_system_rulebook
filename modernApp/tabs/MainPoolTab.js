// modernApp/tabs/MainPoolTab.js
import { PurchaseCard } from '../components/PurchaseCard.js';
import { Logger } from '../utils/Logger.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { UnifiedPurchaseSystem } from '../systems/UnifiedPurchaseSystem.js';

export class MainPoolTab {
    constructor(container, stateManager) {
        this.container = container;
        this.stateManager = stateManager;
        this.currentSectionKey = 'flaws'; 
        
        this.sections = {
            flaws: { title: 'Flaws', entityType: 'flaw', description: 'Flaws COST 30 main pool points each but grant a +Tier stat bonus and add limitations.' },
            traits: { title: 'Traits', entityType: 'trait', description: 'Traits COST 30 main pool points each and provide conditional +Tier bonuses or unique effects.' },
            boons: { title: 'Boons', entityType: 'boon', parentIdFilter: null, description: 'Boons have variable costs and provide straightforward benefits.' },
            action_upgrades: { title: 'Action Upgrades', entityType: 'action_upgrade', description: 'Action Upgrades enhance or modify standard character actions. Costs vary.' },
            unique_abilities_purchasable: { title: 'Unique Abilities', entityType: 'unique_ability', parentIdFilter: null, description: 'Powerful, distinct abilities. Costs vary.'}
        };
        
        this.eventBusListeners = {
            characterLoaded: null, // Added listener for character load/switch
            characterChanged: null,
            entityPurchased: null,
            entityRemoved: null
        };
        this.delegatedGridListener = null;
    }

    async init() {
        // Store bound versions of handlers
        this.eventBusListeners.characterLoaded = (data) => this.handleCharacterUpdate(data.character, 'CHARACTER_LOADED');
        this.eventBusListeners.characterChanged = (data) => this.handleCharacterUpdate(data.character, 'CHARACTER_CHANGED');
        this.eventBusListeners.entityPurchased = (data) => this.handleCharacterUpdate(data.character, 'ENTITY_PURCHASED');
        this.eventBusListeners.entityRemoved = (data) => this.handleCharacterUpdate(data.character, 'ENTITY_REMOVED');

        // Subscribe to events
        EventBus.on('CHARACTER_LOADED', this.eventBusListeners.characterLoaded);
        EventBus.on('CHARACTER_CHANGED', this.eventBusListeners.characterChanged);
        EventBus.on('ENTITY_PURCHASED', this.eventBusListeners.entityPurchased);
        EventBus.on('ENTITY_REMOVED', this.eventBusListeners.entityRemoved);
        
        Logger.info('[MainPoolTab] Initialized.');
    }

    handleCharacterUpdate(character, eventName = 'Unknown Event') {
        if (this.container && this.container.style.display !== 'none') {
            Logger.debug(`[MainPoolTab] Re-rendering due to ${eventName}.`);
            this.render();
        }
    }

    render() {
        if (!this.container) {
            Logger.error("[MainPoolTab] Cannot render, container is not set.");
            return;
        }
        const character = this.stateManager.getCharacter();
        const pools = PoolCalculator.calculatePools(character); // Pass character

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
        
        if (sectionConfig.parentIdFilter !== undefined) {
            entities = entities.filter(e => e.parentId === sectionConfig.parentIdFilter);
        }
        
        if (!entities || entities.length === 0) {
            return `<p class="no-items">No items available in the "${sectionConfig.title}" category (type: ${entityType}).</p>`;
        }

        // No need to pass character here, PurchaseCard gets it from StateManager
        return entities.map(entity => {
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
                    
                    Logger.debug(`[MainPoolTab] Button Clicked - Action: ${action}, EntityID: ${entityId}, Type: ${entityTypeFromCard}`);

                    if (!entityId || !entityTypeFromCard) {
                        Logger.error("[MainPoolTab] Clicked button without entityId or entityType in dataset", button);
                        return;
                    }
                    
                    // *** FIX: Match action names from UniversalCard ***
                    if (action === 'purchase_entity') { 
                        this.handlePurchase(entityId, entityTypeFromCard);
                    } else if (action === 'remove_entity') { 
                        const character = this.stateManager.getCharacter();
                        const purchaseArrayName = `${entityTypeFromCard}s`;
                        // Find by entity.id first to get the purchaseInstance which contains purchaseId
                        const purchaseInstance = character[purchaseArrayName]?.find(p => p.id === entityId); 

                        if (purchaseInstance && purchaseInstance.purchaseId) {
                            this.handleRemove(purchaseInstance.purchaseId, entityTypeFromCard);
                        } else {
                            Logger.warn(`[MainPoolTab] Could not find purchaseId for entity ${entityId} of type ${entityTypeFromCard} to remove.`);
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
        UnifiedPurchaseSystem.purchase(entityId); 
    }

    handleRemove(purchaseId, entityType) {
        Logger.info(`[MainPoolTab] Attempting removal: Purchase ID - ${purchaseId}, Type - ${entityType}`);
        UnifiedPurchaseSystem.remove(purchaseId, entityType);
    }
    
    cleanup() {
        if (this.eventBusListeners.characterLoaded) EventBus.off('CHARACTER_LOADED', this.eventBusListeners.characterLoaded);
        if (this.eventBusListeners.characterChanged) EventBus.off('CHARACTER_CHANGED', this.eventBusListeners.characterChanged);
        if (this.eventBusListeners.entityPurchased) EventBus.off('ENTITY_PURCHASED', this.eventBusListeners.entityPurchased);
        if (this.eventBusListeners.entityRemoved) EventBus.off('ENTITY_REMOVED', this.eventBusListeners.entityRemoved);
        this.eventBusListeners = {};

        const purchaseGrid = this.container?.querySelector('#main-pool-purchase-grid');
        if (purchaseGrid && this.delegatedGridListener) {
            purchaseGrid.removeEventListener('click', this.delegatedGridListener);
            this.delegatedGridListener = null;
        }
        Logger.info('[MainPoolTab] Cleanup called, listeners removed.');
    }
}