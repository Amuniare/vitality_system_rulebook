import { SummaryHeader } from './components/SummaryHeader.js';
import { PointPoolsSummary } from './components/PointPoolsSummary.js';
import { AttributesSummary } from './components/AttributesSummary.js';
import { ArchetypesSummary } from './components/ArchetypesSummary.js';
import { SpecialAttacksSummary } from './components/SpecialAttacksSummary.js';
import { UtilityAbilitiesSummary } from './components/UtilityAbilitiesSummary.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { gameDataManager } from '../../core/GameDataManager.js';

export class SummaryTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        
        // Initialize all child components
        this.summaryHeader = new SummaryHeader();
        this.pointPoolsSummary = new PointPoolsSummary();
        this.attributesSummary = new AttributesSummary();
        this.archetypesSummary = new ArchetypesSummary();
        this.specialAttacksSummary = new SpecialAttacksSummary();
        this.utilityAbilitiesSummary = new UtilityAbilitiesSummary();
        
        // Event listener lifecycle management
        this.clickHandler = null;
        this.containerElement = null;
    }

    render() {
        const tabContent = document.getElementById('tab-summary');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }

        // Fetch all necessary data once at the top level (Golden Rule #1)
        const pools = this.builder.calculatePointPools();
        const stats = this.builder.calculateStats();
        const archetypeNames = this.resolveArchetypeNames(character);

        // Compose the final HTML by calling child component render methods (Golden Rule #3)
        tabContent.innerHTML = `
            <div class="summary-section">
                <h2>Character Summary</h2>
                <div class="summary-grid-two-rows" data-testid="character-summary">
                    <div class="summary-row-1 grid-layout grid-columns-auto-fit-300">
                        ${this.summaryHeader.render(character)}
                        ${this.pointPoolsSummary.render(pools)}
                        ${this.attributesSummary.render(character, stats)}
                    </div>
                    <div class="summary-row-2 grid-layout grid-columns-auto-fit-300">
                        ${this.archetypesSummary.render(archetypeNames)}
                        ${this.specialAttacksSummary.render(character)}
                        ${this.utilityAbilitiesSummary.render(character)}
                    </div>
                </div>

                <div class="export-actions">
                    <h3>Export Character</h3>
                    <div class="export-buttons">
                        ${RenderUtils.renderButton({ 
                            text: 'Export Full JSON', 
                            variant: 'secondary', 
                            dataAttributes: { 
                                action: 'export-json-summary', 
                                testid: 'export-json' 
                            }
                        })}
                        ${RenderUtils.renderButton({ 
                            text: 'Print Character Sheet', 
                            variant: 'secondary', 
                            dataAttributes: { 
                                action: 'print-character' 
                            }
                        })}
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners after rendering
        this.setupEventListeners();
    }

    removeEventListeners() {
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
            this.containerElement = null;
        }
    }

    setupEventListeners() {
        // First, remove any old listeners to prevent duplication
        this.removeEventListeners();
        
        const container = document.getElementById('tab-summary');
        if (!container) return;
        
        // Store the handler and container so it can be removed later
        this.clickHandler = (e) => {
            const element = e.target.closest('[data-action]');
            if (!element) return;
            
            const action = element.dataset.action;
            
            switch (action) {
                case 'export-json-summary':
                    this.builder.exportCharacter();
                    break;
                case 'print-character':
                    this.printCharacter();
                    break;
            }
        };
        
        this.containerElement = container;
        this.containerElement.addEventListener('click', this.clickHandler);
        
        console.log('✅ SummaryTab event listeners attached.');
    }

    resolveArchetypeNames(character) {
        if (!character.archetypes) {
            return {};
        }

        const archetypeNames = {};
        const allArchetypes = gameDataManager.getArchetypes();

        Object.entries(character.archetypes).forEach(([category, archetypeId]) => {
            if (archetypeId && allArchetypes[category]) {
                const archetype = allArchetypes[category].find(arch => arch.id === archetypeId);
                archetypeNames[category] = archetype ? archetype.name : archetypeId;
            } else {
                archetypeNames[category] = null;
            }
        });

        return archetypeNames;
    }

    printCharacter() {
        this.builder.showNotification('Print functionality coming soon!', 'info');
    }

    // onCharacterUpdate will be called by CharacterBuilder when character changes
    onCharacterUpdate() {
        // Just call render - it will handle the full lifecycle
        this.render();
    }
}