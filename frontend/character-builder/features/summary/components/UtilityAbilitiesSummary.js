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

        // Check expertise (situational talent sets)
        if (utilityPurchases.expertise && 
            utilityPurchases.expertise.situational && 
            Array.isArray(utilityPurchases.expertise.situational) && 
            utilityPurchases.expertise.situational.length > 0) {
            return true;
        }

        // Check other utility categories
        return ['features', 'senses', 'movement', 'descriptors'].some(category => {
            const items = utilityPurchases[category];
            return Array.isArray(items) && items.length > 0;
        });
    }

    renderUtilityCategories(utilityPurchases, utilityDefinitions) {
        let content = '';
        
        // Handle Talent Sets (new expertise system)
        if (utilityPurchases.expertise && 
            utilityPurchases.expertise.situational && 
            Array.isArray(utilityPurchases.expertise.situational) && 
            utilityPurchases.expertise.situational.length > 0) {
            content += this.renderTalentSets(utilityPurchases.expertise.situational);
        }

        // Define the order and display names for other categories
        const categoryConfig = {
            features: 'Features',
            senses: 'Senses',
            movement: 'Movement Features',
            descriptors: 'Descriptors'
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

    renderTalentSets(talentSets) {
        return `
            <div class="utility-category">
                <h5 class="utility-category-header">Talent Sets</h5>
                <div class="utility-items">
                    ${talentSets.map(talentSet => this.renderTalentSet(talentSet)).join('')}
                </div>
            </div>
        `;
    }

    renderTalentSet(talentSet) {
        const displayName = talentSet.talents.filter(t => t && t.trim()).join(', ') || 'Untitled Talent Set';
        const attributeDisplay = talentSet.attribute.charAt(0).toUpperCase() + talentSet.attribute.slice(1);
        const levelDisplay = this.formatExpertiseLevel(talentSet.level);
        const hasLevel = talentSet.level && talentSet.level !== 'none';
        
        return `
            <div class="utility-summary-item talent-set-item">
                <h5 class="utility-item-name">${displayName}${hasLevel ? ` (${levelDisplay})` : ''}</h5>
                <p class="utility-description">${attributeDisplay}-based talent set${hasLevel ? '' : ' (unpurchased)'}</p>
                ${talentSet.talents.length > 0 ? `<div class="talent-list">${talentSet.talents.filter(t => t && t.trim()).map(talent => `<span class="talent-tag">${talent}</span>`).join('')}</div>` : ''}
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
            itemId = item.itemId || item.name || item.ability || item.feature;
            itemName = item.name || item.ability || item.feature || itemId;
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
        
        return `
            <div class="utility-summary-item">
                <h5 class="utility-item-name">${itemName}</h5>
                ${itemDescription ? `<p class="utility-description">${itemDescription}</p>` : ''}
            </div>
        `;
    }

    formatExpertiseLevel(level) {
        const levelMap = {
            'basic': 'Basic',
            'mastered': 'Mastered',
            'none': 'Unpurchased'
        };

        return levelMap[level?.toLowerCase()] || level || 'Unknown Level';
    }
}