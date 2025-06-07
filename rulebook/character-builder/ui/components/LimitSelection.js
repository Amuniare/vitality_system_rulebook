// LimitSelection.js - Manages the display and selection of limits for special attacks
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { TierSystem } from '../../core/TierSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class LimitSelection {
    constructor(parentTab) {
        this.parentTab = parentTab;
        this.attackIndex = 0;
        this.showingModal = false;
        this.expandedCategories = new Set();
    }

    setAttackIndex(index) {
        this.attackIndex = index;
    }

    setModalState(showing) {
        this.showingModal = showing;
    }

    render(attack, character) {
        if (!character || !character.archetypes) {
            return this.renderDisabledSection('unknown');
        }
        
        const archetype = character.archetypes.specialAttack;
        const canUseLimits = this.canArchetypeUseLimits(character);

        if (!canUseLimits) {
            return this.renderDisabledSection(archetype);
        }

        return `
            <div class="limits-section section-block">
                <div class="section-header">
                    <h3>Limits</h3>
                </div>
                
                ${this.renderSelectedLimitsTable(attack, character)}
                ${this.renderCalculationDetails(attack, character)}
                ${this.renderAvailableLimits(character, attack)}
            </div>
        `;
    }

    renderDisabledSection(archetype) {
        return `
            <div class="limits-section section-block disabled">
                <h3>Limits</h3>
                <p class="archetype-restriction">${this.formatArchetypeName(archetype)} archetype cannot use limits.</p>
            </div>
        `;
    }

    renderSelectedLimitsTable(attack, character) {
        if (attack.limits.length === 0) {
            return `<div class="empty-state">No limits selected. Click "Add Limit" to get started.</div>`;
        }

        return `
            <div class="selected-limits-table">
                <h4>Selected Limits</h4>
                <table class="limits-breakdown-table">
                    <thead>
                        <tr>
                            <th width="40">Remove</th>
                            <th>Limit Name</th>
                            <th width="80">Points</th>
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
        const pointsValue = limit.points || limit.cost || 0;
        
        return `
            <tr class="limit-table-row" data-limit-index="${index}">
                <td class="remove-cell">
                    ${RenderUtils.renderButton({
                        text: '×', 
                        variant: 'danger', 
                        size: 'small', 
                        dataAttributes: {action: 'remove-limit', index: index},
                        title: `Remove ${limit.name}`
                    })}
                </td>
                <td class="limit-name-cell">${limit.name}</td>
                <td class="limit-points-cell">${pointsValue}</td>
            </tr>
        `;
    }

    renderLimitCalculationFooter(attack, character) {
        const limitPointsTotal = attack.limitPointsTotal || 0;
        const finalUpgradePoints = attack.upgradePointsFromLimits || 0;
        
        // Get archetype details for display
        const specialAttackArchetype = character.archetypes?.specialAttack;
        let archetypeMultiplier = 0;
        if (specialAttackArchetype) {
            switch(specialAttackArchetype) {
                case 'normal':
                    archetypeMultiplier = character.tier / 6;
                    break;
                case 'specialist':
                    archetypeMultiplier = character.tier / 3;
                    break;
                case 'straightforward':
                    archetypeMultiplier = character.tier / 2;
                    break;
                case 'sharedUses':
                    archetypeMultiplier = 1.0;
                    break;
                default:
                    archetypeMultiplier = 0;
                    break;
            }
        }
        
        // Get the raw calculation to show "before rounding"
        let totalValueBeforeRounding = 0;
        if (limitPointsTotal > 0 && specialAttackArchetype) {
            const calcResult = TierSystem.calculateLimitScaling(limitPointsTotal, character.tier, specialAttackArchetype);
            totalValueBeforeRounding = calcResult.totalValue;
        }
        
        // Calculate what simple multiplication would give (for comparison)
        const simpleMultiplication = limitPointsTotal * archetypeMultiplier;
        const hasDiminishingReturns = Math.abs(totalValueBeforeRounding - simpleMultiplication) > 0.1;
        
        return `
            <tr class="calculation-subtotal">
                <td colspan="2"><strong>Step 1 - Limit Points Total:</strong></td>
                <td><strong>${limitPointsTotal}</strong></td>
            </tr>
            <tr class="calculation-multiplier">
                <td colspan="2">Step 2 - Archetype Rate Modifier (${specialAttackArchetype || 'none'}):</td>
                <td>×${archetypeMultiplier.toFixed(3)}</td>
            </tr>
            <tr class="calculation-base">
                <td colspan="2">Step 3 - Apply Modified Rates to DR Buckets:</td>
                <td>${hasDiminishingReturns ? 'See buckets below' : `${limitPointsTotal} × ${archetypeMultiplier.toFixed(3)} = ${simpleMultiplication.toFixed(1)}`}</td>
            </tr>
            ${hasDiminishingReturns ? `
                <tr class="calculation-diminishing">
                    <td colspan="2">Before Rounding:</td>
                    <td>${totalValueBeforeRounding.toFixed(2)}</td>
                </tr>
            ` : ''}
            <tr class="calculation-final">
                <td colspan="2"><strong>Step 4 - Final (Rounded to Nearest 10):</strong></td>
                <td><strong>${finalUpgradePoints}</strong></td>
            </tr>
        `;
    }

    renderCalculationDetails(attack, character) {
        if (attack.limits.length === 0) return '';

        const limitBreakdown = {
            steps: [
                `Limit Points: ${attack.limitPointsTotal || 0}`,
                `Tier Multiplier: x${character.tier}`,
                `Upgrade Points: ${attack.upgradePointsFromLimits || 0}`
            ]
        };

        return `
            <div class="limit-calculation-details">
                <h5>Point Calculation</h5>
                <div class="calculation-breakdown">
                    ${limitBreakdown.steps.map(step => `<div class="calc-line">${step}</div>`).join('')}
                </div>
            </div>
        `;
    }

    renderAvailableLimits(character, attack) {
        const allLimits = SpecialAttackSystem.getAvailableLimits();
        
        // Group limits by category for hierarchical display
        const limitsByCategory = {};
        allLimits.forEach(limit => {
            if (!limitsByCategory[limit.category]) {
                limitsByCategory[limit.category] = [];
            }
            limitsByCategory[limit.category].push(limit);
        });

        return `
            <div class="available-limits">
                <h4>Available Limits</h4>
                <div class="limit-categories-hierarchy">
                    ${Object.entries(limitsByCategory).map(([categoryKey, categoryLimits]) => 
                        this.renderLimitCategory(categoryKey, categoryLimits, attack, character)
                    ).join('')}
                </div>
            </div>
        `;
    }

    renderLimitCategory(categoryKey, categoryLimits, attack, character) {
        const isExpanded = this.expandedCategories.has(categoryKey);
        const formattedCategoryName = this.formatCategoryName(categoryKey);

        return `
            <div class="limit-category">
                <div class="category-header" data-action="toggle-limit-category" data-category="${categoryKey}">
                    <span class="category-toggle ${isExpanded ? 'expanded' : ''}">${isExpanded ? '▼' : '▶'}</span>
                    <h5>${formattedCategoryName}</h5>
                </div>
                <div class="category-content ${isExpanded ? 'expanded' : 'collapsed'}">
                    <div class="limit-options-grid">
                        ${categoryLimits.map(limit => this.renderLimitOption(limit, attack, character)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderLimitOption(limit, attack, character) {
        const isSelected = attack.limits.some(selected => selected.id === limit.id);
        const validation = SpecialAttackSystem.validateLimitSelection(character, attack, limit.id);
        const canAdd = !isSelected && validation.isValid;

        return RenderUtils.renderCard({
            title: limit.name,
            cost: limit.points || limit.cost || 0,
            description: `
                ${limit.description || ''}
                ${!validation.isValid ? `<br><small class="error-text">${validation.errors[0]}</small>` : ''}
            `,
            clickable: canAdd,
            disabled: isSelected || !validation.isValid,
            selected: isSelected,
            dataAttributes: { 
                action: canAdd ? 'add-limit' : '', 
                limitId: limit.id 
            }
        }, { cardClass: 'limit-option', showStatus: false });
    }

    // Granular update methods
    updateLimitsList(attack) {
        const tableBody = document.querySelector('.limits-breakdown-table tbody');
        if (tableBody) {
            tableBody.innerHTML = attack.limits.map((limit, index) => this.renderLimitTableRow(limit, index)).join('');
        }

        // Update count in header
        const header = document.querySelector('.limits-section h3');
        if (header) {
            header.textContent = `Limits (${attack.limits.length})`;
        }

        // Show/hide empty state vs table
        const emptyState = document.querySelector('.limits-section .empty-state');
        const table = document.querySelector('.selected-limits-table');
        
        if (attack.limits.length === 0) {
            if (table) table.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (table) table.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';
        }
    }

    updateCalculationFooter(attack, character) {
        const tfoot = document.querySelector('.limits-breakdown-table tfoot');
        if (tfoot) {
            tfoot.innerHTML = this.renderLimitCalculationFooter(attack, character);
        }
    }

    // Helper methods
    canArchetypeUseLimits(character) {
        if (SpecialAttackSystem.canArchetypeUseLimits) {
            return SpecialAttackSystem.canArchetypeUseLimits(character);
        }
        
        // Fallback logic if SpecialAttackSystem method doesn't exist
        if (!character || !character.archetypes) return false;
        const archetype = character.archetypes.specialAttack;
        return !['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype);
    }

    formatArchetypeName(archetype) {
        return archetype ? archetype.charAt(0).toUpperCase() + archetype.slice(1) : '';
    }

    formatCategoryName(category) {
        return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    toggleCategory(categoryKey) {
        if (this.expandedCategories.has(categoryKey)) {
            this.expandedCategories.delete(categoryKey);
        } else {
            this.expandedCategories.add(categoryKey);
        }
    }

    // Event handling
    handleEvent(event) {
        const action = event.target.dataset.action;

        switch (action) {
            case 'open-limit-modal':
                this.setModalState(true);
                this.parentTab.render();
                break;
            case 'close-limit-modal':
                this.setModalState(false);
                this.parentTab.render();
                break;
            case 'add-limit':
                this.parentTab.addLimit(event.target.dataset.limitId);
                break;
            case 'remove-limit':
                this.parentTab.removeLimit(parseInt(event.target.dataset.index));
                break;
            case 'toggle-limit-category':
                this.toggleCategory(event.target.dataset.category || event.target.closest('[data-category]').dataset.category);
                this.parentTab.render();
                break;
        }
    }

    // Cleanup
    destroy() {
        this.expandedCategories.clear();
    }
}