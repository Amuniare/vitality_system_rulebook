// rulebook/character-builder/ui/tabs/SpecialAttackTab.js
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { AttackTypeSystem } from '../../systems/AttackTypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';
import { EventManager } from '../shared/EventManager.js';

// Import modular components
import { AttackBasicsForm } from '../components/AttackBasicsForm.js';
import { LimitSelection } from '../components/LimitSelection.js';
import { UpgradeSelection } from '../components/UpgradeSelection.js';

export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedAttackIndex = 0;
        this.expandedLimitCategories = new Set();
        this.expandedUpgradeCategories = new Set(['Accuracy Bonuses', 'Damage Bonuses']);
        
        // Initialize modular components
        this.attackBasicsForm = new AttackBasicsForm(this);
        this.limitSelection = new LimitSelection(this);
        this.upgradeSelection = new UpgradeSelection(this);
    }

    render() {
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }
        
        tabContent.innerHTML = `
            <div class="special-attacks-section">
                <h2>Special Attacks</h2>
                <p class="section-description">
                    Create unique combat abilities. Use limits to generate upgrade points, then purchase enhancements.
                </p>
                ${this.renderArchetypeInfo(character)}
                ${this.renderAttackManagement(character)}
                ${character.specialAttacks.length > 0 && character.specialAttacks[this.selectedAttackIndex] ?
                    this.renderAttackBuilder(character) :
                    '<div class="empty-state">Create your first special attack to begin building.</div>'}
                <div class="next-step">
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
        if (!archetypeId) {
            return `<div class="archetype-info card"><div class="card-header"><h3 class="card-title">Archetype Not Selected</h3></div><p>Please select a Special Attack Archetype.</p></div>`;
        }
        const archetypeData = (this.builder.gameDataManager.getArchetypes().specialAttack || []).find(a => a.id === archetypeId);
        return `<div class="archetype-info card"><div class="card-header"><h3 class="card-title">Archetype: ${archetypeData.name}</h3></div><p>${archetypeData.description}</p></div>`;
    }

    renderAttackManagement(character) {
        const canCreate = SpecialAttackSystem.validateCanCreateAttack(character);
        return `
            <div class="attack-management">
                <div class="attack-list-header">
                    <h3>Attacks (${character.specialAttacks.length})</h3>
                    ${RenderUtils.renderButton({
                        text: '+ Create Attack',
                        variant: 'primary',
                        disabled: !canCreate.isValid,
                        dataAttributes: { action: 'create-attack' },
                        title: canCreate.isValid ? 'Create new' : (canCreate.errors[0] || '')
                    })}
                </div>
                <div class="attack-tabs-container">
                    ${character.specialAttacks.map((attack, index) => this.renderAttackTab(attack, index)).join('')}
                </div>
            </div>
        `;
    }
    
    renderAttackTab(attack, index) {
        return `
            <div class="attack-tab ${index === this.selectedAttackIndex ? 'active' : ''}" data-action="select-attack-tab" data-attack-index="${index}">
                <span class="attack-tab-name">${attack.name || `Attack ${index + 1}`}</span>
                <span class="attack-tab-points">${attack.upgradePointsSpent || 0}/${attack.upgradePointsAvailable || 0}p</span>
                ${RenderUtils.renderButton({
                    text: '×', variant: 'danger', size: 'small', classes: ['delete-attack-btn'],
                    dataAttributes: { action: 'delete-attack', index }
                })}
            </div>
        `;
    }

    renderAttackBuilder(character) {
        const attack = character.specialAttacks[this.selectedAttackIndex];
        if (!attack) return '';
        
        // Update component attack indices
        this.limitSelection.setAttackIndex(this.selectedAttackIndex);
        this.upgradeSelection.setAttackIndex(this.selectedAttackIndex);
        
        return `
            <div class="attack-builder card">
                ${this.attackBasicsForm.render(attack, character)}
                <div class="attack-builder-columns">
                    <div class="limits-column">
                        ${this.limitSelection.render(attack, character)}
                    </div>
                    <div class="upgrades-column">
                        ${this.upgradeSelection.render(attack, character)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAttackBasics(attack, character) {
        const attackTypes = AttackTypeSystem.getAttackTypeDefinitions();
        const effectTypes = AttackTypeSystem.getEffectTypeDefinitions();
        const freeAttackTypes = AttackTypeSystem.getFreeAttackTypesFromArchetype(character);
    
        return `
            <div class="attack-basics-form">
                ${RenderUtils.renderFormGroup({
                    label: 'Attack Name', inputId: 'attack-name',
                    inputHtml: `<input type="text" id="attack-name" value="${attack.name || ''}" data-action="update-attack-name">`
                })}
                 <div class="attack-summary-tags">
                    ${(attack.attackTypes || []).map(id => {
                        const def = attackTypes[id];
                        return `<span class="tag attack-type-tag">${def?.name || id} <button data-action="remove-attack-type" data-id="${id}">×</button></span>`;
                    }).join('')}
                    ${(attack.effectTypes || []).map(id => {
                        const def = effectTypes[id];
                        return `<span class="tag effect-type-tag">${def?.name || id} <button data-action="remove-effect-type" data-id="${id}">×</button></span>`;
                    }).join('')}
                </div>
                <div class="attack-type-selectors">
                    ${RenderUtils.renderFormGroup({
                        label: 'Add Attack Type',
                        inputHtml: RenderUtils.renderSelect({
                            id: 'attack-type-select', placeholder: 'Select...',
                            options: Object.values(attackTypes)
                                .filter(t => !(attack.attackTypes || []).includes(t.id))
                                .map(t => ({ value: t.id, label: `${t.name} (${freeAttackTypes.includes(t.id) ? 'Free' : (t.cost + 'p')})`})),
                            dataAttributes: { action: 'add-attack-type' }
                        })
                    })}
                    ${RenderUtils.renderFormGroup({
                        label: 'Add Effect Type',
                        inputHtml: RenderUtils.renderSelect({
                            id: 'effect-type-select', placeholder: 'Select...',
                            options: Object.values(effectTypes)
                                .filter(t => !(attack.effectTypes || []).includes(t.id))
                                .map(t => ({ value: t.id, label: `${t.name} (${t.cost}p)`})),
                            dataAttributes: { action: 'add-effect-type' }
                        })
                    })}
                </div>
            </div>
        `;
    }

    renderAttackConditionalFields(attack) {
        let html = '';
        if ((attack.effectTypes || []).includes('hybrid')) {
            html += RenderUtils.renderFormGroup({
                label: 'Hybrid Order',
                inputHtml: RenderUtils.renderSelect({
                    id: 'hybrid-order-select', value: attack.hybridOrder || 'damage-first',
                    options: [{value: 'damage-first', label: 'Damage then Conditions'}, {value: 'conditions-first', label: 'Conditions then Damage'}],
                    dataAttributes: { action: 'update-hybrid-order' }
                })
            });
        }
        if ((attack.effectTypes || []).some(e => ['condition', 'hybrid'].includes(e))) {
            const conditions = AttackTypeSystem.getBasicConditions();
            html += RenderUtils.renderFormGroup({
                label: 'Add Basic Condition',
                inputHtml: RenderUtils.renderSelect({
                    id: 'basic-condition-select', placeholder: 'Select...',
                    options: conditions
                        .filter(c => !(attack.basicConditions || []).includes(c.id))
                        .map(c => ({value: c.id, label: c.name})),
                    dataAttributes: { action: 'add-basic-condition'}
                })
            });
            html += `<div class="attack-summary-tags">${(attack.basicConditions || []).map(id => `<span class="tag condition-tag">${id} <button data-action="remove-basic-condition" data-id="${id}">×</button></span>`).join('')}</div>`;
        }
        return html ? `<div class="attack-basics-conditionals">${html}</div>` : '';
    }

    renderLimitsSection(attack, character) {
        const archetype = character.archetypes.specialAttack;
        if (!SpecialAttackSystem.canArchetypeUseLimits(character)) {
            return `<div class="limits-section section-block disabled"><h3>Limits</h3><p class="archetype-restriction">${this.formatArchetypeName(archetype)} archetype cannot use limits.</p></div>`;
        }
        const allLimits = SpecialAttackSystem.getAvailableLimits();
        const limitsByCategory = this.groupLimitsByCategory(allLimits);
        return `
            <div class="limits-section section-block">
                ${this.renderSelectedLimitsTable(attack, character)}
                <div class="limit-categories-hierarchy">
                    <h4>Available Limits</h4>
                    ${Object.entries(limitsByCategory).map(([cat, lims]) => this.renderLimitCategory(cat, lims, attack, character)).join('')}
                </div>
            </div>
        `;
    }
    
    renderSelectedLimitsTable(attack, character) {
        if (!attack.limits || attack.limits.length === 0) return '';
        return `
            <div class="selected-limits-table">
                <h4>Selected Limits</h4>
                <table class="limits-breakdown-table">
                    <thead><tr><th>Remove</th><th>Limit</th><th>Points</th></tr></thead>
                    <tbody>${attack.limits.map((limit, index) => this.renderLimitTableRow(limit, index)).join('')}</tbody>
                    <tfoot>${this.renderLimitCalculationFooter(attack, character)}</tfoot>
                </table>
            </div>
        `;
    }
    
    renderLimitTableRow(limit, index) {
        const pointsValue = limit.points || limit.cost || 0;
        return `
            <tr class="limit-table-row" data-limit-index="${index}">
                <td class="remove-cell">${RenderUtils.renderButton({ text: '×', variant: 'danger', size: 'small', dataAttributes: {action: 'remove-limit-row', index: index}})}</td>
                <td class="limit-name-cell">${limit.name}</td>
                <td class="limit-points-cell">${pointsValue}</td>
            </tr>`;
    }

    renderLimitCalculationFooter(attack, character) {
        const { totalValue, finalPoints } = SpecialAttackSystem.calculateLimitToUpgradePoints(character, attack);
        return `
            <tr class="calculation-subtotal"><td colspan="2"><strong>Limit Points Total:</strong></td><td><strong>${attack.limitPointsTotal || 0}</strong></td></tr>
            <tr class="calculation-diminishing"><td colspan="2">Before Rounding:</td><td>${totalValue.toFixed(2)}</td></tr>
            <tr class="calculation-final"><td colspan="2"><strong>Final Upgrade Points:</strong></td><td><strong>${finalPoints}</strong></td></tr>`;
    }

    renderLimitCategory(categoryKey, categoryLimits, attack, character) {
        const isExpanded = this.expandedLimitCategories.has(categoryKey);
        return `
            <div class="limit-category">
                <div class="limit-category-header" data-action="toggle-limit-category" data-category="${categoryKey}">
                    <span class="category-expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    <span class="category-name">${this.formatCategoryName(categoryKey)}</span>
                </div>
                <div class="limit-category-content" style="display: ${isExpanded ? 'block' : 'none'};">
                    ${categoryLimits.map(limit => this.renderLimitOption(limit, attack, character)).join('')}
                </div>
            </div>
        `;
    }

    renderLimitOption(limit, attack, character) {
        const isSelected = (attack.limits || []).some(l => l.id === limit.id);
        const validation = SpecialAttackSystem.validateLimitSelection(character, attack, limit.id);
        return RenderUtils.renderCard({
            title: limit.name,
            cost: limit.cost,
            description: limit.description + (!validation.isValid ? `<br><small class="error-text">${validation.errors[0]}</small>` : ''),
            clickable: !isSelected && validation.isValid,
            disabled: isSelected || !validation.isValid,
            selected: isSelected,
            dataAttributes: { action: isSelected ? 'remove-limit' : 'add-limit', 'limit-id': limit.id }
        }, { cardClass: 'limit-option', showStatus: false });
    }

    renderUpgradesSection(attack, character) {
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        return `
            <div class="upgrades-section section-block">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining">Points: <span class="${remainingPoints < 0 ? 'error-text' : ''}">${remainingPoints}</span></div>
                </div>
                ${this.renderAvailableUpgrades(character, attack)}
            </div>
        `;
    }

    renderAvailableUpgrades(character, attack) {
        const allUpgrades = SpecialAttackSystem.getAvailableUpgrades();
        const upgradesByCategory = this.groupUpgradesByCategory(allUpgrades);

        return `
            <div class="upgrade-categories">
                ${Object.entries(upgradesByCategory).map(([category, upgrades]) => `
                    <div class="upgrade-category">
                        <div class="category-header" data-action="toggle-upgrade-category" data-category="${category}">
                           <span class="category-toggle">${this.expandedUpgradeCategories.has(category) ? '▼' : '▶'}</span>
                           <h5>${category}</h5>
                        </div>
                        <div class="category-content" style="display: ${this.expandedUpgradeCategories.has(category) ? 'block' : 'none'};">
                            ${upgrades.map(up => this.renderUpgradeCard(up, attack, character)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderUpgradeCard(upgrade, attack, character) {
        let actualCost = typeof upgrade.cost === 'string' ? ((parseInt(upgrade.cost) || 0) * character.tier) : upgrade.cost;
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        const canAfford = remainingPoints >= actualCost;
        const isPurchased = (attack.upgrades || []).some(u => u.id === upgrade.id);
        const validation = SpecialAttackSystem.validateUpgradeAddition(character, attack, upgrade);

        return RenderUtils.renderCard({
            title: upgrade.name,
            cost: actualCost,
            description: `${upgrade.effect || ''} ${upgrade.restriction ? `<br><small><strong>Restriction:</strong> ${upgrade.restriction}</small>`: ''} ${!validation.isValid ? `<br><small class="error-text">${validation.errors[0]}</small>` : ''}`,
            clickable: !isPurchased && canAfford && validation.isValid,
            disabled: isPurchased || !canAfford || !validation.isValid,
            selected: isPurchased,
            dataAttributes: { action: isPurchased ? 'remove-upgrade' : 'purchase-upgrade', 'upgrade-id': upgrade.id }
        }, { cardClass: 'upgrade-option', showStatus: false });
    }

    setupEventListeners() {
        EventManager.delegateEvents(document.getElementById('tab-specialAttacks'), {
            click: { '[data-action]': (e, el) => this.handleEvent(e, el) },
            change: { 'select[data-action]': (e, el) => this.handleEvent(e, el) },
            input: { 'input[data-action]': (e, el) => this.handleEvent(e, el) }
        });
    }

    handleEvent(e, element) {
        const { action, ...data } = element.dataset;
        e.stopPropagation();

        const handlers = {
            createAttack: () => this.createNewAttack(),
            selectAttackTab: () => this.selectAttack(parseInt(data.attackIndex)),
            deleteAttack: () => this.deleteAttack(parseInt(data.index)),
            updateAttackName: () => this.updateAttackProperty('name', element.value),
            addAttackType: () => this.addAttackType(element.value),
            removeAttackType: () => this.removeAttackType(data.id),
            addEffectType: () => this.addEffectType(element.value),
            removeEffectType: () => this.removeEffectType(data.id),
            addBasicCondition: () => this.addCondition(element.value, false),
            removeBasicCondition: () => this.removeCondition(data.id, false),
            updateHybridOrder: () => this.updateAttackProperty('hybridOrder', element.value),
            toggleLimitCategory: () => this.toggleCategory('limit', data.category),
            toggleUpgradeCategory: () => this.toggleCategory('upgrade', data.category),
            addLimit: () => this.addLimit(data.limitId),
            removeLimit: () => this.removeLimit(data.limitId),
            removeLimitRow: () => this.removeLimitByIndex(parseInt(data.index)),
            purchaseUpgrade: () => this.purchaseUpgrade(data.upgradeId),
            removeUpgrade: () => this.removeUpgrade(data.upgradeId),
            'continue-to-utility': () => this.builder.switchTab('utility')
        };
        handlers[action]?.();
    }
    
    onCharacterUpdate() { 
        // Granular updates using modular components
        this.updateAttackTabs();
        this.updateComponentStates();
    }
    
    // Granular update methods
    updateAttackTabs() {
        const character = this.builder.currentCharacter;
        if (!character) return;
        
        const tabsContainer = document.querySelector('.attack-tabs-container');
        if (tabsContainer) {
            tabsContainer.innerHTML = character.specialAttacks.map((attack, index) => 
                this.renderAttackTab(attack, index)
            ).join('');
        }
    }
    
    updateComponentStates() {
        const character = this.builder.currentCharacter;
        if (!character || !character.specialAttacks[this.selectedAttackIndex]) return;
        
        const attack = character.specialAttacks[this.selectedAttackIndex];
        
        // Update modular components with granular updates
        this.limitSelection.updateLimitsList(attack);
        this.limitSelection.updateCalculationFooter(attack, character);
        this.upgradeSelection.updatePurchasedUpgrades(attack);
    }
    
    createNewAttack() {
        const character = this.builder.currentCharacter;
        const newAttack = SpecialAttackSystem.createSpecialAttack(character);
        character.specialAttacks.push(newAttack);
        this.selectedAttackIndex = character.specialAttacks.length - 1;
        this.builder.updateCharacter();
    }
    selectAttack(index) { this.selectedAttackIndex = index; this.render(); }
    deleteAttack(index) {
        if(confirm('Are you sure you want to delete this attack?')){
            SpecialAttackSystem.deleteSpecialAttack(this.builder.currentCharacter, index);
            if (this.selectedAttackIndex >= this.builder.currentCharacter.specialAttacks.length) {
                this.selectedAttackIndex = Math.max(0, this.builder.currentCharacter.specialAttacks.length - 1);
            }
            this.builder.updateCharacter();
        }
    }
    updateAttackProperty(prop, value) { this.builder.updateSpecialAttackProperty(this.selectedAttackIndex, prop, value); }
    addAttackType(typeId) { if(typeId) { this.builder.addAttackTypeToAttack(this.selectedAttackIndex, typeId); } }
    removeAttackType(typeId) { this.builder.removeAttackTypeFromAttack(this.selectedAttackIndex, typeId); }
    addEffectType(typeId) { if(typeId) { this.builder.addEffectTypeToAttack(this.selectedAttackIndex, typeId); } }
    removeEffectType(typeId) { this.builder.removeEffectTypeFromAttack(this.selectedAttackIndex, typeId); }
    addCondition(id, isAdvanced) { if(id) { this.builder.addConditionToAttack(this.selectedAttackIndex, id, isAdvanced); } }
    removeCondition(id, isAdvanced) { this.builder.removeConditionFromAttack(this.selectedAttackIndex, id, isAdvanced); }
    toggleCategory(type, category) { const set = type === 'limit' ? this.expandedLimitCategories : this.expandedUpgradeCategories; if (set.has(category)) set.delete(category); else set.add(category); this.render(); }
    addLimit(id) { SpecialAttackSystem.addLimitToAttack(this.builder.currentCharacter, this.selectedAttackIndex, id); this.builder.updateCharacter(); }
    removeLimit(id) { SpecialAttackSystem.removeLimitFromAttack(this.builder.currentCharacter, this.selectedAttackIndex, id); this.builder.updateCharacter(); }
    removeLimitByIndex(index) { const limitId = this.builder.currentCharacter.specialAttacks[this.selectedAttackIndex].limits[index].id; this.removeLimit(limitId); }
    purchaseUpgrade(id) { SpecialAttackSystem.addUpgradeToAttack(this.builder.currentCharacter, this.selectedAttackIndex, id); this.builder.updateCharacter(); }
    removeUpgrade(id) { SpecialAttackSystem.removeUpgradeFromAttack(this.builder.currentCharacter, this.selectedAttackIndex, id); this.builder.updateCharacter(); }
    
    groupLimitsByCategory(limits) { return limits.reduce((acc, l) => { (acc[l.category] = acc[l.category] || []).push(l); return acc; }, {}); }
    groupUpgradesByCategory(upgrades) { return upgrades.reduce((acc, u) => { (acc[u.category] = acc[u.category] || []).push(u); return acc; }, {}); }
    formatCategoryName(name) { return name.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()); }
    formatArchetypeName(name) { return name ? name.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) : 'None'; }
}