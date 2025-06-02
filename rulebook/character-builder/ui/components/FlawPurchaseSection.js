// FlawPurchaseSection.js - Flaw purchase interface with proper economics
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';

export class FlawPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const character = this.builder.currentCharacter;
        if (!character) return '';

        const flaws = TraitFlawSystem.getAvailableFlaws();
        const statOptions = TraitFlawSystem.getFlawStatOptions();
        const mainPoolAvailable = TraitFlawSystem.calculateMainPoolAvailable(character);
        const mainPoolSpent = TraitFlawSystem.calculateMainPoolSpent(character);
        const remainingPoints = mainPoolAvailable - mainPoolSpent;

        return `
            <div class="flaw-purchase-section">
                <div class="section-header">
                    <h4>Flaws</h4>
                    <div class="points-remaining">
                        Remaining Points: <span class="${remainingPoints < 0 ? 'over-budget' : ''}">${remainingPoints}</span>
                    </div>
                </div>
                
                <div class="section-description">
                    Flaws are permanent disadvantages that COST 30 points each but provide +Tier bonus to one stat.
                    Each additional bonus to the same stat reduces by 1 (stacking penalty).
                </div>
                
                <div class="purchased-flaws">
                    <h5>Purchased Flaws (${character.mainPoolPurchases.flaws.length})</h5>
                    ${this.renderPurchasedFlaws(character)}
                </div>
                
                <div class="available-flaws">
                    <h5>Available Flaws</h5>
                    <div class="flaw-list">
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
                    <div class="purchased-flaw-card">
                        <div class="flaw-info">
                            <span class="flaw-name">${flaw.name}</span>
                            <span class="flaw-cost">-${flaw.cost}p</span>
                            ${flaw.statBonus ? `<span class="stat-bonus">+${character.tier} ${flaw.statBonus}</span>` : ''}
                        </div>
                        <button class="btn-small btn-danger" data-action="remove-flaw" data-index="${index}">Remove</button>
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
            <div class="flaw-card ${isDisabled ? 'disabled' : ''}" data-flaw-id="${flaw.id}">
                <div class="flaw-header">
                    <span class="flaw-name">${flaw.name}</span>
                    <span class="flaw-cost ${!canAfford ? 'unaffordable' : ''}">-${flaw.cost}p</span>
                </div>
                <div class="flaw-description">${flaw.description}</div>
                <div class="flaw-restriction">
                    <strong>Restriction:</strong> ${flaw.restriction}
                </div>
                
                ${!isDisabled ? `
                    <div class="flaw-purchase-options">
                        <div class="stat-bonus-selection">
                            <label>Choose stat bonus (+Tier):</label>
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
                
                ${isAlreadyPurchased ? '<div class="already-purchased">Already Purchased</div>' : ''}
                ${!canAfford && !isAlreadyPurchased ? '<div class="cannot-afford">Insufficient Points</div>' : ''}
            </div>
        `;
    }

    setupEventListeners() {
        // Stat bonus selection
        document.querySelectorAll('.stat-bonus-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const flawId = e.target.dataset.flawId;
                const purchaseBtn = document.querySelector(`[data-action="purchase-flaw"][data-flaw-id="${flawId}"]`);
                if (purchaseBtn) {
                    purchaseBtn.disabled = !e.target.value;
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