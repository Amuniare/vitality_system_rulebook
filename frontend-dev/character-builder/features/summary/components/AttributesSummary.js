export class AttributesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(character, statBreakdowns) {
        if (!character) {
            return `
                <div class="card">
                    <h3>Core Attributes</h3>
                    <div class="card-content">
                        <p>No attribute data available</p>
                    </div>
                </div>
                <div class="card">
                    <h3>Calculated Stats</h3>
                    <div class="card-content">
                        <p>No stat data available</p>
                    </div>
                </div>
            `;
        }

        return `
            ${this.renderCoreAttributes(character)}
            ${this.renderCalculatedStats(statBreakdowns)}
        `;
    }

    renderCoreAttributes(character) {
        const attributes = character.attributes || {};
        
        return `
            <div class="card">
                <h3>Core Attributes</h3>
                <div class="card-content">
                    <div class="summary-item">
                        <span class="summary-label">Focus</span>
                        <span class="summary-value">${attributes.focus || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Mobility</span>
                        <span class="summary-value">${attributes.mobility || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Power</span>
                        <span class="summary-value">${attributes.power || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Endurance</span>
                        <span class="summary-value">${attributes.endurance || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Awareness</span>
                        <span class="summary-value">${attributes.awareness || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Communication</span>
                        <span class="summary-value">${attributes.communication || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Intelligence</span>
                        <span class="summary-value">${attributes.intelligence || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderCalculatedStats(statBreakdowns) {
        if (!statBreakdowns) {
            return `
                <div class="card">
                    <h3>Calculated Stats</h3>
                    <div class="card-content">
                        <p>No stat breakdown data available</p>
                    </div>
                </div>
            `;
        }
        
        const statsOrder = ['hp', 'avoidance', 'durability', 'resolve', 'stability', 'vitality', 
                           'accuracy', 'damage', 'conditions', 'initiative', 'movement'];
        
        let statItems = '';
        
        statsOrder.forEach(statName => {
            const breakdown = statBreakdowns[statName];
            if (breakdown && breakdown.length > 0) {
                const finalValue = this.calculateFinalValue(breakdown);
                const breakdownText = this.formatBreakdown(breakdown);
                const unit = statName === 'movement' ? ' sp' : '';
                
                statItems += `
                    <div class="stat-item-detailed">
                        <div class="stat-main-line">
                            <span class="summary-label">${this.getStatDisplayName(statName)}</span>
                            <strong class="summary-value">${finalValue}${unit}</strong>
                        </div>
                        <div class="stat-breakdown">
                            ${breakdownText}
                        </div>
                    </div>
                `;
            }
        });
        
        return `
            <div class="card">
                <h3>Calculated Stats</h3>
                <div class="card-content">
                    ${statItems || '<p>No calculated stats available</p>'}
                </div>
            </div>
        `;
    }
    
    // Calculate final value from breakdown array
    calculateFinalValue(breakdown) {
        return breakdown.reduce((total, item) => total + (item.value || 0), 0);
    }
    
    // Format breakdown array into readable string
    formatBreakdown(breakdown) {
        if (!breakdown || breakdown.length === 0) {
            return 'No breakdown available';
        }
        
        return breakdown
            .map(item => {
                const value = item.value || 0;
                const source = item.source || 'Unknown';
                const sign = value >= 0 ? '+' : '';
                return `${sign}${value} (${source})`;
            })
            .join(' ');
    }
    
    // Get display name for stat
    getStatDisplayName(statName) {
        const displayNames = {
            hp: 'HP',
            avoidance: 'Avoidance',
            durability: 'Durability',
            resolve: 'Resolve',
            stability: 'Stability', 
            vitality: 'Vitality',
            accuracy: 'Accuracy',
            damage: 'Damage',
            conditions: 'Conditions',
            initiative: 'Initiative',
            movement: 'Movement'
        };
        
        return displayNames[statName] || statName;
    }
}