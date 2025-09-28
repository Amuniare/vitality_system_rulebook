// frontend/character-builder/features/summary/components/UtilityAbilitiesSummary.js
import { gameDataManager } from '../../../core/GameDataManager.js';

export class UtilityAbilitiesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(character) {
        if (!character) {
            return `
                <div class="card">
                    <h3>Utility</h3>
                    <div class="card-content">
                        <p>No character data available</p>
                    </div>
                </div>
            `;
        }

        const hasAnyPurchases = this.hasUtilityPurchases(character);

        if (!hasAnyPurchases) {
            return `
                <div class="card">
                    <h3>Utility</h3>
                    <div class="card-content">
                        <p>No utility abilities defined yet.</p>
                        <p class="help-text">Abilities will appear here once defined in the Utility tab.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3>Utility</h3>
                <div class="card-content">
                    ${this.renderUtilityArchetype(character)}
                    ${this.renderUtilityPurchases(character.utilityPurchases)}
                </div>
            </div>
        `;
    }

    hasUtilityPurchases(character) {
        if (!character) return false;

        const hasArchetype = !!character.archetypes?.utility;
        const hasPurchases = character.utilityPurchases && Object.values(character.utilityPurchases).some(category => Array.isArray(category) && category.length > 0);

        return hasArchetype || hasPurchases;
    }

    
    renderUtilityArchetype(character) {
        const archetypeId = character.archetypes?.utility;
        if (!archetypeId) return '';

        const archetypes = gameDataManager.getArchetypesForCategory('utility') || [];
        const archetype = archetypes.find(a => a.id === archetypeId);
        if (!archetype) return '';
        
        let configDetails = '';
        const selections = character.utilityArchetypeSelections;
        if (archetypeId === 'practical' && selections.practicalSkills?.length > 0) {
            const skillNames = selections.practicalSkills.map(skillId => {
                const skill = (gameDataManager.getSkills() || []).find(s => s.id === skillId);
                return skill ? skill.name : skillId;
            });
            configDetails = `Skills: ${skillNames.join(', ')}`;
        } else if (archetypeId === 'specialized' && selections.specializedAttribute) {
            const attributes = gameDataManager.getAttributes();
            const allAttributes = [...(attributes.combat || []), ...(attributes.utility || [])];
            const attr = allAttributes.find(a => a.id === selections.specializedAttribute);
            configDetails = `Attribute: ${attr ? attr.name : selections.specializedAttribute}`;
        }
        
        return `
            <div class="utility-category">
                <h5 class="utility-category-header">Utility Archetype</h5>
                <div class="utility-summary-item">
                    <h5 class="utility-item-name">${archetype.name}</h5>
                    <p class="utility-description">${archetype.description}</p>
                    ${configDetails ? `<p class="utility-config-details"><strong>Selection:</strong> ${configDetails}</p>` : ''}
                </div>
            </div>
        `;
    }

    renderUtilityPurchases(utilityPurchases) {
        let content = '';
        const categoryConfig = {
            features: 'Features',
            senses: 'Senses',
            movement: 'Movement',
            descriptors: 'Descriptors'
        };

        Object.entries(categoryConfig).forEach(([key, displayName]) => {
            const items = utilityPurchases[key];
            if (Array.isArray(items) && items.length > 0) {
                content += this.renderCategory(displayName, items);
            }
        });

        return content;
    }

    renderCategory(categoryName, items) {
        return `
            <div class="utility-category">
                <h5 class="utility-category-header">${categoryName}</h5>
                <div class="utility-items">
                    ${items.map(item => this.renderItem(item)).join('')}
                </div>
            </div>
        `;
    }

    renderItem(item) {
        return `
            <div class="utility-summary-item">
                <h5 class="utility-item-name">${item.name} (${item.cost}p)</h5>
                ${item.description ? `<p class="utility-description">${item.description}</p>` : ''}
            </div>
        `;
    }
}