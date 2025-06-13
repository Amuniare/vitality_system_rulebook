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
        // Initialize situational array if needed
        if (!character.utilityPurchases.expertise.situational) {
            character.utilityPurchases.expertise.situational = [];
        }
        const situationalExpertises = character.utilityPurchases.expertise.situational;
        const maxSituationalExpertises = 3;
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        
        const availableContent = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeSituationalExpertiseBlock(attrKey, attrData, character)
        ).join('');
        
        return `
            <div class="expertise-section">
                <h4>Situational Expertise (${situationalExpertises.length}/${maxSituationalExpertises} total)</h4>
                <p class="section-description">Custom situational talents that help in specific circumstances. Each expertise contains 3 custom talents you define.</p>
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
        // Initialize situational array if needed
        if (!character.utilityPurchases.expertise.situational) {
            character.utilityPurchases.expertise.situational = [];
        }
        const situationalExpertises = character.utilityPurchases.expertise.situational;
        const maxSituationalExpertises = 3;
        
        // Find existing expertise for this attribute, or create placeholder for new one
        const existingExpertise = situationalExpertises.find(e => e.attribute.toLowerCase() === attrKey.toLowerCase());
        const canPurchase = !existingExpertise && situationalExpertises.length < maxSituationalExpertises;

        return RenderUtils.renderCard({
            title: `${attrKey} Situational Expertise`, titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Basic: ${costs.situational.basic.cost}p / Mastered: ${costs.situational.mastered.cost}p</h5>
                    <div class="expertise-cards-grid">
                        ${existingExpertise ? this.renderPurchasedSituationalExpertise(existingExpertise, character) : ''}
                        ${canPurchase ? this.renderNewSituationalExpertiseCard(attrKey) : ''}
                        ${!existingExpertise && !canPurchase ? '<p class="empty-state-small">Max situational expertises reached (3/3)</p>' : ''}
                    </div>
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

    renderNewSituationalExpertiseCard(attribute) {
        return `
            <div class="expertise-card">
                <div class="expertise-card-header">
                    <div class="expertise-description">
                        <div class="talent-inputs">
                            <input type="text" class="talent-input" 
                                   placeholder="Talent 1" 
                                   data-action="create-situational-talent"
                                   data-attribute="${attribute.toLowerCase()}"
                                   data-talent-index="0">
                            <input type="text" class="talent-input" 
                                   placeholder="Talent 2" 
                                   data-action="create-situational-talent"
                                   data-attribute="${attribute.toLowerCase()}"
                                   data-talent-index="1">
                            <input type="text" class="talent-input" 
                                   placeholder="Talent 3" 
                                   data-action="create-situational-talent"
                                   data-attribute="${attribute.toLowerCase()}"
                                   data-talent-index="2">
                        </div>
                    </div>
                </div>
                <div class="expertise-card-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-value">1p</div>
                        ${RenderUtils.renderButton({ 
                            text: 'Purchase Basic', 
                            variant: 'primary', 
                            size: 'small',
                            dataAttributes: { 
                                action: 'create-and-purchase-situational-expertise', 
                                attribute: attribute.toLowerCase(),
                                level: 'basic' 
                            } 
                        })}
                    </div>
                    <div class="expertise-mastered-section">
                        <div class="expertise-cost-value">2p</div>
                        ${RenderUtils.renderButton({ 
                            text: 'Purchase Mastered', 
                            variant: 'primary', 
                            size: 'small',
                            dataAttributes: { 
                                action: 'create-and-purchase-situational-expertise', 
                                attribute: attribute.toLowerCase(),
                                level: 'mastered' 
                            } 
                        })}
                    </div>
                </div>
            </div>`;
    }

    renderPurchasedSituationalExpertise(expertise, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const basicCost = costs.situational.basic.cost;
        const masteredCost = costs.situational.mastered.cost;
        
        // Generate display name from talents (comma-separated)
        const displayName = expertise.talents.filter(t => t && t.trim()).join(', ') || 'Untitled Expertise';
        
        return `
            <div class="expertise-card">
                <div class="expertise-card-header">
                    <div class="expertise-name">${displayName}</div>
                    <div class="expertise-description">
                        <div class="talent-inputs">
                            <input type="text" class="talent-input" 
                                   placeholder="Talent 1" 
                                   value="${expertise.talents[0] || ''}"
                                   data-action="update-situational-talent"
                                   data-expertise-id="${expertise.id}"
                                   data-talent-index="0">
                            <input type="text" class="talent-input" 
                                   placeholder="Talent 2" 
                                   value="${expertise.talents[1] || ''}"
                                   data-action="update-situational-talent"
                                   data-expertise-id="${expertise.id}"
                                   data-talent-index="1">
                            <input type="text" class="talent-input" 
                                   placeholder="Talent 3" 
                                   value="${expertise.talents[2] || ''}"
                                   data-action="update-situational-talent"
                                   data-expertise-id="${expertise.id}"
                                   data-talent-index="2">
                        </div>
                    </div>
                </div>
                <div class="expertise-card-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-value">${basicCost}p</div>
                        ${RenderUtils.renderButton({ 
                            text: expertise.level === 'basic' ? '✓ Basic' : 'Purchase', 
                            variant: expertise.level === 'basic' ? 'success' : 'primary', 
                            size: 'small', 
                            disabled: expertise.level !== 'none',
                            dataAttributes: { 
                                action: 'purchase-situational-expertise', 
                                'expertise-id': expertise.id, 
                                level: 'basic' 
                            } 
                        })}
                    </div>
                    <div class="expertise-mastered-section">
                        <div class="expertise-cost-value">${masteredCost}p</div>
                        ${RenderUtils.renderButton({ 
                            text: expertise.level === 'mastered' ? '✓ Mastered' : 'Master', 
                            variant: expertise.level === 'mastered' ? 'success' : 'primary', 
                            size: 'small', 
                            disabled: expertise.level !== 'basic',
                            dataAttributes: { 
                                action: 'purchase-situational-expertise', 
                                'expertise-id': expertise.id, 
                                level: 'mastered' 
                            } 
                        })}
                    </div>
                    <div class="expertise-remove-section">
                        ${RenderUtils.renderButton({ 
                            text: '✕', 
                            variant: 'danger', 
                            size: 'small',
                            dataAttributes: { 
                                action: 'remove-situational-expertise', 
                                'expertise-id': expertise.id
                            } 
                        })}
                    </div>
                </div>
            </div>`;
    }

}