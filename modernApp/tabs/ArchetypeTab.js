// tabs/ArchetypeTab.js
import { PurchaseCard } from '../components/purchaseCard.js';

export class ArchetypeTab {
    constructor(container, stateManager, dataLoader) {
        this.container = container;
        this.stateManager = stateManager;
        this.dataLoader = dataLoader;
        this.currentSection = 'overview';
        this.archetypeData = null;
        
        this.sections = {
            overview: { title: 'Overview', icon: '📋' },
            abilities: { title: 'Unique Abilities', icon: '✨' },
            specialAttacks: { title: 'Special Attacks', icon: '⚔️' },
            traits: { title: 'Archetype Traits', icon: '🎯' },
            upgrades: { title: 'Archetype Upgrades', icon: '🔧' }
        };
        
        this.unsubscribe = null;
    }

    async init() {
        // Load archetype data
        await this.loadArchetypeData();
        
        // Subscribe to state changes
        this.unsubscribe = this.stateManager.subscribe(() => {
            this.updateDisplay();
        });
        
        // Set up event delegation
        this.setupEventDelegation();
    }

    async loadArchetypeData() {
        try {
            // Load all archetype-related data
            const [
                archetypes,
                uniqueAbilities,
                specialAttacks,
                archetypeTraits,
                archetypeUpgrades
            ] = await Promise.all([
                this.dataLoader.loadArchetypes(),
                this.dataLoader.loadUniqueAbilities(),
                this.dataLoader.loadSpecialAttacks(),
                this.dataLoader.loadArchetypeTraits(),
                this.dataLoader.loadArchetypeUpgrades()
            ]);

            // Store in state
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'archetypes', entities: archetypes }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'uniqueAbilities', entities: uniqueAbilities }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'specialAttacks', entities: specialAttacks }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'archetypeTraits', entities: archetypeTraits }
            });
            this.stateManager.dispatch({
                type: 'SET_ENTITIES',
                payload: { type: 'archetypeUpgrades', entities: archetypeUpgrades }
            });

        } catch (error) {
            console.error('Error loading archetype data:', error);
        }
    }

    render() {
        const state = this.stateManager.getState();
        const selectedArchetype = state.character.archetype;
        
        this.container.innerHTML = `
            <div class="tab-content archetype-tab">
                <div class="archetype-header">
                    <h2>Archetype Selection</h2>
                    ${this.renderArchetypeSelector()}
                </div>
                
                ${selectedArchetype ? this.renderArchetypeContent() : this.renderNoArchetype()}
            </div>
        `;

        this.setupSectionTabs();
    }

    renderArchetypeSelector() {
        const state = this.stateManager.getState();
        const archetypes = state.entities.archetypes || [];
        const selected = state.character.archetype;

        return `
            <div class="archetype-selector">
                <label for="archetype-select">Choose Archetype:</label>
                <select id="archetype-select" class="archetype-dropdown">
                    <option value="">-- Select an Archetype --</option>
                    ${archetypes.map(arch => `
                        <option value="${arch.id}" ${selected?.id === arch.id ? 'selected' : ''}>
                            ${arch.name} - ${arch.tagline || ''}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    renderArchetypeContent() {
        const state = this.stateManager.getState();
        const archetype = state.character.archetype;
        
        return `
            <div class="archetype-content">
                <div class="archetype-info">
                    <h3>${archetype.name}</h3>
                    <p class="archetype-tagline">${archetype.tagline || ''}</p>
                    <p class="archetype-description">${archetype.description || ''}</p>
                </div>
                
                <div class="section-tabs">
                    ${Object.entries(this.sections).map(([key, section]) => `
                        <button class="section-tab ${key === this.currentSection ? 'active' : ''}" 
                                data-section="${key}">
                            <span class="tab-icon">${section.icon}</span>
                            ${section.title}
                        </button>
                    `).join('')}
                </div>
                
                <div class="section-content">
                    ${this.renderSectionContent()}
                </div>
            </div>
        `;
    }

    renderSectionContent() {
        switch (this.currentSection) {
            case 'overview':
                return this.renderOverview();
            case 'abilities':
                return this.renderUniqueAbilities();
            case 'specialAttacks':
                return this.renderSpecialAttacks();
            case 'traits':
                return this.renderArchetypeTraits();
            case 'upgrades':
                return this.renderArchetypeUpgrades();
            default:
                return '<p>Select a section to view content.</p>';
        }
    }

    renderOverview() {
        const state = this.stateManager.getState();
        const archetype = state.character.archetype;
        
        return `
            <div class="overview-section">
                <h3>Archetype Overview</h3>
                
                <div class="stats-grid">
                    ${this.renderStatBlock('Starting Stats', archetype.stats)}
                    ${this.renderStatBlock('Stat Growth', archetype.growth)}
                </div>
                
                <div class="archetype-features">
                    <h4>Key Features</h4>
                    <ul class="feature-list">
                        ${(archetype.features || []).map(feature => `
                            <li class="feature-item">
                                <strong>${feature.name}:</strong> ${feature.description}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="archetype-playstyle">
                    <h4>Playstyle</h4>
                    <p>${archetype.playstyle || 'No playstyle description available.'}</p>
                </div>
            </div>
        `;
    }

    renderStatBlock(title, stats) {
        if (!stats) return '';
        
        return `
            <div class="stat-block">
                <h5>${title}</h5>
                <div class="stat-list">
                    ${Object.entries(stats).map(([stat, value]) => `
                        <div class="stat-row">
                            <span class="stat-name">${this.formatStatName(stat)}</span>
                            <span class="stat-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderUniqueAbilities() {
        const state = this.stateManager.getState();
        const abilities = state.entities.uniqueAbilities || [];
        const archetype = state.character.archetype;
        
        // Filter abilities for this archetype
        const archetypeAbilities = abilities.filter(ability => 
            !ability.archetypeRestriction || 
            ability.archetypeRestriction.includes(archetype.id)
        );

        return `
            <div class="abilities-section">
                <div class="section-header">
                    <h3>Unique Abilities</h3>
                    <p>Special abilities available to your archetype. These use your main pool points.</p>
                </div>
                
                <div class="purchase-grid">
                    ${archetypeAbilities.map(ability => {
                        const card = new PurchaseCard(ability, 'uniqueAbility', this.stateManager);
                        return card.render();
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderSpecialAttacks() {
        const state = this.stateManager.getState();
        const attacks = state.entities.specialAttacks || [];
        const archetype = state.character.archetype;
        
        // Filter attacks for this archetype
        const archetypeAttacks = attacks.filter(attack => 
            !attack.archetypeRestriction || 
            attack.archetypeRestriction.includes(archetype.id)
        );

        return `
            <div class="attacks-section">
                <div class="section-header">
                    <h3>Special Attacks</h3>
                    <p>Powerful combat techniques unique to your archetype.</p>
                </div>
                
                <div class="purchase-grid">
                    ${archetypeAttacks.map(attack => {
                        const card = new PurchaseCard(attack, 'specialAttack', this.stateManager);
                        return card.render();
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderArchetypeTraits() {
        const state = this.stateManager.getState();
        const traits = state.entities.archetypeTraits || [];
        const archetype = state.character.archetype;
        
        // Get traits specific to this archetype
        const archetypeTraits = traits.filter(trait => 
            trait.archetypeId === archetype.id
        );

        return `
            <div class="traits-section">
                <div class="section-header">
                    <h3>Archetype Traits</h3>
                    <p>Inherent traits that come with your archetype. These are automatically applied.</p>
                </div>
                
                <div class="trait-grid">
                    ${archetypeTraits.map(trait => `
                        <div class="trait-card ${trait.isActive ? 'active' : ''}">
                            <div class="trait-header">
                                <h4>${trait.name}</h4>
                                ${trait.isActive ? '<span class="active-badge">Active</span>' : ''}
                            </div>
                            <p class="trait-description">${trait.description}</p>
                            ${this.renderTraitEffects(trait.effects)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderArchetypeUpgrades() {
        const state = this.stateManager.getState();
        const upgrades = state.entities.archetypeUpgrades || [];
        const archetype = state.character.archetype;
        
        // Get upgrades for this archetype
        const archetypeUpgrades = upgrades.filter(upgrade => 
            upgrade.archetypeId === archetype.id
        );

        return `
            <div class="upgrades-section">
                <div class="section-header">
                    <h3>Archetype Upgrades</h3>
                    <p>Advanced upgrades that enhance your archetype's capabilities.</p>
                </div>
                
                <div class="purchase-grid">
                    ${archetypeUpgrades.map(upgrade => {
                        const card = new PurchaseCard(upgrade, 'archetypeUpgrade', this.stateManager);
                        return card.render();
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderTraitEffects(effects) {
        if (!effects || effects.length === 0) return '';
        
        return `
            <div class="trait-effects">
                <strong>Effects:</strong>
                <ul>
                    ${effects.map(effect => `<li>${effect}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderNoArchetype() {
        return `
            <div class="no-archetype">
                <div class="empty-state">
                    <h3>No Archetype Selected</h3>
                    <p>Please select an archetype from the dropdown above to view its details and available options.</p>
                </div>
            </div>
        `;
    }

    formatStatName(stat) {
        const statNames = {
            vit: 'Vitality',
            str: 'Strength',
            dex: 'Dexterity',
            int: 'Intelligence',
            fth: 'Faith',
            lck: 'Luck',
            hp: 'Health',
            mp: 'Mana',
            sta: 'Stamina'
        };
        return statNames[stat] || stat.charAt(0).toUpperCase() + stat.slice(1);
    }

    setupEventDelegation() {
        // Remove existing listener
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            // Handle purchase buttons
            if (e.target.classList.contains('purchase-btn')) {
                e.preventDefault();
                const action = e.target.dataset.action;
                const entityId = e.target.dataset.entityId;
                const entityType = e.target.dataset.entityType;
                
                if (action === 'purchase') {
                    this.handlePurchase(entityId, entityType);
                } else if (action === 'remove') {
                    this.handleRemove(entityId, entityType);
                }
            }
        };

        this.container.addEventListener('click', this.clickHandler);

        // Handle archetype selection
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'archetype-select') {
                this.handleArchetypeChange(e.target.value);
            }
        });
    }

    setupSectionTabs() {
        const tabs = this.container.querySelectorAll('.section-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section && section !== this.currentSection) {
                    this.currentSection = section;
                    this.updateSection();
                }
            });
        });
    }

    handleArchetypeChange(archetypeId) {
        if (!archetypeId) {
            this.stateManager.dispatch({
                type: 'UPDATE_CHARACTER',
                payload: { archetype: null }
            });
        } else {
            const state = this.stateManager.getState();
            const archetype = state.entities.archetypes.find(a => a.id === archetypeId);
            
            if (archetype) {
                this.stateManager.dispatch({
                    type: 'UPDATE_CHARACTER',
                    payload: { archetype: archetype }
                });
            }
        }
        
        this.render();
    }

    handlePurchase(entityId, entityType) {
        this.stateManager.dispatch({
            type: 'PURCHASE_ENTITY',
            payload: { entityId, entityType }
        });
    }

    handleRemove(entityId, entityType) {
        const purchase = this.stateManager.getPurchaseForEntity(entityId, entityType);
        if (purchase) {
            this.stateManager.dispatch({
                type: 'REMOVE_ENTITY',
                payload: { purchaseId: purchase.id, entityType }
            });
        }
    }

    updateSection() {
        // Update active tab
        const tabs = this.container.querySelectorAll('.section-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === this.currentSection);
        });

        // Update section content
        const contentDiv = this.container.querySelector('.section-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderSectionContent();
        }
    }

    updateDisplay() {
        // Update any dynamic content that needs refreshing
        const contentDiv = this.container.querySelector('.section-content');
        if (contentDiv && (this.currentSection === 'abilities' || 
                          this.currentSection === 'specialAttacks' || 
                          this.currentSection === 'upgrades')) {
            contentDiv.innerHTML = this.renderSectionContent();
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