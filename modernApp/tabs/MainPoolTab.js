// modernApp/tabs/MainPoolTab.js
import { PurchaseCard } from '../components/PurchaseCard.js';
import { Logger } from '../utils/Logger.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { UnifiedPurchaseSystem } from '../systems/UnifiedPurchaseSystem.js'; // Direct import now

export class MainPoolTab {
    constructor(container, stateManager) {
        this.container = container;
        this.stateManager = stateManager;
        this.currentSectionKey = 'flaws'; // Default section
        
        // Ensure entityType matches the 'type' field in your unified-game-data.json for these items
        this.sections = {
            flaws: { title: 'Flaws', entityType: 'flaw', description: 'Flaws COST 30 main pool points each but grant a +Tier stat bonus and add limitations.' },
            traits: { title: 'Traits', entityType: 'trait', description: 'Traits COST 30 main pool points each and provide conditional +Tier bonuses or unique effects.' },
            boons_simple: { title: 'Simple Boons', entityType: 'boon', description: 'Simple Boons have variable costs and provide straightforward benefits.' },
            action_upgrades: { title: 'Action Upgrades', entityType: 'action_upgrade', description: 'Action Upgrades enhance or modify standard character actions. Costs vary.' },
            // Add other main pool categories here if they exist:
            unique_abilities_purchasable: { title: 'Unique Abilities', entityType: 'unique_ability', description: 'Powerful, distinct abilities. Costs vary.'}
        };
        
        this.eventBusListener = null;
        this.delegatedGridListener = null; // For purchase grid
    }

    async init() {
        this.eventBusListener = (characterData) => {
            if (this.container.querySelector('.main-pool-tab')) {
                this.render(); 
                Logger.debug('[MainPoolTab] Re-rendered due to character update.');
            }
        };
        EventBus.on('character-updated', this.eventBusListener);
        
        // Initial character data for rendering
        const character = this.stateManager.getCharacter();
        // Any specific pre-computation based on character can go here if needed before first render

        Logger.info('[MainPoolTab] Initialized.');
    }

    render() {
        const character = this.stateManager.getCharacter();
        const pools = PoolCalculator.calculatePools(character);

        this.container.innerHTML = `
            <div class="tab-content main-pool-tab">
                <div class="pool-header section-header">
                    <h2>Main Pool</h2>
                    <div class="pool-summary">
                        <div class="pool-info">
                            <span class="pool-label">Points Available:</span>
                            <span class="pool-value" id="main-pool-points-display">${pools.mainRemaining} / ${pools.main}</span>
                        </div>
                        <div class="pool-breakdown">
                            <span>Base Pool: ${pools.main} (Tier ${character.tier})</span>
                            <!-- You can add details here like points from archetypes if applicable -->
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
        const entities = EntityLoader.getEntitiesByType(entityType);
        
        if (!entities || entities.length === 0) {
            return `<p class="no-items">No items available in the "${sectionConfig.title}" category (type: ${entityType}). Check unified-game-data.json.</p>`;
        }

        const character = this.stateManager.getCharacter();
        const purchaseArrayName = `${entityType}s`; // e.g. "flaws", "traits"

        return entities.map(entity => {
            // Context for UniversalCard via PurchaseCard
            const purchasedInstance = character[purchaseArrayName]?.find(p => p.id === entity.id);
            const isPurchased = !!purchasedInstance;
            
            // PurchaseCard will internally call RequirementSystem and PoolCalculator for affordability
            // It then calls UniversalCard.render with the assembled context.
            const card = new PurchaseCard(entity, entityType); 
            return card.render(); // PurchaseCard handles its own logic and context for UniversalCard
        }).join('');
    }

    setupEventListeners() {
        // Section Tab Buttons
        this.container.querySelectorAll('.section-tab').forEach(tabButton => {
            // Simple way to manage listeners on re-render: check if already attached
            if (!tabButton.hasAttribute('data-listener-attached')) {
                tabButton.addEventListener('click', (e) => {
                    const sectionKey = e.currentTarget.dataset.sectionKey;
                    if (sectionKey && sectionKey !== this.currentSectionKey) {
                        this.currentSectionKey = sectionKey;
                        this.render(); // Re-render to show new section
                    }
                });
                tabButton.setAttribute('data-listener-attached', 'true');
            }
        });

        // Purchase/Remove Buttons (Event Delegation on the grid)
        const purchaseGrid = this.container.querySelector('#main-pool-purchase-grid');
        if (purchaseGrid) {
            // Remove old listener before adding a new one if it exists
            if (this.delegatedGridListener) {
                purchaseGrid.removeEventListener('click', this.delegatedGridListener);
            }
            this.delegatedGridListener = (e) => {
                const button = e.target.closest('.purchase-btn');
                if (button && !button.disabled) {
                    e.preventDefault();
                    const action = button.dataset.action;
                    const entityId = button.dataset.entityId;
                    const entityTypeFromCard = button.dataset.entityType; // This is reliable

                    if (!entityTypeFromCard) {
                        Logger.error("[MainPoolTab] Clicked button without entityType in dataset", button);
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
                            Logger.warn(`[MainPoolTab] Could not find purchaseId for entity ${entityId} of type ${entityTypeFromCard} to remove.`);
                            // Attempt removal by entityId if purchaseId is missing (fallback for older data/logic)
                            // This might be risky if multiple instances of same ID are possible and purchaseId is key
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
        // StateManager change will trigger re-render via EventBus listener in init()
    }

    handleRemove(purchaseId, entityType) {
        Logger.info(`[MainPoolTab] Attempting removal: Purchase ID - ${purchaseId}, Type - ${entityType}`);
        UnifiedPurchaseSystem.remove(purchaseId, entityType);
        // StateManager change will trigger re-render via EventBus listener in init()
    }
    
    destroy() {
        if (this.eventBusListener) {
            EventBus.off('character-updated', this.eventBusListener);
            this.eventBusListener = null;
            Logger.info('[MainPoolTab] Unsubscribed from character-updated event.');
        }
        const purchaseGrid = this.container.querySelector('#main-pool-purchase-grid');
        if (purchaseGrid && this.delegatedGridListener) {
            purchaseGrid.removeEventListener('click', this.delegatedGridListener);
            this.delegatedGridListener = null;
        }
    }
}