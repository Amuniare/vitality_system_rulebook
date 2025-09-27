// frontend/character-builder/features/main-pool/components/BoonSection.js
import { BoonsSystem } from '../../../systems/BoonsSystem.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class BoonSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const boons = BoonsSystem.getAvailableBoons();
        const purchasedBoons = character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type); // Assuming 'simple' or undefined type means simple

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Available Boons</h3>
                <p class="category-description">
                    Permanent abilities that change how your character functions.
                    Boons have fixed costs and immediate effects.
                </p>

                ${RenderUtils.renderGrid(
                    boons,
                    (boon) => this.renderBoonOption(boon, character, pointInfo),
                    { gridContainerClass: 'grid-layout boon-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                )}
            </div>
        `;
        return containerHtml;
    }

    renderPurchasedBoon(boon, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${boon.name}</span>
                    <span class="item-details">${boon.cost}p - ${boon.category}</span>
                </div>
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    classes: ['remove-boon'], // Keep specific class for JS if needed
                    dataAttributes: { index: index, 'boon-id': boon.boonId, action: 'remove-simple-boon' } // Add boonId for removal logic
                })}
            </div>
        `;
    }

    renderBoonOption(boon, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id && (b.type === 'simple' || !b.type));

        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        
        return RenderUtils.renderCard({
            title: boon.name,
            cost: boon.cost,
            description: boon.description,
            status: status,
            clickable: !alreadyPurchased,
            disabled: alreadyPurchased,
            dataAttributes: { 
                'boon-id': boon.id, 
                action: 'purchase-simple-boon',
                purchase: 'boon',
                cost: boon.cost 
            },
            additionalContent: `<div class="item-category">Category: ${boon.category}</div>`
        }, { cardClass: 'boon-card simple', showStatus: alreadyPurchased });
    }

    setupEventListeners() {
        // Handled by MainPoolTab's EventManager using data-action
    }

    purchaseBoon(boonId) {
        // 1. Get current point balance
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.mainPool;
        
        // 2. Get the cost of the item
        const boon = BoonsSystem.getAvailableBoons().find(b => b.id === boonId);
        const itemCost = boon ? boon.cost : 0;
        
        // 3. Check if this purchase will go over budget
        if (itemCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            BoonsSystem.purchaseBoon(character, boonId);
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased simple boon!`, 'success');
        } catch (error) {
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
        }
    }

    removeBoon(boonIdToRemove) { // Changed to use boonId for removal
        const character = this.builder.currentCharacter;
        try {
            const boon = character.mainPoolPurchases.boons.find(b => b.boonId === boonIdToRemove && (b.type === 'simple' || !b.type));
            if (boon) {
                BoonsSystem.removeBoon(character, boon.boonId); // System uses boonId
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${boon.name}`, 'info');
            } else {
                 this.builder.showNotification(`Could not find boon to remove.`, 'error');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove boon: ${error.message}`, 'error');
        }
    }
}