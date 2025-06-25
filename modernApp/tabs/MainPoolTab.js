// modernApp/tabs/MainPoolTab.js
import { Component } from '../core/Component.js';
import { connectToState } from '../core/StateConnector.js';
import { UniversalCard } from '../components/UniversalCard.js';
import { PointPoolDisplay } from '../components/PointPoolDisplay.js';
import { CollapsibleSection } from '../components/CollapsibleSection.js';
import { Logger } from '../utils/Logger.js';
import { UnifiedPurchaseSystem } from '../systems/UnifiedPurchaseSystem.js';
import { StateManager } from '../core/StateManager.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';

/**
 * Enhanced MainPoolTab with component-driven architecture
 * Focuses on data preparation and layout, delegates purchase logic to components
 */
class MainPoolTab extends Component {
    static propSchema = {
        character: { type: 'object', default: () => ({}) },
        gameData: { type: 'object', default: () => ({}) },
        pools: { type: 'object', default: () => ({}) }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        this.sections = new Map();
        this.pointPoolDisplay = null;
        Logger.info('[MainPoolTab] Constructed with props:', this.props);
    }

    async init() {
        Logger.info('[MainPoolTab] Initializing...');
        this.setupEventListeners();
        Logger.info('[MainPoolTab] Initialization complete');
    }

    onRender() {
        if (!this.container) {
            Logger.warn('[MainPoolTab] No container available for render');
            return;
        }

        Logger.debug('[MainPoolTab] Rendering with character:', this.props.character?.name);

        this.container.innerHTML = `
            <div class="main-pool-tab">
                <div class="pool-header">
                    <div class="point-pool-container"></div>
                    <div class="tab-description">
                        <p>Purchase flaws, traits, boons, and abilities using your main point pool.</p>
                    </div>
                </div>
                
                <div class="pool-sections">
                    <div class="flaws-section-container"></div>
                    <div class="traits-section-container"></div>
                    <div class="boons-section-container"></div>
                    <div class="unique-abilities-section-container"></div>
                    <div class="action-upgrades-section-container"></div>
                </div>
            </div>
        `;

        // Initialize point pool display
        this.initializePointPoolDisplay();

        // Initialize sections
        this.initializeSections();

        Logger.debug('[MainPoolTab] Render complete');
    }

    initializePointPoolDisplay() {
        const container = this.container.querySelector('.point-pool-container');
        if (!container) {
            Logger.error('[MainPoolTab] Point pool container not found');
            return;
        }

        try {
            this.pointPoolDisplay = new PointPoolDisplay(container, {
                pools: this.props.pools,
                showMainPool: true,
                showBreakdown: true,
                size: 'large'
            });

            this.pointPoolDisplay.init();
            Logger.debug('[MainPoolTab] Point pool display initialized');
        } catch (error) {
            Logger.error('[MainPoolTab] Failed to initialize point pool display:', error);
        }
    }

    initializeSections() {
        const sectionsConfig = [
            {
                key: 'flaws',
                title: 'Flaws',
                description: 'Character flaws that cost 30 points and provide tier-based stat bonuses',
                containerSelector: '.flaws-section-container',
                dataKey: 'flaws',
                entityType: 'flaw'
            },
            {
                key: 'traits',
                title: 'Traits', 
                description: 'Character traits that cost 30 points each',
                containerSelector: '.traits-section-container',
                dataKey: 'traits',
                entityType: 'trait'
            },
            {
                key: 'boons',
                title: 'Boons',
                description: 'Beneficial character abilities',
                containerSelector: '.boons-section-container', 
                dataKey: 'boons',
                entityType: 'boon'
            },
            {
                key: 'uniqueAbilities',
                title: 'Unique Abilities',
                description: 'Special character abilities with variable costs',
                containerSelector: '.unique-abilities-section-container',
                dataKey: 'uniqueAbilities', 
                entityType: 'uniqueAbility'
            },
            {
                key: 'actionUpgrades',
                title: 'Action Upgrades',
                description: 'Upgrades to basic actions',
                containerSelector: '.action-upgrades-section-container',
                dataKey: 'actionUpgrades',
                entityType: 'actionUpgrade'
            }
        ];

        sectionsConfig.forEach(config => this.initializeSection(config));
    }

