// modernApp/components/UniversalCard.js
import { Component } from '../core/Component.js';
import { PurchaseButton } from './PurchaseButton.js';
import { Logger } from '../utils/Logger.js';
import { Formatters } from '../utils/Formatters.js';

/**
 * Enhanced UniversalCard component with integrated purchase handling
 * Renders any game entity with purchase/select capabilities
 */
export class UniversalCard extends Component {
    static propSchema = {
        // Entity data
        entity: { type: 'object', required: true },
        entityType: { type: 'string', required: true },
        
        // Display options
        size: { type: 'string', default: 'medium' }, // small, medium, large
        layout: { type: 'string', default: 'vertical' }, // vertical, horizontal, compact
        showDescription: { type: 'boolean', default: true },
        showCost: { type: 'boolean', default: true },
        showEffects: { type: 'boolean', default: true },
        showRequirements: { type: 'boolean', default: true },
        
        // Purchase state
        isPurchased: { type: 'boolean', default: false },
        isSelected: { type: 'boolean', default: false },
        canPurchase: { type: 'boolean', default: true },
        canRemove: { type: 'boolean', default: true },
        
        // Purchase handlers (optional)
        onPurchase: { type: 'function', optional: true },
        onRemove: { type: 'function', optional: true },
        onSelect: { type: 'function', optional: true },
        
        // Additional metadata
        metadata: { type: 'object', default: () => ({}) }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        this.purchaseButton = null;
        this.cardElement = null;
        Logger.debug('[UniversalCard] Constructed for entity:', this.props.entity?.id);
    }

    async init() {
        Logger.debug('[UniversalCard] Initializing...');
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) {
            Logger.warn('[UniversalCard] No container available for render');
            return;
        }

        if (!this.props.entity) {
            Logger.error('[UniversalCard] No entity provided for render');
            this.container.innerHTML = '<div class="card-error">No entity data</div>';
            return;
        }

        const cardClasses = this.getCardClasses();
        const entity = this.props.entity;
        
        this.container.innerHTML = `
            <div class="${cardClasses}" data-entity-id="${entity.id}" data-entity-type="${this.props.entityType}">
                ${this.renderCardHeader()}
                ${this.renderCardBody()}
                ${this.renderCardFooter()}
            </div>
        `;

        this.cardElement = this.container.querySelector('.universal-card');
        
        // Initialize purchase button
        this.initializePurchaseButton();
        
