// FlawPurchaseSection.js - Flaw purchase UI component
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { GameConstants } from '../../core/GameConstants.js';

export class FlawPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const availableFlaws = TraitFlawSystem.getAvailableFlaws();
        const purchasedFlaws = character.mainPoolPurchases.flaws;

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Flaws (Give +${GameConstants.FLAW_BONUS}p each)</h3>
                <p class="category-description">
                    Take disadvantages to gain extra main pool points and +Tier bonus to one stat.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Flaws (${purchasedFlaws.length})</h4>
                    ${purchasedFlaws.length > 0 ? `
                        <div class="item-list">
                            ${purchasedFlaws.map((flaw, index) => this.renderPurchasedFlaw(flaw, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No flaws purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Flaws</h4>
                    <div class="flaw-grid">
                        ${availableFlaws.map(flaw => this.renderFlawOption(flaw, character, pointInfo)).join('')}
                    </div>
                </div>
            </div>
        `;

        return containerHtml;
    }

    renderPurchasedFlaw(flaw, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${flaw.name}</span>
                    <span class="item-bonus">+${GameConstants.FLAW_BONUS}p, +Tier to ${flaw.statBonus}</span>
                </div>
                <button class="btn-danger btn-small remove-flaw" data-index="${index}">Remove</button>
            </div>
        `;
    }

    renderFlawOption(flaw, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.flaws.some(f => f.flawId === flaw.id);

        return `
            <div class="flaw-card ${alreadyPurchased ? 'disabled' : 'clickable'}" data-flaw-id="${flaw.id}">
                <h5>${flaw.name}</h5>
                <p class="item-cost"><strong>Gives: +${GameConstants.FLAW_BONUS}p</strong></p>
                <p class="item-description">${flaw.description}</p>
                <div class="item-effect">Effect: ${flaw.effect}</div>
                ${alreadyPurchased ? 
                    '<div class="status-badge">Already Purchased</div>' : 
                    '<div class="status-badge success">Click to Purchase</div>'
                }
            </div>
        `;
    }

    setupEventListeners() {
        // Flaw card clicks
        document.querySelectorAll('.flaw-card.clickable').forEach(card => {
            card.addEventListener('click', () => {
                const flawId = card.dataset.flawId;
                this.purchaseFlaw(flawId);
            });
        });

        // Remove flaw buttons
        document.querySelectorAll('.remove-flaw').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeFlaw(index);
            });
        });
    }

    purchaseFlaw(flawId) {
        const character = this.builder.currentCharacter;
        
        try {
            // Simple stat selection via prompt
            const statTargets = ['accuracy', 'damage', 'conditions', 'avoidance', 'durability'];
            const choice = prompt(`Choose stat bonus for this flaw:\n${statTargets.map((s, i) => `${i+1}. ${s}`).join('\n')}`);
            
            if (!choice) return; // User cancelled
            
            const statIndex = parseInt(choice) - 1;
            if (statIndex < 0 || statIndex >= statTargets.length) {
                alert('Invalid selection');
                return;
            }

            const selectedStat = statTargets[statIndex];
            
            // Use system to handle purchase
            TraitFlawSystem.purchaseFlaw(character, flawId, selectedStat);
            
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased flaw for +${GameConstants.FLAW_BONUS}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase flaw: ${error.message}`, 'error');
        }
    }

    removeFlaw(index) {
        const character = this.builder.currentCharacter;
        
        try {
            if (index >= 0 && index < character.mainPoolPurchases.flaws.length) {
                const flaw = character.mainPoolPurchases.flaws[index];
                character.mainPoolPurchases.flaws.splice(index, 1);
                
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${flaw.name}`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove flaw: ${error.message}`, 'error');
        }
    }
}