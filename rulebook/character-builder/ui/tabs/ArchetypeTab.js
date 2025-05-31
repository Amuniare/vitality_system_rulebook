// ArchetypeTab.js - Archetype selection interface
import { ArchetypeSystem } from '../../systems/ArchetypeSystem.js';

export class ArchetypeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-archetypes');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        tabContent.innerHTML = `
            <div class="archetypes-section">
                <h2>Choose Archetypes</h2>
                <p class="section-description">
                    Select one archetype from each of the 7 categories. These choices define your character's 
                    fundamental approach and provide point modifiers and restrictions.
                    <strong>All archetypes must be selected before proceeding.</strong>
                </p>
                
                <div class="archetype-progress">
                    <span id="archetype-count">0/7 Archetypes Selected</span>
                </div>
                
                ${this.renderArchetypeCategory('movement', 'Movement Archetype', 'How your character moves around the battlefield')}
                ${this.renderArchetypeCategory('attackType', 'Attack Type Archetype', 'What types of attacks your character specializes in')}
                ${this.renderArchetypeCategory('effectType', 'Effect Type Archetype', 'Whether you focus on damage, conditions, or both')}
                ${this.renderArchetypeCategory('uniqueAbility', 'Unique Ability Archetype', 'Special capabilities beyond standard actions')}
                ${this.renderArchetypeCategory('defensive', 'Defensive Archetype', 'How your character protects themselves')}
                ${this.renderArchetypeCategory('specialAttack', 'Special Attack Archetype', 'How you develop unique combat abilities')}
                ${this.renderArchetypeCategory('utility', 'Utility Archetype', 'Your non-combat capabilities and skills')}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Assign your attribute points across combat and utility stats.</p>
                    <button id="continue-to-attributes" class="btn-primary" disabled>Continue to Attributes →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateProgress();
    }

    renderArchetypeCategory(categoryId, categoryName, description) {
        const character = this.builder.currentCharacter;
        const archetypes = ArchetypeSystem.getArchetypesForCategory(categoryId);
        const selectedId = character.archetypes[categoryId];

        return `
            <div class="archetype-category" data-category="${categoryId}">
                <h3>${categoryName}</h3>
                <p class="category-description">${description}</p>
                
                <div class="archetype-grid">
                    ${archetypes.map(archetype => `
                        <div class="archetype-card ${selectedId === archetype.id ? 'selected' : ''}" 
                             data-category="${categoryId}" 
                             data-archetype="${archetype.id}">
                            <h4>${archetype.name}</h4>
                            <p>${archetype.description}</p>
                            ${this.renderArchetypeDetails(archetype)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderArchetypeDetails(archetype) {
        // Add specific details based on archetype type
        let details = '';
        
        if (archetype.effects) {
            details += `<div class="archetype-effects"><strong>Effects:</strong> ${archetype.effects}</div>`;
        }
        
        if (archetype.restrictions) {
            details += `<div class="archetype-restrictions"><strong>Restrictions:</strong> ${archetype.restrictions}</div>`;
        }
        
        if (archetype.pointModifier) {
            details += `<div class="archetype-points"><strong>Points:</strong> ${archetype.pointModifier}</div>`;
        }

        return details;
    }

    setupEventListeners() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Archetype selection
        document.querySelectorAll('.archetype-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = card.dataset.category;
                const archetypeId = card.dataset.archetype;
                this.selectArchetype(category, archetypeId);
            });
        });

        // Continue button
        const continueBtn = document.getElementById('continue-to-attributes');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('attributes');
            });
        }
    }

    selectArchetype(category, archetypeId) {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Validate selection
        const validation = ArchetypeSystem.validateArchetypeSelection(character, category, archetypeId);
        
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors.join(', '), 'error');
            return;
        }

        if (validation.warnings.length > 0) {
            if (!confirm(`${validation.warnings.join(', ')}\n\nContinue anyway?`)) {
                return;
            }
        }

        // Apply selection
        character.archetypes[category] = archetypeId;

        // Update display
        this.updateArchetypeSelection(category, archetypeId);
        this.updateProgress();
        this.builder.updateCharacter();
    }

    updateArchetypeSelection(category, archetypeId) {
        const categoryElement = document.querySelector(`[data-category="${category}"]`);
        if (!categoryElement) return;

        // Remove previous selection
        categoryElement.querySelectorAll('.archetype-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add new selection
        const selectedCard = categoryElement.querySelector(`[data-archetype="${archetypeId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }

    updateProgress() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const categories = ['movement', 'attackType', 'effectType', 'uniqueAbility', 'defensive', 'specialAttack', 'utility'];
        const selectedCount = categories.filter(cat => character.archetypes[cat] !== null).length;
        
        // Update progress display
        const progressElement = document.getElementById('archetype-count');
        if (progressElement) {
            progressElement.textContent = `${selectedCount}/7 Archetypes Selected`;
        }

        // Enable/disable continue button
        const continueBtn = document.getElementById('continue-to-attributes');
        if (continueBtn) {
            continueBtn.disabled = selectedCount < 7;
            if (selectedCount === 7) {
                continueBtn.classList.add('pulse');
            } else {
                continueBtn.classList.remove('pulse');
            }
        }

        // Update tab states
        this.builder.updateTabStates();
    }
}