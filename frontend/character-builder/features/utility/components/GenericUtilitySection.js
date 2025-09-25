import { RenderUtils } from '../../../shared/utils/RenderUtils.js';
import { UtilitySystem } from '../../../systems/UtilitySystem.js';
import { CustomUtilityForm } from './CustomUtilityForm.js';

export class GenericUtilitySection {
    constructor(builder) {
        this.builder = builder;
        this.customUtilityForm = new CustomUtilityForm(builder);
    }

    render(character, categoryKey, categoryData) {
        const title = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        const purchasedItems = character.utilityPurchases[categoryKey] || [];
        let allItems = [];
        Object.values(categoryData).forEach(tier => {
            const itemsToAdd = tier.features || tier.senses || tier.movement || tier.descriptors;
            if (Array.isArray(itemsToAdd)) {
                allItems = allItems.concat(itemsToAdd.map(item => ({ ...item, cost: tier.cost ?? item.cost })));
            }
        });
        return `
            <div class="utility-generic-section">
                <h3>${title}</h3>
                ${RenderUtils.renderGrid(
                    [...allItems, { isCustomCreator: true, categoryKey }],
                    (item) => {
                        if (item.isCustomCreator) {
                            return this.customUtilityForm.render(item.categoryKey);
                        }
                        const isPurchased = purchasedItems.some(p => p.id === item.id);
                        return RenderUtils.renderCard({
                            title: item.name, cost: item.cost, description: item.description,
                            status: isPurchased ? 'purchased' : 'available',
                            clickable: !isPurchased, disabled: isPurchased,
                            dataAttributes: isPurchased ? {} : { 
                                action: `purchase-item`, 
                                'category-key': categoryKey, 
                                'item-id': item.id,
                                purchase: 'utility',
                                cost: item.cost
                            }
                        }, { cardClass: `${categoryKey.slice(0, -1)}-card`, showStatus: false });
                    }, { gridContainerClass: 'grid-layout utility-item-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                )}
            </div>`;
    }
}