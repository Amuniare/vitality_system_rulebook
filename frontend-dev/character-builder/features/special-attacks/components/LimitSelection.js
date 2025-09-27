// frontend/character-builder/features/special-attacks/components/LimitSelection.js
// FIXED: This version correctly uses hierarchical data to prevent ID mismatches and restore UI indentation.
import { SpecialAttackSystem } from '../../../systems/SpecialAttackSystem.js';
import { TierSystem } from '../../../core/TierSystem.js';
import { LimitCalculator } from '../../../calculators/LimitCalculator.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class LimitSelection {
    constructor(parentTab) {
        this.parentTab = parentTab;
        this.expandedCategories = new Set();
    }

    render(attack, character) {
        if (!character || !character.archetypes) {
            return this.renderDisabledSection('unknown');
        }

        const canUseLimits = SpecialAttackSystem.canArchetypeUseLimits(character);

        if (!canUseLimits) {
            return this.renderDisabledSection(character.archetypes.specialAttack);
        }

        return `
            <div class="limits-section section-block">
                <div class="section-header">
                    <h3>Limits</h3>
                </div>
                ${this.renderSelectedLimitsTable(attack, character)}
                ${this.renderAvailableLimits(character, attack)}
                ${this.renderCustomLimitCreation(character, attack)}
            </div>
        `;
    }

    renderDisabledSection(archetype) {
        const archetypeName = archetype ? archetype.charAt(0).toUpperCase() + archetype.slice(1) : 'Unknown';
        return `
            <div class="limits-section section-block disabled">
                <h3>Limits</h3>
                <p class="archetype-restriction">${archetypeName} archetype cannot use limits.</p>
            </div>
        `;
    }

    renderSelectedLimitsTable(attack, character) {
        if (!attack.limits || attack.limits.length === 0) {
            return `<div class="empty-state">No limits selected. Choose from the available limits below.</div>`;
        }
        return `
            <div class="selected-limits-list">
                <h4>Selected Limits (${attack.limits.length})</h4>
                <table class="limits-breakdown-table">
                    <thead>
                        <tr>
                            <th width="40"></th>
                            <th>Limit Name</th>
                            <th width="60">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attack.limits.map((limit, index) => this.renderLimitTableRow(limit, index)).join('')}
                    </tbody>
                    <tfoot>
                        ${this.renderLimitCalculationFooter(attack, character)}
                    </tfoot>
                </table>
            </div>
        `;
    }
    
    renderLimitTableRow(limit, index) {
        // Handle custom limits differently
        if (limit.isCustom) {
            return `
                <tr class="limit-table-row custom-limit-row">
                    <td class="remove-cell">
                        ${RenderUtils.renderButton({
                            text: '×',
                            variant: 'danger',
                            size: 'small',
                            dataAttributes: { action: 'remove-limit', 'limit-id': limit.id },
                            title: `Remove ${limit.name}`
                        })}
                    </td>
                    <td>${limit.name} <span class="custom-tag">(Custom)</span></td>
                    <td class="limit-points-cell">${limit.points}</td>
                </tr>
            `;
        }
        
        // Handle standard limits
        const limitDef = SpecialAttackSystem.getLimitById(limit.id);
        const cost = limitDef ? (typeof limitDef.cost === 'number' ? limitDef.cost : 0) : 0;
        
        return `
            <tr class="limit-table-row">
                <td class="remove-cell">
                    ${RenderUtils.renderButton({
                        text: '×',
                        variant: 'danger',
                        size: 'small',
                        dataAttributes: { action: 'remove-limit', 'limit-id': limit.id },
                        title: `Remove ${limit.name}`
                    })}
                </td>
                <td>${limitDef ? limitDef.name : limit.id}</td>
                <td class="limit-points-cell">${cost}</td>
            </tr>
        `;
    }

    renderLimitCalculationFooter(attack, character) {
        const limitPointsTotal = attack.limitPointsTotal || 0;
        const fromLimits = attack.upgradePointsFromLimits || 0;
        const archetype = character.archetypes.specialAttack;

        // Get the detailed calculation breakdown using LimitCalculator
        const breakdown = LimitCalculator.getCalculationBreakdown(limitPointsTotal, character.tier, archetype);

        return `
            <tr class="calculation-subtotal">
                <td colspan="2">Limit Points Total</td>
                <td><strong>${limitPointsTotal}</strong></td>
            </tr>
            <tr class="calculation-scaling">
                <td colspan="2">Scaling Rate (from ${archetype} archetype)</td>
                <td>×${breakdown.archetypeMultiplier.toFixed(2)}</td>
            </tr>
            <tr class="calculation-effective">
                <td colspan="2">Effective Limit Points</td>
                <td>${breakdown.scaledLimitPoints.toFixed(1)}</td>
            </tr>
            <tr class="calculation-breakdown-header">
                <td colspan="3"><strong>Diminishing Returns Buckets:</strong></td>
            </tr>
            ${breakdown.steps.slice(3).filter(step => step.includes('Bucket')).map(step => {
                const match = step.match(/^[\s•]*(.+?)\s*=\s*(.+)$/);
                if (match) {
                    return `
                        <tr class="calculation-step">
                            <td colspan="2">${match[1].replace(/^\s*•?\s*/, '')}</td>
                            <td><strong>${match[2]}</strong></td>
                        </tr>
                    `;
                } else {
                    return `
                        <tr class="calculation-step">
                            <td colspan="2">${step.replace(/^\s*•?\s*/, '')}</td>
                            <td></td>
                        </tr>
                    `;
                }
            }).join('')}
            <tr class="calculation-final">
                <td colspan="2"><strong>Upgrade Points from Limits</strong></td>
                <td><strong>${fromLimits}</strong></td>
            </tr>
        `;
    }

    renderAvailableLimits(character, attack) {
        // FIX: Use the hierarchical data source to preserve structure
        const limitsData = SpecialAttackSystem.getAvailableLimitsHierarchy();
        return `
            <div class="available-limits">
                <h4>Available Limits</h4>
                <div class="limit-categories-hierarchy">
                    ${Object.entries(limitsData).map(([categoryKey, categoryData]) =>
                        this.renderLimitCategory(categoryKey, categoryData, attack, character)
                    ).join('')}
                </div>
            </div>
        `;
    }

    renderLimitCategory(categoryKey, categoryData, attack, character) {
        const isExpanded = this.expandedCategories.has(categoryKey);
        const formattedCategoryName = this.formatCategoryName(categoryKey);
        return `
            <div class="limit-category">
                <div class="limit-category-header" data-action="toggle-limit-category" data-category="${categoryKey}">
                    <span class="category-expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    <h5 class="category-name">${formattedCategoryName}</h5>
                </div>
                ${isExpanded ? `
                    <div class="limit-category-content">
                        ${this.renderMainLimitOption(categoryKey, categoryData, attack, character)}
                        ${this.renderVariants(categoryKey, categoryData, attack, character)}
                    </div>` : ''
                }
            </div>
        `;
    }

    renderMainLimitOption(categoryKey, categoryData, attack, character) {
        if (categoryData.cost === undefined) return '';
        const limitData = {
            id: categoryKey,
            name: categoryKey,
            ...categoryData,
            type: 'main'
        };
        return this.renderLimitOption(limitData, attack, character, 'main-limit');
    }

    renderVariants(categoryKey, categoryData, attack, character) {
        if (!categoryData.variants) return '';
        return Object.entries(categoryData.variants).map(([variantKey, variantData]) =>
            `
            ${this.renderVariantOption(categoryKey, variantKey, variantData, attack, character)}
            ${this.renderModifiers(categoryKey, variantKey, variantData, attack, character)}
            `
        ).join('');
    }

    renderVariantOption(categoryKey, variantKey, variantData, attack, character) {
        const limitData = {
            id: `${categoryKey}_${variantKey}`,
            name: variantKey,
            ...variantData,
            type: 'variant',
            parent: categoryKey
        };
        return this.renderLimitOption(limitData, attack, character, 'variant-limit');
    }

    renderModifiers(categoryKey, variantKey, variantData, attack, character) {
        if (!variantData.modifiers) return '';
        return Object.entries(variantData.modifiers).map(([modifierKey, modifierData]) =>
            this.renderModifierOption(categoryKey, variantKey, modifierKey, modifierData, attack, character)
        ).join('');
    }

    renderModifierOption(categoryKey, variantKey, modifierKey, modifierData, attack, character) {
        const limitData = {
            id: `${categoryKey}_${variantKey}_${modifierKey}`,
            name: modifierKey,
            ...modifierData,
            type: 'modifier',
            parent: `${categoryKey}_${variantKey}`
        };
        return this.renderLimitOption(limitData, attack, character, 'modifier-limit');
    }

    renderLimitOption(limit, attack, character, cssClass = 'limit-option') {
        const isSelected = attack.limits.some(selected => selected.id === limit.id);
        const validation = SpecialAttackSystem.validateLimitSelection(character, attack, limit.id);
        const canAdd = !isSelected && validation.isValid;

        return RenderUtils.renderCard({
            title: limit.name,
            cost: typeof limit.cost === 'string' ? limit.cost : limit.cost || 0,
            description: `${limit.description || ''} ${!validation.isValid && !isSelected ? `<br><small class="error-text">${validation.errors[0]}</small>` : ''}`,
            clickable: canAdd,
            disabled: isSelected || !validation.isValid,
            selected: isSelected,
            dataAttributes: {
                action: canAdd ? 'add-limit' : '',
                'limit-id': limit.id
            }
        }, { cardClass: `limit-option ${cssClass}`, showStatus: false });
    }

    renderCustomLimitCreation(character, attack) {
        const isExpanded = this.expandedCategories.has('custom');
        return `
            <div class="limit-category custom-limit-category">
                <div class="limit-category-header" data-action="toggle-limit-category" data-category="custom">
                    <span class="category-expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    <h5 class="category-name">Create Custom Limit</h5>
                </div>
                ${isExpanded ? `
                    <div class="limit-category-content">
                        <div class="custom-limit-form">
                            ${RenderUtils.renderFormGroup({
                                label: 'Name:',
                                inputHtml: `<input type="text" class="custom-limit-input custom-limit-name" placeholder="Enter limit name" maxlength="50">`
                            })}
                            
                            ${RenderUtils.renderFormGroup({
                                label: 'Description:',
                                inputHtml: `<textarea class="custom-limit-input custom-limit-description" rows="3" placeholder="Describe the limit's effects" maxlength="500"></textarea>`
                            })}
                            
                            ${RenderUtils.renderFormGroup({
                                label: 'Point Value:',
                                inputHtml: `<input type="number" class="custom-limit-input custom-limit-points" placeholder="Enter point value" min="1" max="100">`
                            })}
                            
                            <div class="form-actions">
                                ${RenderUtils.renderButton({
                                    text: 'Add Custom Limit',
                                    variant: 'primary',
                                    dataAttributes: { action: 'add-custom-limit' },
                                    classes: ['add-custom-limit-btn'],
                                    disabled: true
                                })}
                                ${RenderUtils.renderButton({
                                    text: 'Cancel',
                                    variant: 'secondary',
                                    dataAttributes: { action: 'cancel-custom-limit-form' }
                                })}
                            </div>
                        </div>
                    </div>` : ''
                }
            </div>
        `;
    }

    formatCategoryName(category) {
        return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    toggleCategory(categoryKey) {
        if (this.expandedCategories.has(categoryKey)) {
            this.expandedCategories.delete(categoryKey);
            // Clear custom form when collapsing
            if (categoryKey === 'custom') {
                this.clearCustomLimitForm();
            }
        } else {
            this.expandedCategories.add(categoryKey);
        }
    }
    
    clearCustomLimitForm() {
        // Clear the form fields when category is collapsed
        setTimeout(() => {
            const form = document.querySelector('.custom-limit-category .custom-limit-form');
            if (form) {
                const nameInput = form.querySelector('.custom-limit-name');
                const descriptionInput = form.querySelector('.custom-limit-description');
                const pointsInput = form.querySelector('.custom-limit-points');
                
                if (nameInput) nameInput.value = '';
                if (descriptionInput) descriptionInput.value = '';
                if (pointsInput) pointsInput.value = '';
                
                this.validateCustomLimitFormScoped(form);
            }
        }, 100);
    }


    validateCustomLimitFormScoped(container = null) {
        // If no specific container provided, find the form within the expanded custom category
        const form = container || document.querySelector('.custom-limit-category .custom-limit-form');
        if (!form) return;
        
        const nameInput = form.querySelector('.custom-limit-name');
        const descriptionInput = form.querySelector('.custom-limit-description');
        const pointsInput = form.querySelector('.custom-limit-points');
        const addButton = form.querySelector('.add-custom-limit-btn');
        
        if (!nameInput || !descriptionInput || !pointsInput || !addButton) {
            return;
        }
        
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const points = pointsInput.value;
        
        const isValid = name.length > 0 && 
                       description.length > 0 && 
                       points && 
                       !isNaN(Number(points)) && 
                       Number(points) > 0;
        
        addButton.disabled = !isValid;
        addButton.classList.toggle('disabled', !isValid);
        
        if (isValid) {
            addButton.removeAttribute('disabled');
        } else {
            addButton.setAttribute('disabled', 'true');
        }
    }

    destroy() {
        this.expandedCategories.clear();
    }
}