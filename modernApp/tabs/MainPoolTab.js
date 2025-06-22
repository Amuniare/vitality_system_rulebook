// modernApp/tabs/MainPoolTab.js
import { Component } from '../core/Component.js';
import { connectToState } from '../core/StateConnector.js';
import { PurchaseCard } from '../components/PurchaseCard.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { StateManager } from '../core/StateManager.js';
import { UnifiedPurchaseSystem } from '../systems/UnifiedPurchaseSystem.js';
import { RequirementSystem } from '../systems/RequirementSystem.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { UniversalCard } from '../components/UniversalCard.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';

class MainPoolTab extends Component {
    static propSchema = {
        character: { type: 'object', default: () => ({}) },
        pools: { type: 'object', default: () => ({}) }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        this.currentSection = 'flaws';
        this.purchaseCards = new Map();
        this.handleSectionChange = this.handleSectionChange.bind(this);
        this.handlePurchase = this.handlePurchase.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        
        this.sections = {
            flaws: { title: 'Flaws', entityType: 'flaw', description: 'Flaws COST 30 main pool points each but grant a +Tier stat bonus and add limitations.' },
            traits: { title: 'Traits', entityType: 'trait', description: 'Traits COST 30 main pool points each and provide conditional +Tier bonuses or unique effects.' },
            boons: { title: 'Boons', entityType: 'boon', description: 'Boons have variable costs and provide straightforward benefits.' },
            action_upgrades: { title: 'Action Upgrades', entityType: 'action_upgrade', description: 'Action Upgrades enhance or modify standard character actions.' },
            unique_abilities: { title: 'Unique Abilities', entityType: 'unique_ability', description: 'Unique abilities with special costs and effects.' },
            custom_abilities: { title: 'Custom Abilities', entityType: 'custom_ability', description: 'Custom abilities created by the player.' }
        };
    }

    init() {
        this.componentId = `main-pool-${Date.now()}`;
        // Move event listeners to init() method
        this._addEventListener(this.container, 'click', this.handleContainerClick.bind(this));
        Logger.info('[MainPoolTab] Initialized with proper event delegation');
    }

    // Use event delegation on container, not individual cards
    handleContainerClick(e) {
        // Section tabs
        const sectionTab = e.target.closest('.section-tab');
        if (sectionTab) {
            this.handleSectionChange(sectionTab.dataset.sectionKey);
            return;
        }

        // Purchase buttons via delegation - no direct listeners on individual cards
        const purchaseBtn = e.target.closest('.purchase-btn');
        if (purchaseBtn && !purchaseBtn.disabled) {
            const action = purchaseBtn.dataset.action;
            const entityId = purchaseBtn.dataset.entityId;
            const entityType = purchaseBtn.dataset.entityType;
            
            if (action === 'purchase') {
                this.handlePurchase(entityId, entityType);
            } else if (action === 'remove') {
                this.handleRemove(entityId, entityType);
            }
        }
    }

    handleSectionChange(sectionKey) {
        this.currentSection = sectionKey;
        this._requestRender(); // Use proper render queueing
    }

    handlePurchase(entityId, entityType) {
        Logger.info(`[MainPoolTab] Attempting purchase: Entity ID - ${entityId}, Type - ${entityType}`);
        UnifiedPurchaseSystem.purchase(entityId);
        // No need to manually re-render - StateConnector handles updates
    }

    handleRemove(purchaseId, entityType) {
        Logger.info(`[MainPoolTab] Attempting removal: Purchase ID - ${purchaseId}, Type - ${entityType}`);
        UnifiedPurchaseSystem.remove(purchaseId, entityType);
        // No need to manually re-render - StateConnector handles updates
    }

    async render() {
        if (!this.container) return;

        const { character, pools } = this.props;
        const currentSectionData = this.sections[this.currentSection];
        
        try {
            // Get entities for current section
            const entities = await EntityLoader.getEntitiesByType(currentSectionData.entityType, character);
            
            this.container.innerHTML = `
                <div class="pool-header">
                    <h2>Main Pool Purchases</h2>
                    <div class="pool-summary">
                        <div class="pool-info">
                            <span class="pool-label">Main Pool Remaining:</span>
                            <span class="pool-value">${pools.mainRemaining || 0}</span>
                        </div>
                        <div class="pool-breakdown">
                            <span>Total: ${pools.mainTotal || 0}</span>
                            <span>•</span>
                            <span>Spent: ${pools.mainSpent || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="section-tabs">
                    ${Object.entries(this.sections).map(([key, section]) => `
                        <button class="section-tab ${key === this.currentSection ? 'active' : ''}" 
                                data-section-key="${key}">
                            ${section.title}
                        </button>
                    `).join('')}
                </div>

                <div class="section-content">
                    <div class="section-header">
                        <h3>${currentSectionData.title}</h3>
                        <p class="section-description">${currentSectionData.description}</p>
                    </div>
                    
                    <div class="purchase-grid" id="main-pool-purchase-grid">
                        ${entities.map(entity => this.renderPurchaseCard(entity, character)).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            Logger.error('[MainPoolTab] Error rendering:', error);
            this.container.innerHTML = `<div class="error">Error loading ${currentSectionData.title}</div>`;
        }
    }

    // Pass complete purchase data to PurchaseCard
    renderPurchaseCard(entity, character) {
        const arrayName = `${this.sections[this.currentSection].entityType}s`;
        const isPurchased = character[arrayName]?.some(p => p.id === entity.id) || false;
        
        // Check requirements
        const reqCheck = RequirementSystem.check(entity.requirements, character);
        
        // Check affordability
        const pools = PoolCalculator.calculatePools(character);
        const poolName = entity.cost?.pool || 'main';
        const pool = pools[poolName + 'Remaining'] ?? -Infinity;
        const cost = entity.cost?.value || 0;
        const isAffordable = pool >= cost;

        const context = {
            isPurchased,
            isAffordable,
            areRequirementsMet: reqCheck.areMet,
            unmetRequirements: reqCheck.unmet,
            entityType: this.sections[this.currentSection].entityType
        };

        return UniversalCard.render(entity, context);
    }
}

// Declare required state paths: ['character.purchases', 'character.tier']
const mapStateToProps = (state) => ({
    character: state,
    pools: PoolCalculator.calculatePools(state)
});

// Implement proper state subscription
const ConnectedMainPoolTab = connectToState(mapStateToProps)(MainPoolTab);
export { ConnectedMainPoolTab as MainPoolTab };