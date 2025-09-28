// frontend/character-builder/features/archetypes/ArchetypeTab.js
import { ArchetypeSystem } from '../../systems/ArchetypeSystem.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { EventManager } from '../../shared/utils/EventManager.js';

export class ArchetypeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.listenersAttached = false;
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
            { id: 'attack', name: 'Attack Archetype', description: 'How you develop special combat abilities and attacks' },
            { id: 'defensive', name: 'Defensive Archetype', description: 'How your character resists conditions and effects' },
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
                <h2>Choose Archetypes ${RenderUtils.renderInfoIcon(RenderUtils.getTooltipText('archetypes'))}</h2>
                <p class="section-description">
                    Select one archetype from each of the 4 categories. These choices define your character's
                    fundamental approach and provide point modifiers and restrictions.
                    <strong>All archetypes must be selected before proceeding.</strong>
                </p>

                <div class="archetype-progress">
                    <span id="archetype-count">0/4 Archetypes Selected</span>
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
        if (archetype.pointModifier) {
            details += `<div class="archetype-points"><strong>Points:</strong> ${archetype.pointModifier}</div>`;
        }
        return details;
    }

    setupEventListeners() {
        if (this.listenersAttached) {
            return;
        }
        
        const container = document.getElementById('tab-archetypes');
        if (!container) return;
        
        EventManager.delegateEvents(container, {
            click: {
                '[data-action="select-archetype"]': (e, element) => {
                    const category = element.dataset.category;
                    const archetypeId = element.dataset.archetype;
                    if (category && archetypeId) {
                        this.selectArchetype(category, archetypeId);
                    }
                },
                '[data-action="continue-to-attributes"]': () => this.builder.switchTab('attributes')
            }
        }, this);
        
        this.listenersAttached = true;
        console.log('✅ ArchetypeTab event listeners attached ONCE.');
    }



    updateArchetypeSelectionUI(category, archetypeId) {
        console.log(`🔍 Updating UI for ${category} = ${archetypeId}`);
        
        const categoryElement = document.querySelector(`.archetype-category[data-category="${category}"]`);
        console.log(`🔍 Found category element for ${category}:`, !!categoryElement);
        
        if (!categoryElement) return;
    
        const cards = categoryElement.querySelectorAll('.card.archetype-card');
        console.log(`🔍 Found ${cards.length} cards in category ${category}`);
        
        cards.forEach((card, index) => {
            const wasSelected = card.classList.contains('selected');
            card.classList.remove('selected');
            
            // Update card selection
            if (card.dataset.archetype === archetypeId) {
                card.classList.add('selected');
                console.log(`🔍 Selected card ${index} (${card.dataset.archetype}) in ${category}`);
            }
            
            
            console.log(`🔍 Card ${index}: ${card.dataset.archetype}, selected: ${wasSelected} -> ${card.classList.contains('selected')}`);
        });
    }

    selectArchetype(category, archetypeId) {
        const character = this.builder.currentCharacter;
        if (!character) return;
    
        // NEW: Allow clearing by clicking the same archetype
        if (character.archetypes[category] === archetypeId) {
            this.builder.setArchetype(category, null);
            console.log(`✅ Cleared archetype: ${category}`);
        } else {
            // Existing validation logic (simplified)
            const archetypes = ArchetypeSystem.getArchetypesForCategory(category);
            const archetypeExists = archetypes.find(arch => arch.id === archetypeId);
            if (!archetypeExists) {
                console.error(`❌ Archetype ${archetypeId} not found in category ${category}`);
                return;
            }
            
            this.builder.setArchetype(category, archetypeId);
            console.log(`✅ Set archetype: ${category} = ${archetypeId}`);
        }
        
        // Update the UI to reflect the change
        this.updateArchetypeSelectionUI(category, this.builder.currentCharacter.archetypes[category]);
        this.updateProgress();
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
    
        const continueBtn = document.querySelector('.continue-to-attributes-btn');
        if (continueBtn) {
            // CHANGED: Always enable continue button, just show warning if incomplete
            continueBtn.disabled = false;
            const allSelected = selectedCount === totalCategories;
            
            if (allSelected) {
                continueBtn.classList.add('pulse');
                continueBtn.textContent = 'Continue to Attributes →';
            } else {
                continueBtn.classList.remove('pulse');
                continueBtn.textContent = `Continue Anyway (${selectedCount}/${totalCategories}) →`;
            }
        }
        this.builder.updateTabStates();
    }

}
