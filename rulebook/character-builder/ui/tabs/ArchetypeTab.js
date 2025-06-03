// rulebook/character-builder/ui/tabs/ArchetypeTab.js
import { ArchetypeSystem } from '../../systems/ArchetypeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class ArchetypeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }


    render() {
        const tabContent = document.getElementById('tab-archetypes');
        if (!tabContent) return;
    
        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }
    
        const categories = [
            { id: 'movement', name: 'Movement Archetype', description: 'How your character moves around the battlefield' },
            { id: 'attackType', name: 'Attack Type Archetype', description: 'What types of attacks your character specializes in' },
            { id: 'effectType', name: 'Effect Type Archetype', description: 'Whether you focus on damage, conditions, or both' },
            { id: 'uniqueAbility', name: 'Unique Ability Archetype', description: 'Special capabilities beyond standard actions' },
            { id: 'defensive', name: 'Defensive Archetype', description: 'How your character protects themselves' },
            { id: 'specialAttack', name: 'Special Attack Archetype', description: 'How you develop unique combat abilities' },
            { id: 'utility', name: 'Utility Archetype', description: 'Your non-combat capabilities and skills' }
        ];
    
        // DEBUG: Let's see what archetype data we're getting
        console.log('🔍 Debug: Testing archetype data loading...');
        categories.forEach(cat => {
            const archetypes = ArchetypeSystem.getArchetypesForCategory(cat.id);
            console.log(`🔍 Category ${cat.id}:`, archetypes);
            if (archetypes.length > 0) {
                console.log(`🔍 First archetype in ${cat.id}:`, archetypes[0]);
            }
        });
    
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
    
                ${categories.map(cat => this.renderArchetypeCategory(cat.id, cat.name, cat.description, character)).join('')}
    
                <div class="next-step">
                    <p><strong>Next Step:</strong> Assign your attribute points across combat and utility stats.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Attributes →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-attributes' },
                        classes: ['continue-to-attributes-btn'],
                        disabled: true
                    })}
                </div>
            </div>
        `;
    
        // DEBUG: Let's see what HTML was actually generated
        setTimeout(() => {
            const archetypeCards = document.querySelectorAll('.archetype-card');
            console.log(`🔍 Generated ${archetypeCards.length} archetype cards`);
            archetypeCards.forEach((card, index) => {
                console.log(`🔍 Card ${index} dataset:`, card.dataset);
                console.log(`🔍 Card ${index} HTML:`, card.outerHTML.substring(0, 200) + '...');
            });
        }, 100);
    
        this.setupEventListeners();
        this.updateProgress();
    }


    renderArchetypeCategory(categoryId, categoryName, description, character) {
        const archetypes = ArchetypeSystem.getArchetypesForCategory(categoryId);
        const selectedId = character.archetypes[categoryId];
    
        console.log(`🔍 Rendering category ${categoryId}:`, { archetypes, selectedId });
    
        // DEBUG: Let's see what each archetype card will generate
        const cardHtml = archetypes.map((archetype, index) => {
            console.log(`🔍 Generating card for ${categoryId}[${index}]:`, archetype);
            const cardData = {
                title: archetype.name,
                titleTag: 'h4',
                description: archetype.description,
                additionalContent: this.renderArchetypeDetails(archetype),
                clickable: true,
                selected: selectedId === archetype.id,
                dataAttributes: { category: categoryId, archetype: archetype.id, action: 'select-archetype' }
            };
            console.log(`🔍 Card data for ${categoryId}[${index}]:`, cardData);
            
            const html = RenderUtils.renderCard(cardData, { 
                cardClass: `archetype-card ${selectedId === archetype.id ? 'selected' : ''}`, 
                showCost: false, 
                showStatus: false 
            });
            console.log(`🔍 Generated HTML for ${categoryId}[${index}]:`, html.substring(0, 200) + '...');
            return html;
        });
    
        return `
            <div class="archetype-category" data-category="${categoryId}">
                <h3>${categoryName}</h3>
                <p class="category-description">${description}</p>
    
                ${RenderUtils.renderGrid(
                    archetypes,
                    (archetype) => RenderUtils.renderCard({
                        title: archetype.name,
                        titleTag: 'h4',
                        description: archetype.description,
                        additionalContent: this.renderArchetypeDetails(archetype),
                        clickable: true,
                        selected: selectedId === archetype.id,
                        dataAttributes: { category: categoryId, archetype: archetype.id, action: 'select-archetype' }
                    }, { cardClass: `archetype-card ${selectedId === archetype.id ? 'selected' : ''}`, showCost: false, showStatus: false }),
                    { gridContainerClass: 'grid-layout archetype-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                )}
            </div>
        `;
    }


    renderArchetypeDetails(archetype) {
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
        // EventManager at CharacterBuilder level will handle data-action clicks.
        // No direct querySelectors needed here if using data-action attributes.
    }

    selectArchetype(category, archetypeId) { 
        console.log('🎯 ArchetypeTab.selectArchetype called with:', { category, archetypeId });
        
        const character = this.builder.currentCharacter;
        if (!character) {
            console.error('❌ No current character');
            return;
        }
    
        console.log('🔍 Current character archetypes:', character.archetypes);
        console.log('🔍 Validating archetype selection...');
        
        const validation = ArchetypeSystem.validateArchetypeSelection(character, category, archetypeId);
        console.log('🔍 Validation result:', validation);
        
        if (!validation.isValid) {
            console.error('❌ Validation failed:', validation.errors);
            this.builder.showNotification(validation.errors.join(', '), 'error');
            return;
        }
        
        if (validation.warnings.length > 0) {
            console.warn('⚠️ Validation warnings:', validation.warnings);
            if (!confirm(`${validation.warnings.join(', ')}\n\nThis may require re-evaluating later choices. Continue?`)) {
                return;
            }
        }
    
        console.log('✅ Setting archetype:', { category, archetypeId });
        character.archetypes[category] = archetypeId;
        
        this.updateArchetypeSelectionUI(category, archetypeId);
        this.updateProgress();
        this.builder.updateCharacter();
        
        console.log('✅ Archetype selection complete');
    }


    updateArchetypeSelectionUI(category, archetypeId) {
        const categoryElement = document.querySelector(`.archetype-category[data-category="${category}"]`);
        if (!categoryElement) return;

        categoryElement.querySelectorAll('.card.archetype-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.archetype === archetypeId) {
                card.classList.add('selected');
            }
        });
    }

    updateProgress() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const totalCategories = ArchetypeSystem.getArchetypeCategories().length;
        const selectedCount = Object.values(character.archetypes).filter(val => val !== null).length;

        const progressElement = document.getElementById('archetype-count');
        if (progressElement) {
            progressElement.textContent = `${selectedCount}/${totalCategories} Archetypes Selected`;
        }

        const continueBtn = document.querySelector('.continue-to-attributes-btn'); // Updated selector
        if (continueBtn) {
            const allSelected = selectedCount === totalCategories;
            continueBtn.disabled = !allSelected;
            continueBtn.classList.toggle('pulse', allSelected);
        }
        this.builder.updateTabStates(); // Ensure CharacterBuilder updates global tab states
    }
}
