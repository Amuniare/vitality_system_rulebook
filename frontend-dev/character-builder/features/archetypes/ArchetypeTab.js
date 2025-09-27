// ArchetypeTab.js - Simplified 4-category archetype selection for new streamlined system
import { gameDataManager } from '../../core/GameDataManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';

export class ArchetypeTab {
    constructor(builder) {
        this.builder = builder;
        this.clickHandler = null;
        this.containerElement = null;
    }

    render() {
        const tabContent = document.getElementById('tab-archetypes');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }

        // Simplified 4-category system (not 7)
        const categories = [
            { id: 'movement', name: 'Movement', description: 'How your character moves and navigates the battlefield' },
            { id: 'attack', name: 'Attack', description: 'Your approach to combat and special abilities' },
            { id: 'defensive', name: 'Defensive', description: 'How your character survives and resists effects' },
            { id: 'utility', name: 'Utility', description: 'Non-combat skills and expertise' }
        ];

        tabContent.innerHTML = `
            <div class="archetypes-section">
                <h2>Choose Your Archetypes ${RenderUtils.renderInfoIcon('Select one archetype from each of the 4 categories. These define your character\'s core capabilities.')}</h2>
                <p class="section-description">
                    The Vitality System uses a <strong>simplified 4-archetype system</strong>.
                    Each category shapes different aspects of your character's abilities.
                    <strong>All archetypes should be selected to build an effective character.</strong>
                </p>

                <div class="archetype-progress">
                    <span id="archetype-count">0/4 Archetypes Selected</span>
                </div>

                ${categories.map(cat => this.renderArchetypeCategory(cat.id, cat.name, cat.description, character)).join('')}

                <div class="archetype-summary">
                    ${this.renderArchetypeSummary()}
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Assign your attribute points across combat and utility stats.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Attributes →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-attributes' },
                        classes: ['continue-to-attributes-btn'],
                        disabled: false
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateProgress();
    }

    renderArchetypeCategory(categoryId, categoryName, description, character) {
        const archetypes = gameDataManager.getArchetypesForCategory(categoryId);
        const selectedId = character.archetypes[categoryId];

        if (!archetypes || archetypes.length === 0) {
            return `
                <div class="archetype-category" data-category="${categoryId}">
                    <h3>${categoryName}</h3>
                    <p class="category-description">${description}</p>
                    <div class="no-archetypes">No archetypes available for this category.</div>
                </div>
            `;
        }

        return `
            <div class="archetype-category" data-category="${categoryId}">
                <h3>${categoryName}</h3>
                <p class="category-description">${description}</p>

                <div class="selection-indicator">
                    ${selectedId ? `Selected: <strong>${this.getArchetypeName(categoryId, selectedId)}</strong>` : 'No selection'}
                </div>

