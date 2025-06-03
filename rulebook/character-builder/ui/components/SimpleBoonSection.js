// SimpleBoonSection.js - Simple boon purchase interface (split from BoonPurchaseSection)
import { SimpleBoonsSystem } from '../../systems/SimpleBoonsSystem.js';

export class SimpleBoonSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const simpleBoons = SimpleBoonsSystem.getAvailableBoons();
        const purchasedBoons = character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type);

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Simple Boons (Variable Cost)</h3>
                <p class="category-description">
                    Permanent abilities that change how your character functions.
                    Simple boons have fixed costs and immediate effects.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Simple Boons (${purchasedBoons.length})</h4>
                    ${purchasedBoons.length > 0 ? `
                        <div class="item-list">
                            ${purchasedBoons.map((boon, index) => this.renderPurchasedBoon(boon, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No simple boons purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Simple Boons</h4>
                    <div class="boon-grid">
                        ${simpleBoons.map(boon => this.renderSimpleBoonOption(boon, character, pointInfo)).join('')}
                    </div>
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
                <button class="btn-danger btn-small remove-boon" data-index="${index}">Remove</button>
            </div>
        `;
    }

    renderSimpleBoonOption(boon, character, pointInfo) {
        const canAfford = pointInfo.remaining >= boon.cost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id && (b.type === 'simple' || !b.type));
        const canPurchase = canAfford && !alreadyPurchased;

        return `
            <div class="boon-card simple ${canPurchase ? 'clickable' : 'disabled'}" 
                 data-boon-id="${boon.id}">
                <h5>${boon.name}</h5>
                <p class="item-cost"><strong>Cost: ${boon.cost}p</strong></p>
                <p class="item-description">${boon.description}</p>
                <div class="item-category">Category: ${boon.category}</div>
                ${alreadyPurchased ? 
                    '<div class="status-badge">Already Purchased</div>' : 
                    canAfford ? '<div class="status-badge success">Click to Purchase</div>' :
                    '<div class="status-badge error">Cannot Afford</div>'
                }
            </div>
        `;
    }

    setupEventListeners() {
        // Simple boon cards
        document.querySelectorAll('.boon-card.simple.clickable').forEach(card => {
            card.addEventListener('click', () => {
                const boonId = card.dataset.boonId;
                this.purchaseSimpleBoon(boonId);
            });
        });

        // Remove boon buttons
        document.querySelectorAll('.remove-boon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeBoon(index);
            });
        });
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

    removeBoon(index) {
        const character = this.builder.currentCharacter;
        const simpleBoons = character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type);
        
        try {
            if (index >= 0 && index < simpleBoons.length) {
                const boon = simpleBoons[index];
                SimpleBoonsSystem.removeBoon(character, boon.boonId);
                
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${boon.name}`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove boon: ${error.message}`, 'error');
        }
    }
}