// UtilityTab.js - REFACTORED to use EventManager, RenderUtils, and UpdateManager
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';
import { UpdateManager } from '../shared/UpdateManager.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.activeCategory = 'expertise';
    }

    render() {
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        tabContent.innerHTML = `
            <div class="utility-section">
                <h2>Utility Abilities</h2>
                <p class="section-description">
                    Purchase expertise, features, senses, movement, and descriptors using your utility pool points.
                </p>
                
                ${this.renderPointDisplay(character)}
                ${this.renderCategoryNavigation()}
                ${this.renderActiveCategory(character)}
                ${this.renderPurchasedSummary(character)}
                ${this.renderNextStep()}
            </div>
        `;

        this.setupEventListeners();
    }

    renderPointDisplay(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0;
        const available = pools.totalAvailable.utilityPool || 0;
        const spent = pools.totalSpent.utilityPool || 0;

        return RenderUtils.renderPointDisplay(spent, available, 'Utility Pool', { 
            showRemaining: true,
            variant: utilityPool < 0 ? 'over-budget' : utilityPool === 0 ? 'fully-used' : 'default'
        });
    }

    renderCategoryNavigation() {
        const categories = [
            { id: 'expertise', name: 'Expertise', description: 'Specialized skills and training' },
            { id: 'features', name: 'Features', description: 'Supernatural abilities' },
            { id: 'senses', name: 'Senses', description: 'Enhanced perception' },
            { id: 'movement', name: 'Movement', description: 'Enhanced locomotion' },
            { id: 'descriptors', name: 'Descriptors', description: 'Reality manipulation' }
        ];

        return RenderUtils.renderTabs(categories.map(cat => ({
            id: cat.id,
            label: `${cat.name}<br><small>${cat.description}</small>`,
            disabled: false
        })), this.activeCategory);
    }

    renderActiveCategory(character) {
        const categoryMethods = {
            expertise: () => this.renderExpertiseCategory(character),
            features: () => this.renderFeaturesCategory(character),
            senses: () => this.renderSensesCategory(character),
            movement: () => this.renderMovementCategory(character),
            descriptors: () => this.renderDescriptorsCategory(character)
        };

        const renderMethod = categoryMethods[this.activeCategory];
        return renderMethod ? renderMethod() : '<div class="empty-state">Select a category</div>';
    }

    renderExpertiseCategory(character) {
        const attributes = ['awareness', 'communication', 'intelligence', 'focus', 'mobility', 'endurance', 'power'];
        
        return `
            <div class="category-content">
                <h3>Expertise Selection</h3>
                <p class="category-description">Choose specialized knowledge and training for each attribute.</p>
                
                ${RenderUtils.renderGrid(
                    attributes,
                    (attr) => this.renderAttributeExpertise(attr, character),
                    { gridClass: 'expertise-grid', columns: 'auto-fit', minWidth: '300px' }
                )}
            </div>
        `;
    }

    renderAttributeExpertise(attribute, character) {
        const attributeData = this.getAttributeExpertiseData(attribute);
        const current = character.utilityPurchases.expertise[attribute];
        
        return `
            <div class="expertise-attribute-card">
                <h4>${this.capitalizeFirst(attribute)} Expertise</h4>
                
                <div class="expertise-type-section">
                    <h5>Activity-Based (2p Basic / 6p Mastered)</h5>
                    ${RenderUtils.renderGrid(
                        attributeData.activity,
                        (expertise) => this.renderExpertiseOption(expertise, attribute, 'activity', current, character),
                        { gridClass: 'expertise-options', columns: '1', minWidth: '100%' }
                    )}
                </div>
                
                <div class="expertise-type-section">
                    <h5>Situational (1p Basic / 3p Mastered)</h5>
                    ${RenderUtils.renderGrid(
                        attributeData.situational,
                        (expertise) => this.renderExpertiseOption(expertise, attribute, 'situational', current, character),
                        { gridClass: 'expertise-options', columns: '1', minWidth: '100%' }
                    )}
                </div>
            </div>
        `;
    }

    renderExpertiseOption(expertise, attribute, type, current, character) {
        const hasBasic = current.basic.includes(expertise.id);
        const hasMastery = current.mastered.includes(expertise.id);
        const costs = type === 'activity' ? { basic: 2, mastered: 6 } : { basic: 1, mastered: 3 };

        return `
            <div class="expertise-option">
                <div class="expertise-basic">
                    <label>
                        <input type="checkbox" 
                               data-expertise-type="${type}"
                               data-expertise-level="basic"
                               data-expertise-id="${expertise.id}"
                               data-attribute="${attribute}"
                               ${hasBasic ? 'checked' : ''}>
                        ${expertise.name} (${costs.basic}p)
                    </label>
                    <small class="expertise-description">${expertise.description}</small>
                </div>
                
                ${hasBasic ? `
                    <div class="expertise-mastery">
                        <label>
                            <input type="checkbox"
                                   data-expertise-type="${type}"
                                   data-expertise-level="mastered"
                                   data-expertise-id="${expertise.id}"
                                   data-attribute="${attribute}"
                                   ${hasMastery ? 'checked' : ''}>
                            Master ${expertise.name} (+${costs.mastered - costs.basic}p)
                        </label>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderFeaturesCategory(character) {
        const featureCategories = this.getFeatureData();
        
        return `
            <div class="category-content">
                <h3>Features</h3>
                <p class="category-description">Supernatural abilities that enable new types of actions and checks.</p>
                
                ${Object.entries(featureCategories).map(([category, features]) => `
                    <div class="feature-category-section">
                        <h4>${category}</h4>
                        ${RenderUtils.renderGrid(
                            features,
                            (feature) => this.renderFeatureCard(feature, character),
                            { gridClass: 'feature-grid', columns: 'auto-fit', minWidth: '280px' }
                        )}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderFeatureCard(feature, character) {
        const isSelected = character.utilityPurchases.features.some(f => f.id === feature.id);
        const pools = PointPoolCalculator.calculateAllPools(character);
        const canAfford = pools.remaining.utilityPool >= feature.cost;

        return RenderUtils.renderCard({
            title: feature.name,
            cost: feature.cost,
            description: `${feature.description}${feature.upgrades ? `<br><small><strong>Upgrades:</strong> ${feature.upgrades}</small>` : ''}`,
            status: isSelected ? 'purchased' : canAfford ? 'available' : 'unaffordable',
            clickable: !isSelected && canAfford,
            disabled: isSelected || !canAfford,
            dataAttributes: { featureId: feature.id, featureCost: feature.cost }
        }, { cardClass: 'feature-card' });
    }

    renderSensesCategory(character) {
        const sensesByTier = this.getSenseData();
        
        return `
            <div class="category-content">
                <h3>Senses</h3>
                <p class="category-description">Enhanced perceptual capabilities for detecting what normal senses cannot.</p>
                
                ${Object.entries(sensesByTier).map(([tier, senses]) => `
                    <div class="sense-tier-section">
                        <h4>${tier} Point Senses</h4>
                        ${RenderUtils.renderGrid(
                            senses,
                            (sense) => this.renderSenseCard(sense, character),
                            { gridClass: 'sense-grid', columns: 'auto-fit', minWidth: '280px' }
                        )}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSenseCard(sense, character) {
        const isSelected = character.utilityPurchases.senses.some(s => s.id === sense.id);
        const pools = PointPoolCalculator.calculateAllPools(character);
        const canAfford = pools.remaining.utilityPool >= sense.cost;

        return RenderUtils.renderCard({
            title: sense.name,
            cost: sense.cost,
            description: sense.description,
            status: isSelected ? 'purchased' : canAfford ? 'available' : 'unaffordable',
            clickable: !isSelected && canAfford,
            disabled: isSelected || !canAfford,
            dataAttributes: { senseId: sense.id, senseCost: sense.cost }
        }, { cardClass: 'sense-card' });
    }

    renderMovementCategory(character) {
        const movementOptions = this.getMovementData();
        
        return `
            <div class="category-content">
                <h3>Movement Abilities</h3>
                <p class="category-description">Enhanced locomotion capabilities for combat and exploration.</p>
                
                ${RenderUtils.renderGrid(
                    movementOptions,
                    (movement) => this.renderMovementCard(movement, character),
                    { gridClass: 'movement-grid', columns: 'auto-fit', minWidth: '280px' }
                )}
            </div>
        `;
    }

    renderMovementCard(movement, character) {
        const isSelected = character.utilityPurchases.movement.some(m => m.id === movement.id);
        const pools = PointPoolCalculator.calculateAllPools(character);
        const canAfford = pools.remaining.utilityPool >= movement.cost;

        return RenderUtils.renderCard({
            title: movement.name,
            cost: movement.cost,
            description: movement.description,
            status: isSelected ? 'purchased' : canAfford ? 'available' : 'unaffordable',
            clickable: !isSelected && canAfford,
            disabled: isSelected || !canAfford,
            dataAttributes: { movementId: movement.id, movementCost: movement.cost }
        }, { cardClass: 'movement-card' });
    }

    renderDescriptorsCategory(character) {
        const descriptorCategories = this.getDescriptorData();
        
        return `
            <div class="category-content">
                <h3>Descriptors</h3>
                <p class="category-description">Reality manipulation abilities tied to specific concepts or elements.</p>
                
                ${Object.entries(descriptorCategories).map(([category, descriptors]) => `
                    <div class="descriptor-category-section">
                        <h4>${category}</h4>
                        ${RenderUtils.renderGrid(
                            descriptors,
                            (descriptor) => this.renderDescriptorCard(descriptor, character),
                            { gridClass: 'descriptor-grid', columns: 'auto-fit', minWidth: '280px' }
                        )}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDescriptorCard(descriptor, character) {
        const isSelected = character.utilityPurchases.descriptors.some(d => d.id === descriptor.id);
        const pools = PointPoolCalculator.calculateAllPools(character);
        const canAfford = pools.remaining.utilityPool >= descriptor.cost;

        return RenderUtils.renderCard({
            title: descriptor.name,
            cost: descriptor.cost,
            description: `${descriptor.description}<br><small><strong>Applications:</strong> ${descriptor.applications.join(', ')}</small>`,
            status: isSelected ? 'purchased' : canAfford ? 'available' : 'unaffordable',
            clickable: !isSelected && canAfford,
            disabled: isSelected || !canAfford,
            dataAttributes: { descriptorId: descriptor.id, descriptorCost: descriptor.cost }
        }, { cardClass: 'descriptor-card' });
    }

    renderPurchasedSummary(character) {
        const purchases = character.utilityPurchases;
        const sections = [];
        
        // Expertise summary
        Object.entries(purchases.expertise).forEach(([attr, expertises]) => {
            if (expertises.basic.length > 0 || expertises.mastered.length > 0) {
                const items = [
                    ...expertises.basic.map(id => `Basic ${id}`),
                    ...expertises.mastered.map(id => `Master ${id}`)
                ];
                sections.push({ title: `${this.capitalizeFirst(attr)} Expertise`, items });
            }
        });
        
        // Other categories
        if (purchases.features.length > 0) {
            sections.push({ title: 'Features', items: purchases.features.map(f => f.name) });
        }
        if (purchases.senses.length > 0) {
            sections.push({ title: 'Senses', items: purchases.senses.map(s => s.name) });
        }
        if (purchases.movement.length > 0) {
            sections.push({ title: 'Movement', items: purchases.movement.map(m => m.name) });
        }
        if (purchases.descriptors.length > 0) {
            sections.push({ title: 'Descriptors', items: purchases.descriptors.map(d => d.name) });
        }

        return `
            <div class="purchased-utilities">
                <h3>Purchased Utilities</h3>
                ${sections.length > 0 ? `
                    <div class="purchased-sections">
                        ${sections.map(section => `
                            <div class="purchased-section">
                                <h4>${section.title}</h4>
                                <div class="purchased-items">
                                    ${section.items.map(item => `<span class="purchased-item">${item}</span>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-state">No utilities purchased yet</div>'}
            </div>
        `;
    }

    renderNextStep() {
        return `
            <div class="next-step">
                ${RenderUtils.renderButton({
                    text: 'Continue to Summary →',
                    variant: 'primary',
                    dataAttributes: { action: 'continue-to-summary' }
                })}
            </div>
        `;
    }

    setupEventListeners() {
        const container = document.querySelector('.utility-section');
        if (!container) {
            console.error('Utility section container not found');
            return;
        }

        EventManager.setupStandardListeners(container, {
            clickHandlers: {
                '.tab-btn': this.handleCategorySwitch.bind(this),
                '.feature-card.clickable': this.handleFeatureToggle.bind(this),
                '.sense-card.clickable': this.handleSenseToggle.bind(this),
                '.movement-card.clickable': this.handleMovementToggle.bind(this),
                '.descriptor-card.clickable': this.handleDescriptorToggle.bind(this),
                '[data-action="continue-to-summary"]': this.handleContinue.bind(this)
            },
            changeHandlers: {
                'input[data-expertise-id]': this.handleExpertiseChange.bind(this)
            }
        });
    }

    handleCategorySwitch(e, element) {
        const newCategory = element.dataset.tab;
        if (newCategory && newCategory !== this.activeCategory) {
            this.activeCategory = newCategory;
            UpdateManager.scheduleUpdate(this, 'updateActiveCategory', 'high');
        }
    }

    handleExpertiseChange(e, element) {
        const { expertiseId, attribute, expertiseLevel, expertiseType } = element.dataset;
        const isChecked = element.checked;
        const character = this.builder.currentCharacter;
        
        try {
            if (expertiseLevel === 'basic') {
                this.toggleBasicExpertise(character, attribute, expertiseId, isChecked);
            } else if (expertiseLevel === 'mastered') {
                this.toggleMasteredExpertise(character, attribute, expertiseId, isChecked);
            }
            
            UpdateManager.batchUpdates([
                { component: this, method: 'updateActiveCategory', priority: 'normal' },
                { component: this.builder, method: 'updateCharacter', priority: 'high' }
            ]);
            
        } catch (error) {
            console.error('Failed to update expertise:', error);
            this.builder.showNotification('Failed to update expertise', 'error');
        }
    }

    handleFeatureToggle(e, element) {
        const featureId = element.dataset.featureId;
        const featureCost = parseInt(element.dataset.featureCost);
        
        try {
            this.toggleUtilityPurchase('features', featureId, featureCost);
        } catch (error) {
            this.handlePurchaseError('feature', error);
        }
    }

    handleSenseToggle(e, element) {
        const senseId = element.dataset.senseId;
        const senseCost = parseInt(element.dataset.senseCost);
        
        try {
            this.toggleUtilityPurchase('senses', senseId, senseCost);
        } catch (error) {
            this.handlePurchaseError('sense', error);
        }
    }

    handleMovementToggle(e, element) {
        const movementId = element.dataset.movementId;
        const movementCost = parseInt(element.dataset.movementCost);
        
        try {
            this.toggleUtilityPurchase('movement', movementId, movementCost);
        } catch (error) {
            this.handlePurchaseError('movement', error);
        }
    }

    handleDescriptorToggle(e, element) {
        const descriptorId = element.dataset.descriptorId;
        const descriptorCost = parseInt(element.dataset.descriptorCost);
        
        try {
            this.toggleUtilityPurchase('descriptors', descriptorId, descriptorCost);
        } catch (error) {
            this.handlePurchaseError('descriptor', error);
        }
    }

    handleContinue() {
        this.builder.switchTab('summary');
    }

    // Business Logic Methods
    toggleBasicExpertise(character, attribute, expertiseId, isChecked) {
        const expertise = character.utilityPurchases.expertise[attribute];
        
        if (isChecked) {
            if (!expertise.basic.includes(expertiseId)) {
                expertise.basic.push(expertiseId);
            }
        } else {
            expertise.basic = expertise.basic.filter(id => id !== expertiseId);
            // Also remove mastery if basic is unchecked
            expertise.mastered = expertise.mastered.filter(id => id !== expertiseId);
        }
    }

    toggleMasteredExpertise(character, attribute, expertiseId, isChecked) {
        const expertise = character.utilityPurchases.expertise[attribute];
        
        if (isChecked) {
            if (!expertise.mastered.includes(expertiseId)) {
                expertise.mastered.push(expertiseId);
            }
        } else {
            expertise.mastered = expertise.mastered.filter(id => id !== expertiseId);
        }
    }

    toggleUtilityPurchase(category, itemId, itemCost) {
        const character = this.builder.currentCharacter;
        const purchases = character.utilityPurchases[category];
        const isCurrentlyPurchased = purchases.some(item => item.id === itemId);
        
        if (isCurrentlyPurchased) {
            this.removeUtilityPurchase(category, itemId);
        } else {
            this.addUtilityPurchase(category, itemId, itemCost);
        }
        
        UpdateManager.batchUpdates([
            { component: this, method: 'updateActiveCategory', priority: 'normal' },
            { component: this.builder, method: 'updateCharacter', priority: 'high' }
        ]);
    }

    addUtilityPurchase(category, itemId, itemCost) {
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        
        if (pools.remaining.utilityPool < itemCost) {
            throw new Error(`Insufficient utility points (need ${itemCost}, have ${pools.remaining.utilityPool})`);
        }
        
        const itemData = this.findItemById(category, itemId);
        if (!itemData) {
            throw new Error(`${category} item not found: ${itemId}`);
        }
        
        character.utilityPurchases[category].push({
            id: itemId,
            name: itemData.name,
            cost: itemCost
        });
        
        this.builder.showNotification(`Purchased ${itemData.name}`, 'success');
    }

    removeUtilityPurchase(category, itemId) {
        const character = this.builder.currentCharacter;
        const index = character.utilityPurchases[category].findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            const item = character.utilityPurchases[category][index];
            character.utilityPurchases[category].splice(index, 1);
            this.builder.showNotification(`Removed ${item.name}`, 'info');
        }
    }

    handlePurchaseError(itemType, error) {
        console.error(`Failed to toggle ${itemType}:`, error);
        this.builder.showNotification(error.message, 'error');
    }

    // Update methods for UpdateManager
    updateActiveCategory() {
        const character = this.builder.currentCharacter;
        const contentContainer = document.querySelector('.category-content');
        
        if (contentContainer && character) {
            contentContainer.innerHTML = this.renderActiveCategory(character);
            this.setupEventListeners(); // Re-setup for new content
        }
    }

    onCharacterUpdate() {
        UpdateManager.scheduleUpdate(this, 'updateActiveCategory', 'normal');
    }

    // Data Methods (unchanged but condensed for brevity)
    getAttributeExpertiseData(attribute) {
        const data = {
            awareness: {
                activity: [
                    { id: 'tracking', name: 'Tracking', description: 'Following trails, signs, or behavioral patterns' },
                    { id: 'searching', name: 'Searching', description: 'Scanning for hidden, lost, or obscured details' },
                    { id: 'perception', name: 'Perception', description: 'Noticing changes, cues, or threats in real time' },
                    { id: 'senseMotives', name: 'Sense Motives', description: 'Reading intent, emotion, or deception in others' }
                ],
                situational: [
                    { id: 'urbanAreas', name: 'Urban Areas', description: 'Streets, alleys, rooftops, and social rhythms of cities' },
                    { id: 'wilderness', name: 'Wilderness', description: 'Forests, deserts, mountains, and natural landscapes' },
                    { id: 'chaoticScenes', name: 'Chaotic Scenes', description: 'Riots, protests, crowds, or high-distraction areas' },
                    { id: 'lowVisibility', name: 'Low Visibility', description: 'Darkness, fog, smoke, or sight-limiting conditions' }
                ]
            },
            // ... other attributes (truncated for brevity, full data would be included)
        };
        return data[attribute] || { activity: [], situational: [] };
    }

    getFeatureData() {
        return {
            'Mental/Psychic Powers': [
                { id: 'telepathy', name: 'Telepathy', cost: 3, description: 'Two-way mental communication' },
                { id: 'mindReading', name: 'Mind-Reading', cost: 5, description: 'Read surface thoughts' }
                // ... full feature data
            ]
            // ... other categories
        };
    }

    getSenseData() {
        return {
            '1': [
                { id: 'darkvision', name: 'Darkvision', cost: 1, description: 'See in complete darkness' }
                // ... full sense data
            ]
            // ... other tiers
        };
    }

    getMovementData() {
        return [
            { id: 'flight', name: 'Flight', cost: 10, description: 'Move in any direction at full speed' }
            // ... full movement data
        ];
    }

    getDescriptorData() {
        return {
            'Elemental Descriptors': [
                { id: 'fire', name: 'Fire', cost: 5, description: 'Mastery over flame and heat', applications: ['Forge materials', 'Melt locks'] }
                // ... full descriptor data
            ]
            // ... other categories
        };
    }

    // Helper Methods
    findItemById(category, itemId) {
        const dataMethods = {
            features: () => this.findFeatureById(itemId),
            senses: () => this.findSenseById(itemId),
            movement: () => this.findMovementById(itemId),
            descriptors: () => this.findDescriptorById(itemId)
        };
        
        const method = dataMethods[category];
        return method ? method() : null;
    }

    findFeatureById(id) {
        const categories = this.getFeatureData();
        for (const features of Object.values(categories)) {
            const feature = features.find(f => f.id === id);
            if (feature) return feature;
        }
        return null;
    }

    findSenseById(id) {
        const tiers = this.getSenseData();
        for (const senses of Object.values(tiers)) {
            const sense = senses.find(s => s.id === id);
            if (sense) return sense;
        }
        return null;
    }

    findMovementById(id) {
        return this.getMovementData().find(m => m.id === id);
    }

    findDescriptorById(id) {
        const categories = this.getDescriptorData();
        for (const descriptors of Object.values(categories)) {
            const descriptor = descriptors.find(d => d.id === id);
            if (descriptor) return descriptor;
        }
        return null;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}