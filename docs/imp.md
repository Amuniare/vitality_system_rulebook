Okay, this is a very large request, as it involves modifying the HTML-generating parts of many JavaScript files. I will provide the updated content for the JavaScript files that were identified as needing changes to their `render` methods or similar HTML-generating parts.

**Important Considerations Before Replacing Files:**

1.  **BACKUP YOUR PROJECT:** This is critical. Before replacing any files, ensure you have a complete backup of your `vitality_system_rulebook` directory.
2.  **INCREMENTAL TESTING:** If possible, replace files one by one (or in small groups) and test the character builder in your browser after each replacement. This will make debugging much easier if an issue arises.
3.  **RenderUtils.js First:** The changes in `RenderUtils.js` are foundational. If you're doing this incrementally, update and test this file first.
4.  **Developer Tools:** You will absolutely need to use your browser's developer tools (F12) to inspect elements and debug any styling or layout issues that might occur.
5.  **This is a Best Effort:** Without being able to run and test the code, these are generated based on the defined refactoring rules. Minor adjustments might be needed.

Here are the updated files:

---
**FILE: `rulebook/character-builder/ui/shared/RenderUtils.js`**
---
```javascript
// rulebook/character-builder/ui/shared/RenderUtils.js
export class RenderUtils {
    // Render a standard card with consistent styling
    static renderCard(data, options = {}) {
        const {
            title,
            cost,
            description,
            status, // e.g., 'purchased', 'unaffordable', 'available', or custom
            clickable = false,
            disabled = false,
            dataAttributes = {},
            additionalContent = ''
        } = data;

        const {
            cardClass = '', // Modifier class like 'flaw-card', 'archetype-card'
            showCost = true,
            showStatus = true,
            titleTag = 'h5' // Allow customizing title tag, e.g. h4, h5
        } = options;

        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');

        const baseCardClass = 'card';
        const statusClass = status ? `status-${status}` : ''; // Used for specific status styling if needed

        const classes = [
            baseCardClass,
            cardClass,
            clickable && !disabled ? 'clickable' : '', // Clickable only if not disabled
            disabled ? 'disabled' : '',
            statusClass
        ].filter(Boolean).join(' ');

        let costHtml = '';
        if (showCost && cost !== undefined) {
            let costBadgeClass = '';
            if (status === 'unaffordable') costBadgeClass = 'unaffordable';
            else if (cost === 0) costBadgeClass = 'free';
            costHtml = `<span class="card-cost ${costBadgeClass}">${cost > 0 ? cost + 'p' : 'Free'}</span>`;
        }
        
        let statusIndicatorHtml = '';
        if (showStatus && status) {
            statusIndicatorHtml = this.renderStatusIndicator(status, this.getStatusText(status), { absolutePosition: false });
        }


        return `
            <div class="${classes}" ${dataAttrs}>
                ${title || costHtml ? `
                    <div class="card-header">
                        ${title ? `<${titleTag} class="card-title">${title}</${titleTag}>` : ''}
                        ${costHtml}
                    </div>
                ` : ''}
                ${description ? `<div class="card-description">${description}</div>` : ''}
                ${additionalContent}
                ${statusIndicatorHtml}
            </div>
        `;
    }

    // Render a grid of items
    static renderGrid(items, renderItem, options = {}) {
        const {
            gridContainerClass = 'grid-layout', // Base class for grid display
            gridSpecificClass = '', // For specific column configurations e.g., grid-columns-auto-fit-250
            emptyMessage = 'No items available'
        } = options;

        if (!items || items.length === 0) {
            return `<div class="empty-state">${emptyMessage}</div>`;
        }

        const fullGridClass = [gridContainerClass, gridSpecificClass].filter(Boolean).join(' ');

        return `
            <div class="${fullGridClass}">
                ${items.map(renderItem).join('')}
            </div>
        `;
    }

    // Render a standard button
    static renderButton(config) {
        const {
            text,
            type = 'button',
            variant = 'primary', // e.g., primary, secondary, danger
            size = '', // e.g., 'small'
            disabled = false,
            dataAttributes = {},
            classes = [], // Additional custom classes
            onClick = '' // For inline JS, though data-action is preferred
        } = config;

        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');

        const buttonClasses = [
            'btn', // Base button class
            `btn-${variant}`,
            size ? `btn-${size}` : '',
            ...classes,
            disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ');

        return `
            <button type="${type}"
                    class="${buttonClasses}"
                    ${disabled ? 'disabled' : ''}
                    ${dataAttrs}
                    ${onClick ? `onclick="${onClick}"` : ''}>
                ${text}
            </button>
        `;
    }

    // Render status indicator (replaces status-badge)
    static renderStatusIndicator(statusType, text, options = {}) {
        const { absolutePosition = true, additionalClasses = [] } = options;
        
        const indicatorClasses = [
            'status-indicator',
            `status-indicator-${statusType}`, // e.g., status-indicator-success, status-indicator-error
            absolutePosition ? 'absolute-badge' : '', // Optional class for positioning
            ...additionalClasses
        ].filter(Boolean).join(' ');

        return `<div class="${indicatorClasses}">${text || this.getStatusText(statusType)}</div>`;
    }


    // Render point display
    static renderPointDisplay(current, max, label, options = {}) {
        const {
            showRemaining = true,
            showPercentage = false,
            variant = 'default' // e.g., 'error', 'warning', 'compact' for specific styling
        } = options;

        const remaining = max - current;
        const percentage = max > 0 ? ((current / max) * 100).toFixed(1) : 0;

        let statusClass = variant; // Use variant for main class
        if (variant === 'default') { // Apply specific status only if default
            if (remaining < 0) statusClass = 'over-budget';
            else if (remaining === 0 && current > 0) statusClass = 'fully-used'; // only if some points were spent
        }


        return `
            <div class="point-display ${statusClass}">
                <div class="point-label">${label}</div>
                <div class="point-values">
                    <span class="current">${current}</span>
                    <span class="separator">/</span>
                    <span class="max">${max}</span>
                    ${showRemaining ? `<span class="remaining">(${remaining >= 0 ? remaining : 'OVER ' + Math.abs(remaining)})</span>` : ''}
                    ${showPercentage ? `<span class="percentage">${percentage}%</span>` : ''}
                </div>
            </div>
        `;
    }

    // Render form group
    static renderFormGroup(config) {
        const {
            label,
            inputId, // Added for linking label to input
            inputHtml, // Changed from 'input' to avoid clash, expects full input HTML string
            description,
            error,
            required = false,
            formGroupClass = ''
        } = config;

        return `
            <div class="form-group ${error ? 'has-error' : ''} ${formGroupClass}">
                ${label ? `<label class="form-label ${required ? 'required' : ''}" ${inputId ? `for="${inputId}"` : ''}>${label}</label>` : ''}
                ${inputHtml}
                ${description ? `<small class="form-description">${description}</small>` : ''}
                ${error ? `<div class="form-error">${error}</div>` : ''}
            </div>
        `;
    }

    // Render select dropdown
    static renderSelect(config) {
        const {
            id,
            name, // Added for forms
            value = '',
            options = [], // Expected: [{value: 'val', label: 'Label', disabled: false}]
            placeholder = 'Select...',
            dataAttributes = {},
            classes = [],
            disabled = false
        } = config;

        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, val]) => `data-${key}="${val}"`)
            .join(' ');

        const selectClasses = ['form-select', ...classes].filter(Boolean).join(' '); // form-select might be part of general input styling

        return `
            <select id="${id}" name="${name || id}" class="${selectClasses}" ${disabled ? 'disabled' : ''} ${dataAttrs}>
                ${placeholder ? `<option value="">${placeholder}</option>` : ''}
                ${options.map(opt => `
                    <option value="${opt.value}" ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
        `;
    }

    static getStatusText(status) {
        const statusTexts = {
            success: 'Available',
            error: 'Unavailable',
            warning: 'Warning',
            info: 'Info',
            purchased: 'Owned',
            unaffordable: "Can't Afford",
            available: 'Purchase' // Default for clickable available items
        };
        return statusTexts[status.toLowerCase()] || status;
    }

    // Render purchased item list
    static renderPurchasedList(items, renderItemFn, options = {}) {
        const {
            title = 'Purchased Items',
            listContainerClass = 'purchased-list',
            emptyMessage = 'No items purchased',
            showCount = true,
            itemWrapperClass = '' // Class for each item's wrapper if needed
        } = options;

        const count = items ? items.length : 0;

        return `
            <div class="purchased-section">
                <h4>${title} ${showCount ? `(${count})` : ''}</h4>
                ${count > 0 ? `
                    <div class="${listContainerClass}">
                        ${items.map((item, index) => 
                            itemWrapperClass ? `<div class="${itemWrapperClass}">${renderItemFn(item, index)}</div>` : renderItemFn(item, index)
                        ).join('')}
                    </div>
                ` : `<div class="empty-state">${emptyMessage}</div>`}
            </div>
        `;
    }

    // Render tabs navigation (generic)
    static renderTabs(tabsConfig, activeTabId, options = {}) {
        const { navClass = 'tab-navigation', tabButtonClass = 'tab-btn' } = options;
        return `
            <div class="${navClass}">
                ${tabsConfig.map(tab => `
                    <button class="${tabButtonClass} ${activeTabId === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}"
                            data-tab="${tab.id}"
                            ${tab.disabled ? 'disabled' : ''}>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }
}
```

---
**FILE: `rulebook/character-builder/ui/components/ActionUpgradeSection.js`**
---
```javascript
// rulebook/character-builder/ui/components/ActionUpgradeSection.js
import { ActionSystem } from '../../systems/ActionSystem.js';
import { GameConstants } from '../../core/GameConstants.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class ActionUpgradeSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const availableActions = ActionSystem.getAvailableActions();
        const purchasedUpgrades = character.mainPoolPurchases.primaryActionUpgrades;

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Primary Action Upgrades (${GameConstants.PRIMARY_TO_QUICK_COST}p each)</h3>
                <p class="category-description">
                    Convert any Primary Action to a Quick Action. This allows you to perform the action
                    as part of your Quick Action instead of using your Primary Action.
                </p>

                ${RenderUtils.renderPurchasedList(
                    purchasedUpgrades,
                    (upgrade, index) => this.renderPurchasedUpgrade(upgrade, index),
                    { title: `Purchased Upgrades (${purchasedUpgrades.length})`, emptyMessage: 'No upgrades purchased' }
                )}

                <div class="available-items">
                    <h4>Available Actions</h4>
                    ${RenderUtils.renderGrid(
                        availableActions,
                        (action) => this.renderActionOption(action, character, pointInfo),
                        { gridContainerClass: 'grid-layout action-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                    )}
                </div>
            </div>
        `;

        return containerHtml;
    }

    renderPurchasedUpgrade(upgrade, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${upgrade.actionName} → Quick Action</span>
                    <span class="item-details">${GameConstants.PRIMARY_TO_QUICK_COST}p</span>
                </div>
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    classes: ['remove-upgrade'], // Keep specific class if JS relies on it
                    dataAttributes: { index: index, action: 'remove-action-upgrade' } // Added data-action
                })}
            </div>
        `;
    }

    renderActionOption(action, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === action.id);
        const canAfford = pointInfo.remaining >= GameConstants.PRIMARY_TO_QUICK_COST;
        
        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        else if (!canAfford) status = 'unaffordable';

        return RenderUtils.renderCard({
            title: action.name,
            cost: GameConstants.PRIMARY_TO_QUICK_COST,
            description: action.description,
            status: status,
            clickable: !alreadyPurchased && canAfford,
            disabled: alreadyPurchased || !canAfford,
            dataAttributes: { 'action-id': action.id, action: 'purchase-action-upgrade' }, // Added data-action
            additionalContent: `<div class="upgrade-effect">Upgrade: Use as Quick Action</div>`
        }, { cardClass: 'action-card', showStatus: true }); // Ensure status text is shown via RenderUtils
    }


    setupEventListeners() {
        // EventManager will handle this based on data-action attributes
        // No specific querySelectors needed here if EventManager is used at a higher level (e.g., MainPoolTab)
        // If this section is rendered into a container that MainPoolTab then sets listeners on,
        // ensure data-action attributes are correctly used.
    }

    purchaseActionUpgrade(actionId) {
        const character = this.builder.currentCharacter;
        try {
            ActionSystem.purchaseActionUpgrade(character, actionId);
            this.builder.updateCharacter(); // This will trigger re-render via MainPoolTab/CharacterBuilder
            this.builder.showNotification(`Purchased action upgrade for ${GameConstants.PRIMARY_TO_QUICK_COST}p!`, 'success');
        } catch (error) {
            this.builder.showNotification(`Failed to purchase upgrade: ${error.message}`, 'error');
        }
    }

    removeUpgrade(index) {
        const character = this.builder.currentCharacter;
        try {
            if (index >= 0 && index < character.mainPoolPurchases.primaryActionUpgrades.length) {
                const upgrade = character.mainPoolPurchases.primaryActionUpgrades[index];
                ActionSystem.removeActionUpgrade(character, upgrade.actionId); // Assuming system handles by ID
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${upgrade.actionName} upgrade`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove upgrade: ${error.message}`, 'error');
        }
    }
}
```
---
**FILE: `rulebook/character-builder/ui/components/BoonPurchaseSection.js` (and similar for `SimpleBoonSection.js` / `UniqueAbilitySection.js`)**
---
*Self-correction: `BoonPurchaseSection` was split. I'll do `SimpleBoonSection.js` and `UniqueAbilitySection.js` separately as they were intended to be modular.*

---
**FILE: `rulebook/character-builder/ui/components/SimpleBoonSection.js`**
---
```javascript
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
```

---
**FILE: `rulebook/character-builder/ui/components/UniqueAbilitySection.js`**
---
```javascript
// rulebook/character-builder/ui/components/UniqueAbilitySection.js
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class UniqueAbilitySection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedUpgrades = {};
    }

    render(character, pointInfo) {
        const uniqueAbilities = UniqueAbilitySystem.getComplexUniqueAbilities();
        const purchasedAbilities = character.mainPoolPurchases.boons.filter(b => b.type === 'unique');

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Unique Abilities (Complex)</h3>
                <p class="category-description">
                    Powerful abilities with customizable upgrades. Purchase the base ability first,
                    then add upgrades to customize its effects and power.
                </p>

                ${RenderUtils.renderPurchasedList(
                    purchasedAbilities,
                    (ability, index) => this.renderPurchasedAbility(ability, index),
                    { title: `Purchased Unique Abilities (${purchasedAbilities.length})`, emptyMessage: 'No unique abilities purchased' }
                )}

                <div class="available-items">
                    <h4>Available Unique Abilities</h4>
                    ${RenderUtils.renderGrid(
                        uniqueAbilities,
                        (ability) => this.renderUniqueAbilityOption(ability, character, pointInfo),
                        { gridContainerClass: 'grid-layout ability-grid', gridSpecificClass: 'grid-columns-auto-fit-320' }
                    )}
                </div>
            </div>
        `;
        return containerHtml;
    }

    renderPurchasedAbility(ability, index) {
        const upgradeCount = ability.upgrades?.length || 0;
        const upgradeText = upgradeCount > 0 ? ` (${upgradeCount} upgrades)` : '';

        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${ability.name}${upgradeText}</span>
                    <span class="item-details">${ability.cost}p - ${ability.category}</span>
                </div>
                <div class="item-actions">
                     ${RenderUtils.renderButton({ text: 'Modify', variant: 'secondary', size: 'small', classes: ['modify-ability'], dataAttributes: { index: index, 'boon-id': ability.boonId, action: 'modify-unique-ability' }})}
                     ${RenderUtils.renderButton({ text: 'Remove', variant: 'danger', size: 'small', classes: ['remove-ability'], dataAttributes: { index: index, 'boon-id': ability.boonId, action: 'remove-unique-ability' }})}
                </div>
            </div>
        `;
    }

    renderUniqueAbilityOption(ability, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === ability.id && b.type === 'unique');
        const canAffordBase = pointInfo.remaining >= ability.baseCost;

        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        else if (!canAffordBase) status = 'unaffordable';

        const upgradeCount = ability.upgrades?.length || 0;
        let additionalContent = `<div class="item-category">Category: ${ability.category}</div>`;
        additionalContent += `<div class="upgrade-info">${upgradeCount} upgrades available</div>`;

        if (!alreadyPurchased && canAffordBase) {
            additionalContent += `
                <div class="upgrade-preview">
                    <div class="upgrade-selector" data-ability-id="${ability.id}">
                        <h6>Select Upgrades (Optional)</h6>
                        <div class="upgrade-list">
                            ${this.renderUpgradeOptions(ability, ability.id)}
                        </div>
                        <div class="total-cost">
                            Total Cost: <span id="total-cost-${ability.id}">${ability.baseCost}</span>p
                        </div>
                    </div>
                    ${RenderUtils.renderButton({
                        text: 'Purchase Ability',
                        variant: 'primary',
                        classes: ['purchase-ability'], // Keep specific class if JS relies on it
                        dataAttributes: { 'ability-id': ability.id, action: 'purchase-unique-ability' }
                    })}
                </div>
            `;
        }
        
        return RenderUtils.renderCard({
            title: ability.name,
            cost: ability.baseCost, // Base cost shown on card
            description: ability.description,
            status: status, // status for the base ability purchase
            clickable: false, // Click handling is on the purchase button inside
            disabled: alreadyPurchased || !canAffordBase, // Card disabled if purchased or can't afford base
            dataAttributes: { 'ability-id': ability.id },
            additionalContent: additionalContent
        }, { cardClass: 'ability-card complex', showStatus: !(!alreadyPurchased && canAffordBase) }); // Only show card status if not showing purchase UI
    }

    renderUpgradeOptions(ability, abilityId) {
        if (!ability.upgrades) return '<p class="empty-state">No upgrades for this ability.</p>';
        return ability.upgrades.map(upgrade => `
            <div class="upgrade-option">
                <label class="upgrade-label">
                    <input type="checkbox"
                           class="upgrade-checkbox"
                           data-ability-id="${abilityId}"
                           data-upgrade-id="${upgrade.id}"
                           data-upgrade-cost="${upgrade.cost}">
                    <span class="upgrade-name">${upgrade.name}</span>
                    <span class="upgrade-cost">${upgrade.cost}p${upgrade.per ? `/${upgrade.per}` : ''}</span>
                </label>
                <div class="upgrade-description">${upgrade.description}</div>
                ${upgrade.per ? `
                    <div class="upgrade-quantity">
                        <label for="qty-${abilityId}-${upgrade.id}">Quantity:</label>
                        <input type="number"
                               id="qty-${abilityId}-${upgrade.id}"
                               class="upgrade-qty"
                               data-ability-id="${abilityId}"
                               data-upgrade-id="${upgrade.id}"
                               min="1" max="10" value="1" disabled>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }


    setupEventListeners() {
        // Handled by MainPoolTab's EventManager using data-action for purchase/remove
        // Internal listeners for checkboxes and quantity need to be setup if this component manages its own re-render
        // or if MainPoolTab delegates these specific input changes.
        // For now, assuming MainPoolTab will re-render this section, which re-attaches.
        // If this component re-renders itself on upgrade selection, then:
        const container = document.querySelector('.unique-ability-section'); // This selector needs to be more specific if used
        if (container) {
             container.querySelectorAll('.upgrade-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => this.handleUpgradeSelectionChange(e.target));
            });
            container.querySelectorAll('.upgrade-qty').forEach(input => {
                input.addEventListener('input', (e) => this.handleUpgradeQuantityChange(e.target));
            });
        }
    }
    
    handleUpgradeSelectionChange(checkboxElement) {
        const abilityId = checkboxElement.dataset.abilityId;
        const upgradeId = checkboxElement.dataset.upgradeId;
        const isChecked = checkboxElement.checked;

        const qtyInput = document.querySelector(`input.upgrade-qty[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
        if (qtyInput) {
            qtyInput.disabled = !isChecked;
            if (!isChecked) qtyInput.value = 1; // Reset quantity if unchecked
        }
        this.updateAbilityCostDisplay(abilityId);
    }

    handleUpgradeQuantityChange(quantityInputElement) {
         const abilityId = quantityInputElement.dataset.abilityId;
         this.updateAbilityCostDisplay(abilityId);
    }


    updateAbilityCostDisplay(abilityId) {
        const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!abilityDef) return;

        let currentTotalCost = abilityDef.baseCost;
        const currentSelectedUpgrades = [];

        document.querySelectorAll(`input.upgrade-checkbox[data-ability-id="${abilityId}"]:checked`).forEach(checkbox => {
            const upgradeId = checkbox.dataset.upgradeId;
            const upgradeDef = abilityDef.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                let quantity = 1;
                if (upgradeDef.per) {
                    const qtyInput = document.querySelector(`input.upgrade-qty[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
                    quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
                    currentTotalCost += upgradeDef.cost * quantity;
                } else {
                    currentTotalCost += upgradeDef.cost;
                }
                currentSelectedUpgrades.push({ id: upgradeId, quantity: upgradeDef.per ? quantity : undefined });
            }
        });

        const costElement = document.getElementById(`total-cost-${abilityId}`);
        if (costElement) {
            costElement.textContent = currentTotalCost;
        }
        this.selectedUpgrades[abilityId] = currentSelectedUpgrades; // Store for purchase
    }

    purchaseUniqueAbility(abilityId) {
        const character = this.builder.currentCharacter;
        const upgradesToPurchase = this.selectedUpgrades[abilityId] || []; // Get the currently selected upgrades
        try {
            UniqueAbilitySystem.purchaseUniqueAbility(character, abilityId, upgradesToPurchase);
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased unique ability!`, 'success');
            delete this.selectedUpgrades[abilityId]; // Clear selection after purchase
             // Force re-render of this section to update display
            const mainPoolTab = this.builder.tabs.mainPool;
            if(mainPoolTab && mainPoolTab.activeSection === 'uniqueAbilities') {
                mainPoolTab.updateActiveSection();
            }

        } catch (error) {
            this.builder.showNotification(`Failed to purchase ability: ${error.message}`, 'error');
        }
    }

    removeAbility(abilityIdToRemove) { // Changed to use boonId
        const character = this.builder.currentCharacter;
        try {
            const ability = character.mainPoolPurchases.boons.find(b => b.boonId === abilityIdToRemove && b.type === 'unique');
            if(ability){
                UniqueAbilitySystem.removeUniqueAbility(character, ability.boonId);
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${ability.name}`, 'info');
            } else {
                this.builder.showNotification(`Could not find unique ability to remove.`, 'error');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove ability: ${error.message}`, 'error');
        }
    }

    // Placeholder for modify ability - might open a modal or inline editor
    modifyAbility(abilityIdToModify) {
        this.builder.showNotification(`Modify functionality for ${abilityIdToModify} not yet implemented.`, 'info');
        // This would involve pre-populating the upgrade selector with existing upgrades
        // and then calling an update method instead of purchase.
    }
}
```

---
**FILE: `rulebook/character-builder/ui/components/CharacterTree.js`**
---
```javascript
// rulebook/character-builder/ui/components/CharacterTree.js
import { RenderUtils } from '../shared/RenderUtils.js';
import { EventManager } from '../shared/EventManager.js';

export class CharacterTree {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.library = null; // Will be set by CharacterBuilder
        this.expandedFolders = new Set();
        this.selectedCharacterId = null;
        this.searchTerm = '';
    }

    init() {
        console.log('🟡 Initializing CharacterTree...');
        // Library is expected to be initialized by CharacterBuilder before this
        this.render();
        // Event listeners are setup once by CharacterBuilder, or need to be specific to this component's container
    }

    render() {
        const container = document.getElementById('character-tree');
        if (!container) {
            console.error("Character tree container not found!");
            return;
        }
        if (!this.library || !this.library.initialized) {
            container.innerHTML = '<p>Loading library...</p>';
            return;
        }

        const characters = this.searchTerm ?
                           this.library.searchCharacters(this.searchTerm) :
                           this.library.getAllCharacters();
        const folders = Array.from(this.library.folders.values());

        container.innerHTML = `
            <div class="character-tree-header">
                ${RenderUtils.renderButton({
                    text: '+ New Character',
                    variant: 'primary',
                    dataAttributes: { action: 'new-character' }, // For EventManager
                    classes: ['new-character-btn-tree'] // More specific if needed
                })}
                ${RenderUtils.renderButton({
                    text: 'Import JSON',
                    variant: 'secondary',
                    dataAttributes: { action: 'import-character' } // For EventManager
                })}
            </div>

            <div class="character-search form-group">
                <input type="text"
                       id="character-search-input"
                       placeholder="Search characters..."
                       class="search-input"
                       value="${this.searchTerm}">
            </div>

            <div class="character-tree-content">
                ${this.searchTerm ?
                    this.renderSearchResults(characters) :
                    this.renderCharacterTree(characters, folders)
                }
            </div>

            <div class="character-tree-footer">
                ${this.renderLibraryStats()}
            </div>
        `;
        this.setupTreeSpecificListeners(container); // Re-attach listeners for dynamic content
    }

    renderSearchResults(characters) {
        return `
            <div class="search-results">
                <div class="search-header">Search Results (${characters.length})</div>
                ${characters.length > 0 ? `
                    <div class="search-character-list">
                        ${characters.map(char => this.renderCharacterItem(char)).join('')}
                    </div>
                ` : '<div class="empty-state">No characters found for your search.</div>'}
            </div>
        `;
    }

    renderCharacterTree(characters, folders) {
        const charactersByFolder = this.groupCharactersByFolder(characters);
        const rootFolders = folders.filter(f => !f.parentId);
        const unorganizedCharacters = charactersByFolder.get(null) || []; // Use null for root

        return `
            <div class="character-tree-list">
                ${rootFolders.map(folder => this.renderFolder(folder, charactersByFolder, folders)).join('')}
                ${unorganizedCharacters.length > 0 || rootFolders.length === 0 && characters.length > 0 ? `
                    <div class="folder-section">
                        <div class="folder-header unorganized">
                            <span class="folder-name">Unorganized</span>
                            <span class="folder-count">(${unorganizedCharacters.length})</span>
                        </div>
                        <div class="folder-characters">
                            ${unorganizedCharacters.map(char => this.renderCharacterItem(char)).join('')}
                        </div>
                    </div>
                ` : (characters.length === 0 ? '<div class="empty-state">No characters yet. Click "New Character" to start.</div>' : '')}
            </div>
        `;
    }

    renderFolder(folder, charactersByFolder, allFolders) {
        const isExpanded = this.expandedFolders.has(folder.id);
        const folderCharacters = charactersByFolder.get(folder.id) || [];
        const subFolders = allFolders.filter(f => f.parentId === folder.id);

        return `
            <div class="folder-section">
                <div class="folder-header ${isExpanded ? 'expanded' : 'collapsed'}"
                     data-folder-id="${folder.id}" data-action="toggle-folder">
                    <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
                    <span class="folder-name">${folder.name}</span>
                    <span class="folder-count">(${folderCharacters.length + subFolders.length})</span>
                    <div class="folder-actions">
                        ${RenderUtils.renderButton({ text: '✏️', variant: 'secondary', size: 'small', dataAttributes: { action: 'rename-folder', 'folder-id': folder.id }})}
                        ${RenderUtils.renderButton({ text: '🗑️', variant: 'danger', size: 'small', dataAttributes: { action: 'delete-folder', 'folder-id': folder.id }})}
                    </div>
                </div>

                ${isExpanded ? `
                    <div class="folder-content">
                        ${subFolders.map(subFolder => this.renderFolder(subFolder, charactersByFolder, allFolders)).join('')}
                        <div class="folder-characters">
                            ${folderCharacters.map(char => this.renderCharacterItem(char)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderCharacterItem(character) {
        const isSelected = this.selectedCharacterId === character.id;
        // Validation would typically be done by CharacterBuilder and passed or re-validated
        // For simplicity, let's assume a way to check issues if needed
        const hasIssues = character.validationResults && !character.validationResults.isValid;


        return `
            <div class="character-item ${isSelected ? 'active' : ''} ${hasIssues ? 'has-issues' : ''}"
                 data-character-id="${character.id}" data-action="select-character">
                <div class="character-main">
                    <div class="character-name">${character.name}</div>
                    <div class="character-details">
                        Tier ${character.tier}
                        ${character.realName ? ` • ${character.realName}` : ''}
                    </div>
                </div>
                <div class="character-actions">
                    ${RenderUtils.renderButton({ text: '📋', variant: 'secondary', size: 'small', dataAttributes: { action: 'duplicate-character', 'character-id': character.id }})}
                    ${RenderUtils.renderButton({ text: '💾', variant: 'secondary', size: 'small', dataAttributes: { action: 'export-character-item', 'character-id': character.id }})}
                </div>
            </div>
        `;
    }

    renderLibraryStats() {
        if (!this.library) return '';
        const stats = this.library.getStatistics();
        return `
            <div class="library-stats">
                <div class="stat-item">
                    <span class="stat-value">${stats.totalCharacters}</span>
                    <span class="stat-label">Characters</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.totalFolders}</span>
                    <span class="stat-label">Folders</span>
                </div>
            </div>
        `;
    }

    groupCharactersByFolder(characters) {
        const groups = new Map();
        characters.forEach(character => {
            const folderId = character.folderId || null; // null for root/unorganized
            if (!groups.has(folderId)) {
                groups.set(folderId, []);
            }
            groups.get(folderId).push(character);
        });
        return groups;
    }

    setupTreeSpecificListeners(container) { // Changed from setupEventListeners to be more specific
        EventManager.delegateEvents(container, {
            click: {
                '[data-action="new-character"]': () => this.builder.createNewCharacter(),
                '[data-action="import-character"]': () => this.importCharacter(),
                '[data-action="select-character"]': (e, el) => this.selectCharacter(el.closest('.character-item').dataset.characterId),
                '[data-action="toggle-folder"]': (e, el) => this.toggleFolder(el.closest('.folder-header').dataset.folderId),
                '[data-action="duplicate-character"]': (e, el) => { e.stopPropagation(); this.duplicateCharacter(el.dataset.characterId); },
                '[data-action="export-character-item"]': (e, el) => { e.stopPropagation(); this.exportCharacter(el.dataset.characterId); },
                // Note: CharacterBuilder handles its own delete button; this tree doesn't have a top-level one.
                '[data-action="rename-folder"]': (e, el) => { e.stopPropagation(); this.renameFolder(el.dataset.folderId); },
                '[data-action="delete-folder"]': (e, el) => { e.stopPropagation(); this.deleteFolder(el.dataset.folderId); }
            },
            input: {
                '#character-search-input': EventManager.debounce((e) => this.handleSearch(e.target.value), 300)
            }
        });
    }
    
    handleSearch(query) {
        this.searchTerm = query;
        this.refresh(); // Re-render with search term
    }

    selectCharacter(characterId) {
        if (!this.library) return;
        const character = this.library.getCharacter(characterId);
        if (!character) return;

        this.selectedCharacterId = characterId;
        this.builder.loadCharacter(characterId); // Use builder's load method
        this.refresh(); // Re-render to show selection
    }

    duplicateCharacter(characterId) {
        if (!this.library) return;
        const original = this.library.getCharacter(characterId);
        if (!original) return;

        const duplicate = JSON.parse(JSON.stringify(original)); // Deep clone
        duplicate.id = Date.now().toString();
        duplicate.name = `${original.name} (Copy)`;
        duplicate.created = new Date().toISOString();
        duplicate.lastModified = new Date().toISOString();

        this.library.saveCharacter(duplicate);
        this.refresh();
        this.builder.showNotification(`Duplicated character: ${duplicate.name}`, 'success');
    }

    exportCharacter(characterId) {
        if (!this.library) return;
        const character = this.library.getCharacter(characterId);
        if (!character) return;

        try {
            const jsonData = this.library.exportCharacter(characterId);
            this.downloadFile(`${character.name.replace(/[^a-z0-9]/gi, '_')}_character.json`, jsonData, 'application/json');
            this.builder.showNotification(`Exported ${character.name}`, 'success');
        } catch (error) {
            this.builder.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
    
    importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedCharacter = await this.library.importCharacter(event.target.result);
                    this.refresh();
                    this.builder.showNotification(`Imported character: ${importedCharacter.name}`, 'success');
                    this.selectCharacter(importedCharacter.id); // Optionally select imported character
                } catch (error) {
                    this.builder.showNotification(`Import failed: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    toggleFolder(folderId) {
        if (this.expandedFolders.has(folderId)) {
            this.expandedFolders.delete(folderId);
        } else {
            this.expandedFolders.add(folderId);
        }
        this.refresh();
    }

    renameFolder(folderId) {
        if (!this.library) return;
        const folder = this.library.folders.get(folderId);
        if (!folder) return;

        const newName = prompt('Enter new folder name:', folder.name);
        if (newName && newName.trim() !== '') {
            folder.name = newName.trim();
            this.library.saveToStorage(); // Make sure library saves folder changes
            this.refresh();
            this.builder.showNotification(`Folder renamed to: ${newName}`, 'success');
        }
    }

    deleteFolder(folderId) {
        if (!this.library) return;
        const folder = this.library.folders.get(folderId);
        if (!folder) return;

        const charactersInFolder = this.library.getCharactersInFolder(folderId);
        let confirmMessage = `Delete folder "${folder.name}"?`;
        if (charactersInFolder.length > 0) {
            confirmMessage += ` This will move ${charactersInFolder.length} character(s) to Unorganized.`;
        }

        if (confirm(confirmMessage)) {
            charactersInFolder.forEach(char => {
                const characterToUpdate = this.library.getCharacter(char.id);
                if (characterToUpdate) {
                    characterToUpdate.folderId = null; // Move to unorganized (root)
                    this.library.saveCharacter(characterToUpdate); // Save change
                }
            });
            this.library.folders.delete(folderId);
            this.library.saveToStorage(); // Save folder deletion
            this.refresh();
            this.builder.showNotification(`Deleted folder: ${folder.name}`, 'success');
        }
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    refresh() {
        // This method is called when the tree needs to re-render itself,
        // e.g., after library changes or search.
        if(this.library && this.library.initialized) {
            this.render();
        }
    }
}
```
---
**FILE: `rulebook/character-builder/ui/components/FlawPurchaseSection.js`**
---
```javascript
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
        if (flaw.restriction) {
            additionalContent += `<div class="flaw-restriction"><strong>Restriction:</strong> ${flaw.restriction}</div>`;
        }

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
```
---
**FILE: `rulebook/character-builder/ui/components/PointPoolDisplay.js`**
---
```javascript
// rulebook/character-builder/ui/components/PointPoolDisplay.js
import { RenderUtils } from '../shared/RenderUtils.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';

export class PointPoolDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.lastPools = null;
    }

    update() {
        const container = document.getElementById('point-pools');
        if (!container) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            container.innerHTML = this.renderEmptyState();
            this.lastPools = null; // Reset cache when no character
            return;
        }

        const pools = PointPoolCalculator.calculateAllPools(character);

        // Only update if pools stringified are different (simple deep comparison)
        const currentPoolsString = JSON.stringify(pools);
        if (currentPoolsString === this.lastPools) {
            return; // No change, no re-render
        }
        this.lastPools = currentPoolsString; // Cache the new state

        container.innerHTML = this.renderPointPools(pools);
        // console.log('🔄 Point pools display updated');
    }

    renderPointPools(pools) {
        return `
            <div class="point-pools-section">
                <h3>Point Pools</h3>
                ${this.renderAttributePools(pools)}
                ${this.renderMainPool(pools)}
                ${this.renderUtilityPool(pools)}
                ${this.renderSpecialAttackPools(pools)}
                ${this.renderOverallSummary(pools)}
            </div>
        `;
    }

    renderAttributePools(pools) {
        return `
            <div class="attribute-pools pool-category">
                <h4>Attributes</h4>
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.combatAttributes,
                    pools.totalAvailable.combatAttributes,
                    'Combat Attr.',
                    { variant: pools.remaining.combatAttributes < 0 ? 'error' : pools.remaining.combatAttributes === 0 ? 'warning' : 'default', showRemaining: true }
                )}
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.utilityAttributes,
                    pools.totalAvailable.utilityAttributes,
                    'Utility Attr.',
                    { variant: pools.remaining.utilityAttributes < 0 ? 'error' : pools.remaining.utilityAttributes === 0 ? 'warning' : 'default', showRemaining: true }
                )}
            </div>
        `;
    }

    renderMainPool(pools) {
         // Flaw economics: Flaws COST points, give stat bonus. No point bonus from flaws here.
        const flawCost = pools.totalSpent.mainPoolFlaws || 0; // Assuming PointPoolCalculator provides this

        return `
            <div class="main-pool pool-category">
                <h4>Main Pool</h4>
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.mainPool,
                    pools.totalAvailable.mainPool, // This should NOT include flaw costs as a bonus
                    'Main Pool',
                    { variant: pools.remaining.mainPool < 0 ? 'error' : pools.remaining.mainPool === 0 ? 'warning' : 'default', showRemaining: true, showPercentage: true }
                )}
                ${flawCost > 0 ? `<div class="pool-detail"><small>(${flawCost}p spent on Flaws)</small></div>` : ''}
            </div>
        `;
    }


    renderUtilityPool(pools) {
        return `
            <div class="utility-pool pool-category">
                <h4>Utility Pool</h4>
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.utilityPool,
                    pools.totalAvailable.utilityPool,
                    'Utility Pool',
                    { variant: pools.remaining.utilityPool < 0 ? 'error' : pools.remaining.utilityPool === 0 ? 'warning' : 'default', showRemaining: true }
                )}
            </div>
        `;
    }

    renderSpecialAttackPools(pools) {
        if (!pools.specialAttackPools || pools.specialAttackPools.totalAvailable === 0 && pools.totalSpent.specialAttacks === 0) {
            return `
                <div class="special-attack-pools pool-category">
                    <h4>Special Attacks</h4>
                    <div class="empty-state-small">No special attacks or points allocated.</div>
                </div>
            `;
        }
        return `
            <div class="special-attack-pools pool-category">
                <h4>Special Attacks</h4>
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.specialAttacks,
                    pools.totalAvailable.specialAttacks,
                    'Total SA Points',
                    { variant: pools.remaining.specialAttacks < 0 ? 'error' : pools.remaining.specialAttacks === 0 ? 'warning' : 'default', showRemaining: true }
                )}
                <div class="pool-method-display">
                    <small>Method: ${pools.specialAttackPools.method || 'N/A'}</small>
                </div>
                ${pools.specialAttackPools.attackPools && pools.specialAttackPools.attackPools.length > 0 ? `
                    <div class="individual-attack-pools">
                        ${pools.specialAttackPools.attackPools.map((attack, index) => `
                            <div class="attack-pool-item">
                                <span class="attack-pool-name">${attack.attackName || `Attack ${index + 1}`}</span>
                                <span class="attack-pool-values">${attack.spent}/${attack.available}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderOverallSummary(pools) {
        const totalAvailable = Object.values(pools.totalAvailable).reduce((sum, val) => sum + (val || 0), 0);
        const totalSpent = Object.values(pools.totalSpent).reduce((sum, val) => sum + (val || 0), 0);
        const totalRemaining = totalAvailable - totalSpent;
        
        let issuesHtml = '';
        const issues = [];
        Object.entries(pools.remaining).forEach(([poolName, remainingValue]) => {
            if (remainingValue < 0) {
                issues.push(`${this.formatPoolName(poolName)}: ${Math.abs(remainingValue)} over budget`);
            }
        });
        if (issues.length > 0) {
            issuesHtml = `<div class="pool-issues error-text"><strong>Issues:</strong> ${issues.join('; ')}</div>`;
        }

        return `
            <div class="overall-summary pool-category">
                <h4>Overall Status</h4>
                <div class="summary-line">
                    <span>Total Points Spent:</span> <span class="value">${totalSpent}</span>
                </div>
                <div class="summary-line">
                    <span>Total Points Available:</span> <span class="value">${totalAvailable}</span>
                </div>
                <div class="summary-line ${totalRemaining < 0 ? 'error-text' : ''}">
                    <span>Overall Remaining:</span> <span class="value">${totalRemaining}</span>
                </div>
                ${issuesHtml}
            </div>
        `;
    }
    
    formatPoolName(poolId) {
        return poolId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }


    renderEmptyState() {
        return `
            <div class="point-pools-section">
                <h3>Point Pools</h3>
                <div class="empty-state">Create or select a character to see point pools.</div>
            </div>
        `;
    }
}
```
---
**FILE: `rulebook/character-builder/ui/components/TraitPurchaseSection.js`**
---
```javascript
// rulebook/character-builder/ui/components/TraitPurchaseSection.js
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js'; // Ensure this is used
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class TraitPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.currentTraitData = this.resetCurrentTraitData();
    }

    resetCurrentTraitData() {
        return {
            conditions: [], // array of condition IDs
            statBonuses: [], // array of stat IDs
            tierCost: 0 // sum of selected condition tier costs
        };
    }

    render(character, pointInfo) { // pointInfo is for Main Pool
        const conditionTiersData = TraitFlawSystem.getTraitConditionTiers();
        const statOptionsData = TraitFlawSystem.getTraitStatOptions();

        return `
            <div class="trait-purchase-section-content">
                ${this.renderSectionHeader(pointInfo)}
                ${this.renderSectionDescription()}

                ${RenderUtils.renderPurchasedList(
                    character.mainPoolPurchases.traits,
                    (trait, index) => this.renderPurchasedTrait(trait, index, character),
                    { title: `Purchased Traits (${character.mainPoolPurchases.traits.length})`, emptyMessage: 'No traits purchased yet' }
                )}

                <div class="trait-builder">
                    <h5>Create New Trait</h5>
                    ${this.renderTraitBuilderContent(conditionTiersData, statOptionsData, pointInfo)}
                </div>
            </div>
        `;
    }

    renderSectionHeader(pointInfo) {
        return `
            <div class="section-header">
                <h4>Traits (Cost ${TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30}p Each)</h4>
                <div class="points-remaining">
                   Main Pool: ${pointInfo.remaining}p
                   ${pointInfo.remaining < (TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30) && pointInfo.remaining >=0 ? '<span class="warning">(Low)</span>' : ''}
                   ${pointInfo.remaining < 0 ? '<span class="error">(Over Budget!)</span>' : ''}
                </div>
            </div>
        `;
    }

    renderSectionDescription() {
        return `
            <p class="category-description">
                Traits cost ${TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30} points and provide +Tier bonus to TWO stats when conditions are met.
                Choose conditions totaling up to 3 tier points. Same stacking penalties apply.
            </p>
        `;
    }

    renderPurchasedTrait(trait, index, character) {
        return `
            <div class="purchased-item trait-card-horizontal">
                <div class="item-info">
                    <div class="trait-stats">
                        <strong>Bonuses:</strong> +${character.tier} ${trait.statBonuses.map(s => this.getStatName(s)).join(`, +${character.tier} `)}
                    </div>
                    <div class="trait-conditions">
                        <strong>When:</strong> ${this.getConditionNames(trait.conditions).join(' AND ')}
                    </div>
                    <span class="item-cost trait-item-cost">-${trait.cost}p</span>
                </div>
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    dataAttributes: { action: 'remove-trait', index: index }
                })}
            </div>
        `;
    }
    getStatName(statId) {
        const opt = TraitFlawSystem.getTraitStatOptions().find(s => s.id === statId);
        return opt ? opt.name : statId;
    }


    renderTraitBuilderContent(conditionTiersData, statOptionsData, pointInfo) {
        const traitCost = TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30;
        const canAffordTrait = pointInfo.remaining >= traitCost;
        const builderDisabled = !canAffordTrait;

        const canPurchase = canAffordTrait &&
                           this.currentTraitData.statBonuses.length === 2 &&
                           this.currentTraitData.conditions.length > 0 &&
                           this.currentTraitData.tierCost > 0 && this.currentTraitData.tierCost <= 3;

        return `
            <div class="trait-builder-content ${builderDisabled ? 'disabled-section' : ''}">
                ${this.renderStatSelectionStep(statOptionsData, builderDisabled)}
                ${this.renderConditionSelectionStep(conditionTiersData, builderDisabled)}
                ${this.renderBuilderActions(canPurchase, canAffordTrait, traitCost)}
                ${!canAffordTrait ? RenderUtils.renderStatusIndicator('error', `Insufficient points to purchase trait (need ${traitCost}p).`, {absolutePosition:false}) : ''}
            </div>
        `;
    }

    renderStatSelectionStep(statOptionsData, disabled) {
        return `
            <div class="builder-step">
                <h6>Step 1: Choose Stat Bonuses (Exactly 2 required)</h6>
                ${RenderUtils.renderGrid(
                    statOptionsData,
                    (stat) => this.renderStatOption(stat, disabled),
                    { gridContainerClass: 'grid-layout stat-selection', gridSpecificClass: 'grid-columns-auto-fit-200' }
                )}
                <div class="selection-summary">
                    Selected Stats: ${this.currentTraitData.statBonuses.map(s => this.getStatName(s)).join(', ') || 'None'}
                    (${this.currentTraitData.statBonuses.length}/2)
                </div>
            </div>
        `;
    }

    renderStatOption(stat, sectionDisabled) {
        const isSelected = this.currentTraitData.statBonuses.includes(stat.id);
        const isDisabledByLimit = this.currentTraitData.statBonuses.length >= 2 && !isSelected;
        return `
            <div class="stat-option form-group">
                <label>
                    <input type="checkbox"
                           class="stat-checkbox"
                           data-stat-id="${stat.id}"
                           ${isSelected ? 'checked' : ''}
                           ${sectionDisabled || isDisabledByLimit ? 'disabled' : ''}>
                    ${stat.name}
                </label>
                <small>${stat.description}</small>
            </div>
        `;
    }

    renderConditionSelectionStep(conditionTiersData, disabled) {
        const tierCostRemaining = 3 - this.currentTraitData.tierCost;
        return `
            <div class="builder-step">
                <h6>Step 2: Choose Conditions (Max 3 tier points total)</h6>
                <div class="tier-budget">
                    Tier Points Used: ${this.currentTraitData.tierCost}/3
                    (${tierCostRemaining < 0 ? '<span class="error">Over Limit!</span>' : `${tierCostRemaining} remaining`})
                </div>
                ${Object.entries(conditionTiersData).map(([tierKey, tierData]) =>
                    this.renderConditionTier(tierData, disabled)
                ).join('')}
                 <div class="selection-summary">
                    Selected Conditions: ${this.getConditionNames(this.currentTraitData.conditions).join(', ') || 'None'}
                </div>
            </div>
        `;
    }

    renderConditionTier(tierData, sectionDisabled) {
        return `
            <div class="condition-tier">
                <h7>${tierData.name} (${tierData.cost} point${tierData.cost !== 1 ? 's' : ''} each)</h7>
                ${RenderUtils.renderGrid(
                    tierData.conditions,
                    (condition) => this.renderConditionOption(condition, tierData.cost, sectionDisabled),
                    { gridContainerClass: 'grid-layout condition-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                )}
            </div>
        `;
    }

    renderConditionOption(condition, cost, sectionDisabled) {
        const isSelected = this.currentTraitData.conditions.includes(condition.id);
        const wouldExceed = !isSelected && (this.currentTraitData.tierCost + cost > 3);
        return `
            <div class="condition-option form-group">
                <label>
                    <input type="checkbox"
                           class="condition-checkbox"
                           data-condition-id="${condition.id}"
                           data-tier-cost="${cost}"
                           ${isSelected ? 'checked' : ''}
                           ${sectionDisabled || wouldExceed ? 'disabled' : ''}>
                    ${condition.name}
                </label>
                <small>${condition.description}</small>
            </div>
        `;
    }

    renderBuilderActions(canPurchase, canAffordTrait, traitCost) {
        return `
            <div class="builder-actions">
                ${RenderUtils.renderButton({
                    text: 'Clear Selections',
                    variant: 'secondary',
                    dataAttributes: { action: 'clear-trait-builder' }
                })}
                ${RenderUtils.renderButton({
                    text: `Purchase Trait (-${traitCost}p)`,
                    variant: 'primary',
                    disabled: !canPurchase,
                    dataAttributes: { action: 'purchase-trait' }
                })}
            </div>
        `;
    }

    setupEventListeners() {
        // Delegated to MainPoolTab
        // Internal listeners for builder UI state updates:
        const container = document.querySelector('.trait-purchase-section-content');
        if (container) {
            // Stat checkboxes
            container.addEventListener('change', (e) => {
                if (e.target.matches('.stat-checkbox')) {
                    this.handleStatSelection(e.target);
                } else if (e.target.matches('.condition-checkbox')) {
                    this.handleConditionSelection(e.target);
                }
            });
        }
    }

    handleStatSelection(checkboxElement) {
        const statId = checkboxElement.dataset.statId;
        if (checkboxElement.checked) {
            if (this.currentTraitData.statBonuses.length < 2) {
                this.currentTraitData.statBonuses.push(statId);
            } else {
                checkboxElement.checked = false; // Revert if limit exceeded
                this.builder.showNotification('Maximum 2 stat bonuses allowed.', 'warning');
            }
        } else {
            this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
        }
        this.refreshBuilderUI();
    }

    handleConditionSelection(checkboxElement) {
        const conditionId = checkboxElement.dataset.conditionId;
        const tierCost = parseInt(checkboxElement.dataset.tierCost);
        if (checkboxElement.checked) {
            if (this.currentTraitData.tierCost + tierCost <= 3) {
                this.currentTraitData.conditions.push(conditionId);
                this.currentTraitData.tierCost += tierCost;
            } else {
                checkboxElement.checked = false; // Revert
                this.builder.showNotification('Condition tier limit (3 points) exceeded.', 'warning');
            }
        } else {
            this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
            this.currentTraitData.tierCost -= tierCost;
        }
        this.refreshBuilderUI();
    }
    
    refreshBuilderUI() {
        // Re-render only the trait builder part
        const builderContainer = document.querySelector('.trait-builder');
        if (builderContainer && this.builder.currentCharacter) {
            const pointInfo = PointPoolCalculator.calculateAllPools(this.builder.currentCharacter).remaining;
            const mainPoolRemaining = pointInfo.mainPool || 0;
            const conditionTiersData = TraitFlawSystem.getTraitConditionTiers();
            const statOptionsData = TraitFlawSystem.getTraitStatOptions();
            
            builderContainer.innerHTML = `
                <h5>Create New Trait</h5>
                ${this.renderTraitBuilderContent(conditionTiersData, statOptionsData, {remaining: mainPoolRemaining})}
            `;
            // Note: Event listeners for checkboxes within builder will be re-bound by MainPoolTab if it re-renders the whole section,
            // or need to be re-attached here if this component manages its own complete re-render.
            // The current setup assumes MainPoolTab handles delegation or re-renders this whole section.
            // For isolated refreshBuilderUI, we'd need to re-call this.setupEventListeners() on the builderContainer.
             this.setupEventListeners(); // Re-attach to the new DOM for checkboxes
        }
    }


    handleClearBuilder() {
        this.currentTraitData = this.resetCurrentTraitData();
        this.refreshBuilderUI();
    }

    handleTraitPurchase() {
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseTrait(character, this.currentTraitData);
            this.currentTraitData = this.resetCurrentTraitData(); // Clear builder after purchase
            this.builder.updateCharacter(); // This will trigger re-render of MainPoolTab
            this.builder.showNotification('Trait purchased!', 'success');
        } catch (error) {
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
        }
    }

    handleTraitRemoval(index) {
        const character = this.builder.currentCharacter;
        const trait = character.mainPoolPurchases.traits[index];
        if (confirm(`Remove trait "${this.getTraitSummary(trait, character)}"? This refunds ${trait.cost}p.`)) {
            try {
                TraitFlawSystem.removeTrait(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Trait removed.', 'success');
            } catch (error) {
                this.builder.showNotification(`Failed to remove trait: ${error.message}`, 'error');
            }
        }
    }
    
    getTraitSummary(trait, character) {
        return `+${character.tier} ${trait.statBonuses.map(s => this.getStatName(s)).join('/')} when ${this.getConditionNames(trait.conditions, 1)}...`;
    }

    getConditionNames(conditionIds, limit = Infinity) {
        const conditionTiersData = TraitFlawSystem.getTraitConditionTiers();
        const names = [];
        for (const id of conditionIds) {
            if (names.length >= limit) break;
            for (const tier of Object.values(conditionTiersData)) {
                const cond = tier.conditions.find(c => c.id === id);
                if (cond) {
                    names.push(cond.name);
                    break;
                }
            }
        }
        return names;
    }
}
```

---
**FILE: `rulebook/character-builder/ui/components/ValidationDisplay.js`**
---
```javascript
// rulebook/character-builder/ui/components/ValidationDisplay.js
import { RenderUtils } from '../shared/RenderUtils.js'; // Keep if used for icons/status
import { CharacterValidator } from '../../validators/CharacterValidator.js';

export class ValidationDisplay {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.lastValidationResultString = null; // Store stringified result for comparison
    }

    update() {
        const container = document.getElementById('validation-panel');
        if (!container) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            container.innerHTML = this.renderEmptyState();
            this.lastValidationResultString = null;
            return;
        }

        const validationResult = CharacterValidator.validateCharacter(character);
        const currentResultString = JSON.stringify(validationResult);

        if (currentResultString === this.lastValidationResultString) {
            return; // No change in validation, no re-render
        }
        this.lastValidationResultString = currentResultString;

        container.innerHTML = this.renderValidation(validationResult);
        // console.log(`🔄 Validation display updated: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`);
    }

    renderValidation(validationResult) {
        return `
            <div class="validation-section">
                <h3>Character Status</h3>
                ${this.renderOverallStatus(validationResult)}
                ${this.renderBuildOrder(validationResult.sections?.buildOrder)}
                ${this.renderSectionValidation(validationResult.sections)}
                ${this.renderIssuesList(validationResult.errors, validationResult.warnings)}
            </div>
        `;
    }

    renderOverallStatus(validationResult) {
        const isValid = validationResult.isValid;
        const statusType = isValid ? 'success' : 'error'; // 'error' if any errors, 'warning' if only warnings
        if (!isValid && validationResult.errors.length === 0 && validationResult.warnings.length > 0) {
           // statusType = 'warning'; // Could refine this logic
        }

        const icon = isValid ? '✅' : (validationResult.errors.length > 0 ? '❌' : '⚠️');
        const titleText = isValid ? 'Character Valid' : (validationResult.errors.length > 0 ? 'Errors Found' : 'Warnings Found');
        const summaryText = `${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings.`;

        return `
            <div class="validation-status ${statusType}">
                <div class="status-icon">${icon}</div>
                <div class="status-text">
                    <div class="status-title">${titleText}</div>
                    <div class="status-summary">${summaryText}</div>
                </div>
            </div>
        `;
    }

    renderBuildOrder(buildOrderValidation) {
        if (!buildOrderValidation || !buildOrderValidation.buildState) return '';
        const buildState = buildOrderValidation.buildState;

        const steps = [
            { id: 'archetypes', name: 'Archetypes Complete', completed: buildState.archetypesComplete },
            { id: 'attributes', name: 'Attributes Assigned', completed: buildState.attributesAssigned },
            { id: 'mainPool', name: 'Main Pool Touched', completed: buildState.mainPoolPurchases }, // Assuming "touched"
            { id: 'specialAttacks', name: 'Special Attacks Exist', completed: buildState.hasSpecialAttacks }
        ];

        return `
            <div class="build-order-progress">
                <h4>Build Progress</h4>
                <div class="build-steps-list">
                    ${steps.map((step, index) => {
                        const isAccessible = index === 0 || steps[index - 1].completed;
                        return `
                            <div class="build-step-item ${step.completed ? 'completed' : (isAccessible ? 'pending' : 'locked')}">
                                <span class="step-icon">${step.completed ? '✅' : (isAccessible ? '⭕' : '🔒')}</span>
                                <span class="step-name">${step.name}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${buildOrderValidation.errors.length > 0 ? `<div class="error-text small-text">${buildOrderValidation.errors.join('<br>')}</div>` : ''}
                ${buildOrderValidation.warnings.length > 0 && buildOrderValidation.errors.length === 0 ? `<div class="warning-text small-text">${buildOrderValidation.warnings.join('<br>')}</div>` : ''}
            </div>
        `;
    }

    renderSectionValidation(sectionsValidation) {
        if (!sectionsValidation) return '';
        const sectionNamesMap = {
            buildOrder: 'Build Order',
            archetypes: 'Archetypes',
            attributes: 'Attributes',
            specialAttacks: 'Special Attacks',
            pointPools: 'Point Pools',
            // Add more user-friendly names if CharacterValidator returns more sections
        };

        return `
            <div class="section-validation-details">
                <h4>Section Status</h4>
                <div class="section-status-list">
                    ${Object.entries(sectionsValidation).map(([sectionKey, valResult]) => {
                        if (sectionKey === 'buildOrder') return ''; // Handled separately
                        const sectionName = sectionNamesMap[sectionKey] || sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                        const icon = valResult.isValid ? '✅' : (valResult.errors.length > 0 ? '❌' : '⚠️');
                        const issueSummary = [];
                        if (valResult.errors.length > 0) issueSummary.push(`${valResult.errors.length} err`);
                        if (valResult.warnings.length > 0) issueSummary.push(`${valResult.warnings.length} warn`);
                        
                        return `
                            <div class="section-status-item ${valResult.isValid ? 'valid' : (valResult.errors.length > 0 ? 'invalid' : 'has-warnings')}">
                                <span class="section-icon">${icon}</span>
                                <span class="section-name">${sectionName}</span>
                                <span class="section-issue-summary">${issueSummary.join(', ') || 'OK'}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderIssuesList(errors, warnings) {
        if (errors.length === 0 && warnings.length === 0) {
            return `<div class="no-issues-found status-indicator status-indicator-success">🎉 No validation issues found! Character is ready.</div>`;
        }
        return `
            <div class="issues-list-container">
                ${errors.length > 0 ? `
                    <div class="errors-section">
                        <h5>Errors (${errors.length})</h5>
                        <ul class="issue-items error-items">
                            ${errors.map(err => `<li>❌ ${err}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${warnings.length > 0 ? `
                    <div class="warnings-section">
                        <h5>Warnings (${warnings.length})</h5>
                        <ul class="issue-items warning-items">
                            ${warnings.map(warn => `<li>⚠️ ${warn}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="validation-section">
                <h3>Character Status</h3>
                <div class="empty-state">Create or select a character to see validation status.</div>
            </div>
        `;
    }
}
```

---
**FILE: `rulebook/character-builder/ui/tabs/ArchetypeTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/ArchetypeTab.js
import { ArchetypeSystem } from '../../systems/ArchetypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class ArchetypeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-archetypes');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }

        const categories = [
            { id: 'movement', name: 'Movement Archetype', description: 'How your character moves around the battlefield' },
            { id: 'attackType', name: 'Attack Type Archetype', description: 'What types of attacks your character specializes in' },
            { id: 'effectType', name: 'Effect Type Archetype', description: 'Whether you focus on damage, conditions, or both' },
            { id: 'uniqueAbility', name: 'Unique Ability Archetype', description: 'Special capabilities beyond standard actions' },
            { id: 'defensive', name: 'Defensive Archetype', description: 'How your character protects themselves' },
            { id: 'specialAttack', name: 'Special Attack Archetype', description: 'How you develop unique combat abilities' },
            { id: 'utility', name: 'Utility Archetype', description: 'Your non-combat capabilities and skills' }
        ];

        tabContent.innerHTML = `
            <div class="archetypes-section">
                <h2>Choose Archetypes</h2>
                <p class="section-description">
                    Select one archetype from each of the 7 categories. These choices define your character's
                    fundamental approach and provide point modifiers and restrictions.
                    <strong>All archetypes must be selected before proceeding.</strong>
                </p>

                <div class="archetype-progress">
                    <span id="archetype-count">0/7 Archetypes Selected</span>
                </div>

                ${categories.map(cat => this.renderArchetypeCategory(cat.id, cat.name, cat.description, character)).join('')}

                <div class="next-step">
                    <p><strong>Next Step:</strong> Assign your attribute points across combat and utility stats.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Attributes →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-attributes' }, // For EventManager
                        classes: ['continue-to-attributes-btn'], // Added for specific styling/JS if needed
                        disabled: true // Will be enabled by updateProgress
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners(); // For Archetype Cards
        this.updateProgress(); // Initial progress update
    }

    renderArchetypeCategory(categoryId, categoryName, description, character) {
        const archetypes = ArchetypeSystem.getArchetypesForCategory(categoryId);
        const selectedId = character.archetypes[categoryId];

        return `
            <div class="archetype-category" data-category="${categoryId}">
                <h3>${categoryName}</h3>
                <p class="category-description">${description}</p>

                ${RenderUtils.renderGrid(
                    archetypes,
                    (archetype) => RenderUtils.renderCard({
                        title: archetype.name,
                        titleTag: 'h4', // Use h4 for card titles within this section
                        description: archetype.description,
                        additionalContent: this.renderArchetypeDetails(archetype),
                        clickable: true,
                        selected: selectedId === archetype.id, // RenderUtils would need to handle 'selected' class
                        dataAttributes: { category: categoryId, archetype: archetype.id, action: 'select-archetype' }
                    }, { cardClass: `archetype-card ${selectedId === archetype.id ? 'selected' : ''}`, showCost: false, showStatus: false }),
                    { gridContainerClass: 'grid-layout archetype-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                )}
            </div>
        `;
    }

    renderArchetypeDetails(archetype) {
        let details = '';
        if (archetype.effects) {
            details += `<div class="archetype-effects"><strong>Effects:</strong> ${archetype.effects}</div>`;
        }
        if (archetype.restrictions) {
            details += `<div class="archetype-restrictions"><strong>Restrictions:</strong> ${archetype.restrictions}</div>`;
        }
        if (archetype.pointModifier) {
            details += `<div class="archetype-points"><strong>Points:</strong> ${archetype.pointModifier}</div>`;
        }
        return details;
    }

    setupEventListeners() {
        // EventManager at CharacterBuilder level will handle data-action clicks.
        // No direct querySelectors needed here if using data-action attributes.
    }

    selectArchetype(category, archetypeId) { // Called by CharacterBuilder's EventManager
        const character = this.builder.currentCharacter;
        if (!character) return;

        const validation = ArchetypeSystem.validateArchetypeSelection(character, category, archetypeId);
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors.join(', '), 'error');
            return;
        }
        if (validation.warnings.length > 0) {
            if (!confirm(`${validation.warnings.join(', ')}\n\nThis may require re-evaluating later choices. Continue?`)) {
                return;
            }
        }

        character.archetypes[category] = archetypeId;
        this.updateArchetypeSelectionUI(category, archetypeId); // Update UI for this specific selection
        this.updateProgress(); // Update overall progress
        this.builder.updateCharacter(); // Notify CharacterBuilder of change for broader updates
    }

    updateArchetypeSelectionUI(category, archetypeId) {
        const categoryElement = document.querySelector(`.archetype-category[data-category="${category}"]`);
        if (!categoryElement) return;

        categoryElement.querySelectorAll('.card.archetype-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.archetype === archetypeId) {
                card.classList.add('selected');
            }
        });
    }

    updateProgress() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const totalCategories = ArchetypeSystem.getArchetypeCategories().length;
        const selectedCount = Object.values(character.archetypes).filter(val => val !== null).length;

        const progressElement = document.getElementById('archetype-count');
        if (progressElement) {
            progressElement.textContent = `${selectedCount}/${totalCategories} Archetypes Selected`;
        }

        const continueBtn = document.querySelector('.continue-to-attributes-btn'); // Updated selector
        if (continueBtn) {
            const allSelected = selectedCount === totalCategories;
            continueBtn.disabled = !allSelected;
            continueBtn.classList.toggle('pulse', allSelected);
        }
        this.builder.updateTabStates(); // Ensure CharacterBuilder updates global tab states
    }
}
```
---
**FILE: `rulebook/character-builder/ui/tabs/AttributeTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/AttributeTab.js
import { AttributeSystem } from '../../systems/AttributeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class AttributeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-attributes');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or archetypes incomplete.</p>";
            return;
        }

        const pools = this.builder.calculatePointPools(); // Get fresh pool data

        tabContent.innerHTML = `
            <div class="attributes-section">
                <h2>Assign Attributes</h2>
                <p class="section-description">
                    Allocate your attribute points across combat and utility attributes.
                    Each attribute cannot exceed your tier (${character.tier}).
                </p>

                ${this.renderAttributePoolSection('Combat', 'combatAttributes', ['focus', 'mobility', 'power', 'endurance'], character, pools)}
                ${this.renderAttributePoolSection('Utility', 'utilityAttributes', ['awareness', 'communication', 'intelligence'], character, pools)}
                ${this.renderAttributeRecommendations(character)}

                <div class="next-step">
                    <p><strong>Next Step:</strong> Purchase abilities from your main pool.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Main Pool →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-mainpool' }
                    })}
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    renderAttributePoolSection(title, poolKey, attributeIds, character, pools) {
        const poolData = pools.totalAvailable[poolKey] !== undefined ? {
            spent: pools.totalSpent[poolKey] || 0,
            available: pools.totalAvailable[poolKey] || 0,
            remaining: pools.remaining[poolKey] || 0
        } : { spent: 0, available: 0, remaining: 0 };


        const attributeDefinitions = AttributeSystem.getAttributeDefinitions();

        return `
            <div class="attribute-pool ${poolKey}">
                <h3>${title} Attributes</h3>
                <div class="pool-status ${poolData.remaining < 0 ? 'over-budget' : poolData.remaining === 0 && poolData.spent > 0 ? 'fully-used' : ''}">
                    Points: <span class="points-display">${poolData.spent}/${poolData.available}</span>
                    ${poolData.remaining < 0 ? `<span class="error-text"> (OVER BUDGET by ${Math.abs(poolData.remaining)})</span>` : ''}
                </div>

                ${RenderUtils.renderGrid(
                    attributeIds,
                    (attrId) => this.renderAttributeControl(
                        attrId,
                        attributeDefinitions[attrId].name,
                        attributeDefinitions[attrId].description,
                        character
                    ),
                    { gridContainerClass: 'grid-layout attribute-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                )}
            </div>
        `;
    }

    renderAttributeControl(attrId, name, description, character) {
        const value = character.attributes[attrId] || 0;
        const max = character.tier;

        // Using card base for attribute items
        return RenderUtils.renderCard({
            title: name,
            titleTag: 'label', // Use label for better accessibility with slider
            description: description,
            additionalContent: `
                <div class="attribute-controls">
                    ${RenderUtils.renderButton({ text: '-', classes: ['attr-btn', 'minus'], dataAttributes: { attr: attrId, change: -1, action: 'change-attribute-btn' }, disabled: value <= 0 })}
                    <span class="attribute-value">${value}</span>
                    ${RenderUtils.renderButton({ text: '+', classes: ['attr-btn', 'plus'], dataAttributes: { attr: attrId, change: 1, action: 'change-attribute-btn' }, disabled: value >= max })}
                </div>
                <div class="attribute-limit">Max: ${max}</div>
                <div class="attribute-slider form-group">
                     <input type="range"
                           id="slider-${attrId}"
                           min="0"
                           max="${max}"
                           value="${value}"
                           data-attr="${attrId}"
                           data-action="change-attribute-slider">
                    <div class="slider-ticks">
                        ${Array.from({length: max + 1}, (_, i) => `<span class="tick ${i <= value ? 'filled' : ''}">${i}</span>`).join('')}
                    </div>
                </div>
            `
        }, { cardClass: 'attribute-item', showCost: false, showStatus: false });
    }


    renderAttributeRecommendations(character) {
        const recommendations = AttributeSystem.getAttributeRecommendations(character);
        if (recommendations.length === 0) return '';
        return `
            <div class="attribute-recommendations">
                <h4>Archetype Recommendations</h4>
                <ul>
                    ${recommendations.map(rec => `
                        <li><strong>${AttributeSystem.getAttributeDefinitions()[rec.attribute]?.name || rec.attribute}:</strong> ${rec.reason}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    setupEventListeners() {
        // EventManager at CharacterBuilder will handle data-action clicks/inputs.
    }

    changeAttribute(attrId, change) { // Called by CharacterBuilder's EventManager
        const character = this.builder.currentCharacter;
        if (!character) return;

        const currentValue = character.attributes[attrId] || 0;
        const newValue = Math.max(0, Math.min(character.tier, currentValue + change));
        this.updateAttributeValue(attrId, newValue);
    }

    setAttributeViaSlider(attrId, newValue) { // Called by CharacterBuilder's EventManager
        this.updateAttributeValue(attrId, parseInt(newValue));
    }

    updateAttributeValue(attrId, newValue) {
        const character = this.builder.currentCharacter;
        const oldValue = character.attributes[attrId] || 0;

        if (oldValue === newValue) return; // No change

        const validation = AttributeSystem.validateAttributeAssignment(character, attrId, newValue);
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors.join(', '), 'error');
            // Re-render to show previous valid state (or current invalid state if it was already invalid)
            this.render(); // This might be too broad, ideally just update the specific attribute UI
            return;
        }

        character.attributes[attrId] = newValue;
        this.builder.updateCharacter(); // Triggers re-render of this tab and PointPoolDisplay
    }

    // onCharacterUpdate will be called by CharacterBuilder, triggering a re-render
    // of this tab if it's active, which will update all values.
}
```
---
**FILE: `rulebook/character-builder/ui/tabs/BasicInfoTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/BasicInfoTab.js
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class BasicInfoTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-basicInfo');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="basic-info-section">
                <h2>Character Information</h2>
                <p class="section-description">Enter your character's basic information to begin building.</p>

                ${RenderUtils.renderFormGroup({
                    label: 'Hero Name *',
                    inputId: 'character-name',
                    inputHtml: `<input type="text" id="character-name" placeholder="Enter your hero name" value="${character.name || ''}" data-action="update-char-name">`,
                    description: "The name your character uses in their heroic identity"
                })}

                ${RenderUtils.renderFormGroup({
                    label: 'Real Name',
                    inputId: 'real-name',
                    inputHtml: `<input type="text" id="real-name" placeholder="Enter your character's real name" value="${character.realName || ''}" data-action="update-real-name">`,
                    description: "Your character's civilian identity (optional)"
                })}

                ${RenderUtils.renderFormGroup({
                    label: 'Character Tier *',
                    inputId: 'tier-select',
                    inputHtml: RenderUtils.renderSelect({
                        id: 'tier-select',
                        value: character.tier || 4,
                        options: Array.from({length: 10}, (_, i) => ({ value: i + 1, label: `${i + 1} - ${this.getTierDescription(i + 1)}`})),
                        dataAttributes: { action: 'update-tier' }
                    }),
                    description: "Tier represents your character's overall power level and experience"
                })}

                <div class="tier-info">
                    <h3>Tier Information</h3>
                    <div id="tier-description-display"></div>
                    <div class="tier-effects">
                        <h4>Tier Effects:</h4>
                        <ul id="tier-effects-list"></ul>
                    </div>
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Choose your 7 archetype categories to define your character's core abilities.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Archetypes →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-archetypes' }
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners(); // For direct event listeners if any, or rely on CharacterBuilder
        this.updateTierDisplay(character.tier); // Initial display
    }


    getTierDescription(tier) {
        // ... (same as before)
        const descriptions = {
            1: "Novice", 2: "Developing", 3: "Competent", 4: "Professional", 5: "Veteran",
            6: "Expert", 7: "Elite", 8: "Master", 9: "Legendary", 10: "World-class Expert"
        };
        return descriptions[tier] || "Unknown";
    }
    getTierFlavorText(tier) {
        // ... (same as before)
        const flavorTexts = {
            1: "Just starting out on your heroic journey. You have potential but lack experience.",
            2: "Developing your abilities and gaining confidence in your powers.",
            3: "A competent hero who can handle most everyday threats reliably.",
            4: "A professional hero with established capabilities and reputation.",
            5: "A veteran hero with significant experience and refined abilities.",
            6: "An expert hero whose skills are recognized and respected.",
            7: "An elite hero operating at the highest levels of competence.",
            8: "A master hero pushing the boundaries of human capability.",
            9: "A legendary hero whose deeds inspire others and shape history.",
            10: "A world-class expert representing the absolute pinnacle of heroic achievement."
        };
        return flavorTexts[tier] || "A hero of unknown caliber.";
    }


    setupEventListeners() {
        // EventManager at CharacterBuilder level will handle data-action inputs/changes.
    }

    updateName(newName) { // Called by CharacterBuilder
        const character = this.builder.currentCharacter;
        if (character) {
            character.name = newName || 'Unnamed Character';
            this.builder.updateCharacter(); // This also updates the header
        }
    }
    updateRealName(newRealName) { // Called by CharacterBuilder
        const character = this.builder.currentCharacter;
        if (character) {
            character.realName = newRealName;
            this.builder.updateCharacter();
        }
    }
    updateTier(newTier) { // Called by CharacterBuilder
        const character = this.builder.currentCharacter;
        if (character) {
            character.tier = parseInt(newTier);
            this.updateTierDisplay(character.tier);
            this.builder.updateCharacter(); // This updates header and point pools
        }
    }

    updateTierDisplay(tier) {
        const descElement = document.getElementById('tier-description-display');
        if (descElement) {
            descElement.innerHTML = `
                <p><strong>Tier ${tier}:</strong> ${this.getTierDescription(tier)}</p>
                <p>${this.getTierFlavorText(tier)}</p>
            `;
        }

        const effectsList = document.getElementById('tier-effects-list');
        if (effectsList) {
             // These values should ideally come from TierSystem.js or GameConstants.js
            effectsList.innerHTML = `
                <li><strong>Bonus to all actions:</strong> +${tier}</li>
                <li><strong>Maximum attribute rank:</strong> ${tier}</li>
                <li><strong>Combat attribute points:</strong> ${tier * 2}</li>
                <li><strong>Utility attribute points:</strong> ${tier}</li>
                <li><strong>Main pool points:</strong> ${Math.max(0, (tier - 2) * 15)}</li>
                <li><strong>Utility pool points:</strong> ${Math.max(0, 5 * (tier - 1))}</li>
                <li><strong>HP (Base):</strong> 100 (Actual HP includes Endurance bonuses)</li>
            `;
        }
    }
     // onCharacterUpdate can re-call render if needed, or more granular updates.
    onCharacterUpdate() {
        // If only tier could change that affects this tab's specific display (beyond header)
        const tierSelect = document.getElementById('tier-select');
        if (tierSelect && this.builder.currentCharacter && tierSelect.value != this.builder.currentCharacter.tier) {
             tierSelect.value = this.builder.currentCharacter.tier;
             this.updateTierDisplay(this.builder.currentCharacter.tier);
        }
         const nameInput = document.getElementById('character-name');
         if(nameInput && this.builder.currentCharacter && nameInput.value !== this.builder.currentCharacter.name) {
            nameInput.value = this.builder.currentCharacter.name;
         }
         const realNameInput = document.getElementById('real-name');
         if(realNameInput && this.builder.currentCharacter && realNameInput.value !== this.builder.currentCharacter.realName) {
            realNameInput.value = this.builder.currentCharacter.realName;
         }
    }
}
```
---
**FILE: `rulebook/character-builder/ui/tabs/MainPoolTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/MainPoolTab.js
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { FlawPurchaseSection } from '../components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from '../components/TraitPurchaseSection.js';
import { SimpleBoonSection } from '../components/SimpleBoonSection.js';
import { UniqueAbilitySection } from '../components/UniqueAbilitySection.js';
import { ActionUpgradeSection } from '../components/ActionUpgradeSection.js';
import { UpdateManager } from '../shared/UpdateManager.js';
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.sections = {
            flaws: new FlawPurchaseSection(characterBuilder),
            traits: new TraitPurchaseSection(characterBuilder),
            simpleBoons: new SimpleBoonSection(characterBuilder),
            uniqueAbilities: new UniqueAbilitySection(characterBuilder),
            actions: new ActionUpgradeSection(characterBuilder)
        };
        this.activeSection = 'flaws'; // Default section
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or previous steps incomplete.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="main-pool-tab-content">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Use your main pool points to purchase flaws, traits, simple boons, unique abilities, and action upgrades.
                </p>

                ${this.renderPointPoolInfo(character)}
                ${this.renderSectionNavigation()}
                <div class="section-content-area" id="main-pool-active-section">
                    ${this.renderActiveSectionContent(character)}
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks using limits and upgrades.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Special Attacks →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-special-attacks' }
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderPointPoolInfo(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const mainPoolInfo = {
            spent: pools.totalSpent.mainPool || 0,
            available: pools.totalAvailable.mainPool || 0,
            remaining: pools.remaining.mainPool || 0
        };
        const breakdown = this.calculatePointBreakdown(character, pools); // Pass full pools

        return `
            <div class="point-pool-display main-pool-specific-display">
                ${RenderUtils.renderPointDisplay(
                    mainPoolInfo.spent,
                    mainPoolInfo.available,
                    'Main Pool',
                    { showRemaining: true, variant: mainPoolInfo.remaining < 0 ? 'error' : mainPoolInfo.remaining === 0 && mainPoolInfo.spent > 0 ? 'warning' : 'default' }
                )}
                <div class="pool-sources">
                    <small>Base: ${Math.max(0, (character.tier - 2) * 15)}
                    ${character.archetypes.uniqueAbility === 'extraordinary' ? ` (+${Math.max(0, (character.tier - 2) * 15)} from Extraordinary)` : ''}
                    </small>
                </div>
                ${this.renderPointUsageBreakdown(breakdown)}
            </div>
        `;
    }

    renderPointUsageBreakdown(breakdown) {
        // Only render if there's something spent
        if (Object.values(breakdown).every(val => val === 0)) {
            return '<div class="empty-state-small">No Main Pool points spent yet.</div>';
        }

        const items = [
            { label: 'Simple Boons', value: breakdown.simpleBoons, class: 'boon-cost' },
            { label: 'Unique Abilities', value: breakdown.uniqueAbilities, class: 'ability-cost' },
            { label: 'Traits', value: breakdown.traits, class: 'trait-cost' },
            { label: 'Flaws (Cost)', value: breakdown.flaws, class: 'flaw-item-cost' }, // Flaws cost points
            { label: 'Action Upgrades', value: breakdown.actions, class: 'action-cost' },
        ].filter(item => item.value > 0);

        return `
            <div class="pool-spending-details">
                <h6>Point Usage Breakdown:</h6>
                <div class="spending-grid grid-layout grid-columns-auto-fit-200">
                    ${items.map(item => `
                        <div class="spending-item ${item.class || ''}">
                            <span>${item.label}:</span>
                            <span>-${item.value}p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculatePointBreakdown(character, pools) { // pools might not be needed if we recalculate from character.mainPoolPurchases
        return {
            simpleBoons: character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type).reduce((sum, b) => sum + (b.cost || 0), 0),
            uniqueAbilities: character.mainPoolPurchases.boons.filter(b => b.type === 'unique').reduce((sum, b) => sum + (b.cost || 0), 0),
            traits: character.mainPoolPurchases.traits.reduce((sum, t) => sum + (t.cost || 0), 0),
            flaws: character.mainPoolPurchases.flaws.reduce((sum, f) => sum + (f.cost || 0), 0),
            actions: character.mainPoolPurchases.primaryActionUpgrades.reduce((sum, a) => sum + (a.cost || 0), 0),
        };
    }


    renderSectionNavigation() {
        const sectionTabsConfig = [
            { id: 'flaws', label: 'Flaws' },
            { id: 'traits', label: 'Traits' },
            { id: 'simpleBoons', label: 'Simple Boons' },
            { id: 'uniqueAbilities', label: 'Unique Abilities' },
            { id: 'actions', label: 'Action Upgrades' }
        ];
        return RenderUtils.renderTabs(sectionTabsConfig, this.activeSection, { navClass: 'section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveSectionContent(character) {
        const sectionComponent = this.sections[this.activeSection];
        if (!sectionComponent) return '<p class="error-text">Error: Selected section not found.</p>';

        const pools = PointPoolCalculator.calculateAllPools(character);
        const mainPoolInfo = {
            spent: pools.totalSpent.mainPool || 0,
            available: pools.totalAvailable.mainPool || 0,
            remaining: pools.remaining.mainPool || 0
        };
        return sectionComponent.render(character, mainPoolInfo);
    }

    setupEventListeners() {
        const container = document.querySelector('.main-pool-tab-content');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                '.section-tab': (e, el) => this.handleSectionSwitch(el.dataset.section),
                '[data-action="continue-to-special-attacks"]': () => this.builder.switchTab('specialAttacks'),
                // Delegate actions for children components
                '[data-action="purchase-flaw"]': (e, el) => this.sections.flaws.handleFlawPurchase(el.dataset.flawId),
                '[data-action="remove-flaw"]': (e, el) => this.sections.flaws.handleFlawRemoval(parseInt(el.dataset.index)),
                '[data-action="clear-trait-builder"]': () => this.sections.traits.handleClearBuilder(),
                '[data-action="purchase-trait"]': () => this.sections.traits.handleTraitPurchase(),
                '[data-action="remove-trait"]': (e, el) => this.sections.traits.handleTraitRemoval(parseInt(el.dataset.index)),
                '[data-action="purchase-simple-boon"]': (e, el) => this.sections.simpleBoons.purchaseSimpleBoon(el.dataset.boonId),
                '[data-action="remove-simple-boon"]': (e, el) => this.sections.simpleBoons.removeBoon(el.dataset.boonId),
                '[data-action="purchase-unique-ability"]': (e, el) => this.sections.uniqueAbilities.purchaseUniqueAbility(el.dataset.abilityId),
                '[data-action="remove-unique-ability"]': (e, el) => this.sections.uniqueAbilities.removeAbility(el.dataset.boonId),
                '[data-action="modify-unique-ability"]': (e, el) => this.sections.uniqueAbilities.modifyAbility(el.dataset.boonId),
                '[data-action="purchase-action-upgrade"]': (e, el) => this.sections.actions.purchaseActionUpgrade(el.dataset.actionId),
                '[data-action="remove-action-upgrade"]': (e, el) => this.sections.actions.removeUpgrade(parseInt(el.dataset.index))
            },
            change: { // For trait builder internal updates
                '.stat-checkbox': (e, el) => { if (this.activeSection === 'traits') this.sections.traits.handleStatSelection(el);},
                '.condition-checkbox': (e, el) => { if (this.activeSection === 'traits') this.sections.traits.handleConditionSelection(el);},
                '.flaw-purchase-section-content .stat-bonus-select': (e, el) => { // Specific to flaw section select
                     if (this.activeSection === 'flaws' && this.sections.flaws.handleStatBonusChange) {
                        this.sections.flaws.handleStatBonusChange(e, el);
                    }
                },
                '.unique-ability-section .upgrade-checkbox': (e, el) => { // Specific to unique ability section
                    if (this.activeSection === 'uniqueAbilities' && this.sections.uniqueAbilities.handleUpgradeSelectionChange) {
                        this.sections.uniqueAbilities.handleUpgradeSelectionChange(el);
                    }
                }
            },
            input: {
                 '.unique-ability-section .upgrade-qty': (e, el) => { // Specific to unique ability section
                    if (this.activeSection === 'uniqueAbilities' && this.sections.uniqueAbilities.handleUpgradeQuantityChange) {
                        this.sections.uniqueAbilities.handleUpgradeQuantityChange(el);
                    }
                }
            }
        });
        // Call setup for the currently active section if it has its own more complex listeners
        this.sections[this.activeSection]?.setupEventListeners?.();
    }


    handleSectionSwitch(newSection) {
        if (newSection && newSection !== this.activeSection) {
            this.activeSection = newSection;
            this.updateActiveSectionUI();
        }
    }

    updateActiveSectionUI() {
        // Update tab button active states
        document.querySelectorAll('.main-pool-tab-content .section-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === this.activeSection);
        });
        // Re-render the content of the active section
        const contentArea = document.getElementById('main-pool-active-section');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveSectionContent(this.builder.currentCharacter);
            // Re-run setupEventListeners for the *newly rendered content of the active section* if it has complex needs
            this.sections[this.activeSection]?.setupEventListeners?.();
        }
    }

    onCharacterUpdate() { // Called by CharacterBuilder
        // Re-render the point pool display and the currently active section
        const pointPoolContainer = document.querySelector('.main-pool-specific-display');
        if (pointPoolContainer && this.builder.currentCharacter) {
            pointPoolContainer.innerHTML = this.renderPointPoolInfo(this.builder.currentCharacter);
        }
        this.updateActiveSectionUI();
    }
}
```

---
**FILE: `rulebook/character-builder/ui/tabs/SpecialAttackTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/SpecialAttackTab.js
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { LimitCalculator } from '../../calculators/LimitCalculator.js';
// import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js'; // Already imported
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedAttackIndex = 0;
        this.showingLimitModal = false;
        this.showingUpgradeModal = false;
        // Add more specific modal states if needed, e.g., for attack types
    }

    render() {
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or prerequisites not met.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="special-attacks-section">
                <h2>Special Attacks</h2>
                <p class="section-description">
                    Create unique combat abilities using your special attack archetype rules.
                    Use limits to generate upgrade points, then purchase enhancements.
                </p>

                ${this.renderArchetypeInfo(character)}
                ${this.renderAttackManagement(character)}
                ${character.specialAttacks.length > 0 && character.specialAttacks[this.selectedAttackIndex] ?
                    this.renderAttackBuilder(character) :
                    '<div class="empty-state">No attack selected or available to build.</div>'}
                ${this.renderLimitModal(character)}
                ${this.renderUpgradeModal(character)}
                ${this.renderAttackTypeModal(character)}


                <div class="next-step">
                    <p><strong>Next Step:</strong> Configure utility abilities and expertise.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Utility →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-utility' }
                    })}
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    renderArchetypeInfo(character) {
        const archetypeId = character.archetypes.specialAttack;
        const archetypeDetails = SpecialAttackSystem.getSpecialAttackArchetypeDetails ? // Check if new method exists
                                SpecialAttackSystem.getSpecialAttackArchetypeDetails(character) :
                                { name: this.formatArchetypeName(archetypeId), description: this.getArchetypeDescription(archetypeId, character) };


        return `
            <div class="archetype-info card">
                <div class="card-header">
                    <h3 class="card-title">Special Attack Archetype: ${archetypeDetails.name}</h3>
                </div>
                <div class="card-description">
                    ${archetypeDetails.description}
                </div>
            </div>
        `;
    }
    // getArchetypeDescription remains the same


    renderAttackManagement(character) {
        const canCreate = SpecialAttackSystem.validateCanCreateAttack(character); // Using system
        const attacks = character.specialAttacks;

        return `
            <div class="attack-management">
                <div class="attack-list-header">
                    <h3>Attacks (${attacks.length})</h3>
                    ${RenderUtils.renderButton({
                        text: '+ Create Attack',
                        variant: 'primary',
                        disabled: !canCreate.isValid,
                        dataAttributes: { action: 'create-attack' },
                        title: canCreate.isValid ? 'Create a new special attack' : (canCreate.errors[0] || 'Cannot create more attacks')
                    })}
                </div>
                ${!canCreate.isValid && canCreate.errors.length > 0 ? `<p class="error-text small-text">${canCreate.errors[0]}</p>`: ''}

                ${attacks.length > 0 ? `
                    <div class="attack-tabs-container">
                        ${attacks.map((attack, index) => `
                            <div class="attack-tab ${index === this.selectedAttackIndex ? 'active' : ''}"
                                 data-attack-index="${index}" data-action="select-attack-tab">
                                <span class="attack-tab-name">${attack.name || `Attack ${index + 1}`}</span>
                                <span class="attack-tab-points">${attack.upgradePointsSpent || 0}/${attack.upgradePointsAvailable || 0}p</span>
                                ${RenderUtils.renderButton({
                                    text: '×',
                                    variant: 'danger',
                                    size: 'small',
                                    classes: ['delete-attack-btn'],
                                    dataAttributes: { action: 'delete-attack', index: index },
                                    title: `Delete ${attack.name || `Attack ${index + 1}`}`
                                })}
                            </div>
                        `).join('')}
                    </div>
                ` : `<div class="empty-state">No special attacks created yet.</div>`}
            </div>
        `;
    }

    renderAttackBuilder(character) {
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return '<div class="empty-state">Select an attack to build.</div>';

        return `
            <div class="attack-builder card">
                ${this.renderAttackBasics(attack)}
                ${this.renderAttackTypesSection(attack, character)}
                ${this.renderLimitsSection(attack, character)}
                ${this.renderUpgradesSection(attack, character)}
                ${this.renderPointsSummary(attack)}
            </div>
        `;
    }

    renderAttackBasics(attack) {
        return `
            <div class="attack-basics-form">
                ${RenderUtils.renderFormGroup({
                    label: 'Attack Name',
                    inputId: `attack-name-${this.selectedAttackIndex}`,
                    inputHtml: `<input type="text" id="attack-name-${this.selectedAttackIndex}" value="${attack.name}" placeholder="Enter attack name" data-action="update-attack-name">`
                })}
                ${RenderUtils.renderFormGroup({
                    label: 'Description',
                    inputId: `attack-description-${this.selectedAttackIndex}`,
                    inputHtml: `<textarea id="attack-description-${this.selectedAttackIndex}" placeholder="Describe your attack..." data-action="update-attack-description">${attack.description || ''}</textarea>`
                })}
            </div>
        `;
    }

    renderAttackTypesSection(attack, character) {
        // This section needs to show selected attack types and allow adding/removing them.
        // For brevity, a simplified version. A modal would be better for selection.
        const selectedTypes = attack.attackTypes || [];
        const availableTypes = AttackTypeSystem.getAttackTypeDefinitions(); // Get all
        const freeTypesFromArchetype = AttackTypeSystem.getFreeAttackTypesFromArchetype(character);


        return `
            <div class="attack-types-section section-block">
                 <div class="section-header">
                    <h4>Attack Types (${selectedTypes.length})</h4>
                    ${RenderUtils.renderButton({ text: '+ Add Attack Type', variant: 'secondary', size: 'small', dataAttributes: { action: 'open-attack-type-modal' }})}
                </div>
                ${selectedTypes.length > 0 ? `
                    <div class="selected-items-list">
                        ${selectedTypes.map(typeId => {
                            const typeDef = availableTypes[typeId];
                            const cost = freeTypesFromArchetype.includes(typeId) ? 0 : typeDef.cost;
                            return `
                                <div class="selected-item">
                                    <span>${typeDef.name} (${cost}p) ${freeTypesFromArchetype.includes(typeId) ? '(Free)' : ''}</span>
                                    ${RenderUtils.renderButton({text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-attack-type', 'type-id': typeId}})}
                                </div>`;
                        }).join('')}
                    </div>
                ` : `<div class="empty-state-small">No attack types selected.</div>`}
            </div>
        `;
    }
     renderAttackTypeModal(character) {
        if (!character || !character.specialAttacks[this.selectedAttackIndex]) return '';
        const attack = character.specialAttacks[this.selectedAttackIndex];
        const allTypes = AttackTypeSystem.getAttackTypeDefinitions();
        const freeTypes = AttackTypeSystem.getFreeAttackTypesFromArchetype(character);

        return `
            <div id="attack-type-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Attack Type</h3>
                        ${RenderUtils.renderButton({ text: '×', variant: 'secondary', size: 'small', dataAttributes: { action: 'close-attack-type-modal' }})}
                    </div>
                    <div class="modal-body">
                        ${RenderUtils.renderGrid(
                            Object.values(allTypes),
                            (typeDef) => {
                                const isSelected = attack.attackTypes.includes(typeDef.id);
                                const cost = freeTypes.includes(typeDef.id) ? 0 : typeDef.cost;
                                const canAfford = (attack.upgradePointsAvailable - attack.upgradePointsSpent) >= cost;
                                let status = isSelected ? 'purchased' : (canAfford ? 'available' : 'unaffordable');

                                return RenderUtils.renderCard({
                                    title: typeDef.name,
                                    cost: cost,
                                    description: `${typeDef.description} ${typeDef.penalty ? `<br><strong>Penalty:</strong> ${typeDef.penalty}` : ''}`,
                                    status: status,
                                    clickable: !isSelected && canAfford,
                                    disabled: isSelected || !canAfford,
                                    dataAttributes: { action: 'select-attack-type', 'type-id': typeDef.id, cost: cost }
                                }, { cardClass: 'attack-type-option', showStatus: true });
                            },
                            { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                        )}
                    </div>
                </div>
            </div>
        `;
    }


    renderLimitsSection(attack, character) {
        // ... (renderLimitItem should use RenderUtils.renderButton for delete)
        // ... (add limit button should use RenderUtils.renderButton)
        const archetype = character.archetypes.specialAttack;
        const canUseLimits = SpecialAttackSystem.canArchetypeUseLimits ? SpecialAttackSystem.canArchetypeUseLimits(archetype) : !['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype);

        if (!canUseLimits) {
            return `
                <div class="limits-section section-block disabled">
                    <h4>Limits</h4>
                    <p class="archetype-restriction">${this.formatArchetypeName(archetype)} archetype cannot use limits.</p>
                </div>
            `;
        }
        const limitBreakdown = LimitCalculator.getCalculationBreakdown(attack.limitPointsTotal || 0, character.tier, archetype);


        return `
            <div class="limits-section section-block">
                <div class="section-header">
                    <h4>Limits (${attack.limits.length})</h4>
                    ${RenderUtils.renderButton({ text: '+ Add Limit', variant: 'secondary', size: 'small', dataAttributes: { action: 'open-limit-modal' }})}
                </div>
                 ${RenderUtils.renderPurchasedList( // Using purchased list for display
                    attack.limits,
                    (limit, index) => this.renderLimitItem(limit, index),
                    { listContainerClass: 'limits-list selected-items-list', emptyMessage: 'No limits selected. Add limits to generate upgrade points.' }
                )}
                ${attack.limits.length > 0 ? `
                    <div class="limit-calculation-details">
                        <h5>Point Calculation from Limits</h5>
                        <div class="calculation-breakdown">
                            ${limitBreakdown.steps.map(step => `<div class="calc-line">${step}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    renderLimitItem(limit, index) {
        return `
            <div class="selected-item limit-item">
                <div class="item-header">
                    <span class="item-name">${limit.name}</span>
                    <span class="item-value">${limit.points}p</span>
                </div>
                <div class="item-description">${limit.description}</div>
                ${RenderUtils.renderButton({text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-limit', index: index}})}
            </div>
        `;
    }


    renderUpgradesSection(attack, character) {
        // ... (browse upgrades button should use RenderUtils.renderButton)
        // ... (purchased upgrade items should use a consistent structure, maybe a variant of .selected-item)
         const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        return `
            <div class="upgrades-section section-block">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining">
                        Upgrade Points: <span class="${remainingPoints < 0 ? 'error-text' : ''}">${remainingPoints}</span> / ${attack.upgradePointsAvailable || 0}
                    </div>
                </div>
                 ${RenderUtils.renderPurchasedList(
                    attack.upgrades || [],
                    (upgrade, index) => this.renderPurchasedUpgrade(upgrade, index),
                    { listContainerClass: 'upgrades-list selected-items-list', title: `Purchased Upgrades (${attack.upgrades?.length || 0})`, showCount: false, emptyMessage: 'No upgrades purchased yet.' }
                )}
                <div class="browse-upgrades-action">
                     ${RenderUtils.renderButton({ text: 'Browse Available Upgrades', variant: 'secondary', size: 'small', dataAttributes: { action: 'open-upgrade-modal' }})}
                </div>
            </div>
        `;
    }
    renderPurchasedUpgrade(upgrade, index) {
         return `
            <div class="selected-item purchased-upgrade">
                 <div class="item-header">
                    <span class="item-name">${upgrade.name}</span>
                    <span class="item-value">${upgrade.cost}p</span>
                </div>
                <div class="item-description">${upgrade.description || upgrade.effect || 'Effect details missing.'}</div>
                ${RenderUtils.renderButton({text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-upgrade', index: index}})}
            </div>
        `;
    }


    renderPointsSummary(attack) {
        // ... (use RenderUtils.renderPointDisplay for consistency if applicable)
        const remaining = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        const status = remaining < 0 ? 'error' : (remaining === 0 && (attack.upgradePointsAvailable || 0) > 0 ? 'warning' : 'default');

        return `
            <div class="points-summary-block section-block">
                <h4>Attack Point Summary</h4>
                ${RenderUtils.renderPointDisplay(attack.upgradePointsSpent || 0, attack.upgradePointsAvailable || 0, 'Upgrade Points', {showRemaining: true, variant: status})}
            </div>
        `;
    }

    renderLimitModal(character) {
        // ... (options should be rendered as cards using RenderUtils.renderCard)
        // ... (close button uses RenderUtils.renderButton)
        const allLimits = LimitCalculator.getAllLimits();
        const attack = character.specialAttacks[this.selectedAttackIndex];

        return `
            <div id="limit-modal" class="modal ${this.showingLimitModal ? '' : 'hidden'}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Limit to "${attack?.name || 'Attack'}"</h3>
                        ${RenderUtils.renderButton({ text: '×', variant: 'secondary', size: 'small', dataAttributes: { action: 'close-limit-modal' }})}
                    </div>
                    <div class="modal-body">
                        ${Object.entries(allLimits).map(([category, limits]) => `
                            <div class="limit-category-modal">
                                <h4>${this.formatCategoryName(category)}</h4>
                                ${RenderUtils.renderGrid(
                                    limits,
                                    (limit) => {
                                        const isSelected = attack?.limits.some(l => l.id === limit.id);
                                        // Basic validation for display, actual validation in system
                                        const validation = attack ? SpecialAttackSystem.validateLimitAddition(character, attack, limit) : {isValid: true};
                                        return RenderUtils.renderCard({
                                            title: limit.name,
                                            cost: limit.points,
                                            description: limit.description,
                                            status: isSelected ? 'purchased' : (validation.isValid ? 'available' : 'error'),
                                            clickable: !isSelected && validation.isValid,
                                            disabled: isSelected || !validation.isValid,
                                            dataAttributes: { action: 'select-limit', 'limit-id': limit.id }
                                        }, { cardClass: 'limit-option', showStatus: true });
                                    },
                                    { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                                )}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderUpgradeModal(character) {
        // ... (options should be rendered as cards using RenderUtils.renderCard)
        // ... (close button uses RenderUtils.renderButton)
        const attack = character.specialAttacks[this.selectedAttackIndex];
        // Simplified upgrade categories for now as in original
        const upgradeCategories = SpecialAttackSystem.getAvailableUpgrades ? SpecialAttackSystem.getAvailableUpgrades(character, attack) : { /* fallback from original */ };


        return `
            <div id="upgrade-modal" class="modal ${this.showingUpgradeModal ? '' : 'hidden'}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Purchase Upgrades for "${attack?.name || 'Attack'}"</h3>
                        ${RenderUtils.renderButton({ text: '×', variant: 'secondary', size: 'small', dataAttributes: { action: 'close-upgrade-modal' }})}
                    </div>
                     <div class="modal-points-info">
                        Available Points: ${(attack?.upgradePointsAvailable || 0) - (attack?.upgradePointsSpent || 0)}
                    </div>
                    <div class="modal-body">
                       ${Object.entries(upgradeCategories).map(([categoryName, upgrades]) => `
                            <div class="upgrade-category-modal">
                                <h4>${this.formatCategoryName(categoryName)}</h4>
                                ${RenderUtils.renderGrid(
                                    upgrades,
                                    (upgrade) => {
                                        const isSelected = attack?.upgrades?.some(u => u.id === upgrade.id);
                                        const canAfford = attack ? (attack.upgradePointsAvailable - attack.upgradePointsSpent) >= upgrade.cost : false;
                                        let status = isSelected ? 'purchased' : (canAfford ? 'available' : 'unaffordable');
                                        // Further validation if needed from SpecialAttackSystem.validateUpgradeAddition
                                        return RenderUtils.renderCard({
                                            title: upgrade.name,
                                            cost: upgrade.cost,
                                            description: upgrade.description,
                                            status: status,
                                            clickable: !isSelected && canAfford,
                                            disabled: isSelected || !canAfford,
                                            dataAttributes: { action: 'select-upgrade', 'upgrade-id': upgrade.id }
                                        }, { cardClass: 'upgrade-option', showStatus: true });
                                    },
                                    { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                                )}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    // setupEventListeners will be more reliant on data-actions handled by CharacterBuilder
    // formatArchetypeName and formatCategoryName remain the same

    // Method stubs for actions called by CharacterBuilder via EventManager
    // (Implementations would call SpecialAttackSystem and then this.builder.updateCharacter() & this.render())
    createNewAttack() {
        const character = this.builder.currentCharacter;
        if (!character) return;
        try {
            const newAttack = SpecialAttackSystem.createSpecialAttack(character); // System handles validation now
            character.specialAttacks.push(newAttack);
            this.selectedAttackIndex = character.specialAttacks.length - 1;
            this.builder.updateCharacter(); // This triggers re-render via CharacterBuilder
            this.builder.showNotification('New attack created!', 'success');
        } catch (error) {
            this.builder.showNotification(`Error creating attack: ${error.message}`, 'error');
        }
    }
    deleteAttack(index) {
        const character = this.builder.currentCharacter;
        if (!character || !character.specialAttacks[index]) return;
        const attackName = character.specialAttacks[index].name;
        if (confirm(`Delete "${attackName}"?`)) {
            SpecialAttackSystem.deleteSpecialAttack(character, index);
            if (this.selectedAttackIndex >= character.specialAttacks.length) {
                this.selectedAttackIndex = Math.max(0, character.specialAttacks.length - 1);
            }
            this.builder.updateCharacter();
            this.builder.showNotification(`Attack "${attackName}" deleted.`, 'info');
        }
    }
    updateAttackName(newName) {
        const attack = this.builder.currentCharacter?.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            attack.name = newName;
            this.builder.updateCharacter(); // Debounced update will happen
        }
    }
    updateAttackDescription(newDescription) {
         const attack = this.builder.currentCharacter?.specialAttacks[this.selectedAttackIndex];
        if (attack) {
            attack.description = newDescription;
            this.builder.updateCharacter();
        }
    }
    openLimitModal() { this.showingLimitModal = true; this.render(); }
    closeLimitModal() { this.showingLimitModal = false; this.render(); }
    addLimit(limitId) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
        // Fetch full limit data
        const limitData = LimitCalculator.findLimitById(limitId);
        if(!limitData) {
            this.builder.showNotification('Limit definition not found.', 'error'); return;
        }
        try {
            SpecialAttackSystem.addLimitToAttack(character, this.selectedAttackIndex, limitData);
            this.builder.updateCharacter();
            this.closeLimitModal(); // Re-renders implicitly via builder update if tab is active
            this.builder.showNotification('Limit added.', 'success');
        } catch(error) {
            this.builder.showNotification(`Failed to add limit: ${error.message}`, 'error');
        }
    }
    removeLimit(limitIndexOnAttack) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
        try {
            // Assume SpecialAttackSystem.removeLimitFromAttack(character, attackIndex, limitIndexOnAttack)
            const removedLimit = attack.limits.splice(limitIndexOnAttack, 1)[0];
            SpecialAttackSystem.recalculateAttackPoints(character, attack); // Ensure system recalculates
            this.builder.updateCharacter();
            this.builder.showNotification(`Limit "${removedLimit.name}" removed.`, 'info');
        } catch(error) {
            this.builder.showNotification(`Failed to remove limit: ${error.message}`, 'error');
        }
    }

    openUpgradeModal() { this.showingUpgradeModal = true; this.render(); }
    closeUpgradeModal() { this.showingUpgradeModal = false; this.render(); }
    addUpgrade(upgradeId) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;

        // Fetch full upgrade data - Placeholder, replace with actual data source
        const upgradeData = SpecialAttackSystem.getUpgradeDefinition ? SpecialAttackSystem.getUpgradeDefinition(upgradeId) : { id: upgradeId, name: upgradeId, cost: 10, description: 'Placeholder' };
         if(!upgradeData) {
            this.builder.showNotification('Upgrade definition not found.', 'error'); return;
        }
        try {
            SpecialAttackSystem.addUpgradeToAttack(character, this.selectedAttackIndex, upgradeData);
            this.builder.updateCharacter();
            this.closeUpgradeModal();
            this.builder.showNotification('Upgrade added.', 'success');
        } catch(error) {
            this.builder.showNotification(`Failed to add upgrade: ${error.message}`, 'error');
        }
    }
    removeUpgrade(upgradeIndexOnAttack) {
         const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack || !attack.upgrades) return;
        try {
            const removedUpgrade = SpecialAttackSystem.removeUpgradeFromAttack(character, this.selectedAttackIndex, attack.upgrades[upgradeIndexOnAttack].id);
            this.builder.updateCharacter();
            this.builder.showNotification(`Upgrade "${removedUpgrade.name}" removed.`, 'info');
        } catch(error) {
            this.builder.showNotification(`Failed to remove upgrade: ${error.message}`, 'error');
        }
    }
    openAttackTypeModal() { this.showingAttackTypeModal = true; this.render(); }
    closeAttackTypeModal() { this.showingAttackTypeModal = false; this.render(); }

    selectAttackType(typeId, cost) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
        try {
            // AttackTypeSystem.addAttackTypeToAttack might be better here
            const validation = AttackTypeSystem.validateAttackTypeSelection(character, attack, typeId);
            if (!validation.isValid) throw new Error(validation.errors.join(', '));

            AttackTypeSystem.addAttackTypeToAttack(character, attack, typeId); // System handles cost
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
            this.closeAttackTypeModal(); // Will re-render via builder.updateCharacter
            this.builder.showNotification(`Attack type ${typeId} added.`, 'success');
        } catch(error) {
             this.builder.showNotification(`Failed to add attack type: ${error.message}`, 'error');
        }
    }
    removeAttackType(typeId) {
        const character = this.builder.currentCharacter;
        const attack = character?.specialAttacks[this.selectedAttackIndex];
        if (!character || !attack) return;
         try {
            AttackTypeSystem.removeAttackTypeFromAttack(character, attack, typeId); // System handles refund
            SpecialAttackSystem.recalculateAttackPoints(character, attack);
            this.builder.updateCharacter();
            // Modal doesn't need to be open, this acts on the main display
            this.builder.showNotification(`Attack type ${typeId} removed.`, 'info');
        } catch(error) {
             this.builder.showNotification(`Failed to remove attack type: ${error.message}`, 'error');
        }
    }


    // formatArchetypeName and formatCategoryName remain the same
    formatArchetypeName(archetypeId) {
        if (!archetypeId) return 'None Selected';
        return archetypeId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    formatCategoryName(categoryName) {
        if (!categoryName) return '';
        return categoryName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    onCharacterUpdate() { // Called by CharacterBuilder
        // If the selected attack still exists, re-render. Otherwise, might select first or show empty.
        if (this.builder.currentCharacter && this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex]) {
            this.render();
        } else if (this.builder.currentCharacter && this.builder.currentCharacter.specialAttacks.length > 0) {
            this.selectedAttackIndex = 0;
            this.render();
        } else {
            this.selectedAttackIndex = 0; // Reset
            this.render(); // Will show "no attacks" state
        }
    }
}
```
---
**FILE: `rulebook/character-builder/ui/tabs/SummaryTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/SummaryTab.js
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class SummaryTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-summary');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }

        const stats = this.builder.calculateStats(); // From CharacterBuilder
        const validation = this.builder.validateCharacter(); // From CharacterBuilder

        tabContent.innerHTML = `
            <div class="summary-section">
                <h2>Character Summary</h2>
                <div class="grid-layout grid-columns-auto-fit-300 summary-grid">
                    ${this.renderBasicInfoCard(character)}
                    ${this.renderArchetypesCard(character)}
                    ${this.renderAttributesCard(character)}
                    ${this.renderCalculatedStatsCard(stats)}
                    ${this.renderValidationSummaryCard(validation)}
                    ${this.renderPointPoolsSummaryCard(character)}
                </div>

                <div class="export-actions">
                    <h3>Export Character</h3>
                    <div class="export-buttons">
                        ${RenderUtils.renderButton({ text: 'Export Full JSON', variant: 'secondary', dataAttributes: { action: 'export-json-summary' }})}
                        ${RenderUtils.renderButton({ text: 'Export for Roll20', variant: 'secondary', dataAttributes: { action: 'export-roll20-summary' }})}
                        ${RenderUtils.renderButton({ text: 'Print Character Sheet', variant: 'secondary', dataAttributes: { action: 'print-character' }})}
                    </div>
                </div>
            </div>
        `;
        // Event listeners for buttons will be handled by CharacterBuilder via data-actions
    }

    renderBasicInfoCard(character) {
        return RenderUtils.renderCard({
            title: 'Basic Information',
            additionalContent: `
                <div class="info-grid">
                    <div><strong>Name:</strong> ${character.name}</div>
                    <div><strong>Real Name:</strong> ${character.realName || 'N/A'}</div>
                    <div><strong>Tier:</strong> ${character.tier}</div>
                    <div><strong>Created:</strong> ${new Date(character.created).toLocaleDateString()}</div>
                    <div><strong>Last Modified:</strong> ${new Date(character.lastModified).toLocaleString()}</div>
                </div>
            `
        }, { cardClass: 'summary-info-card', showCost: false, showStatus: false });
    }

    renderArchetypesCard(character) {
        const archetypeNames = { /* ... same as before ... */ 
            movement: 'Movement', attackType: 'Attack Type', effectType: 'Effect Type',
            uniqueAbility: 'Unique Ability', defensive: 'Defensive', specialAttack: 'Special Attack', utility: 'Utility'
        };
        const content = Object.entries(character.archetypes).map(([key, value]) => `
            <div class="archetype-item stat-item">
                <span>${archetypeNames[key] || key}:</span>
                <strong>${value ? this.formatArchetypeName(value) : '<em>Not selected</em>'}</strong>
            </div>
        `).join('');
        return RenderUtils.renderCard({ title: 'Archetypes', additionalContent: `<div class="archetype-list">${content}</div>` }, { cardClass: 'summary-archetypes-card', showCost: false, showStatus: false });
    }

    renderAttributesCard(character) {
        const attributeNames = { /* ... same as before ... */ 
            focus: 'Focus', mobility: 'Mobility', power: 'Power', endurance: 'Endurance',
            awareness: 'Awareness', communication: 'Communication', intelligence: 'Intelligence'
        };
        const combatAttrs = ['focus', 'mobility', 'power', 'endurance'];
        const utilityAttrs = ['awareness', 'communication', 'intelligence'];

        const combatContent = combatAttrs.map(attr => `
            <div class="attr-item stat-item"><span>${attributeNames[attr]}:</span><strong class="attr-value">${character.attributes[attr] || 0}</strong></div>
        `).join('');
        const utilityContent = utilityAttrs.map(attr => `
            <div class="attr-item stat-item"><span>${attributeNames[attr]}:</span><strong class="attr-value">${character.attributes[attr] || 0}</strong></div>
        `).join('');

        return RenderUtils.renderCard({
            title: 'Attributes',
            additionalContent: `
                <div class="attributes-display-summary">
                    <div class="combat-attrs-summary"><h4>Combat</h4>${combatContent}</div>
                    <div class="utility-attrs-summary"><h4>Utility</h4>${utilityContent}</div>
                </div>`
        }, { cardClass: 'summary-attributes-card', showCost: false, showStatus: false });
    }

    renderCalculatedStatsCard(stats) {
        if (!stats || !stats.final) return RenderUtils.renderCard({ title: 'Calculated Stats', additionalContent: '<p>Stats not available.</p>'}, {cardClass: 'summary-stats-card'});

        const combat = [
            { name: 'Accuracy', value: stats.final.accuracy }, { name: 'Damage', value: stats.final.damage },
            { name: 'Conditions', value: stats.final.conditions }, { name: 'Initiative', value: stats.final.initiative },
            { name: 'Movement', value: `${stats.final.movement} sp` }, { name: 'HP', value: stats.final.hp },
        ];
        const defense = [
            { name: 'Avoidance', value: stats.final.avoidance }, { name: 'Durability', value: stats.final.durability },
            { name: 'Resolve', value: stats.final.resolve }, { name: 'Stability', value: stats.final.stability },
            { name: 'Vitality', value: stats.final.vitality },
        ];
        const renderStatList = (statList) => statList.map(s => `<div class="stat-item"><span>${s.name}:</span><strong>${s.value === undefined ? 'N/A' : s.value}</strong></div>`).join('');

        return RenderUtils.renderCard({
            title: 'Calculated Stats',
            additionalContent: `
                <div class="stats-grid-summary">
                    <div class="combat-stats-summary"><h4>Combat</h4>${renderStatList(combat)}</div>
                    <div class="defense-stats-summary"><h4>Defenses</h4>${renderStatList(defense)}</div>
                </div>`
        }, { cardClass: 'summary-stats-card', showCost: false, showStatus: false });
    }

    renderPointPoolsSummaryCard(character) {
        const pools = this.builder.calculatePointPools(); // from CharacterBuilder
        const poolOrder = ['combatAttributes', 'utilityAttributes', 'mainPool', 'utilityPool', 'specialAttacks'];
        
        const content = poolOrder.map(poolKey => {
            const name = this.formatArchetypeName(poolKey.replace('Attributes', ' Attr.')); // User-friendly name
            return `
                <div class="stat-item">
                    <span>${name}:</span>
                    <strong>${pools.totalSpent[poolKey] || 0} / ${pools.totalAvailable[poolKey] || 0} (Rem: ${pools.remaining[poolKey] || 0})</strong>
                </div>
            `;
        }).join('');

        return RenderUtils.renderCard({
            title: 'Point Pools',
            additionalContent: `<div class="point-pool-summary-list">${content}</div>`
        }, { cardClass: 'summary-pools-card', showCost: false, showStatus: false });
    }


    renderValidationSummaryCard(validation) {
        const statusType = validation.isValid ? 'success' : (validation.errors.length > 0 ? 'error' : 'warning');
        const statusText = validation.isValid ? 'Character Valid!' : (validation.errors.length > 0 ? 'Errors Found' : 'Warnings Present');
        const icon = validation.isValid ? '✅' : (validation.errors.length > 0 ? '❌' : '⚠️');

        let issuesContent = '';
        if (validation.errors.length > 0) {
            issuesContent += `<h6>Errors (${validation.errors.length}):</h6><ul class="error-items">
                ${validation.errors.slice(0,3).map(e => `<li>${e}</li>`).join('')}
                ${validation.errors.length > 3 ? `<li>...and ${validation.errors.length-3} more.</li>` : ''}
            </ul>`;
        }
        if (validation.warnings.length > 0) {
            issuesContent += `<h6>Warnings (${validation.warnings.length}):</h6><ul class="warning-items">
                ${validation.warnings.slice(0,3).map(w => `<li>${w}</li>`).join('')}
                ${validation.warnings.length > 3 ? `<li>...and ${validation.warnings.length-3} more.</li>` : ''}
            </ul>`;
        }
        if (!issuesContent) issuesContent = "<p>No validation issues.</p>";

        return RenderUtils.renderCard({
            title: 'Validation Status',
            additionalContent: `
                <div class="validation-status-line">
                    ${RenderUtils.renderStatusIndicator(statusType, `${icon} ${statusText}`, {absolutePosition: false})}
                </div>
                ${issuesContent}`
        }, { cardClass: `summary-validation-card status-${statusType}`, showCost: false, showStatus: false });
    }

    formatArchetypeName(archetypeId) {
        return archetypeId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    setupEventListeners() {
        // Buttons handled by CharacterBuilder's EventManager via data-actions
    }

    // exportForRoll20 and printCharacterSheet are called by CharacterBuilder
    // onCharacterUpdate will be handled by CharacterBuilder calling this.render() if active.
}
```

---
**FILE: `rulebook/character-builder/ui/tabs/UtilityTab.js`**
---
```javascript
// rulebook/character-builder/ui/tabs/UtilityTab.js
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';
import { UpdateManager } from '../shared/UpdateManager.js'; // If complex internal updates needed
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../systems/UtilitySystem.js'; // Main system for data

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.activeCategory = 'expertise'; // Default category
    }

    render() {
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or prerequisites not met.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="utility-tab-content">
                <h2>Utility Abilities</h2>
                <p class="section-description">
                    Purchase expertise, features, senses, movement, and descriptors using your utility pool points.
                </p>

                ${this.renderPointPoolInfo(character)}
                ${this.renderCategoryNavigation()}
                <div class="utility-category-content" id="utility-active-category-content">
                    ${this.renderActiveCategoryContent(character)}
                </div>
                ${this.renderPurchasedSummary(character)}

                <div class="next-step">
                    ${RenderUtils.renderButton({
                        text: 'Continue to Summary →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-summary' }
                    })}
                </div>
            </div>
        `;
        this.setupEventListeners(); // For category switching and internal interactions
    }

    renderPointPoolInfo(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0; // Ensure fallback if undefined
        const available = pools.totalAvailable.utilityPool || 0;
        const spent = pools.totalSpent.utilityPool || 0;

        return RenderUtils.renderPointDisplay(spent, available, 'Utility Pool', {
            showRemaining: true,
            variant: utilityPool < 0 ? 'error' : (utilityPool === 0 && spent > 0 ? 'warning' : 'default')
        });
    }

    renderCategoryNavigation() {
        const categories = [
            { id: 'expertise', label: 'Expertise', description: 'Skills & Training' },
            { id: 'features', label: 'Features', description: 'Supernatural Abilities' },
            { id: 'senses', label: 'Senses', description: 'Enhanced Perception' },
            { id: 'movement', label: 'Movement', description: 'Enhanced Locomotion' },
            { id: 'descriptors', label: 'Descriptors', description: 'Reality Manipulation' }
        ];
        // Making labels more descriptive by including the description in a smaller tag
        const tabConfigs = categories.map(cat => ({
            id: cat.id,
            label: `${cat.label} <small class="tab-description">(${cat.description})</small>`,
            disabled: false // Add logic if some tabs should be disabled
        }));
        return RenderUtils.renderTabs(tabConfigs, this.activeCategory, { navClass: 'section-tabs utility-section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveCategoryContent(character) {
        const sectionRenderers = {
            expertise: () => this.renderExpertiseSection(character),
            features: () => this.renderGenericUtilitySection(character, 'features', UtilitySystem.getAvailableFeatures()),
            senses: () => this.renderGenericUtilitySection(character, 'senses', UtilitySystem.getAvailableSenses()),
            movement: () => this.renderGenericUtilitySection(character, 'movement', UtilitySystem.getMovementFeatures()),
            descriptors: () => this.renderGenericUtilitySection(character, 'descriptors', UtilitySystem.getDescriptors())
        };
        const renderer = sectionRenderers[this.activeCategory];
        return renderer ? renderer() : `<div class="empty-state">Select a utility category.</div>`;
    }

    renderExpertiseSection(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const content = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeExpertiseBlock(attrKey, attrData, character)
        ).join('');
        return `<div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${content}</div>`;
    }

    renderAttributeExpertiseBlock(attrKey, attrData, character) {
        const currentExpertise = character.utilityPurchases.expertise[attrKey] || { basic: [], mastered: [] };
        const renderOptions = (type, options) => {
            if (!options || options.length === 0) return '<p class="empty-state-small">None available.</p>';
            return options.map(ex => this.renderSingleExpertiseOption(ex, attrKey, type, currentExpertise)).join('');
        };

        return RenderUtils.renderCard({
            title: `${attrData.name} Expertise`,
            titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Activity-Based (Basic: ${UtilitySystem.getExpertiseCost ? UtilitySystem.getExpertiseCost('activity','basic'):2}p / Mastered: +${UtilitySystem.getExpertiseCost ? UtilitySystem.getExpertiseCost('activity','mastered') - UtilitySystem.getExpertiseCost('activity','basic'):4}p)</h5>
                    <div class="expertise-options-list">${renderOptions('activity', attrData.activities)}</div>
                </div>
                <div class="expertise-subsection">
                    <h5>Situational (Basic: ${UtilitySystem.getExpertiseCost ? UtilitySystem.getExpertiseCost('situational','basic'):1}p / Mastered: +${UtilitySystem.getExpertiseCost ? UtilitySystem.getExpertiseCost('situational','mastered') - UtilitySystem.getExpertiseCost('situational','basic'):2}p)</h5>
                    <div class="expertise-options-list">${renderOptions('situational', attrData.situational)}</div>
                </div>`
        }, { cardClass: 'expertise-attribute-card', showCost: false, showStatus: false });
    }

    renderSingleExpertiseOption(expertise, attribute, type, currentExpertise) {
        const basicCost = UtilitySystem.getExpertiseCost ? UtilitySystem.getExpertiseCost(type, 'basic') : (type === 'activity' ? 2 : 1);
        const masteredCostDelta = (UtilitySystem.getExpertiseCost ? UtilitySystem.getExpertiseCost(type, 'mastered') : (type === 'activity' ? 6 : 3)) - basicCost;

        const isBasic = currentExpertise.basic.includes(expertise.id);
        const isMastered = currentExpertise.mastered.includes(expertise.id);

        return `
            <div class="expertise-option-item form-group">
                <label>
                    <input type="checkbox" data-action="toggle-expertise" data-attribute="${attribute}" data-expertise-id="${expertise.id}" data-expertise-type="${type}" data-level="basic" ${isBasic ? 'checked' : ''}>
                    ${expertise.name} (${basicCost}p)
                </label>
                ${expertise.description ? `<small class="expertise-desc">${expertise.description}</small>`:''}
                ${isBasic ? `
                    <label class="mastery-label">
                        <input type="checkbox" data-action="toggle-expertise" data-attribute="${attribute}" data-expertise-id="${expertise.id}" data-expertise-type="${type}" data-level="mastered" ${isMastered ? 'checked' : ''}>
                        Master (+${masteredCostDelta}p)
                    </label>
                ` : ''}
            </div>
        `;
    }


    renderGenericUtilitySection(character, categoryKey, categoryData) {
        const title = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        const purchasedItems = character.utilityPurchases[categoryKey] || [];
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingUtilityPoints = pools.remaining.utilityPool;

        let allItems = [];
        Object.values(categoryData).forEach(tierOrGroup => {
            const itemsToAdd = tierOrGroup.features || tierOrGroup.senses || tierOrGroup.descriptors || tierOrGroup; // Adapt to data structure
            if (Array.isArray(itemsToAdd)) {
                allItems = allItems.concat(itemsToAdd.map(item => ({ ...item, cost: tierOrGroup.cost !== undefined ? tierOrGroup.cost : item.cost })));
            }
        });
        // Filter out items that are already purchased for the available list
        const availableItems = allItems.filter(item => !purchasedItems.some(pItem => pItem.id === item.id));


        return `
            <div class="utility-generic-section">
                <h3>${title}</h3>
                <p class="category-description">${this.getCategoryDescription(categoryKey)}</p>
                ${RenderUtils.renderPurchasedList(
                    purchasedItems,
                    (item, index) => this.renderPurchasedUtilityItem(item, categoryKey, index),
                    { title: `Purchased ${title} (${purchasedItems.length})`, emptyMessage: `No ${categoryKey} purchased.`}
                )}
                <h4>Available ${title}</h4>
                ${RenderUtils.renderGrid(
                    availableItems,
                    (item) => {
                        const canAfford = remainingUtilityPoints >= item.cost;
                        return RenderUtils.renderCard({
                            title: item.name,
                            cost: item.cost,
                            description: item.description + (item.applications ? `<br><small><strong>Apps:</strong> ${item.applications.join(', ')}</small>` : ''),
                            status: canAfford ? 'available' : 'unaffordable',
                            clickable: canAfford,
                            disabled: !canAfford,
                            dataAttributes: { action: `purchase-${categoryKey.slice(0,-1)}`, 'item-id': item.id, cost: item.cost } // e.g. purchase-feature
                        }, { cardClass: `${categoryKey.slice(0,-1)}-card`, showStatus: true });
                    },
                    { gridContainerClass: 'grid-layout utility-item-grid', gridSpecificClass: 'grid-columns-auto-fit-280', emptyMessage: `All available ${categoryKey} purchased or none defined.` }
                )}
            </div>
        `;
    }
    getCategoryDescription(categoryKey) {
        const descs = {
            features: 'Supernatural abilities that enable new types of actions and checks.',
            senses: 'Enhanced perceptual capabilities for detecting what normal senses cannot.',
            movement: 'Enhanced locomotion capabilities for combat and exploration.',
            descriptors: 'Reality manipulation abilities tied to specific concepts or elements.'
        };
        return descs[categoryKey] || 'Select items from this category.';
    }

    renderPurchasedUtilityItem(item, categoryKey, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-cost">${item.cost}p</span>
                </div>
                ${RenderUtils.renderButton({text: 'Remove', variant: 'danger', size: 'small', dataAttributes: {action: `remove-${categoryKey.slice(0,-1)}`, index: index, 'item-id': item.id }})}
            </div>
        `;
    }


    renderPurchasedSummary(character) {
        // This could show a count of purchased items per category or be removed if too verbose
        return '';
    }
    renderNextStep() { /* same as before */
        return ` <div class="next-step"> ${RenderUtils.renderButton({ text: 'Continue to Summary →', variant: 'primary', dataAttributes: { action: 'continue-to-summary' } })} </div> `;
    }


    setupEventListeners() {
        const container = document.querySelector('.utility-tab-content');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                '.section-tab': (e, el) => this.handleCategorySwitch(el.dataset.tab), // Ensure data-tab used in renderTabs
                '[data-action="continue-to-summary"]': () => this.builder.switchTab('summary'),
                '[data-action^="purchase-"]': (e, el) => this.handleGenericPurchase(el),
                '[data-action^="remove-"]': (e, el) => this.handleGenericRemove(el)
            },
            change: {
                '[data-action="toggle-expertise"]': (e, el) => this.handleExpertiseToggle(el)
            }
        });
    }


    handleCategorySwitch(newCategory) {
        if (newCategory && newCategory !== this.activeCategory) {
            this.activeCategory = newCategory;
            this.updateActiveCategoryContentUI();
        }
    }
    
    handleExpertiseToggle(checkbox) {
        const { attribute, expertiseId, expertiseType, level } = checkbox.dataset;
        const isChecked = checkbox.checked;
        const character = this.builder.currentCharacter;
        try {
            UtilitySystem.toggleExpertise(character, attribute, expertiseId, expertiseType, level, isChecked);
            this.builder.updateCharacter(); // This will trigger re-render of points and this section
             this.builder.showNotification(`Expertise ${expertiseId} ${level} ${isChecked ? 'added' : 'removed'}.`, 'success');
        } catch (error) {
            this.builder.showNotification(`Expertise update failed: ${error.message}`, 'error');
            checkbox.checked = !isChecked; // Revert UI on failure
        }
    }

    handleGenericPurchase(element) {
        const action = element.dataset.action; // e.g., "purchase-feature"
        const categoryKey = action.split('-')[1] + 's'; // "features"
        const itemId = element.dataset.itemId;
        const itemCost = parseInt(element.dataset.cost);
        
        const character = this.builder.currentCharacter;
        try {
            UtilitySystem.purchaseItem(character, categoryKey, itemId, itemCost);
            this.builder.updateCharacter();
            this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} purchased.`, 'success');
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
        }
    }
    handleGenericRemove(element) {
        const action = element.dataset.action; // e.g., "remove-feature"
        const categoryKey = action.split('-')[1] + 's'; // "features"
        const itemId = element.dataset.itemId; // Make sure this is present on remove buttons
        
        const character = this.builder.currentCharacter;
        if (confirm(`Remove this ${categoryKey.slice(0,-1)}?`)) {
            try {
                UtilitySystem.removeItem(character, categoryKey, itemId);
                this.builder.updateCharacter();
                this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} removed.`, 'info');
            } catch (error) {
                 this.builder.showNotification(`Removal failed: ${error.message}`, 'error');
            }
        }
    }


    updateActiveCategoryContentUI() {
        // Update tab button active states
        document.querySelectorAll('.utility-tab-content .section-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.activeCategory);
        });
        // Re-render the content of the active section
        const contentArea = document.getElementById('utility-active-category-content');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveCategoryContent(this.builder.currentCharacter);
            // Event listeners are delegated, so new content will be covered.
        }
    }
    
    onCharacterUpdate() { // Called by CharacterBuilder
        const pointPoolContainer = document.querySelector('.utility-tab-content .point-display');
        if (pointPoolContainer && this.builder.currentCharacter) {
            pointPoolContainer.outerHTML = this.renderPointPoolInfo(this.builder.currentCharacter);
        }
        this.updateActiveCategoryContentUI();
    }

    capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
}
```

---

This covers the primary JavaScript files that generate HTML and would be affected by the CSS class refactoring. Remember to:

1.  **Carefully review `RenderUtils.js` first.** Its `renderCard`, `renderButton`, `renderGrid`, and `renderStatusIndicator` are key.
2.  **Test each component/tab** after updating its JavaScript and the corresponding HTML it generates.
3.  **Use browser developer tools** to ensure the new classes are being applied correctly and that styles look as expected.
4.  **Adjust `data-action` attributes and EventManager delegation** in `CharacterBuilder.js` or individual tabs if the refactoring changed how events should be caught. The provided changes try to make `data-action` attributes more consistent for easier delegation.

This is a complex refactor. Good luck!