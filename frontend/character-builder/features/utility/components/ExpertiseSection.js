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
        const costs = UtilitySystem.getExpertiseCosts();
        
        return `
            <div class="expertise-section">
                <h4>Talent Sets (${situationalExpertises.length}/${maxSituationalExpertises})</h4>
                <p class="section-description">Create custom talent collections that represent your character's specialized training. You can purchase a single set, which contains 3 talents you define. Basic level costs ${costs.situational.basic.cost}p, the upgrade to Mastered costs ${costs.situational.mastered.cost}p.</p>
                
                <div class="talent-sets-container">
                    ${this.renderExistingTalentSets(situationalExpertises)}
                    ${situationalExpertises.length < maxSituationalExpertises ? this.renderCreateNewTalentSetCard() : ''}
                </div>
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

    // Attribute-based situational rendering removed - use unified Talent Set interface

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

    renderCreateNewTalentSetCard() {
        const costs = UtilitySystem.getExpertiseCosts();
        
        return `
            <div class="talent-set-card create-new">
                <div class="talent-set-header">
                    <h5>Create New Talent Set</h5>
                    <p class="talent-set-description">Define three talents that represent your character's specialized training.</p>
                </div>
                <div class="talent-set-content">
                    <div class="talent-inputs">
                        <input type="text" class="talent-input" 
                               placeholder="Talent 1 (e.g., Lock Picking)" 
                               data-action="create-situational-talent"
                               data-talent-index="0">
                        <input type="text" class="talent-input" 
                               placeholder="Talent 2 (e.g., Safe Cracking)" 
                               data-action="create-situational-talent"
                               data-talent-index="1">
                        <input type="text" class="talent-input" 
                               placeholder="Talent 3 (e.g., Alarm Bypassing)" 
                               data-action="create-situational-talent"
                               data-talent-index="2">
                    </div>
                </div>
                <div class="talent-set-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-value">${costs.situational.basic.cost}p</div>
                        ${RenderUtils.renderButton({ 
                            text: 'Purchase Basic', 
                            variant: 'primary', 
                            size: 'small',
                            dataAttributes: { 
                                action: 'create-and-purchase-situational-expertise',
                                level: 'basic' 
                            } 
                        })}
                    </div>
                    <div class="expertise-mastered-section">
                        <div class="expertise-cost-value">${costs.situational.mastered.cost}p</div>
                        ${RenderUtils.renderButton({ 
                            text: 'Purchase Mastered', 
                            variant: 'primary', 
                            size: 'small',
                            dataAttributes: { 
                                action: 'create-and-purchase-situational-expertise',
                                level: 'mastered' 
                            } 
                        })}
                    </div>
                </div>
            </div>`;
    }

    renderExistingTalentSets(talentSets) {
        if (talentSets.length === 0) {
            return '<div class="empty-state"><p>No talent sets created yet. Create your first custom talent collection below.</p></div>';
        }
        
        return talentSets.map(talentSet => this.renderTalentSetCard(talentSet)).join('');
    }
    
    renderTalentSetCard(expertise) {
        const costs = UtilitySystem.getExpertiseCosts();
        const basicCost = costs.situational.basic.cost;
        const masteredCost = costs.situational.mastered.cost;
        
        // Generate display name from talents (comma-separated)
        const displayName = expertise.talents.filter(t => t && t.trim()).join(', ') || 'Untitled Talent Set';
        const attributeDisplay = expertise.attribute.charAt(0).toUpperCase() + expertise.attribute.slice(1);
        
        return `
            <div class="talent-set-card ${expertise.level}">
                <div class="talent-set-header">
                    <div class="talent-set-name">${displayName}</div>
                    <div class="talent-set-attribute">${attributeDisplay} • ${expertise.level === 'basic' ? 'Basic' : expertise.level === 'mastered' ? 'Mastered' : 'Unpurchased'}</div>
                </div>
                <div class="talent-set-content">
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
                <div class="talent-set-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-value">${basicCost}p</div>
                        ${RenderUtils.renderButton({ 
                            text: expertise.level === 'basic' || expertise.level === 'mastered' ? '✓ Basic' : 'Purchase Basic', 
                            variant: expertise.level === 'basic' || expertise.level === 'mastered' ? 'success' : 'primary', 
                            size: 'small', 
                            disabled: expertise.level === 'basic' || expertise.level === 'mastered',
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
                            text: expertise.level === 'mastered' ? '✓ Mastered' : 'Upgrade to Mastered', 
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
                            text: '✕ Remove', 
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