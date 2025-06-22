// BoonPurchaseSection.js - Boon purchase UI component
import { UniqueAbilitySystem } from '../../../systems/UniqueAbilitySystem.js';

export class BoonPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const boons = UniqueAbilitySystem.getAvailableBoons();
        const complexBoons = UniqueAbilitySystem.getComplexUniqueAbilities();
        const purchasedBoons = character.mainPoolPurchases.boons;

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Boons (Variable Cost)</h3>
                <p class="category-description">
                    Permanent abilities that change how your character functions.
                    Boons have fixed costs, complex boons have upgrades.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Boons (${purchasedBoons.length})</h4>
                    ${purchasedBoons.length > 0 ? `
                        <div class="item-list">
                            ${purchasedBoons.map((boon, index) => this.renderPurchasedBoon(boon, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No boons purchased</p>'}
                </div>
                
                <div class="boon-categories">
                    <div class="simple-boons">
                        <h4>Boons</h4>
                        <div class="boon-grid">
                            ${boons.map(boon => this.renderBoonOption(boon, character, pointInfo)).join('')}
                        </div>
                    </div>
                    
                    <div class="complex-boons">
                        <h4>Complex Boons</h4>
                        <div class="boon-grid">
                            ${complexBoons.map(boon => this.renderComplexBoonOption(boon, character, pointInfo)).join('')}
                        </div>
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

    renderBoonOption(boon, character, pointInfo) {
        const canAfford = pointInfo.remaining >= boon.cost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id);
        const canPurchase = canAfford && !alreadyPurchased;

        return `
            <div class="boon-card simple ${canPurchase ? 'clickable' : 'disabled'}" 
                 data-boon-id="${boon.id}" 
                 data-boon-type="simple">
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

    renderComplexBoonOption(boon, character, pointInfo) {
        const canAfford = pointInfo.remaining >= boon.baseCost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === boon.id);
        const canPurchase = canAfford && !alreadyPurchased;

        return `
            <div class="boon-card complex ${canPurchase ? 'clickable' : 'disabled'}" 
                 data-boon-id="${boon.id}" 
                 data-boon-type="complex">
                <h5>${boon.name}</h5>
                <p class="item-cost"><strong>Base Cost: ${boon.baseCost}p</strong></p>
                <p class="item-description">${boon.description}</p>
                <div class="item-category">Category: ${boon.category}</div>
                ${boon.upgrades ? `<div class="upgrade-count">${boon.upgrades.length} upgrades available</div>` : ''}
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
                this.purchaseBoon(boonId);
            });
        });

        // Complex boon cards (for now, just purchase base)
        document.querySelectorAll('.boon-card.complex.clickable').forEach(card => {
            card.addEventListener('click', () => {
                const boonId = card.dataset.boonId;
                this.purchaseComplexBoonBase(boonId);
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

    purchaseBoon(boonId) {
        const character = this.builder.currentCharacter;
        
        try {
            // Use system to handle purchase
            UniqueAbilitySystem.purchaseBoon(character, boonId);
            
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased boon!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    purchaseComplexBoonBase(boonId) {
        const character = this.builder.currentCharacter;
        
        try {
            // For now, just purchase base complex boon without upgrades
            UniqueAbilitySystem.purchaseBoon(character, boonId, []);
            
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased complex boon!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase boon: ${error.message}`, 'error');
        }
    }

    removeBoon(index) {
        const character = this.builder.currentCharacter;
        
        try {
            if (index >= 0 && index < character.mainPoolPurchases.boons.length) {
                const boon = character.mainPoolPurchases.boons[index];
                character.mainPoolPurchases.boons.splice(index, 1);
                
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${boon.name}`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove boon: ${error.message}`, 'error');
        }
    }
}