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

