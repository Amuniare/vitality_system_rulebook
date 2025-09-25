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
        const statBreakdowns = this.builder.getStatBreakdowns();
        
        // Fetch archetype definitions with descriptions
        const archetypeDefinitions = this.getArchetypeDefinitions(character);
        
        // Fetch utility definitions with descriptions
        const utilityDefinitions = this.getUtilityDefinitions(character);

        // Compose the final HTML using new two-column layout (Golden Rule #3)
        tabContent.innerHTML = `
            <div class="summary-section">
                <h2>Character Summary</h2>
                <div class="summary-grid-container" data-testid="character-summary">
                    <div class="summary-left-column">
                        ${this.summaryHeader.render(character)}
                        ${this.pointPoolsSummary.render(pools)}
                        ${this.attributesSummary.render(character, statBreakdowns)}
                        ${this.archetypesSummary.render(character.archetypes, archetypeDefinitions)}
                        ${this.utilityAbilitiesSummary.render(character)}
                    </div>
                    <div class="summary-right-column">
                        ${this.specialAttacksSummary.render(character.specialAttacks)}
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

    // Get archetype definitions with full descriptions
    getArchetypeDefinitions(character) {
        if (!character.archetypes) {
            return {};
        }

        const archetypeDefinitions = {};
        const allArchetypes = gameDataManager.getArchetypes();

        Object.entries(character.archetypes).forEach(([category, archetypeId]) => {
            if (archetypeId && allArchetypes[category]) {
                const archetype = allArchetypes[category].find(arch => arch.id === archetypeId);
                if (archetype) {
                    archetypeDefinitions[category] = {
                        id: archetype.id,
                        name: archetype.name,
                        description: archetype.description || 'No description available'
                    };
                }
            }
        });

        return archetypeDefinitions;
    }
    
    // Get utility definitions with full descriptions
    getUtilityDefinitions(character) {
        if (!character.utilityPurchases) {
            return {};
        }

        const utilityDefinitions = {};
        
        // Get all utility data from gameDataManager
        const featuresData = gameDataManager.getAvailableFeatures();
        const sensesData = gameDataManager.getAvailableSenses();
        const movementData = gameDataManager.getMovementFeatures();
        
        // Helper function to find a definition within tiered data
        const findDefinitionInTiers = (tieredData, itemId, itemKey) => {
            if (!tieredData || typeof tieredData !== 'object') return null;
            for (const tier of Object.values(tieredData)) {
                if (tier[itemKey] && Array.isArray(tier[itemKey])) {
                    const item = tier[itemKey].find(i => i.id === itemId);
                    if (item) return item;
                }
            }
            return null;
        };

        // Process each utility category
        Object.entries(character.utilityPurchases).forEach(([category, purchases]) => {
            if (!purchases || !Array.isArray(purchases) || purchases.length === 0) return;
            
            utilityDefinitions[category] = {};
            
            purchases.forEach(purchase => {
                let definition = null;
                const itemId = purchase.itemId || purchase.id; // Handle different structures
                
                // Find the definition based on category
                switch(category) {
                    case 'features':
                        definition = findDefinitionInTiers(featuresData, itemId, 'features');
                        break;
                    case 'senses':
                        definition = findDefinitionInTiers(sensesData, itemId, 'senses');
                        break;
                    case 'movement':
                        definition = findDefinitionInTiers(movementData, itemId, 'features'); // movement_features.json uses 'features' key
                        break;
                    case 'expertise':
                        definition = { id: itemId, name: itemId, description: `Expertise in ${itemId}` };
                        break;
                }
                
                if (definition) {
                    utilityDefinitions[category][itemId] = {
                        id: definition.id,
                        name: definition.name || itemId,
                        description: definition.description || 'No description available'
                    };
                }
            });
        });

        return utilityDefinitions;
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