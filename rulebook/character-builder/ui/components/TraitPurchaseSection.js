// TraitPurchaseSection.js - Trait purchase UI component
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { GameConstants } from '../../core/GameConstants.js';

export class TraitPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const availableTraits = TraitFlawSystem.getAvailableTraits();
        const purchasedTraits = character.mainPoolPurchases.traits;

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Traits (${GameConstants.TRAIT_COST}p each)</h3>
                <p class="category-description">
                    Conditional bonuses activated when specific circumstances are met.
                    Each trait provides +Tier bonus to 2 stats when conditions are met.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Traits (${purchasedTraits.length})</h4>
                    ${purchasedTraits.length > 0 ? `
                        <div class="item-list">
                            ${purchasedTraits.map((trait, index) => this.renderPurchasedTrait(trait, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No traits purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Traits</h4>
                    <div class="trait-grid">
                        ${availableTraits.map(trait => this.renderTraitOption(trait, character, pointInfo)).join('')}
                    </div>
                </div>
            </div>
        `;

        return containerHtml;
    }

    renderPurchasedTrait(trait, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${trait.name}</span>
                    <span class="item-details">${GameConstants.TRAIT_COST}p - ${trait.condition || trait.description}</span>
                </div>
                <button class="btn-danger btn-small remove-trait" data-index="${index}">Remove</button>
            </div>
        `;
    }

    renderTraitOption(trait, character, pointInfo) {
        const canAfford = pointInfo.remaining >= GameConstants.TRAIT_COST;
        const alreadyPurchased = character.mainPoolPurchases.traits.some(t => t.traitId === trait.id);
        const canPurchase = canAfford && !alreadyPurchased;

        return `
            <div class="trait-card ${canPurchase ? 'clickable' : 'disabled'}" data-trait-id="${trait.id}">
                <h5>${trait.name}</h5>
                <p class="item-cost"><strong>Cost: ${GameConstants.TRAIT_COST}p</strong></p>
                <p class="item-description">${trait.description}</p>
                <div class="trait-tier">Tier ${trait.tier} (${trait.bonusCount} stat bonuses)</div>
                ${alreadyPurchased ? 
                    '<div class="status-badge">Already Purchased</div>' : 
                    canAfford ? '<div class="status-badge success">Click to Purchase</div>' :
                    '<div class="status-badge error">Cannot Afford</div>'
                }
            </div>
        `;
    }

    setupEventListeners() {
        // Trait card clicks
        document.querySelectorAll('.trait-card.clickable').forEach(card => {
            card.addEventListener('click', () => {
                const traitId = card.dataset.traitId;
                this.purchaseTrait(traitId);
            });
        });

        // Remove trait buttons
        document.querySelectorAll('.remove-trait').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeTrait(index);
            });
        });
    }

    purchaseTrait(traitId) {
        const character = this.builder.currentCharacter;
        
        try {
            // Use default stat bonuses (accuracy, damage) for simplicity
            const defaultStats = ['accuracy', 'damage'];
            
            // Use system to handle purchase
            TraitFlawSystem.purchaseTrait(character, traitId, defaultStats);
            
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased trait for ${GameConstants.TRAIT_COST}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
        }
    }

    removeTrait(index) {
        const character = this.builder.currentCharacter;
        
        try {
            if (index >= 0 && index < character.mainPoolPurchases.traits.length) {
                const trait = character.mainPoolPurchases.traits[index];
                character.mainPoolPurchases.traits.splice(index, 1);
                
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${trait.name}`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove trait: ${error.message}`, 'error');
        }
    }
}