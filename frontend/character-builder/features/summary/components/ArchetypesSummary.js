export class ArchetypesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(archetypes, archetypeDefinitions) {
        if (!archetypes || typeof archetypes !== 'object') {
            return `
                <div class="card">
                    <h3>Selected Archetypes</h3>
                    <div class="card-content">
                        <p>No archetype data available</p>
                    </div>
                </div>
            `;
        }

        const archetypeOrder = ['movement', 'attackType', 'effectType', 'uniqueAbility', 'defensive', 'specialAttack', 'utility'];
        const categoryNames = {
            movement: 'Movement',
            attackType: 'Attack Type',
            effectType: 'Effect Type',
            uniqueAbility: 'Unique Ability',
            defensive: 'Defensive',
            specialAttack: 'Special Attack',
            utility: 'Utility'
        };
        
        let archetypeItems = '';
        
        archetypeOrder.forEach(category => {
            const archetypeId = archetypes[category];
            const definition = archetypeDefinitions && archetypeDefinitions[category];
            
            if (archetypeId && definition) {
                archetypeItems += `
                    <div class="archetype-summary-item">
                        <div class="archetype-header">
                            <span class="summary-label">${categoryNames[category]}</span>
                            <strong class="summary-value">${definition.name}</strong>
                        </div>
                        <p class="archetype-description">
                            ${definition.description}
                        </p>
                    </div>
                `;
            } else if (archetypeId) {
                // Fallback for missing definitions
                archetypeItems += `
                    <div class="archetype-summary-item">
                        <div class="archetype-header">
                            <span class="summary-label">${categoryNames[category]}</span>
                            <strong class="summary-value">${archetypeId}</strong>
                        </div>
                        <p class="archetype-description">
                            <em>Description not available</em>
                        </p>
                    </div>
                `;
            } else {
                // Show empty state for unselected archetypes
                archetypeItems += `
                    <div class="archetype-summary-item">
                        <div class="archetype-header">
                            <span class="summary-label">${categoryNames[category]}</span>
                            <span class="summary-value"><em>Not Selected</em></span>
                        </div>
                    </div>
                `;
            }
        });

        return `
            <div class="card">
                <h3>Selected Archetypes</h3>
                <div class="card-content">
                    ${archetypeItems}
                </div>
            </div>
        `;
    }

}