    initializeSection(config) {
        const container = this.container.querySelector(config.containerSelector);
        if (!container) {
            Logger.error(`[MainPoolTab] Section container not found: ${config.containerSelector}`);
            return;
        }

        try {
            const section = new CollapsibleSection(container, {
                title: config.title,
                description: config.description,
                isCollapsed: false,
                showItemCount: true
            });

            section.init();

            // Get entities for this section
            const entities = this.getEntitiesForSection(config.dataKey);
            
            // Render entity cards in section content
            this.renderSectionEntities(section, entities, config.entityType);

            this.sections.set(config.key, section);
            Logger.debug(`[MainPoolTab] Section initialized: ${config.title}`);
        } catch (error) {
            Logger.error(`[MainPoolTab] Failed to initialize section ${config.title}:`, error);
        }
    }

    getEntitiesForSection(dataKey) {
        const gameData = this.props.gameData;
        if (!gameData || !gameData[dataKey]) {
            Logger.warn(`[MainPoolTab] No data found for section: ${dataKey}`);
            return [];
        }

        return gameData[dataKey] || [];
    }

    renderSectionEntities(section, entities, entityType) {
        if (!entities || entities.length === 0) {
            section.setContent('<p class="no-entities">No items available in this category.</p>');
            return;
        }

        const contentContainer = document.createElement('div');
        contentContainer.className = 'entities-grid';

        entities.forEach(entity => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'entity-card-container';
            
            // Check if entity is purchased
            const isPurchased = this.isEntityPurchased(entity.id, entityType);
            
            // Create card component
            const card = new UniversalCard(cardContainer, {
                entity,
                entityType,
                isPurchased,
                canPurchase: this.canPurchaseEntity(entity),
                canRemove: isPurchased,
                size: 'medium',
                showDescription: true,
                showCost: true,
                showEffects: true,
                showRequirements: true
            });

            card.init();
            contentContainer.appendChild(cardContainer);
        });

        section.setContent(contentContainer);
        