        Logger.debug(`[UniversalCard] Rendered ${this.props.entityType} card:`, entity.id);
    }

    renderCardHeader() {
        const entity = this.props.entity;
        const cost = this.props.showCost && entity.cost ? `<span class="card-cost">${entity.cost}pts</span>` : '';
        
        return `
            <div class="card-header">
                <div class="card-title-row">
                    <h3 class="card-title">${entity.name || 'Unnamed'}</h3>
                    ${cost}
                </div>
                ${this.renderCardTags()}
            </div>
        `;
    }

    renderCardTags() {
        const entity = this.props.entity;
        const tags = [];
        
        // Add type tag
        if (this.props.entityType) {
            tags.push(Formatters.camelToTitle(this.props.entityType));
        }
        
        // Add entity-specific tags
        if (entity.category) {
            tags.push(Formatters.camelToTitle(entity.category));
        }
        
        if (entity.tier) {
            tags.push(`Tier ${entity.tier}`);
        }
        
        if (entity.tags && Array.isArray(entity.tags)) {
            tags.push(...entity.tags);
        }
        
        if (tags.length === 0) return '';
        
        return `
            <div class="card-tags">
                ${tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
        `;
    }

    renderCardBody() {
        const parts = [];
        
        if (this.props.showDescription) {
            parts.push(this.renderDescription());
        }
        
        if (this.props.showEffects) {
            parts.push(this.renderEffects());
        }
        
        if (this.props.showRequirements) {
            parts.push(this.renderRequirements());
        }
        
        return `<div class="card-body">${parts.join('')}</div>`;
    }

    renderDescription() {
        const entity = this.props.entity;
        
        if (!entity.description) return '';
        
        return `
            <div class="card-description">
                <p>${entity.description}</p>
            </div>
        `;
    }

    renderEffects() {
        const entity = this.props.entity;
        
        if (!entity.effects && !entity.statBonus && !entity.modifiers) return '';
        
        const effectsList = [];
        
        // Handle stat bonuses
        if (entity.statBonus) {
            if (typeof entity.statBonus === 'object') {
                if (entity.statBonus.type === 'choice') {
                    effectsList.push(`+${entity.statBonus.value} to chosen attribute (${entity.statBonus.options.join(', ')})`);
                } else {
                    Object.entries(entity.statBonus).forEach(([stat, value]) => {
                        effectsList.push(`+${value} ${Formatters.camelToTitle(stat)}`);
                    });
                }
            } else {
                effectsList.push(`Stat Bonus: ${entity.statBonus}`);
            }
        }
        
        // Handle effects array
        if (entity.effects && Array.isArray(entity.effects)) {
            effectsList.push(...entity.effects.map(effect => effect.description || effect));
        }
        
        // Handle modifiers
        if (entity.modifiers) {
            Object.entries(entity.modifiers).forEach(([key, value]) => {
                effectsList.push(`${Formatters.camelToTitle(key)}: ${value}`);
            });
        }
        
        if (effectsList.length === 0) return '';
        
        return `
            <div class="card-effects">
                <strong>Effects:</strong>
                <ul class="effects-list">
                    ${effectsList.map(effect => `<li>${effect}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderRequirements() {
        const entity = this.props.entity;
        
        if (!entity.requirements && !entity.restrictions && !entity.prerequisites) return '';
        
        const requirementsList = [];
        
        // Handle requirements
        if (entity.requirements) {
            if (Array.isArray(entity.requirements)) {
                requirementsList.push(...entity.requirements);
            } else {
                requirementsList.push(entity.requirements);
            }
        }
        
        // Handle restrictions
        if (entity.restrictions) {
            const restrictions = Array.isArray(entity.restrictions) 
                ? entity.restrictions 
                : [entity.restrictions];
            requirementsList.push(...restrictions.map(r => `Cannot have: ${r}`));
        }
        
        // Handle prerequisites
        if (entity.prerequisites) {
            const prereqs = Array.isArray(entity.prerequisites) 
                ? entity.prerequisites 
                : [entity.prerequisites];
            requirementsList.push(...prereqs.map(p => `Requires: ${p}`));
        }
        
        if (requirementsList.length === 0) return '';
        
        return `
            <div class="card-requirements">
                <strong>Requirements:</strong>
                <ul class="requirements-list">
                    ${requirementsList.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderCardFooter() {
        return `
            <div class="card-footer">
                <div class="purchase-button-container"></div>
            </div>
        `;
    }

    initializePurchaseButton() {
        const buttonContainer = this.cardElement?.querySelector('.purchase-button-container');
        
        if (!buttonContainer) {
            Logger.error('[UniversalCard] Purchase button container not found');
            return;
        }
        
        try {
            this.purchaseButton = new PurchaseButton(buttonContainer, {
                entity: this.props.entity,
                entityType: this.props.entityType,
                isPurchased: this.props.isPurchased,
                isSelected: this.props.isSelected,
                canPurchase: this.props.canPurchase,
                canRemove: this.props.canRemove,
                size: this.props.size === 'large' ? 'large' : 'medium',
                showCost: this.props.showCost,
                onPurchase: this.props.onPurchase,
                onRemove: this.props.onRemove,
                onSelect: this.props.onSelect
            });
            
            this.purchaseButton.init();
            
            Logger.debug('[UniversalCard] Purchase button initialized');
        } catch (error) {
            Logger.error('[UniversalCard] Failed to initialize purchase button:', error);
        }
    }

    setupEventListeners() {
        if (!this.cardElement) {
            Logger.error('[UniversalCard] Cannot setup event listeners - no card element');
            return;
        }

        // Listen for purchase events from the button
        this._addEventListener(this.cardElement, 'purchase-action', this.handlePurchaseAction);
        
        // Add card interaction effects
        this._addEventListener(this.cardElement, 'mouseenter', this.handleCardHover);
        this._addEventListener(this.cardElement, 'mouseleave', this.handleCardLeave);
    }

    handlePurchaseAction(event) {
        const { action, entity, entityType } = event.detail;
        
        Logger.info(`[UniversalCard] Purchase action received: ${action} for ${entityType}:`, entity.id);
        
        // Emit event to parent for handling
        const cardEvent = new CustomEvent('card-purchase-action', {
            detail: {
                action,
                entity,
                entityType,
                cardId: this.componentId,
                timestamp: Date.now()
            },
            bubbles: true
        });
        
        this.container.dispatchEvent(cardEvent);
    }

    handleCardHover(event) {
        event.currentTarget.classList.add('card-hover');
    }

    handleCardLeave(event) {
        event.currentTarget.classList.remove('card-hover');
    }

    getCardClasses() {
        const baseClasses = ['universal-card'];
        
        // Size classes
        baseClasses.push(`card-${this.props.size}`);
        
        // Layout classes
        baseClasses.push(`card-${this.props.layout}`);
        
        // State classes
        if (this.props.isPurchased) baseClasses.push('card-purchased');
        if (this.props.isSelected) baseClasses.push('card-selected');
        if (!this.props.canPurchase) baseClasses.push('card-disabled');
        
        // Entity type class
        baseClasses.push(`card-${this.props.entityType}`);
        
        return baseClasses.join(' ');
    }

    // Update card state
    updatePurchaseState(isPurchased, isSelected = null) {
        this.props.isPurchased = isPurchased;
        if (isSelected !== null) {
            this.props.isSelected = isSelected;
        }
        
        // Update purchase button
        if (this.purchaseButton) {
            this.purchaseButton.setPurchased(isPurchased);
            if (isSelected !== null) {
                this.purchaseButton.setSelected(isSelected);
            }
        }
        
        // Update card classes
        if (this.cardElement) {
            this.cardElement.className = this.getCardClasses();
        }
        
        Logger.debug('[UniversalCard] Purchase state updated:', { isPurchased, isSelected });
    }

    // Set loading state on purchase button
    setLoading(isLoading, loadingText = null) {
        if (this.purchaseButton) {
            this.purchaseButton.setLoading(isLoading, loadingText);
        }
    }

    // Get card debug information
    getDebugInfo() {
        return {
            entityId: this.props.entity?.id,
            entityType: this.props.entityType,
            isPurchased: this.props.isPurchased,
            isSelected: this.props.isSelected,
            canPurchase: this.props.canPurchase,
            hasElement: !!this.cardElement,
            hasPurchaseButton: !!this.purchaseButton
        };
    }

    destroy() {
        // Clean up purchase button
        if (this.purchaseButton) {
            this.purchaseButton.destroy();
            this.purchaseButton = null;
        }
        
        // Call parent destroy
        super.destroy();
        
        Logger.debug('[UniversalCard] Destroyed');
    }
}