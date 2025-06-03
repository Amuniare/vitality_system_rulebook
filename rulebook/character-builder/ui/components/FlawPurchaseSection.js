// FlawPurchaseSection.js - Flaw purchase interface with improved formatting
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';

export class FlawPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const flaws = TraitFlawSystem.getAvailableFlaws();
        const statOptions = TraitFlawSystem.getFlawStatOptions();
        const remainingPoints = pointInfo.remaining;

        return `
            <div class="flaw-purchase-section">
                <div class="section-header">
                    <h4>Flaws (Cost 30p Each)</h4>
                    <div class="points-remaining">
                        Remaining Points: <span class="${remainingPoints < 0 ? 'over-budget' : ''}">${remainingPoints}</span>
                    </div>
                </div>
                
                <div class="section-description">
                    <div class="economics-notice">
                        <strong>NEW ECONOMICS:</strong> Flaws now COST 30 points each but provide +Tier bonus to one chosen stat.
                        Each additional bonus to the same stat has stacking penalty (reduces by 1 per stack).
                    </div>
                </div>
                
                <div class="purchased-flaws">
                    <h5>Purchased Flaws (${character.mainPoolPurchases.flaws.length})</h5>
                    ${this.renderPurchasedFlaws(character)}
                </div>
                
                <div class="available-flaws">
                    <h5>Available Flaws</h5>
                    <div class="flaw-grid">
                        ${flaws.map(flaw => this.renderFlawCard(flaw, character, statOptions, remainingPoints)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderPurchasedFlaws(character) {
        if (character.mainPoolPurchases.flaws.length === 0) {
            return '<div class="empty-state">No flaws purchased yet</div>';
        }

        return `
            <div class="purchased-list">
                ${character.mainPoolPurchases.flaws.map((flaw, index) => `
                    <div class="purchased-flaw-item">
                        <div class="purchased-flaw-content">
                            <div class="flaw-name-cost">
                                <span class="flaw-name">${flaw.name}</span>
                                <span class="flaw-cost">-${flaw.cost}p</span>
                            </div>
                            ${flaw.statBonus ? `
                                <div class="stat-bonus-display">
                                    <span class="bonus-label">Bonus:</span>
                                    <span class="bonus-value">+${character.tier} ${flaw.statBonus}</span>
                                </div>
                            ` : ''}
                        </div>
                        <button class="btn-small btn-danger remove-flaw-btn" data-action="remove-flaw" data-index="${index}">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }


    renderFlawCard(flaw, character, statOptions, remainingPoints) {
        const isAlreadyPurchased = character.mainPoolPurchases.flaws.some(f => f.flawId === flaw.id);
        const canAfford = remainingPoints >= flaw.cost;
        const isDisabled = isAlreadyPurchased || !canAfford;
    
        return `
            <div class="flaw-card ${isDisabled ? 'disabled' : 'clickable'}" data-flaw-id="${flaw.id}">
                <div class="flaw-header">
                    <h5 class="flaw-name">${flaw.name}</h5>
                    <span class="flaw-cost ${!canAfford && !isAlreadyPurchased ? 'unaffordable' : ''}">${flaw.cost}p</span>
                </div>
                
                <div class="flaw-description">${flaw.description}</div>
                
                <div class="flaw-restriction">
                    <strong>Restriction:</strong> ${flaw.restriction}
                </div>
                
                ${!isDisabled ? `
                    <div class="flaw-purchase-options">
                        <div class="stat-bonus-selection">
                            <label>Choose stat bonus (+${character.tier}):</label>
                            <select class="stat-bonus-select" data-flaw-id="${flaw.id}">
                                <option value="">Select stat...</option>
                                ${statOptions.map(stat => `
                                    <option value="${stat.id}">${stat.name} - ${stat.description}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button class="btn-primary purchase-flaw-btn" data-flaw-id="${flaw.id}" disabled>
                            Purchase Flaw
                        </button>
                    </div>
                ` : ''}
                
                ${isAlreadyPurchased ? '<div class="already-purchased">✓ Purchased</div>' : ''}
                ${!canAfford && !isAlreadyPurchased ? '<div class="cannot-afford">Insufficient Points</div>' : ''}
            </div>
        `;
    }


    setupEventListeners() {
        // Stat bonus selection enables purchase button
        document.querySelectorAll('.stat-bonus-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const flawId = e.target.dataset.flawId;
                const purchaseBtn = document.querySelector(`.purchase-flaw-btn[data-flaw-id="${flawId}"]`);
                if (purchaseBtn) {
                    purchaseBtn.disabled = !e.target.value;
                    purchaseBtn.classList.toggle('enabled', !!e.target.value);
                }
            });
        });

        // Purchase flaw
        document.querySelectorAll('.purchase-flaw-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const flawId = e.target.dataset.flawId;
                const statSelect = document.querySelector(`.stat-bonus-select[data-flaw-id="${flawId}"]`);
                const statBonus = statSelect?.value;
                
                if (!statBonus) {
                    this.builder.showNotification('Please select a stat bonus', 'error');
                    return;
                }
                
                this.purchaseFlaw(flawId, statBonus);
            });
        });

        // Remove flaw
        document.querySelectorAll('[data-action="remove-flaw"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFlaw(index);
            });
        });
    }

    purchaseFlaw(flawId, statBonus) {
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseFlaw(character, flawId, statBonus);
            this.builder.updateCharacter();
            this.builder.showNotification('Flaw purchased successfully', 'success');
        } catch (error) {
            this.builder.showNotification(error.message, 'error');
        }
    }

    removeFlaw(index) {
        const character = this.builder.currentCharacter;
        const flaw = character.mainPoolPurchases.flaws[index];
        
        if (confirm(`Remove flaw "${flaw.name}"? This will refund ${flaw.cost} points.`)) {
            TraitFlawSystem.removeFlaw(character, index);
            this.builder.updateCharacter();
            this.builder.showNotification('Flaw removed', 'success');
        }
    }
}