// FlawPurchaseSection.js - REFACTORED to use EventManager and RenderUtils
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class FlawPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const flaws = TraitFlawSystem.getAvailableFlaws();
        const statOptions = TraitFlawSystem.getFlawStatOptions();

        const containerHtml = `
            <div class="flaw-purchase-section">
                ${this.renderSectionHeader(pointInfo)}
                ${this.renderEconomicsNotice()}
                ${RenderUtils.renderPurchasedList(
                    character.mainPoolPurchases.flaws,
                    (flaw, index) => this.renderPurchasedFlaw(flaw, index, character),
                    { title: 'Purchased Flaws', emptyMessage: 'No flaws purchased yet' }
                )}
                ${this.renderAvailableFlaws(flaws, character, statOptions, pointInfo)}
            </div>
        `;

        return containerHtml;
    }

    renderSectionHeader(pointInfo) {
        return `
            <div class="section-header">
                <h4>Flaws (Cost 30p Each)</h4>
                ${RenderUtils.renderPointDisplay(
                    pointInfo.spent, 
                    pointInfo.available, 
                    'Main Pool Points',
                    { showRemaining: true }
                )}
            </div>
        `;
    }

    renderEconomicsNotice() {
        return `
            <div class="economics-notice">
                Flaws cost 30 points each but provide +Tier bonus to one chosen stat.
            </div>
        `;
    }

    renderPurchasedFlaw(flaw, index, character) {
        return `
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
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    classes: ['btn-small'],
                    dataAttributes: { action: 'remove-flaw', index: index }
                })}
            </div>
        `;
    }

    renderAvailableFlaws(flaws, character, statOptions, pointInfo) {
        return `
            <div class="available-flaws">
                <h5>Available Flaws</h5>
                ${RenderUtils.renderGrid(
                    flaws,
                    (flaw) => this.renderFlawCard(flaw, character, statOptions, pointInfo),
                    { gridClass: 'flaw-grid', emptyMessage: 'No flaws available' }
                )}
            </div>
        `;
    }

    renderFlawCard(flaw, character, statOptions, pointInfo) {
        const isAlreadyPurchased = character.mainPoolPurchases.flaws.some(f => f.flawId === flaw.id);
        const canAfford = pointInfo.remaining >= flaw.cost;
        const isDisabled = isAlreadyPurchased || !canAfford;

        let status = 'available';
        if (isAlreadyPurchased) status = 'purchased';
        else if (!canAfford) status = 'unaffordable';

        return RenderUtils.renderCard({
            title: flaw.name,
            cost: flaw.cost,
            description: flaw.description,
            status: status,
            clickable: false,
            disabled: isDisabled,
            dataAttributes: { flawId: flaw.id },
            additionalContent: isDisabled ? '' : this.renderFlawPurchaseOptions(flaw, statOptions)
        }, { cardClass: 'flaw-card improved' });
    }

    renderFlawPurchaseOptions(flaw, statOptions) {
        return `
            <div class="flaw-purchase-section">
                <div class="stat-bonus-row">
                    <label class="stat-bonus-label">Choose stat bonus:</label>
                    ${RenderUtils.renderSelect({
                        id: `stat-select-${flaw.id}`,
                        options: statOptions.map(opt => ({ value: opt.id, label: opt.name })),
                        placeholder: 'Select stat...',
                        dataAttributes: { flawId: flaw.id },
                        classes: ['stat-bonus-select']
                    })}
                </div>
                <div class="purchase-button-row">
                    ${RenderUtils.renderButton({
                        text: 'Purchase Flaw',
                        variant: 'primary',
                        disabled: true,
                        dataAttributes: { action: 'purchase-flaw', flawId: flaw.id },
                        classes: ['purchase-flaw-btn']
                    })}
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const container = document.querySelector('.flaw-purchase-section');
        if (!container) {
            console.error('Flaw purchase section container not found');
            return;
        }

        EventManager.setupStandardListeners(container, {
            changeHandlers: {
                '.stat-bonus-select': this.handleStatBonusChange.bind(this)
            },
            clickHandlers: {
                '.purchase-flaw-btn': this.handleFlawPurchase.bind(this),
                '[data-action="remove-flaw"]': this.handleFlawRemoval.bind(this)
            }
        });
    }

    handleStatBonusChange(e, element) {
        const flawId = element.dataset.flawId;
        const purchaseBtn = document.querySelector(`[data-flaw-id="${flawId}"].purchase-flaw-btn`);
        
        if (purchaseBtn) {
            purchaseBtn.disabled = !element.value;
            purchaseBtn.classList.toggle('enabled', !!element.value);
        }
    }

    handleFlawPurchase(e, element) {
        const flawId = element.dataset.flawId;
        const statSelect = document.querySelector(`[data-flaw-id="${flawId}"].stat-bonus-select`);
        const statBonus = statSelect?.value;
        
        if (!statBonus) {
            this.builder.showNotification('Please select a stat bonus', 'error');
            return;
        }
        
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseFlaw(character, flawId, statBonus);
            this.builder.updateCharacter();
            this.builder.showNotification('Flaw purchased successfully', 'success');
        } catch (error) {
            console.error('Failed to purchase flaw:', error);
            this.builder.showNotification(error.message, 'error');
        }
    }

    handleFlawRemoval(e, element) {
        const index = parseInt(element.dataset.index);
        const character = this.builder.currentCharacter;
        const flaw = character.mainPoolPurchases.flaws[index];
        
        if (confirm(`Remove flaw "${flaw.name}"? This will refund ${flaw.cost} points.`)) {
            try {
                TraitFlawSystem.removeFlaw(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Flaw removed', 'success');
            } catch (error) {
                console.error('Failed to remove flaw:', error);
                this.builder.showNotification('Failed to remove flaw', 'error');
            }
        }
    }
}