                ${RenderUtils.renderGrid(
                    archetypes,
                    (archetype) => RenderUtils.renderCard({
                        title: archetype.name,
                        titleTag: 'h4',
                        description: archetype.description,
                        additionalContent: this.renderArchetypeDetails(archetype),
                        clickable: true,
                        selected: selectedId === archetype.id,
                        dataAttributes: {
                            category: categoryId,
                            archetype: archetype.id,
                            action: 'select-archetype'
                        }
                    }, {
                        cardClass: `archetype-card ${selectedId === archetype.id ? 'selected' : ''}`,
                        showCost: false,
                        showStatus: false
                    }),
                    {
                        gridContainerClass: 'grid-layout archetype-grid',
                        gridSpecificClass: 'grid-columns-auto-fit-280'
                    }
                )}
            </div>
        `;
    }

    renderArchetypeDetails(archetype) {
        let details = '';

        if (archetype.effects && archetype.effects.length > 0) {
            details += '<div class="archetype-effects">';
            archetype.effects.forEach(effect => {
                switch(effect.type) {
                    case 'stat_bonus':
                        details += `<div class="effect">+${effect.bonus} to ${effect.stat}</div>`;
                        break;
                    case 'special_attack':
                        details += `<div class="effect">${effect.count} special attack(s), ${effect.points} points each</div>`;
                        break;
                    case 'extra_boons':
                        details += `<div class="effect">+${effect.count} extra boons</div>`;
                        break;
                    case 'immunity':
                        const immunities = Array.isArray(effect.value) ? effect.value.join(', ') : effect.value;
                        details += `<div class="effect">Immune: ${immunities}</div>`;
                        break;
                    case 'skill_bonus':
                        details += `<div class="effect">+${effect.bonus} to ${effect.stat} skills</div>`;
                        break;
                    case 'movement_mode':
                        details += `<div class="effect">Movement: ${effect.value}</div>`;
                        break;
                    case 'restriction':
                        details += `<div class="effect restriction">Restriction: ${effect.value}</div>`;
                        break;
                    default:
                        details += `<div class="effect">${effect.type}: ${effect.value || 'active'}</div>`;
                }
            });
            details += '</div>';
        }

        if (archetype.options && archetype.options.length > 0) {
            details += '<div class="archetype-options-notice">⚙️ Has customization options</div>';
        }

        return details;
    }

    renderArchetypeSummary() {
        const character = this.builder.currentCharacter;
        const selectedCount = this.getSelectedCount();

        if (selectedCount === 0) {
            return `
                <h3>Archetype Selection</h3>
                <p>Select archetypes from each category to see your character's capabilities.</p>
            `;
        }

        const summaries = [];
        Object.entries(character.archetypes).forEach(([category, archetypeId]) => {
            if (archetypeId) {
                const archetype = this.getArchetypeData(category, archetypeId);
                if (archetype) {
                    summaries.push(`
                        <div class="archetype-summary-item">
                            <strong>${this.getCategoryDisplayName(category)}:</strong> ${archetype.name}
                        </div>
                    `);
                }
            }
        });

        return `
            <h3>Selected Archetypes (${selectedCount}/4)</h3>
            ${summaries.join('')}
            ${selectedCount === 4 ? '<div class="completion-notice">✅ All archetypes selected!</div>' : ''}
        `;
    }

    setupEventListeners() {
        this.removeEventListeners();

        const container = document.getElementById('tab-archetypes');
        if (!container) return;

        this.clickHandler = (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch(action) {
                case 'select-archetype':
                    const category = target.dataset.category;
                    const archetypeId = target.dataset.archetype;
                    if (category && archetypeId) {
                        this.selectArchetype(category, archetypeId);
                    }
                    break;

                case 'continue-to-attributes':
                    this.builder.switchTab('attributes');
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

    selectArchetype(category, archetypeId) {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Allow clearing by clicking the same archetype
        if (character.archetypes[category] === archetypeId) {
            character.archetypes[category] = null;
            console.log(`✅ Cleared archetype: ${category}`);
        } else {
            // Validate archetype exists
            const archetypes = gameDataManager.getArchetypesForCategory(category);
            const archetypeExists = archetypes.find(arch => arch.id === archetypeId);
            if (!archetypeExists) {
                console.error(`❌ Archetype ${archetypeId} not found in category ${category}`);
                return;
            }

            character.archetypes[category] = archetypeId;
            character.touch();
            console.log(`✅ Selected archetype: ${category} = ${archetypeId}`);
        }

        // Update UI and notify builder
        this.updateArchetypeSelectionUI(category, character.archetypes[category]);
        this.updateProgress();
        this.builder.updateCharacter();
    }

    updateArchetypeSelectionUI(category, archetypeId) {
        const categoryElement = document.querySelector(`.archetype-category[data-category="${category}"]`);
        if (!categoryElement) return;

        // Update all cards in this category
        const cards = categoryElement.querySelectorAll('.card.archetype-card');
        cards.forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.archetype === archetypeId) {
                card.classList.add('selected');
            }
        });

        // Update selection indicator
        const indicator = categoryElement.querySelector('.selection-indicator');
        if (indicator) {
            if (archetypeId) {
                indicator.innerHTML = `Selected: <strong>${this.getArchetypeName(category, archetypeId)}</strong>`;
            } else {
                indicator.innerHTML = 'No selection';
            }
        }

        // Update summary
        const summaryElement = document.querySelector('.archetype-summary');
        if (summaryElement) {
            summaryElement.innerHTML = this.renderArchetypeSummary();
        }
    }

    updateProgress() {
        const selectedCount = this.getSelectedCount();

        const progressElement = document.getElementById('archetype-count');
        if (progressElement) {
            progressElement.textContent = `${selectedCount}/4 Archetypes Selected`;
        }

        const continueBtn = document.querySelector('.continue-to-attributes-btn');
        if (continueBtn) {
            const allSelected = selectedCount === 4;

            if (allSelected) {
                continueBtn.classList.add('pulse');
                continueBtn.textContent = 'Continue to Attributes →';
            } else {
                continueBtn.classList.remove('pulse');
                continueBtn.textContent = `Continue (${selectedCount}/4) →`;
            }
        }

        this.builder.updateTabStates();
    }

    // Helper methods
    getSelectedCount() {
        const character = this.builder.currentCharacter;
        return Object.values(character.archetypes).filter(id => id !== null).length;
    }

    getArchetypeName(category, archetypeId) {
        const archetype = this.getArchetypeData(category, archetypeId);
        return archetype ? archetype.name : 'Unknown';
    }

    getArchetypeData(category, archetypeId) {
        const archetypes = gameDataManager.getArchetypesForCategory(category);
        return archetypes.find(a => a.id === archetypeId);
    }

    getCategoryDisplayName(category) {
        const names = {
            movement: 'Movement',
            attack: 'Attack',
            defensive: 'Defensive',
            utility: 'Utility'
        };
        return names[category] || category;
    }

    // Tab interface methods
    onCharacterUpdated() {
        this.render();
    }

    isComplete() {
        return this.getSelectedCount() === 4;
    }

    getValidationErrors() {
        const errors = [];
        const selectedCount = this.getSelectedCount();

        if (selectedCount < 4) {
            errors.push(`Please select all 4 archetypes (${selectedCount}/4 selected)`);
        }

        return errors;
    }
}