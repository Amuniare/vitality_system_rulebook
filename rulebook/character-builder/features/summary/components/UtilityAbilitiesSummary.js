export class UtilityAbilitiesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(character) {
        if (!character || !character.utilityPurchases) {
            return `
                <div class="card">
                    <h3>Utility & General Abilities</h3>
                    <div class="card-content">
                        <p>No utility purchase data available</p>
                    </div>
                </div>
            `;
        }

        const utilityPurchases = character.utilityPurchases;
        const hasAnyPurchases = this.hasUtilityPurchases(utilityPurchases);

        if (!hasAnyPurchases) {
            return `
                <div class="card">
                    <h3>Utility & General Abilities</h3>
                    <div class="card-content">
                        <p>No utility abilities purchased yet</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3>Utility & General Abilities</h3>
                <div class="card-content">
                    ${this.renderUtilityCategories(utilityPurchases)}
                </div>
            </div>
        `;
    }

    hasUtilityPurchases(utilityPurchases) {
        if (!utilityPurchases || typeof utilityPurchases !== 'object') {
            return false;
        }

        // Check if any category has purchases
        return Object.keys(utilityPurchases).some(category => {
            const items = utilityPurchases[category];
            return Array.isArray(items) && items.length > 0;
        });
    }

    renderUtilityCategories(utilityPurchases) {
        let content = '';
        
        // Define the order and display names for categories
        const categoryConfig = {
            expertise: 'Expertise',
            features: 'Features',
            senses: 'Senses',
            movement: 'Movement Features',
            generic: 'Generic Utilities',
            custom: 'Custom Abilities'
        };

        Object.entries(categoryConfig).forEach(([key, displayName]) => {
            const items = utilityPurchases[key];
            if (Array.isArray(items) && items.length > 0) {
                content += this.renderCategory(displayName, items, key);
            }
        });

        return content || '<p>No utility abilities found</p>';
    }

    renderCategory(categoryName, items, categoryKey) {
        return `
            <h5>${categoryName}</h5>
            <ul>
                ${items.map(item => this.renderItem(item, categoryKey)).join('')}
            </ul>
        `;
    }

    renderItem(item, categoryKey) {
        if (typeof item === 'string') {
            return `<li>${item}</li>`;
        }

        if (typeof item === 'object' && item !== null) {
            // Handle expertise with levels
            if (categoryKey === 'expertise' && item.name && item.level) {
                const levelDisplay = this.formatExpertiseLevel(item.level);
                return `<li>${item.name} (${levelDisplay})</li>`;
            }

            // Handle objects with name property
            if (item.name) {
                return `<li>${item.name}</li>`;
            }

            // Handle objects with other structure
            if (item.ability || item.feature) {
                return `<li>${item.ability || item.feature}</li>`;
            }
        }

        // Fallback for unknown structure
        return `<li>${String(item)}</li>`;
    }

    formatExpertiseLevel(level) {
        const levelMap = {
            'novice': 'Novice',
            'practiced': 'Practiced', 
            'expert': 'Expert',
            'master': 'Master',
            'mastered': 'Mastered'
        };

        return levelMap[level?.toLowerCase()] || level || 'Unknown Level';
    }
}