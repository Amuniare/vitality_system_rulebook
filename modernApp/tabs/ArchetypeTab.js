import { UniversalCard } from '../components/UniversalCard.js';
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';

export class ArchetypeTab {
    constructor(container) {
        this.container = container;
        this.categories = [
            { id: 'movement', name: 'Movement Style', description: 'How you move in combat' },
            { id: 'attackType', name: 'Attack Type', description: 'Your offensive approach' },
            { id: 'effectType', name: 'Effect Type', description: 'What your attacks accomplish' },
            { id: 'attackMethod', name: 'Attack Method', description: 'How you deliver attacks' },
            { id: 'defenseMethod', name: 'Defense Method', description: 'How you avoid harm' },
            { id: 'utilityMethod', name: 'Utility Method', description: 'Your non-combat specialty' },
            { id: 'defensive', name: 'Defensive Style', description: 'Your overall durability' }
        ];
        
        // Subscribe to character updates
        EventBus.on('character-updated', (data) => {
            if (data.changes.includes('archetypes')) {
                this.updateDisplay();
            }
        });
    }
    
    render() {
        const character = StateManager.getCharacter();
        
        this.container.innerHTML = `
            <div class="tab-content archetype-tab">
                <h2>Select Your Archetypes</h2>
                <p class="section-description">
                    Choose one archetype from each category to define your character's combat style and abilities.
                </p>
                
                <div class="archetype-categories">
                    ${this.categories.map(category => 
                        this.renderCategory(category, character)
                    ).join('')}
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    renderCategory(category, character) {
        const archetypes = EntityLoader.getEntitiesByFilter({
            type: 'archetype',
            category: category.id
        });
        
        const selectedId = character.archetypes[category.id];
        
        return `
            <div class="archetype-category" data-category="${category.id}">
                <div class="category-header">
                    <h3>${category.name}</h3>
                    <p class="category-description">${category.description}</p>
                </div>
                
                <div class="archetype-grid">
                    ${archetypes.map(archetype => 
                        UniversalCard.render(archetype, {
                            character: character,
                            selected: archetype.id === selectedId,
                            showCost: false,
                            interactive: true
                        })
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Use event delegation for all card clicks
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('[data-clickable="true"]');
            if (!card) return;
            
            const entityId = card.dataset.entityId;
            const entity = EntityLoader.getEntity(entityId);
            
            if (!entity || entity.type !== 'archetype') return;
            
            // Dispatch selection
            StateManager.dispatch('SELECT_ARCHETYPE', {
                category: entity.category,
                archetypeId: entity.id
            });
        });
    }
    
    updateDisplay() {
        // Re-render only the affected category
        const character = StateManager.getCharacter();
        
        this.categories.forEach(category => {
            const categoryEl = this.container.querySelector(`[data-category="${category.id}"]`);
            if (!categoryEl) return;
            
            const gridEl = categoryEl.querySelector('.archetype-grid');
            if (!gridEl) return;
            
            // Re-render just the cards
            const archetypes = EntityLoader.getEntitiesByFilter({
                type: 'archetype',
                category: category.id
            });
            
            const selectedId = character.archetypes[category.id];
            
            gridEl.innerHTML = archetypes.map(archetype => 
                UniversalCard.render(archetype, {
                    character: character,
                    selected: archetype.id === selectedId,
                    showCost: false,
                    interactive: true
                })
            ).join('');
        });
    }
}