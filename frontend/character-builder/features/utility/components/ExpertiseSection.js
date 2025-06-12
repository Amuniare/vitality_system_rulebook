import { RenderUtils } from '../../../shared/utils/RenderUtils.js';
import { UtilitySystem } from '../../../systems/UtilitySystem.js';

export class ExpertiseSection {
    constructor(builder) {
        this.builder = builder;
    }

    renderActivityExpertise(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const availableContent = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeActivityExpertiseBlock(attrKey, attrData, character)
        ).join('');
        
        return `
            <div class="expertise-section">
                <h4>Available Activity-Based Expertise</h4>
                <p class="section-description">Skills and professions that enhance your capabilities. Basic adds your Tier to checks, Mastered adds twice your Tier.</p>
                <div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${availableContent}</div>
            </div>
        `;
    }

    renderSituationalExpertise(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const availableContent = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeSituationalExpertiseBlock(attrKey, attrData, character)
        ).join('');
        
        return `
            <div class="expertise-section">
                <h4>Available Situational Expertise</h4>
                <p class="section-description">Circumstantial training that helps in specific situations. Basic adds your Tier to checks, Mastered adds twice your Tier.</p>
                <div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${availableContent}</div>
            </div>
        `;
    }

    renderAttributeActivityExpertiseBlock(attrKey, attrData, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const activities = attrData.activities || [];
        
        if (activities.length === 0) {
            return RenderUtils.renderCard({
                title: `${attrKey} Activity Expertise`, titleTag: 'h4',
                additionalContent: '<p class="empty-state-small">No activity-based expertise available for this attribute.</p>'
            }, { cardClass: 'expertise-attribute-card' });
        }

        return RenderUtils.renderCard({
            title: `${attrKey} Activity Expertise`, titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Basic: ${costs.activityBased.basic.cost}p / Mastered: ${costs.activityBased.mastered.cost}p</h5>
                    <div class="expertise-cards-grid">${activities.map(ex => this.renderSingleExpertiseOption(ex, attrKey, 'activity', character)).join('')}</div>
                </div>`
        }, { cardClass: 'expertise-attribute-card' });
    }

    renderAttributeSituationalExpertiseBlock(attrKey, attrData, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const situational = attrData.situational || [];
        
        if (situational.length === 0) {
            return RenderUtils.renderCard({
                title: `${attrKey} Situational Expertise`, titleTag: 'h4',
                additionalContent: '<p class="empty-state-small">No situational expertise available for this attribute.</p>'
            }, { cardClass: 'expertise-attribute-card' });
        }

        return RenderUtils.renderCard({
            title: `${attrKey} Situational Expertise`, titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Basic: ${costs.situational.basic.cost}p / Mastered: ${costs.situational.mastered.cost}p</h5>
                    <div class="expertise-cards-grid">${situational.map(ex => this.renderSingleExpertiseOption(ex, attrKey, 'situational', character)).join('')}</div>
                </div>`
        }, { cardClass: 'expertise-attribute-card' });
    }

    renderSingleExpertiseOption(expertise, attribute, type, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const basicCost = costs[type === 'activity' ? 'activityBased' : 'situational'].basic.cost;
        const masteredCost = costs[type === 'activity' ? 'activityBased' : 'situational'].mastered.cost;
        const currentExpertise = character.utilityPurchases.expertise[attribute] || { basic: [], mastered: [] };
        const expertiseId = expertise.id || expertise.name;
        const isBasic = currentExpertise.basic.includes(expertiseId);
        const isMastered = currentExpertise.mastered.includes(expertiseId);

        return `
            <div class="expertise-card">
                <div class="expertise-card-header"><div class="expertise-name">${expertise.name}</div><div class="expertise-description">${expertise.description}</div></div>
                <div class="expertise-card-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-value">${basicCost}p</div>
                        ${RenderUtils.renderButton({ text: isBasic ? '✓ Basic' : 'Purchase', variant: isBasic ? 'success' : 'primary', size: 'small', disabled: isBasic, dataAttributes: { action: 'purchase-expertise', attribute, 'expertise-id': expertiseId, 'expertise-type': type, level: 'basic' } })}
                    </div>
                    <div class="expertise-mastered-section">
                        <div class="expertise-cost-value">${masteredCost}p</div>
                        ${RenderUtils.renderButton({ text: isMastered ? '✓ Mastered' : 'Master', variant: isMastered ? 'success' : 'primary', size: 'small', disabled: !isBasic || isMastered, dataAttributes: { action: 'purchase-expertise', attribute, 'expertise-id': expertiseId, 'expertise-type': type, level: 'mastered' } })}
                    </div>
                </div>
            </div>`;
    }
}