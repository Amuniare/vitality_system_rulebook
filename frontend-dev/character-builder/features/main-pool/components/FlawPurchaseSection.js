// frontend/character-builder/features/main-pool/components/FlawPurchaseSection.js
import { TraitFlawSystem } from '../../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js';
import { EventManager } from '../../../shared/utils/EventManager.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class FlawPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const flaws = TraitFlawSystem.getAvailableFlaws();
        const statOptions = TraitFlawSystem.getFlawStatOptions();

        const containerHtml = `
            <div class="passive-bonus-purchase-section-content">
                ${this.renderSectionHeader(pointInfo)}
                ${this.renderEconomicsNotice()}

                <div class="available-passive-bonuses">
                    <h5>Available Passive Bonuses</h5>
                    ${RenderUtils.renderGrid(
                        flaws,
                        (flaw) => this.renderFlawCard(flaw, character, statOptions, pointInfo),
                        { gridContainerClass: 'grid-layout passive-bonus-grid', gridSpecificClass: 'grid-columns-auto-fit-320' }
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
                <h4>Passive Bonuses (Cost ${TraitFlawSystem.getAvailableFlaws()[0]?.cost || 1}p Each)</h4>
                <div class="points-remaining">
                   Main Pool: ${pointInfo.remaining}p
                   ${pointInfo.remaining < (TraitFlawSystem.getAvailableFlaws()[0]?.cost || 1) && pointInfo.remaining >=0 ? '<span class="warning">(Low)</span>' : ''}
                   ${pointInfo.remaining < 0 ? '<span class="error">(Over Budget!)</span>' : ''}
                </div>
            </div>
        `;
    }

    renderEconomicsNotice() {
        return `
            <div class="economics-notice">
                Passive Bonuses cost ${TraitFlawSystem.getAvailableFlaws()[0]?.cost || 1} point each and provide +Tier bonus to one chosen stat.
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

        let status = 'available';
        if (isAlreadyPurchased) status = 'purchased';
        
        let additionalContent = '';

        if (!isAlreadyPurchased) {
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
                        text: `Purchase Passive Bonus (-${flaw.cost}p)`,
                        variant: 'primary',
                        disabled: true, // Enabled by JS when stat is selected
                        dataAttributes: { action: 'purchase-flaw', 'flaw-id': flaw.id },
                        classes: ['purchase-passive-bonus-btn']
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
            disabled: isAlreadyPurchased,
            dataAttributes: { 'flaw-id': flaw.id }, // For main card div
            additionalContent: additionalContent
        }, { cardClass: 'passive-bonus-card', showCost: true, showStatus: !(status === 'available') });
    }



    handleFlawPurchase(flawId) { // Called by MainPoolTab
        const statSelect = document.querySelector(`#stat-select-${flawId}`);
        const statBonus = statSelect ? statSelect.value : null;

        if (!statBonus) {
            this.builder.showNotification('Please select a stat bonus for the passive bonus.', 'error');
            return;
        }

        // 1. Get current point balance
        const pools = PointPoolCalculator.calculateAllPools(this.builder.currentCharacter);
        const remainingPoints = pools.remaining.mainPool;
        
        // 2. Get the cost of the item
        const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
        const itemCost = flaw ? flaw.cost : 0;
        
        // 3. Check if this purchase will go over budget
        if (itemCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseFlaw(character, flawId, statBonus);
            this.builder.updateCharacter(); // Triggers re-render of MainPoolTab
            this.builder.showNotification('Passive Bonus purchased successfully!', 'success');
        } catch (error) {
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
        }
    }

    handleFlawRemoval(index) { // Called by MainPoolTab
        const character = this.builder.currentCharacter;
        const flaw = character.mainPoolPurchases.flaws[index];

        if (confirm(`Remove passive bonus "${flaw.name}"? This will adjust your points.`)) {
            try {
                TraitFlawSystem.removeFlaw(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Passive Bonus removed successfully.', 'success');
            } catch (error) {
                this.builder.showNotification(`Failed to remove passive bonus: ${error.message}`, 'error');
            }
        }
    }
}