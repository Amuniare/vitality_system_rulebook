// modernApp/components/PurchaseCard.js
import { Component } from '../core/Component.js';
import { UniversalCard } from './UniversalCard.js';
import { Logger } from '../utils/Logger.js';

export class PurchaseCard extends Component {
    static propSchema = {
        entity: { type: 'object', required: true },
        entityType: { type: 'string', required: true },
        isPurchased: { type: 'boolean', default: false },
        isAffordable: { type: 'boolean', default: true },
        areRequirementsMet: { type: 'boolean', default: true },
        unmetRequirements: { type: 'array', default: () => [] },
        onPurchase: { type: 'function', required: true },
        onRemove: { type: 'function', required: true }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        this.handleClick = this.handleClick.bind(this);
    }

    init() {
        // No direct state access or event listeners here
        Logger.debug(`[PurchaseCard] Initialized for entity: ${this.props.entity.name}`);
    }

    render() {
        const context = {
            isPurchased: this.props.isPurchased,
            isAffordable: this.props.isAffordable,
            areRequirementsMet: this.props.areRequirementsMet,
            unmetRequirements: this.props.unmetRequirements,
            entityType: this.props.entityType
        };

        this.container.innerHTML = UniversalCard.render(this.props.entity, context);
        
        // Use event delegation from parent instead of direct listeners
        // Parent component handles clicks via data attributes
    }

    handleClick(action) {
        if (action === 'purchase' && this.props.onPurchase) {
            this.props.onPurchase(this.props.entity.id, this.props.entityType);
        } else if (action === 'remove' && this.props.onRemove) {
            this.props.onRemove(this.props.entity.id, this.props.entityType);
        }
    }
}