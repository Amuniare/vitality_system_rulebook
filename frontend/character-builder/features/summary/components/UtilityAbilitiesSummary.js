export class UtilityAbilitiesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(utilityPurchases, utilityDefinitions) {
        if (!utilityPurchases) {
            return `
                <div class="card">
                    <h3>Utility & General Abilities</h3>
                    <div class="card-content">
                        <p>No utility purchase data available</p>
                    </div>
                </div>
            `;
        }

        const hasAnyPurchases = this.hasUtilityPurchases(utilityPurchases);

        if (!hasAnyPurchases) {
            return `
                <div class="card">
                    <h3>Utility & General Abilities</h3>
                    <div class="card-content">
                        <p>No utility abilities purchased yet</p>
                        <p class="help-text">Utility abilities will appear here once purchased in the Utility tab.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3>Utility & General Abilities</h3>
                <div class="card-content">
                    ${this.renderUtilityCategories(utilityPurchases, utilityDefinitions)}
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

    renderUtilityCategories(utilityPurchases, utilityDefinitions) {
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
                const definitions = utilityDefinitions && utilityDefinitions[key] ? utilityDefinitions[key] : {};
                content += this.renderCategory(displayName, items, key, definitions);
            }
        });

        return content || '<p>No utility abilities found</p>';
    }

    renderCategory(categoryName, items, categoryKey, definitions) {
        return `
            <div class="utility-category">
                <h5 class="utility-category-header">${categoryName}</h5>
                <div class="utility-items">
                    ${items.map(item => this.renderItem(item, categoryKey, definitions)).join('')}
                </div>
            </div>
        `;
    }

    renderItem(item, categoryKey, definitions) {
        let itemId, itemName, itemDescription;
        
        // Extract item information based on structure
        if (typeof item === 'string') {
            itemId = item;
            itemName = item;
        } else if (typeof item === 'object' && item !== null) {
            // Handle expertise with levels
            if (categoryKey === 'expertise' && item.name && item.level) {
                itemId = item.name;
                itemName = `${item.name} (${this.formatExpertiseLevel(item.level)})`;
            } else {
                itemId = item.itemId || item.name || item.ability || item.feature;
                itemName = item.name || item.ability || item.feature || itemId;
            }
        } else {
            itemId = String(item);
            itemName = String(item);
        }
        
        // Get description from definitions
        const definition = definitions && definitions[itemId];
        if (definition) {
            itemDescription = definition.description;
            // Use the definition name if available (it might be more descriptive)
            if (definition.name && !itemName.includes('(')) {
                itemName = definition.name;
            }
        }
        
        // Handle special cases for expertise
        if (categoryKey === 'expertise' && !itemDescription) {
            itemDescription = `Expertise in ${itemId}`;
        }
        
        return `
            <div class="utility-summary-item">
                <h5 class="utility-item-name">${itemName}</h5>
                ${itemDescription ? `<p class="utility-description">${itemDescription}</p>` : ''}
            </div>
        `;
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