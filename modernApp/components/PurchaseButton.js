// modernApp/components/PurchaseButton.js
import { Component } from '../core/Component.js';
import { Logger } from '../utils/Logger.js';

/**
 * Dedicated PurchaseButton component that handles all purchase/select/remove interactions
 * Encapsulates button state logic and emits standardized events
 */
export class PurchaseButton extends Component {
    static propSchema = {
        // Entity data
        entity: { type: 'object', required: true },
        entityType: { type: 'string', required: true },
        
        // State
        isPurchased: { type: 'boolean', default: false },
        isSelected: { type: 'boolean', default: false },
        canPurchase: { type: 'boolean', default: true },
        canRemove: { type: 'boolean', default: true },
        
        // Appearance
        size: { type: 'string', default: 'medium' }, // small, medium, large
        variant: { type: 'string', default: 'primary' }, // primary, secondary, danger
        showCost: { type: 'boolean', default: true },
        
        // Loading state
        isLoading: { type: 'boolean', default: false },
        loadingText: { type: 'string', default: 'Processing...' },
        
        // Custom handlers (optional - will emit events if not provided)
        onPurchase: { type: 'function', optional: true },
        onRemove: { type: 'function', optional: true },
        onSelect: { type: 'function', optional: true }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        this.buttonElement = null;
        Logger.debug('[PurchaseButton] Constructed with props:', this.props);
    }

    async init() {
        Logger.debug('[PurchaseButton] Initializing...');
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) {
            Logger.warn('[PurchaseButton] No container available for render');
            return;
        }

        const buttonInfo = this.getButtonInfo();
        const classes = this.getButtonClasses();
        
        this.container.innerHTML = `
            <button 
                class="${classes}" 
                ${buttonInfo.disabled ? 'disabled' : ''}
                data-entity-id="${this.props.entity.id}"
                data-entity-type="${this.props.entityType}"
                data-action="${buttonInfo.action}"
            >
                ${this.props.isLoading ? this.renderLoadingContent() : this.renderButtonContent(buttonInfo)}
            </button>
        `;

        this.buttonElement = this.container.querySelector('button');
        