        Logger.debug(`[MainPoolTab] Rendered ${entities.length} entities for ${entityType}`);
    }

    setupEventListeners() {
        if (!this.container) {
            Logger.error('[MainPoolTab] Cannot setup event listeners - no container');
            return;
        }

        // Listen for purchase actions from cards
        this._addEventListener(this.container, 'card-purchase-action', this.handleCardPurchaseAction);
        
        Logger.debug('[MainPoolTab] Event listeners setup complete');
    }

    async handleCardPurchaseAction(event) {
        const { action, entity, entityType } = event.detail;
        
        Logger.info(`[MainPoolTab] Handling card purchase action: ${action} for ${entityType}:`, entity.id);

        try {
            // Set loading state on the card
            const cardElement = event.target.closest('.entity-card-container');
            if (cardElement) {
                const card = this.findCardComponent(cardElement);
                if (card) {
                    card.setLoading(true, `${action === 'purchase' ? 'Purchasing' : 'Removing'}...`);
                }
            }

            let success = false;

            switch (action) {
                case 'purchase':
                    success = await this.handlePurchase(entity, entityType);
                    break;
                case 'remove':
                    success = await this.handleRemove(entity, entityType);
                    break;
                default:
                    Logger.error(`[MainPoolTab] Unknown purchase action: ${action}`);
                    return;
            }

            if (success) {
                Logger.info(`[MainPoolTab] ${action} successful for ${entityType}:`, entity.id);
                // The state update will trigger a re-render through StateConnector
            } else {
                Logger.warn(`[MainPoolTab] ${action} failed for ${entityType}:`, entity.id);
            }

        } catch (error) {
            Logger.error(`[MainPoolTab] Error handling ${action}:`, error);
        }
    }

    async handlePurchase(entity, entityType) {
        Logger.debug(`[MainPoolTab] Purchasing ${entityType}:`, entity.id);

        try {
            const result = await UnifiedPurchaseSystem.purchase(entity, entityType, {
                character: this.props.character,
                gameData: this.props.gameData
            });

            if (result.success) {
                Logger.info(`[MainPoolTab] Purchase successful for ${entity.name}`);
                return true;
            } else {
                Logger.warn(`[MainPoolTab] Purchase failed:`, result.error);
                return false;
            }
        } catch (error) {
            Logger.error(`[MainPoolTab] Purchase error:`, error);
            return false;
        }
    }

    async handleRemove(entity, entityType) {
        Logger.debug(`[MainPoolTab] Removing ${entityType}:`, entity.id);

        try {
            const result = await UnifiedPurchaseSystem.remove(entity.id, entityType, {
                character: this.props.character
            });

            if (result.success) {
                Logger.info(`[MainPoolTab] Removal successful for ${entity.name}`);
                return true;
            } else {
                Logger.warn(`[MainPoolTab] Removal failed:`, result.error);
                return false;
            }
        } catch (error) {
            Logger.error(`[MainPoolTab] Removal error:`, error);
            return false;
        }
    }

    // Helper methods
    isEntityPurchased(entityId, entityType) {
        const character = this.props.character;
        if (!character || !character.unifiedPurchases) return false;

        return character.unifiedPurchases.some(purchase => 
            purchase.entityId === entityId && purchase.category === entityType
        );
    }

    canPurchaseEntity(entity) {
        const pools = this.props.pools;
        if (!pools || !pools.mainPool) return false;

        return pools.mainPool.available >= (entity.cost || 0);
    }

    findCardComponent(cardElement) {
        // This is a simplified lookup - in a real implementation,
        // we'd maintain a registry of component instances
        return null;
    }

    // Update method called by StateConnector
    update(nextProps, prevProps) {
        Logger.debug('[MainPoolTab] Update called with new props:', nextProps);

        // Check if character or pools changed
        const characterChanged = !prevProps || 
            prevProps.character?.id !== nextProps.character?.id ||
            JSON.stringify(prevProps.character?.unifiedPurchases) !== JSON.stringify(nextProps.character?.unifiedPurchases);

        const poolsChanged = !prevProps || 
            JSON.stringify(prevProps.pools) !== JSON.stringify(nextProps.pools);

        if (characterChanged || poolsChanged) {
            Logger.info('[MainPoolTab] Character or pools changed, re-rendering');
            
            // Update props
            this.props = nextProps;
            
            // Request re-render through proper component lifecycle
            this._requestRender();
        } else {
            Logger.debug('[MainPoolTab] No significant changes, skipping re-render');
        }
    }

    // Debug information
    getDebugInfo() {
        return {
            characterId: this.props.character?.id,
            characterName: this.props.character?.name,
            sectionsCount: this.sections.size,
            poolsAvailable: this.props.pools?.mainPool?.available,
            purchasesCount: this.props.character?.unifiedPurchases?.length || 0
        };
    }

    destroy() {
        Logger.info('[MainPoolTab] Destroying...');

        // Clean up sections
        this.sections.forEach(section => {
            if (section && typeof section.destroy === 'function') {
                section.destroy();
            }
        });
        this.sections.clear();

        // Clean up point pool display
        if (this.pointPoolDisplay && typeof this.pointPoolDisplay.destroy === 'function') {
            this.pointPoolDisplay.destroy();
        }

        // Call parent destroy
        super.destroy();

        Logger.info('[MainPoolTab] Destroyed');
    }
}

// State mapping function
const mapStateToProps = (state) => {
    if (!state) {
        Logger.debug('[MainPoolTab] mapStateToProps: No state available');
        return {
            character: {},
            gameData: {},
            pools: {}
        };
    }

    const pools = PoolCalculator.calculatePools(state);
    
    Logger.debug('[MainPoolTab] mapStateToProps: Mapping state to props', {
        characterName: state.name,
        poolsAvailable: pools.mainPool?.available
    });

    return {
        character: state,
        gameData: window.gameData || {},
        pools
    };
};

// Connect to state with debugging
const ConnectedMainPoolTab = connectToState(mapStateToProps, {
    displayName: 'ConnectedMainPoolTab',
    debugMode: true
})(MainPoolTab);

export { ConnectedMainPoolTab as MainPoolTab };