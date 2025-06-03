// rulebook/character-builder/ui/components/SimpleBoonSection.js
import { SimpleBoonsSystem } from '../../systems/SimpleBoonsSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class SimpleBoonSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const simpleBoons = SimpleBoonsSystem.getAvailableBoons();
        const purchasedBoons = character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type); // Assuming 'simple' or undefined type means simple

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Simple Boons</h3>
                <p class="category-description">
                    Permanent abilities that change how your character functions.
                    Simple boons have fixed costs and immediate effects.
                </p>

                ${RenderUtils.renderPurchasedList(
                    purchasedBoons,
                    (boon, index) => this.renderPurchasedBoon(boon, index),
                    { title: `Purchased Simple Boons (${purchasedBoons.length})`, emptyMessage: 'No simple boons purchased' }
                )}

                <div class="available-items">
                    <h4>Available Simple Boons</h4>
                    ${RenderUtils.renderGrid(
                        simpleBoons,
                        (boon) => this.renderSimpleBoonOption(boon, character, pointInfo),
                        { gridContainerClass: 'grid-layout boon-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                    )}
                </div>
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

    renderSimpleBoonOption(boon, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id && (b.type === 'simple' || !b.type));
        const canAfford = pointInfo.remaining >= boon.cost;

        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        else if (!canAfford) status = 'unaffordable';
        
        return RenderUtils.renderCard({
            title: boon.name,
            cost: boon.cost,
            description: boon.description,
            status: status,
            clickable: !alreadyPurchased && canAfford,
            disabled: alreadyPurchased || !canAfford,
            dataAttributes: { 'boon-id': boon.id, action: 'purchase-simple-boon' },
            additionalContent: `<div class="item-category">Category: ${boon.category}</div>`
        }, { cardClass: 'boon-card simple', showStatus: true });
    }

    setupEventListeners() {
        // Handled by MainPoolTab's EventManager using data-action
    }

    purchaseSimpleBoon(boonId) {
        const character = this.builder.currentCharacter;
        try {
            SimpleBoonsSystem.purchaseBoon(character, boonId);
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased simple boon!`, 'success');
        } catch (error) {
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    removeBoon(boonIdToRemove) { // Changed to use boonId for removal
        const character = this.builder.currentCharacter;
        try {
            const boon = character.mainPoolPurchases.boons.find(b => b.boonId === boonIdToRemove && (b.type === 'simple' || !b.type));
            if (boon) {
                SimpleBoonsSystem.removeBoon(character, boon.boonId); // System uses boonId
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