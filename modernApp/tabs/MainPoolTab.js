import { UniversalCard } from '../components/UniversalCard.js';
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';

export class MainPoolTab {
    constructor(container) {
        this.container = container;
        this.sections = ['flaws', 'traits', 'boons'];
        this.activeSection = 'flaws';
        this.listenerAttached = false; // Track listener state
        
        EventBus.on('character-updated', (data) => {
            if (data.changes.some(c => ['flaws', 'traits', 'boons', 'pools'].includes(c))) {
                this.updateDisplay();
            }
        });
    }
    
    render() {
        const character = StateManager.getCharacter();
        const pool = PoolCalculator.calculateMainPool(character);
        
        this.container.innerHTML = `
            <div class="tab-content main-pool-tab">
                <h2>Main Pool Purchases</h2>
                
                <div class="pool-summary">
                    <div class="pool-stat">
                        <span class="pool-label">Available:</span>
                        <span class="pool-value">${pool.totalAvailable}p</span>
                    </div>
                    <div class="pool-stat">
                        <span class="pool-label">Spent:</span>
                        <span class="pool-value">${pool.totalSpent}p</span>
                    </div>
                    <div class="pool-stat">
                        <span class="pool-label">Remaining:</span>
                        <span class="pool-value ${pool.remaining < 0 ? 'negative' : ''}">${pool.remaining}p</span>
                    </div>
                </div>
                
                <div class="section-nav">
                    ${this.sections.map(section => `
                        <button class="section-btn ${section === this.activeSection ? 'active' : ''}"
                                data-section="${section}">
                            ${this.getSectionName(section)}
                        </button>
                    `).join('')}
                </div>
                
                <div id="section-content" class="section-content">
                    ${this.renderSection(this.activeSection, character)}
                </div>
            </div>
        `;
        
        // Only attach listener once
        if (!this.listenerAttached) {
            this.setupEventListeners();
            this.listenerAttached = true;
        }
    }
    
    setupEventListeners() {
        // Use a single delegated listener on the container
        this.clickHandler = (e) => {
            // Section buttons
            if (e.target.matches('[data-section]')) {
                this.activeSection = e.target.dataset.section;
                this.render();
                return;
            }
            
            // Card selection
            const card = e.target.closest('[data-clickable="true"]');
            if (card) {
                this.handleCardClick(card);
                return;
            }
            
            // Remove purchase
            if (e.target.matches('[data-action="remove-purchase"]')) {
                e.preventDefault();
                e.stopPropagation();
                
                const purchaseId = e.target.dataset.purchaseId;
                const entityType = e.target.dataset.entityType;
                
                StateManager.dispatch('REMOVE_ENTITY', { purchaseId, entityType });
            }
        };
        
        this.container.addEventListener('click', this.clickHandler);
    }
    

    
    getSectionName(section) {
        const names = {
            flaws: 'Flaws (+Points)',
            traits: 'Traits (-Points)',
            boons: 'Boons (-Points)'
        };
        return names[section] || section;
    }
    
    renderSection(section, character) {
        switch (section) {
            case 'flaws':
                return this.renderFlawSection(character);
            case 'traits':
                return this.renderTraitSection(character);
            case 'boons':
                return this.renderBoonSection(character);
            default:
                return '<p>Section not implemented</p>';
        }
    }
    
    renderFlawSection(character) {
        const flaws = EntityLoader.getEntitiesByType('flaw');
        const purchased = character.flaws || [];
        
        return `
            <div class="flaw-section">
                <h3>Available Flaws</h3>
                <p class="section-description">
                    Flaws grant you additional points but come with permanent disadvantages.
                </p>
                
                <div class="entity-grid">
                    ${flaws.map(flaw => {
                        const isPurchased = purchased.some(p => p.id === flaw.id);
                        
                        return UniversalCard.render(flaw, {
                            character: character,
                            selected: isPurchased,
                            interactive: !isPurchased
                        });
                    }).join('')}
                </div>
                
                ${purchased.length > 0 ? `
                    <h3>Your Flaws</h3>
                    <div class="purchased-list">
                        ${purchased.map(purchase => this.renderPurchasedItem(purchase, 'flaw')).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderTraitSection(character) {
        const traits = EntityLoader.getEntitiesByType('trait');
        const purchased = character.traits || [];
        
        return `
            <div class="trait-section">
                <h3>Available Traits</h3>
                <p class="section-description">
                    Traits provide conditional bonuses at a point cost.
                </p>
                
                <div class="entity-grid">
                    ${traits.map(trait => {
                        const isPurchased = purchased.some(p => p.id === trait.id);
                        
                        return UniversalCard.render(trait, {
                            character: character,
                            selected: isPurchased,
                            interactive: !isPurchased
                        });
                    }).join('')}
                </div>
                
                ${purchased.length > 0 ? `
                    <h3>Your Traits</h3>
                    <div class="purchased-list">
                        ${purchased.map(purchase => this.renderPurchasedItem(purchase, 'trait')).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderBoonSection(character) {
        return `
            <div class="boon-section">
                <h3>Simple Boons</h3>
                <p class="section-description">
                    Boons provide unique abilities and advantages.
                </p>
                <p class="coming-soon">Coming soon...</p>
            </div>
        `;
    }
    
    renderPurchasedItem(purchase, type) {
        const entity = EntityLoader.getEntity(purchase.id);
        if (!entity) return '';
        
        return `
            <div class="purchased-item">
                <div class="purchased-info">
                    <h4>${entity.name}</h4>
                    <span class="purchased-cost">${entity.cost.display}</span>
                </div>
                <button class="btn btn-danger btn-small" 
                        data-action="remove-purchase"
                        data-purchase-id="${purchase.purchaseId}"
                        data-entity-type="${type}">
                    Remove
                </button>
            </div>
        `;
    }
    

    
    handleCardClick(card) {
        const entityId = card.dataset.entityId;
        const entity = EntityLoader.getEntity(entityId);
        
        if (!entity) return;
        
        // Simple purchase for now
        StateManager.dispatch('PURCHASE_ENTITY', {
            entityId: entity.id,
            entityType: entity.type,
            cost: entity.cost
        });
    }
    
    updateDisplay() {
        // Re-render the active section
        const character = StateManager.getCharacter();
        const sectionContent = this.container.querySelector('#section-content');
        
        if (sectionContent) {
            sectionContent.innerHTML = this.renderSection(this.activeSection, character);
        }
        
        // Update pool display
        const pool = PoolCalculator.calculateMainPool(character);
        const poolStats = this.container.querySelectorAll('.pool-stat .pool-value');
        
        if (poolStats.length === 3) {
            poolStats[0].textContent = `${pool.totalAvailable}p`;
            poolStats[1].textContent = `${pool.totalSpent}p`;
            poolStats[2].textContent = `${pool.remaining}p`;
            poolStats[2].classList.toggle('negative', pool.remaining < 0);
        }
    }
}