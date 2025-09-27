// MainPoolTab.js - Simplified Boon Selection System (replaces complex point purchasing)
import { gameDataManager } from '../../core/GameDataManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';

export class MainPoolTab {
    constructor(builder) {
        this.builder = builder;
        this.clickHandler = null;
        this.containerElement = null;
        this.selectedCategory = 'all'; // Filter for boon categories
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or previous steps incomplete.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="boon-selection-content">
                <h2>Choose Your Boons ${RenderUtils.renderInfoIcon('Select boons equal to your character level. Each boon provides unique abilities or stat bonuses.')}</h2>
                <p class="section-description">
                    The <strong>simplified Vitality System</strong> uses boons instead of complex point purchasing.
                    Select <strong>${character.maxBoons} boons</strong> for a Level ${character.level} character.
                    All boons cost 1 point each - no complex calculations needed!
                </p>

                <div class="boon-status">
                    <div class="boon-progress">
                        <span id="boon-count">${character.boons.length}/${character.maxBoons}</span> boons selected
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(character.boons.length / character.maxBoons) * 100}%"></div>
                        </div>
                    </div>
                    ${this.renderLevelInfo()}
                </div>

                <div class="boon-filters">
                    ${this.renderCategoryFilters()}
                </div>

                <div class="selected-boons">
                    ${this.renderSelectedBoons()}
                </div>

                <div class="available-boons">
                    ${this.renderAvailableBoons()}
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Configure special attacks (if your archetype allows them).</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Special Attacks →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-special-attacks' },
                        classes: ['continue-btn'],
                        disabled: false
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderLevelInfo() {
        const character = this.builder.currentCharacter;
        const levelInfo = gameDataManager.getLevelInfo(character.level);

        return `
            <div class="level-info">
                <div class="level-details">
                    <strong>Level ${character.level}</strong>
                    (Tier Bonus: +${levelInfo.tier})
                </div>
                <div class="boon-allowance">
                    ${levelInfo.boons} boon${levelInfo.boons !== 1 ? 's' : ''} allowed
                </div>
            </div>
        `;
    }

