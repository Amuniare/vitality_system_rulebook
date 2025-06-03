// SummaryTab.js - Character summary and export
export class SummaryTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-summary');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        const stats = this.builder.calculateStats();
        const validation = this.builder.validateCharacter();

        tabContent.innerHTML = `
            <div class="summary-section">
                <h2>Character Summary</h2>
                <div class="summary-grid">
                    ${this.renderBasicInfo(character)}
                    ${this.renderArchetypes(character)}
                    ${this.renderAttributes(character)}
                    ${this.renderCalculatedStats(stats)}
                    ${this.renderValidationSummary(validation)}
                </div>
                
                <div class="export-actions">
                    <h3>Export Character</h3>
                    <div class="export-buttons">
                        <button id="export-json-summary" class="btn-secondary">Export JSON</button>
                        <button id="export-roll20-summary" class="btn-secondary">Export for Roll20</button>
                        <button id="print-character" class="btn-secondary">Print Character Sheet</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderBasicInfo(character) {
        return `
            <div class="summary-card">
                <h3>Basic Information</h3>
                <div class="info-grid">
                    <div><strong>Name:</strong> ${character.name}</div>
                    <div><strong>Real Name:</strong> ${character.realName || 'Not specified'}</div>
                    <div><strong>Tier:</strong> ${character.tier}</div>
                    <div><strong>Created:</strong> ${new Date(character.created).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }

    renderArchetypes(character) {
        const archetypeNames = {
            movement: 'Movement',
            attackType: 'Attack Type',
            effectType: 'Effect Type',
            uniqueAbility: 'Unique Ability',
            defensive: 'Defensive',
            specialAttack: 'Special Attack',
            utility: 'Utility'
        };

        return `
            <div class="summary-card">
                <h3>Archetypes</h3>
                <div class="archetype-list">
                    ${Object.entries(character.archetypes).map(([key, value]) => `
                        <div class="archetype-item">
                            <strong>${archetypeNames[key]}:</strong> 
                            ${value ? this.formatArchetypeName(value) : '<em>Not selected</em>'}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderAttributes(character) {
        const attributeNames = {
            focus: 'Focus',
            mobility: 'Mobility',
            power: 'Power',
            endurance: 'Endurance',
            awareness: 'Awareness',
            communication: 'Communication',
            intelligence: 'Intelligence'
        };

        return `
            <div class="summary-card">
                <h3>Attributes</h3>
                <div class="attributes-display">
                    <div class="combat-attrs">
                        <h4>Combat</h4>
                        ${['focus', 'mobility', 'power', 'endurance'].map(attr => `
                            <div class="attr-item">
                                <span>${attributeNames[attr]}:</span>
                                <span class="attr-value">${character.attributes[attr] || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="utility-attrs">
                        <h4>Utility</h4>
                        ${['awareness', 'communication', 'intelligence'].map(attr => `
                            <div class="attr-item">
                                <span>${attributeNames[attr]}:</span>
                                <span class="attr-value">${character.attributes[attr] || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }


    renderValidationSummary(validation) {
        const status = validation.isValid ? 'valid' : 'invalid';
        const statusText = validation.isValid ? 'Character is valid and ready for play!' : 'Character has validation issues';
        const statusIcon = validation.isValid ? '✅' : '⚠️';

        return `
            <div class="summary-card validation-summary ${status}">
                <h3>Validation Status</h3>
                <div class="validation-status">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${statusText}</span>
                </div>
                
                ${validation.errors.length > 0 ? `
                    <div class="validation-errors">
                        <h4>Errors (${validation.errors.length})</h4>
                        <ul>
                            ${validation.errors.slice(0, 5).map(error => `<li>${error}</li>`).join('')}
                            ${validation.errors.length > 5 ? `<li><em>...and ${validation.errors.length - 5} more</em></li>` : ''}
                        </ul>
                    </div>
                ` : ''}
                
                ${validation.warnings.length > 0 ? `
                    <div class="validation-warnings">
                        <h4>Warnings (${validation.warnings.length})</h4>
                        <ul>
                            ${validation.warnings.slice(0, 3).map(warning => `<li>${warning}</li>`).join('')}
                            ${validation.warnings.length > 3 ? `<li><em>...and ${validation.warnings.length - 3} more</em></li>` : ''}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    formatArchetypeName(archetypeId) {
        // Convert camelCase to Title Case
        return archetypeId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    setupEventListeners() {
        const exportJsonBtn = document.getElementById('export-json-summary');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.builder.exportCharacterJSON();
            });
        }

        const exportRoll20Btn = document.getElementById('export-roll20-summary');
        if (exportRoll20Btn) {
            exportRoll20Btn.addEventListener('click', () => {
                this.exportForRoll20();
            });
        }

        const printBtn = document.getElementById('print-character');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printCharacterSheet();
            });
        }
    }

    exportForRoll20() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const roll20Data = character.exportForRoll20();
        const dataStr = JSON.stringify(roll20Data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${character.name.replace(/[^a-z0-9]/gi, '_')}_roll20.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.builder.showNotification('Roll20 export downloaded!', 'success');
    }

    printCharacterSheet() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Create printable character sheet
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${character.name} - Character Sheet</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .character-header { border-bottom: 2px solid #000; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                    .stat-line { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="character-header">
                    <h1>${character.name}</h1>
                    <p>Tier ${character.tier} Character</p>
                </div>
                <!-- Character sheet content would go here -->
                <p>Full character sheet printing feature coming soon!</p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    renderCalculatedStats(stats) {
        if (!stats.final) return '';
    
        return `
            <div class="summary-card">
                <h3>Calculated Stats</h3>
                <div class="stats-grid">
                    <div class="combat-stats">
                        <h4>Combat</h4>
                        ${this.renderStatWithBreakdown('Accuracy', stats.final.accuracy, stats.breakdown?.accuracy)}
                        ${this.renderStatWithBreakdown('Damage', stats.final.damage, stats.breakdown?.damage)}
                        ${this.renderStatWithBreakdown('Conditions', stats.final.conditions, stats.breakdown?.conditions)}
                        ${this.renderStatWithBreakdown('Initiative', stats.final.initiative, stats.breakdown?.initiative)}
                        ${this.renderStatWithBreakdown('Movement', `${stats.final.movement} spaces`, stats.breakdown?.movement)}
                        ${this.renderStatWithBreakdown('HP', stats.final.hp, stats.breakdown?.hp)}
                    </div>
                    <div class="defense-stats">
                        <h4>Defenses</h4>
                        ${this.renderStatWithBreakdown('Avoidance', stats.final.avoidance, stats.breakdown?.avoidance)}
                        ${this.renderStatWithBreakdown('Durability', stats.final.durability, stats.breakdown?.durability)}
                        ${this.renderStatWithBreakdown('Resolve', stats.final.resolve, stats.breakdown?.resolve)}
                        ${this.renderStatWithBreakdown('Stability', stats.final.stability, stats.breakdown?.stability)}
                        ${this.renderStatWithBreakdown('Vitality', stats.final.vitality, stats.breakdown?.vitality)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStatWithBreakdown(name, value, breakdown) {
        if (!breakdown) {
            return `<div class="stat-item"><span>${name}:</span> <span>${value}</span></div>`;
        }
        
        const sourcesText = breakdown.sources?.map(source => 
            `${source.source}: ${source.value > 0 ? '+' : ''}${source.value}`
        ).join(', ') || '';
        
        return `
            <div class="stat-item expandable">
                <div class="stat-header">
                    <span>${name}:</span> 
                    <span class="stat-value">${value}</span>
                </div>
                ${sourcesText ? `<div class="stat-breakdown" title="${sourcesText}">Base: ${breakdown.base}${breakdown.difference !== 0 ? `, Modifiers: ${breakdown.difference > 0 ? '+' : ''}${breakdown.difference}` : ''}</div>` : ''}
            </div>
        `;
    }


    renderCalculatedStats(stats) {
        if (!stats.final) return '';
    
        return `
            <div class="summary-card">
                <h3>Calculated Stats</h3>
                <div class="stats-grid">
                    <div class="combat-stats">
                        <h4>Combat</h4>
                        ${this.renderStatWithBreakdown('Accuracy', stats.final.accuracy, stats.breakdown?.accuracy)}
                        ${this.renderStatWithBreakdown('Damage', stats.final.damage, stats.breakdown?.damage)}
                        ${this.renderStatWithBreakdown('Conditions', stats.final.conditions, stats.breakdown?.conditions)}
                        ${this.renderStatWithBreakdown('Initiative', stats.final.initiative, stats.breakdown?.initiative)}
                        ${this.renderStatWithBreakdown('Movement', `${stats.final.movement} spaces`, stats.breakdown?.movement)}
                        ${this.renderStatWithBreakdown('HP', stats.final.hp, stats.breakdown?.hp)}
                    </div>
                    <div class="defense-stats">
                        <h4>Defenses</h4>
                        ${this.renderStatWithBreakdown('Avoidance', stats.final.avoidance, stats.breakdown?.avoidance)}
                        ${this.renderStatWithBreakdown('Durability', stats.final.durability, stats.breakdown?.durability)}
                        ${this.renderStatWithBreakdown('Resolve', stats.final.resolve, stats.breakdown?.resolve)}
                        ${this.renderStatWithBreakdown('Stability', stats.final.stability, stats.breakdown?.stability)}
                        ${this.renderStatWithBreakdown('Vitality', stats.final.vitality, stats.breakdown?.vitality)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStatWithBreakdown(name, value, breakdown) {
        if (!breakdown) {
            return `<div class="stat-item"><span>${name}:</span> <span>${value}</span></div>`;
        }
        
        const sourcesText = breakdown.sources?.map(source => 
            `${source.source}: ${source.value > 0 ? '+' : ''}${source.value}`
        ).join(', ') || '';
        
        return `
            <div class="stat-item expandable">
                <div class="stat-header">
                    <span>${name}:</span> 
                    <span class="stat-value">${value}</span>
                </div>
                ${sourcesText ? `<div class="stat-breakdown" title="${sourcesText}">Base: ${breakdown.base}${breakdown.difference !== 0 ? `, Modifiers: ${breakdown.difference > 0 ? '+' : ''}${breakdown.difference}` : ''}</div>` : ''}
            </div>
        `;
    }

}