        Logger.debug(`[PurchaseButton] Rendered ${buttonInfo.action} button for entity:`, this.props.entity.id);
    }

    renderLoadingContent() {
        return `
            <span class="button-loading">
                <span class="loading-spinner"></span>
                ${this.props.loadingText}
            </span>
        `;
    }

    renderButtonContent(buttonInfo) {
        const costDisplay = this.props.showCost && this.props.entity.cost 
            ? ` (${this.props.entity.cost}pts)` 
            : '';
            
        return `
            <span class="button-content">
                <span class="button-text">${buttonInfo.text}</span>
                ${costDisplay ? `<span class="button-cost">${costDisplay}</span>` : ''}
            </span>
        `;
    }

    getButtonInfo() {
        const { isPurchased, isSelected, canPurchase, canRemove, entity, entityType } = this.props;
        
        // Determine button state and text
        if (isPurchased) {
            return {
                action: 'remove',
                text: 'Remove',
                disabled: !canRemove || this.props.isLoading,
                variant: 'danger'
            };
        } else if (isSelected) {
            return {
                action: 'remove',
                text: 'Deselect',
                disabled: !canRemove || this.props.isLoading,
                variant: 'secondary'
            };
        } else {
            // Special handling for archetypes (select) vs other entities (purchase)
            const isArchetype = entityType === 'archetype';
            return {
                action: isArchetype ? 'select' : 'purchase',
                text: isArchetype ? 'Select' : 'Purchase',
                disabled: !canPurchase || this.props.isLoading,
                variant: 'primary'
            };
        }
    }

    getButtonClasses() {
        const buttonInfo = this.getButtonInfo();
        const baseClasses = ['purchase-button'];
        
        // Size classes
        baseClasses.push(`btn-${this.props.size}`);
        
        // Variant classes
        baseClasses.push(`btn-${buttonInfo.variant}`);
        
        // State classes
        if (this.props.isPurchased) baseClasses.push('btn-purchased');
        if (this.props.isSelected) baseClasses.push('btn-selected');
        if (this.props.isLoading) baseClasses.push('btn-loading');
        if (buttonInfo.disabled) baseClasses.push('btn-disabled');
        
        return baseClasses.join(' ');
    }

    setupEventListeners() {
        if (!this.buttonElement) {
            Logger.error('[PurchaseButton] Cannot setup event listeners - no button element');
            return;
        }

        this._addEventListener(this.buttonElement, 'click', this.handleClick);
        
        // Add hover effects for better UX
        this._addEventListener(this.buttonElement, 'mouseenter', this.handleMouseEnter);
        this._addEventListener(this.buttonElement, 'mouseleave', this.handleMouseLeave);
    }

    async handleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.props.isLoading) {
            Logger.debug('[PurchaseButton] Click ignored - button is loading');
            return;
        }

        const action = event.target.closest('button').dataset.action;
        const entityId = this.props.entity.id;
        const entityType = this.props.entityType;
        
        Logger.info(`[PurchaseButton] ${action} clicked for ${entityType}:`, entityId);
        
        // Set loading state
        super.updateProps({ isLoading: true });
        
        try {
            // Call custom handler if provided, otherwise emit event
            switch (action) {
                case 'purchase':
                    if (this.props.onPurchase) {
                        await this.props.onPurchase(this.props.entity, entityType);
                    } else {
                        this.emitPurchaseEvent('purchase', this.props.entity, entityType);
                    }
                    break;
                    
                case 'remove':
                    if (this.props.onRemove) {
                        await this.props.onRemove(this.props.entity, entityType);
                    } else {
                        this.emitPurchaseEvent('remove', this.props.entity, entityType);
                    }
                    break;
                    
                case 'select':
                    if (this.props.onSelect) {
                        await this.props.onSelect(this.props.entity, entityType);
                    } else {
                        this.emitPurchaseEvent('select', this.props.entity, entityType);
                    }
                    break;
                    
                default:
                    Logger.error(`[PurchaseButton] Unknown action: ${action}`);
            }
        } catch (error) {
            Logger.error(`[PurchaseButton] Error handling ${action}:`, error);
        } finally {
            // Clear loading state
            super.updateProps({ isLoading: false });
        }
    }

    emitPurchaseEvent(action, entity, entityType) {
        const eventData = {
            action,
            entity,
            entityType,
            timestamp: Date.now(),
            buttonId: this.componentId
        };
        
        Logger.debug(`[PurchaseButton] Emitting ${action} event:`, eventData);
        
        // Emit to parent element
        if (this.container && this.container.parentElement) {
            const customEvent = new CustomEvent('purchase-action', {
                detail: eventData,
                bubbles: true
            });
            this.container.parentElement.dispatchEvent(customEvent);
        }
    }

    handleMouseEnter(event) {
        if (!this.props.isLoading && !event.target.disabled) {
            event.target.classList.add('btn-hover');
        }
    }

    handleMouseLeave(event) {
        event.target.classList.remove('btn-hover');
    }

    // Handle prop updates from base class
    onPropsUpdate(nextProps, prevProps) {
        // Check if state-related props changed
        const stateProps = ['isPurchased', 'isSelected', 'canPurchase', 'canRemove', 'isLoading'];
        const stateChanged = stateProps.some(prop => prevProps[prop] !== nextProps[prop]);
        
        if (stateChanged) {
            Logger.debug('[PurchaseButton] State props changed, will re-render via base class');
            // Base class will handle re-render via _requestRender()
            this.setupEventListeners(); // Re-attach event listeners after render
        }
    }

    // Utility methods for external control
    setLoading(isLoading, loadingText = null) {
        const updates = { isLoading };
        if (loadingText !== null) {
            updates.loadingText = loadingText;
        }
        super.updateProps(updates);
    }

    setPurchased(isPurchased) {
        super.updateProps({ isPurchased });
    }

    setSelected(isSelected) {
        super.updateProps({ isSelected });
    }

    setCanPurchase(canPurchase) {
        super.updateProps({ canPurchase });
    }

    // Debug information
    getDebugInfo() {
        return {
            entityId: this.props.entity?.id,
            entityType: this.props.entityType,
            isPurchased: this.props.isPurchased,
            isSelected: this.props.isSelected,
            isLoading: this.props.isLoading,
            canPurchase: this.props.canPurchase,
            canRemove: this.props.canRemove
        };
    }
}