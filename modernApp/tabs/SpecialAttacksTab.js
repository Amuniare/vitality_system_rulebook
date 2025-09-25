// tabs/SpecialAttacksTab.js
import { AttackCard } from '../components/AttackCard.js';
import { AttackFilters } from '../components/AttackFilters.js';
import { AttackDetails } from '../components/AttackDetails.js';
import { AttackComparison } from '../components/AttackComparison.js';

export class SpecialAttacksTab {
    constructor(container, stateManager, dataLoader) {
        this.container = container;
        this.stateManager = stateManager;
        this.dataLoader = dataLoader;
        
        this.filters = {
            category: 'all',
            damageType: 'all',
            range: 'all',
            costRange: 'all',
            searchTerm: '',
            showPurchasedOnly: false,
            sortBy: 'name'
        };
        
        this.selectedAttack = null;
        this.comparisonAttacks = new Set();
        this.viewMode = 'grid'; // grid, list, details
        
        this.unsubscribe = null;
    }

    async init() {
        await this.loadAttackData();
        
        this.unsubscribe = this.stateManager.subscribe(() => {
            this.updateDisplay();
        });
        
        this.setupEventDelegation();
    }

    async loadAttackData() {
        try {
            const attacks = await this.dataLoader.loadSpecialAttacks();
            
            // Enrich attack data with categories
            const enrichedAttacks = attacks.map(attack => ({
                ...attack,
                category: this.categorizeAttack(attack),
                damageType: this.extractDamageType(attack),
                range: this.extractRange(attack)
            }));
            
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'specialAttacks', entities: enrichedAttacks }
            });
        } catch (error) {
            console.error('Error loading special attacks:', error);
        }
    }

    onRender() {
        const state = this.stateManager.getState();
        const mainPool = state.pools.main;
        const availablePoints = this.stateManager.getAvailablePoints('main');

        this.container.innerHTML = `
            <div class="tab-content special-attacks-tab">
                <div class="attacks-header">
                    <div class="header-top">
                        <h2>Special Attacks</h2>
                        <div class="points-display">
                            <span class="points-label">Available Points:</span>
                            <span class="points-value">${availablePoints} / ${mainPool.total}</span>
                        </div>
                    </div>
                    <p class="header-description">
                        Powerful combat techniques and abilities to enhance your combat effectiveness.
                    </p>
                </div>

                <div class="attacks-controls">
                    <div class="view-mode-toggle">
                        <button class="view-mode-btn ${this.viewMode === 'grid' ? 'active' : ''}" 
                                data-view="grid" title="Grid View">
                            <i class="icon-grid">⊞</i>
                        </button>
                        <button class="view-mode-btn ${this.viewMode === 'list' ? 'active' : ''}" 
                                data-view="list" title="List View">
                            <i class="icon-list">☰</i>
                        </button>
                        <button class="view-mode-btn ${this.viewMode === 'details' ? 'active' : ''}" 
                                data-view="details" title="Details View">
                            <i class="icon-details">📊</i>
                        </button>
                    </div>
                    
                    <div class="comparison-toggle">
                        <button class="btn btn-secondary comparison-btn ${this.comparisonAttacks.size > 0 ? 'active' : ''}">
                            Compare (${this.comparisonAttacks.size})
                        </button>
                    </div>
                </div>

                <div id="attack-filters-container"></div>

                <div class="attacks-content">
                    ${this.renderContent()}
                </div>

                ${this.selectedAttack ? this.renderAttackDetails() : ''}
                ${this.comparisonAttacks.size > 1 ? this.renderComparison() : ''}
            </div>
        `;

        // Render filters
        const filtersContainer = this.container.querySelector('#attack-filters-container');
        const attackFilters = new AttackFilters(filtersContainer, this.filters, (newFilters) => {
            this.filters = newFilters;
            this.updateAttacksList();
        });
        attackFilters.render();

        this.attachEventListeners();
    }

    renderContent() {
        switch (this.viewMode) {
            case 'grid':
                return this.renderGridView();
            case 'list':
                return this.renderListView();
            case 'details':
                return this.renderDetailsView();
            default:
                return this.renderGridView();
        }
    }

    renderGridView() {
        const attacks = this.getFilteredAttacks();
        
        if (attacks.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="attacks-grid">
                ${attacks.map(attack => {
                    const card = new AttackCard(
                        attack, 
                        'specialAttack', 
                        this.stateManager,
                        {
                            isSelected: this.selectedAttack?.id === attack.id,
                            isInComparison: this.comparisonAttacks.has(attack.id),
                            viewMode: 'grid'
                        }
                    );
                    return card.render();
                }).join('')}
            </div>
        `;
    }

    renderListView() {
        const attacks = this.getFilteredAttacks();
        
        if (attacks.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="attacks-list">
                <table class="attacks-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Damage</th>
                            <th>Range</th>
                            <th>Cost</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attacks.map(attack => {
                            const card = new AttackCard(
                                attack, 
                                'specialAttack', 
                                this.stateManager,
                                {
                                    isSelected: this.selectedAttack?.id === attack.id,
                                    isInComparison: this.comparisonAttacks.has(attack.id),
                                    viewMode: 'list'
                                }
                            );
                            return card.render();
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderDetailsView() {
        const attacks = this.getFilteredAttacks();
        
        if (attacks.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="attacks-details-grid">
                ${attacks.map(attack => {
                    const details = new AttackDetails(attack, this.stateManager);
                    return details.render();
                }).join('')}
            </div>
        `;
    }

    renderAttackDetails() {
        const details = new AttackDetails(this.selectedAttack, this.stateManager);
        return `
            <div class="attack-modal-overlay" data-action="close-details">
                <div class="attack-modal">
                    <button class="modal-close" data-action="close-details">×</button>
                    ${details.renderFull()}
                </div>
            </div>
        `;
    }

    renderComparison() {
        const attacks = Array.from(this.comparisonAttacks).map(id => 
            this.getAttackById(id)
        ).filter(Boolean);

        const comparison = new AttackComparison(attacks);
        return `
            <div class="comparison-modal-overlay" data-action="close-comparison">
                <div class="comparison-modal">
                    <button class="modal-close" data-action="close-comparison">×</button>
                    ${comparison.render()}
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>No Special Attacks Found</h3>
                <p>Try adjusting your filters or search criteria.</p>
            </div>
        `;
    }

    getFilteredAttacks() {
        const state = this.stateManager.getState();
        let attacks = state.entities.specialAttacks || [];

        // Apply filters
        if (this.filters.category !== 'all') {
            attacks = attacks.filter(a => a.category === this.filters.category);
        }

        if (this.filters.damageType !== 'all') {
            attacks = attacks.filter(a => a.damageType === this.filters.damageType);
        }

        if (this.filters.range !== 'all') {
            attacks = attacks.filter(a => a.range === this.filters.range);
        }

        if (this.filters.costRange !== 'all') {
            attacks = attacks.filter(a => this.filterByCost(a, this.filters.costRange));
        }

        if (this.filters.searchTerm) {
            const term = this.filters.searchTerm.toLowerCase();
            attacks = attacks.filter(a => 
                a.name.toLowerCase().includes(term) ||
                a.description.toLowerCase().includes(term)
            );
        }

        if (this.filters.showPurchasedOnly) {
            attacks = attacks.filter(a => 
                this.stateManager.hasPurchased(a.id, 'specialAttack')
            );
        }

        // Apply sorting
        attacks = this.sortAttacks(attacks, this.filters.sortBy);

        return attacks;
    }

    sortAttacks(attacks, sortBy) {
        const sortFunctions = {
            name: (a, b) => a.name.localeCompare(b.name),
            cost: (a, b) => a.cost - b.cost,
            damage: (a, b) => (b.damage || 0) - (a.damage || 0),
            range: (a, b) => (b.range || 0) - (a.range || 0)
        };

        return [...attacks].sort(sortFunctions[sortBy] || sortFunctions.name);
    }

    filterByCost(attack, range) {
        const ranges = {
            low: attack.cost <= 15,
            medium: attack.cost > 15 && attack.cost <= 30,
            high: attack.cost > 30
        };
        return ranges[range] || true;
    }

    categorizeAttack(attack) {
        // Categorize based on attack properties
        if (attack.tags?.includes('melee')) return 'melee';
        if (attack.tags?.includes('ranged')) return 'ranged';
        if (attack.tags?.includes('magic')) return 'magic';
        if (attack.tags?.includes('area')) return 'area';
        if (attack.tags?.includes('buff')) return 'support';
        return 'physical';
    }

    extractDamageType(attack) {
        // Extract damage type from effects or tags
        const damageTypes = ['physical', 'fire', 'ice', 'lightning', 'holy', 'dark'];
        for (const type of damageTypes) {
            if (attack.description?.toLowerCase().includes(type) || 
                attack.tags?.includes(type)) {
                return type;
            }
        }
        return 'physical';
    }

    extractRange(attack) {
        // Extract range from description or properties
        if (attack.range) return attack.range;
        if (attack.description?.includes('melee')) return 'melee';
        if (attack.description?.includes('ranged')) return 'ranged';
        return 'varies';
    }

    getAttackById(id) {
        const state = this.stateManager.getState();
        return state.entities.specialAttacks?.find(a => a.id === id);
    }

    setupEventDelegation() {
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'view-details':
                    const attackId = e.target.closest('[data-attack-id]').dataset.attackId;
                    this.selectedAttack = this.getAttackById(attackId);
                    this._requestRender();
                    break;
                    
                case 'close-details':
                    if (e.target.classList.contains('attack-modal-overlay') || 
                        e.target.classList.contains('modal-close')) {
                        this.selectedAttack = null;
                        this._requestRender();
                    }
                    break;
                    
                case 'toggle-comparison':
                    const compareId = e.target.closest('[data-attack-id]').dataset.attackId;
                    if (this.comparisonAttacks.has(compareId)) {
                        this.comparisonAttacks.delete(compareId);
                    } else {
                        this.comparisonAttacks.add(compareId);
                    }
                    this._requestRender();
                    break;
                    
                case 'close-comparison':
                    if (e.target.classList.contains('comparison-modal-overlay') || 
                        e.target.classList.contains('modal-close')) {
                        this.comparisonAttacks.clear();
                        this._requestRender();
                    }
                    break;
            }
        };

        this.container.addEventListener('click', this.clickHandler);
    }

    attachEventListeners() {
        // View mode buttons
        this.container.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.viewMode = e.currentTarget.dataset.view;
                this._requestRender();
            });
        });

        // Comparison button
        const comparisonBtn = this.container.querySelector('.comparison-btn');
        if (comparisonBtn) {
            comparisonBtn.addEventListener('click', () => {
                if (this.comparisonAttacks.size > 1) {
                    this._requestRender();
                }
            });
        }
    }

    updateDisplay() {
        // Update points display
        const state = this.stateManager.getState();
        const availablePoints = this.stateManager.getAvailablePoints('main');
        const pointsValue = this.container.querySelector('.points-value');
        if (pointsValue) {
            pointsValue.textContent = `${availablePoints} / ${state.pools.main.total}`;
        }

        // Update attack cards
        this.updateAttacksList();
    }

    updateAttacksList() {
        const contentDiv = this.container.querySelector('.attacks-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderContent();
        }
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }
    }
}