    renderCategoryFilters() {
        const categories = [
            { id: 'all', name: 'All Boons', count: gameDataManager.getBoons().length },
            { id: 'passive_bonuses', name: 'Passive Bonuses', count: gameDataManager.getBoonsByCategory('passive_bonuses').length },
            { id: 'conditional_bonuses', name: 'Conditional Bonuses', count: gameDataManager.getBoonsByCategory('conditional_bonuses').length },
            { id: 'traits', name: 'Traits', count: gameDataManager.getBoonsByCategory('traits').length },
            { id: 'special_abilities', name: 'Special Abilities', count: gameDataManager.getBoonsByCategory('special_abilities').length }
        ];

        return `
            <div class="category-filters">
                <h4>Filter by Category</h4>
                <div class="filter-buttons">
                    ${categories.map(cat => `
                        <button class="filter-btn ${this.selectedCategory === cat.id ? 'active' : ''}"
                                data-action="filter-category"
                                data-category="${cat.id}">
                            ${cat.name} (${cat.count})
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSelectedBoons() {
        const character = this.builder.currentCharacter;
        const allBoons = gameDataManager.getBoons();

        if (character.boons.length === 0) {
            return `
                <div class="selected-boons-section">
                    <h3>Selected Boons (0/${character.maxBoons})</h3>
                    <div class="no-boons">No boons selected yet. Choose from the options below.</div>
                </div>
            `;
        }

        const selectedBoonData = character.boons.map(boonId => {
            const boon = allBoons.find(b => b.id === boonId);
            return boon || { id: boonId, name: 'Unknown Boon', description: 'Boon not found' };
        });

        return `
            <div class="selected-boons-section">
                <h3>Selected Boons (${character.boons.length}/${character.maxBoons})</h3>
                <div class="selected-boon-list">
                    ${selectedBoonData.map(boon => `
                        <div class="selected-boon-item" data-boon-id="${boon.id}">
                            <div class="boon-header">
                                <strong>${boon.name}</strong>
                                <button class="remove-boon-btn"
                                        data-action="remove-boon"
                                        data-boon-id="${boon.id}"
                                        title="Remove this boon">✕</button>
                            </div>
                            <div class="boon-description">${boon.description}</div>
                            ${this.renderBoonEffects(boon)}
                            ${this.renderBoonDrawback(boon)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderAvailableBoons() {
        const character = this.builder.currentCharacter;
        const allBoons = gameDataManager.getBoons();

        // Filter boons
        let availableBoons = allBoons.filter(boon => !character.boons.includes(boon.id));

        if (this.selectedCategory !== 'all') {
            availableBoons = availableBoons.filter(boon => boon.category === this.selectedCategory);
        }

        if (availableBoons.length === 0) {
            return `
                <div class="available-boons-section">
                    <h3>Available Boons</h3>
                    <div class="no-available">No available boons in this category.</div>
                </div>
            `;
        }

        return `
            <div class="available-boons-section">
                <h3>Available Boons${this.selectedCategory !== 'all' ? ` - ${this.getCategoryDisplayName(this.selectedCategory)}` : ''}</h3>
                <div class="available-boon-grid">
                    ${availableBoons.map(boon => this.renderBoonCard(boon)).join('')}
                </div>
            </div>
        `;
    }

    renderBoonCard(boon) {
        const character = this.builder.currentCharacter;
        const canSelect = character.boons.length < character.maxBoons;

        return RenderUtils.renderCard({
            title: boon.name,
            titleTag: 'h4',
            description: boon.description,
            additionalContent: `
                ${this.renderBoonEffects(boon)}
                ${this.renderBoonDrawback(boon)}
                <div class="boon-category">${this.getCategoryDisplayName(boon.category)}</div>
            `,
            clickable: canSelect,
            dataAttributes: {
                action: canSelect ? 'select-boon' : '',
                'boon-id': boon.id
            }
        }, {
            cardClass: `boon-card ${!canSelect ? 'disabled' : ''}`,
            showCost: false,
            showStatus: false
        });
    }

    renderBoonEffects(boon) {
        if (!boon.effects || boon.effects.length === 0) {
            return '';
        }

        const effects = boon.effects.map(effect => {
            switch(effect.type) {
                case 'stat_bonus':
                    return `+${effect.bonus} to ${effect.stat}`;
                case 'immunity':
                    const immunities = Array.isArray(effect.value) ? effect.value.join(', ') : effect.value;
                    return `Immune to: ${immunities}`;
                case 'special':
                    return `Special: ${effect.value}${effect.count ? ` (${effect.count} uses)` : ''}`;
                case 'aura':
                    return `Aura: ${effect.damage || effect.bonus} (radius ${effect.radius})`;
                case 'conditional_stat_bonus':
                    return `+${effect.bonus} to chosen stats when ${effect.condition}`;
                default:
                    return `${effect.type}: ${effect.value || 'active'}`;
            }
        }).join(', ');

        return `<div class="boon-effects">Effects: ${effects}</div>`;
    }

    renderBoonDrawback(boon) {
        if (!boon.drawback) {
            return '';
        }

        return `<div class="boon-drawback">⚠️ Drawback: ${boon.drawback_description}</div>`;
    }

    setupEventListeners() {
        this.removeEventListeners();

        const container = document.getElementById('tab-mainPool');
        if (!container) return;

        this.clickHandler = (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch(action) {
                case 'select-boon':
                    const boonId = target.dataset.boonId;
                    if (boonId) {
                        this.selectBoon(boonId);
                    }
                    break;

                case 'remove-boon':
                    const removeBoonId = target.dataset.boonId;
                    if (removeBoonId) {
                        this.removeBoon(removeBoonId);
                    }
                    break;

                case 'filter-category':
                    const category = target.dataset.category;
                    if (category) {
                        this.setCategory(category);
                    }
                    break;

                case 'continue-to-special-attacks':
                    this.builder.switchTab('special-attacks');
                    break;
            }
        };

        this.containerElement = container;
        this.containerElement.addEventListener('click', this.clickHandler);
    }

    removeEventListeners() {
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
            this.containerElement = null;
        }
    }

    selectBoon(boonId) {
        const character = this.builder.currentCharacter;

        // Check if we can select more boons
        if (character.boons.length >= character.maxBoons) {
            console.warn(`Cannot select more boons. Maximum of ${character.maxBoons} allowed for level ${character.level}.`);
            return;
        }

        // Check if boon exists
        const boon = gameDataManager.getBoonById(boonId);
        if (!boon) {
            console.error(`Boon ${boonId} not found`);
            return;
        }

        // Add boon to character
        character.boons.push(boonId);
        character.touch();

        console.log(`✅ Selected boon: ${boon.name}`);

        // Update UI
        this.updateBoonDisplay();
        this.builder.updateCharacter();
    }

    removeBoon(boonId) {
        const character = this.builder.currentCharacter;

        // Remove boon from character
        const index = character.boons.indexOf(boonId);
        if (index > -1) {
            character.boons.splice(index, 1);
            character.touch();

            console.log(`✅ Removed boon: ${boonId}`);

            // Update UI
            this.updateBoonDisplay();
            this.builder.updateCharacter();
        }
    }

    setCategory(category) {
        this.selectedCategory = category;
        this.updateCategoryFilters();
        this.updateAvailableBoons();
    }

    updateBoonDisplay() {
        // Update selected boons section
        const selectedSection = document.querySelector('.selected-boons-section');
        if (selectedSection) {
            selectedSection.outerHTML = this.renderSelectedBoons();
        }

        // Update available boons section
        this.updateAvailableBoons();

        // Update progress
        this.updateProgress();
    }

    updateAvailableBoons() {
        const availableSection = document.querySelector('.available-boons-section');
        if (availableSection) {
            availableSection.outerHTML = this.renderAvailableBoons();
        }
    }

    updateCategoryFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === this.selectedCategory) {
                btn.classList.add('active');
            }
        });
    }

    updateProgress() {
        const character = this.builder.currentCharacter;

        // Update count
        const countElement = document.getElementById('boon-count');
        if (countElement) {
            countElement.textContent = `${character.boons.length}/${character.maxBoons}`;
        }

        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const percentage = (character.boons.length / character.maxBoons) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        // Update continue button
        const continueBtn = document.querySelector('.continue-btn');
        if (continueBtn) {
            const complete = character.boons.length === character.maxBoons;
            if (complete) {
                continueBtn.classList.add('pulse');
                continueBtn.textContent = 'Continue to Special Attacks →';
            } else {
                continueBtn.classList.remove('pulse');
                continueBtn.textContent = `Continue (${character.boons.length}/${character.maxBoons}) →`;
            }
        }

        this.builder.updateTabStates();
    }

    // Helper methods
    getCategoryDisplayName(category) {
        const names = {
            passive_bonuses: 'Passive Bonuses',
            conditional_bonuses: 'Conditional Bonuses',
            traits: 'Traits',
            special_abilities: 'Special Abilities'
        };
        return names[category] || category;
    }

    // Tab interface methods
    onCharacterUpdated() {
        this.render();
    }

    isComplete() {
        const character = this.builder.currentCharacter;
        return character.boons.length === character.maxBoons;
    }

    getValidationErrors() {
        const errors = [];
        const character = this.builder.currentCharacter;

        if (character.boons.length < character.maxBoons) {
            const remaining = character.maxBoons - character.boons.length;
            errors.push(`Please select ${remaining} more boon${remaining !== 1 ? 's' : ''} (${character.boons.length}/${character.maxBoons} selected)`);
        }

        return errors;
    }
}