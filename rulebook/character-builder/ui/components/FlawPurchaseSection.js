// rulebook/character-builder/ui/components/FlawPurchaseSection.js
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { EventManager } from '../shared/EventManager.js'; // Assuming used by MainPoolTab
import { RenderUtils } from '../shared/RenderUtils.js';

export class FlawPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const flaws = TraitFlawSystem.getAvailableFlaws();
        const statOptions = TraitFlawSystem.getFlawStatOptions();

        const containerHtml = `
            <div class="flaw-purchase-section-content">
                ${this.renderSectionHeader(pointInfo)}
                ${this.renderEconomicsNotice()}

                ${RenderUtils.renderPurchasedList(
                    character.mainPoolPurchases.flaws,
                    (flaw, index) => this.renderPurchasedFlaw(flaw, index, character),
                    { title: `Purchased Flaws (${character.mainPoolPurchases.flaws.length})`, emptyMessage: 'No flaws purchased yet' }
                )}

                <div class="available-flaws">
                    <h5>Available Flaws</h5>
                    ${RenderUtils.renderGrid(
                        flaws,
                        (flaw) => this.renderFlawCard(flaw, character, statOptions, pointInfo),
                        { gridContainerClass: 'grid-layout flaw-grid', gridSpecificClass: 'grid-columns-auto-fit-320' }
                    )}
                </div>
            </div>
        `;
        return containerHtml;
    }

    renderSectionHeader(pointInfo) {
        // MainPoolTab's PointPoolDisplay will show overall points.
        // This header can be simpler or removed if redundant.
        return `
            <div class="section-header">
                <h4>Flaws (Cost ${TraitFlawSystem.getAvailableFlaws()[0]?.cost || 30}p Each)</h4>
                <div class="points-remaining">
                   Main Pool: ${pointInfo.remaining}p
                   ${pointInfo.remaining < (TraitFlawSystem.getAvailableFlaws()[0]?.cost || 30) && pointInfo.remaining >=0 ? '<span class="warning">(Low)</span>' : ''}
                   ${pointInfo.remaining < 0 ? '<span class="error">(Over Budget!)</span>' : ''}
                </div>
            </div>
        `;
    }

    renderEconomicsNotice() {
        return `
            <div class="economics-notice">
                Flaws cost ${TraitFlawSystem.getAvailableFlaws()[0]?.cost || 30} points each but provide +Tier bonus to one chosen stat.
            </div>
        `;
    }

    renderPurchasedFlaw(flaw, index, character) {
        return `
            <div class="purchased-item purchased-flaw-item">
                <div class="item-info">
                    <span class="item-name">${flaw.name}</span>
                    ${flaw.statBonus ? `
                        <span class="stat-bonus-display">
                            <span class="bonus-label">Bonus:</span>
                            <span class="bonus-value">+${character.tier} ${this.getStatName(flaw.statBonus)}</span>
                        </span>
                    ` : ''}
                    <span class="item-cost flaw-item-cost">-${flaw.cost}p</span>
                </div>
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    dataAttributes: { action: 'remove-flaw', index: index }
                })}
            </div>
        `;
    }
    getStatName(statId) {
        const opt = TraitFlawSystem.getFlawStatOptions().find(s => s.id === statId);
        return opt ? opt.name : statId;
    }


    renderFlawCard(flaw, character, statOptions, pointInfo) {
        const isAlreadyPurchased = character.mainPoolPurchases.flaws.some(f => f.flawId === flaw.id);
        const canAfford = pointInfo.remaining >= flaw.cost;

        let status = 'available';
        if (isAlreadyPurchased) status = 'purchased';
        else if (!canAfford) status = 'unaffordable';
        
        let additionalContent = '';

        if (!isAlreadyPurchased && canAfford) {
            additionalContent += `
                <div class="flaw-purchase-options">
                    <div class="stat-bonus-selection form-group">
                        <label class="stat-bonus-label" for="stat-select-${flaw.id}">Choose stat bonus (+${character.tier}):</label>
                        ${RenderUtils.renderSelect({
                            id: `stat-select-${flaw.id}`,
                            options: statOptions.map(opt => ({ value: opt.id, label: opt.name })),
                            placeholder: 'Select stat bonus...',
                            dataAttributes: { 'flaw-id': flaw.id }, // For JS to find related select
                            classes: ['stat-bonus-select']
                        })}
                    </div>
                    ${RenderUtils.renderButton({
                        text: `Purchase Flaw (-${flaw.cost}p)`,
                        variant: 'primary',
                        disabled: true, // Enabled by JS when stat is selected
                        dataAttributes: { action: 'purchase-flaw', 'flaw-id': flaw.id },
                        classes: ['purchase-flaw-btn']
                    })}
                </div>
            `;
        }

        return RenderUtils.renderCard({
            title: flaw.name,
            cost: flaw.cost, // Show cost in header
            description: flaw.description,
            status: status, // This will be used by RenderUtils to display a status indicator
            clickable: false, // Card itself is not clickable, button inside is
            disabled: isAlreadyPurchased || !canAfford,
            dataAttributes: { 'flaw-id': flaw.id }, // For main card div
            additionalContent: additionalContent
        }, { cardClass: 'flaw-card', showCost: true, showStatus: !(!isAlreadyPurchased && canAfford) });
    }

    setupEventListeners() {
        // Delegate to MainPoolTab or CharacterBuilder
        // Specific internal listeners for stat-select enabling purchase button:
        const container = document.querySelector('.flaw-purchase-section-content'); // More specific root
        if (container) {
            container.addEventListener('change', (e) => {
                if (e.target.matches('.stat-bonus-select')) {
                    const flawId = e.target.dataset.flawId;
                    const purchaseBtn = container.querySelector(`.purchase-flaw-btn[data-flaw-id="${flawId}"]`);
                    if (purchaseBtn) {
                        purchaseBtn.disabled = !e.target.value;
                    }
                }
            });
        }
    }


    handleFlawPurchase(flawId) { // Called by MainPoolTab
        const statSelect = document.querySelector(`#stat-select-${flawId}`);
        const statBonus = statSelect ? statSelect.value : null;

        if (!statBonus) {
            this.builder.showNotification('Please select a stat bonus for the flaw.', 'error');
            return;
        }

        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseFlaw(character, flawId, statBonus);
            this.builder.updateCharacter(); // Triggers re-render of MainPoolTab
            this.builder.showNotification('Flaw purchased successfully!', 'success');
        } catch (error) {
            this.builder.showNotification(`Failed to purchase flaw: ${error.message}`, 'error');
        }
    }

    handleFlawRemoval(index) { // Called by MainPoolTab
        const character = this.builder.currentCharacter;
        const flaw = character.mainPoolPurchases.flaws[index];

        if (confirm(`Remove flaw "${flaw.name}"? This will adjust your points.`)) {
            try {
                TraitFlawSystem.removeFlaw(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Flaw removed successfully.', 'success');
            } catch (error) {
                this.builder.showNotification(`Failed to remove flaw: ${error.message}`, 'error');
            }
        }
    }
}