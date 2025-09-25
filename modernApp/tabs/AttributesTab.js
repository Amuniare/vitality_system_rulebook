// modernApp/tabs/AttributesTab.js
import { Component } from '../core/Component.js';
import { connectToState } from '../core/StateConnector.js';
import { StateManager } from '../core/StateManager.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { PointPoolDisplay } from '../components/PointPoolDisplay.js';
import { Logger } from '../utils/Logger.js';

class AttributesTab extends Component {
    static propSchema = {
        character: { type: 'object', default: () => ({}) },
        pools: { type: 'object', default: () => ({}) }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        
        // Store attribute values locally during interaction
        this.state = {
            localAttributes: {
                combat: { power: 0, endurance: 0, mobility: 0, focus: 0 },
                utility: { awareness: 0, communication: 0, intelligence: 0 }
            },
            pendingUpdates: new Set(),
            validationErrors: {}
        };

        this.attributeDefinitions = {
            combat: [
                { id: 'power', name: 'Power', description: 'Physical strength and damage' },
                { id: 'endurance', name: 'Endurance', description: 'Health and stamina' },
                { id: 'mobility', name: 'Mobility', description: 'Speed and agility' },
                { id: 'focus', name: 'Focus', description: 'Mental clarity and precision' }
            ],
            utility: [
                { id: 'awareness', name: 'Awareness', description: 'Perception and intuition' },
                { id: 'communication', name: 'Communication', description: 'Social skills and influence' },
                { id: 'intelligence', name: 'Intelligence', description: 'Knowledge and reasoning' }
            ]
        };

        this.poolDisplays = { combat: null, utility: null };
    }

    init() {
        this.componentId = `attributes-tab-${Date.now()}`;
        
        // Load initial attribute values
        this.loadCharacterAttributes();
        
        // Implement proper event delegation for +/- buttons
        this._addEventListener(this.container, 'click', this.handleContainerClick.bind(this));
        this._addEventListener(this.container, 'input', this.handleInputChange.bind(this));
        
        Logger.info('[AttributesTab] Initialized with proper event delegation');
    }

    loadCharacterAttributes() {
        const { character } = this.props;
        if (character) {
            const combatAttrs = character.combatAttributes || {};
            const utilityAttrs = character.utilityAttributes || {};
            
            this.setState({
                localAttributes: {
                    combat: {
                        power: combatAttrs.power || 0,
                        endurance: combatAttrs.endurance || 0,
                        mobility: combatAttrs.mobility || 0,
                        focus: combatAttrs.focus || 0
                    },
                    utility: {
                        awareness: utilityAttrs.awareness || 0,
                        communication: utilityAttrs.communication || 0,
                        intelligence: utilityAttrs.intelligence || 0
                    }
                }
            });
        }
    }

    // Implement proper event delegation for +/- buttons
    handleContainerClick(e) {
        const btn = e.target.closest('.attribute-btn');
        if (!btn) return;

        const attributeId = btn.dataset.attribute;
        const poolType = btn.dataset.poolType;
        const action = btn.dataset.action;

        if (attributeId && poolType && action) {
            this.handleAttributeChange(poolType, attributeId, action);
        }
    }

    handleInputChange(e) {
        const input = e.target.closest('.attribute-input');
        if (!input) return;

        const attributeId = input.dataset.attribute;
        const poolType = input.dataset.poolType;
        const value = parseInt(input.value) || 0;

        if (attributeId && poolType) {
            this.handleDirectAttributeChange(poolType, attributeId, value);
        }
    }

    handleAttributeChange(poolType, attributeId, action) {
        const currentValue = this.state.localAttributes[poolType][attributeId];
        let newValue = currentValue;

        if (action === 'increase') {
            newValue = Math.min(currentValue + 1, 10); // Max tier + archetype bonus
        } else if (action === 'decrease') {
            newValue = Math.max(currentValue - 1, 0);
        }

        this.updateLocalAttribute(poolType, attributeId, newValue);
    }

    handleDirectAttributeChange(poolType, attributeId, value) {
        // Add proper input validation
        const validatedValue = this.validateAttributeValue(value, poolType);
        this.updateLocalAttribute(poolType, attributeId, validatedValue);
    }

    // Add proper input validation
    validateAttributeValue(value, poolType) {
        const { character } = this.props;
        const tier = character.tier || 1;
        const maxValue = tier + 6; // Base tier + max archetype bonus
        
        if (value < 0) return 0;
        if (value > maxValue) return maxValue;
        return value;
    }

    updateLocalAttribute(poolType, attributeId, newValue) {
        const newLocalAttributes = { ...this.state.localAttributes };
        newLocalAttributes[poolType] = { ...newLocalAttributes[poolType] };
        newLocalAttributes[poolType][attributeId] = newValue;

        this.setState({
            localAttributes: newLocalAttributes,
            pendingUpdates: new Set([...this.state.pendingUpdates, `${poolType}.${attributeId}`])
        });

        // Implement debounced saves - batch updates to state
        this.debouncedSave = this.debouncedSave || this.debounce(() => {
            this.saveAttributesToState();
        }, 500);

        this.debouncedSave();
    }



    saveAttributesToState() {
        const updates = Array.from(this.state.pendingUpdates);
        if (updates.length > 0) {
            // FIXED: Use updateState instead of dispatch
            StateManager.updateState({
                combatAttributes: this.state.localAttributes.combat,
                utilityAttributes: this.state.localAttributes.utility
            }, 'Update attributes');
            
            this.setState({ pendingUpdates: new Set() });
            Logger.debug('[AttributesTab] Saved attribute changes to state');
        }
    }

    // Helper method for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    onRender() {
        if (!this.container) return;

        const { character, pools } = this.props;
        const { localAttributes, pendingUpdates } = this.state;

        this.container.innerHTML = `
            <div class="tab-header">
                <h2>Attribute Allocation</h2>
                <p>Allocate your attribute points across combat and utility categories.</p>
            </div>

            <div class="attributes-container">
                ${this.renderAttributeSection('combat', 'Combat Attributes', localAttributes.combat, pools)}
                ${this.renderAttributeSection('utility', 'Utility Attributes', localAttributes.utility, pools)}
            </div>

            ${pendingUpdates.size > 0 ? '<div class="save-indicator">Changes pending save...</div>' : ''}
        `;

        // Initialize pool displays
        this.initializePoolDisplays();
    }

    renderAttributeSection(poolType, title, attributes, pools) {
        const poolInfo = pools[poolType] || {};
        const attributeDefs = this.attributeDefinitions[poolType];

        return `
            <div class="attribute-section section-content">
                <div class="section-header">
                    <h3>${title}</h3>
                    <div id="${poolType}-pool-display" class="pool-display-container"></div>
                </div>
                
                <div class="attributes-grid">
                    ${attributeDefs.map(attr => this.renderAttributeControl(poolType, attr, attributes[attr.id])).join('')}
                </div>
            </div>
        `;
    }

    renderAttributeControl(poolType, attributeDef, currentValue) {
        const { character } = this.props;
        const tier = character.tier || 1;
        const maxValue = tier + 6;

        return `
            <div class="attribute-control">
                <div class="attribute-header">
                    <label class="attribute-label">${attributeDef.name}</label>
                    <span class="attribute-description">${attributeDef.description}</span>
                </div>
                
                <div class="attribute-controls">
                    <button class="attribute-btn btn-decrease" 
                            data-pool-type="${poolType}" 
                            data-attribute="${attributeDef.id}" 
                            data-action="decrease"
                            ${currentValue <= 0 ? 'disabled' : ''}>-</button>
                    
                    <input type="number" 
                           class="attribute-input" 
                           data-pool-type="${poolType}" 
                           data-attribute="${attributeDef.id}"
                           value="${currentValue}" 
                           min="0" 
                           max="${maxValue}">
                    
                    <button class="attribute-btn btn-increase" 
                            data-pool-type="${poolType}" 
                            data-attribute="${attributeDef.id}" 
                            data-action="increase"
                            ${currentValue >= maxValue ? 'disabled' : ''}>+</button>
                </div>
                
                <div class="attribute-value">
                    <span class="current-value">${currentValue}</span>
                    <span class="max-value">/ ${maxValue}</span>
                </div>
            </div>
        `;
    }

    initializePoolDisplays() {
        const combatContainer = this.container?.querySelector('#combat-pool-display');
        const utilityContainer = this.container?.querySelector('#utility-pool-display');

        if (combatContainer && !this.poolDisplays.combat) {
            this.poolDisplays.combat = PointPoolDisplay.createCompactDisplay(combatContainer, {
                showCombatAttr: true,
                showUtilityAttr: false
            });
        }

        if (utilityContainer && !this.poolDisplays.utility) {
            this.poolDisplays.utility = PointPoolDisplay.createCompactDisplay(utilityContainer, {
                showCombatAttr: false,
                showUtilityAttr: true
            });
        }
    }

    // Override update to sync component state with props
    update(newProps) {
        super.update(newProps);
        
        // Sync local attributes when props change (but not if we have pending updates)
        if (newProps.character && this.state.pendingUpdates.size === 0) {
            const combatAttrs = newProps.character.combatAttributes || {};
            const utilityAttrs = newProps.character.utilityAttributes || {};
            
            this.setState({
                localAttributes: {
                    combat: {
                        power: combatAttrs.power || 0,
                        endurance: combatAttrs.endurance || 0,
                        mobility: combatAttrs.mobility || 0,
                        focus: combatAttrs.focus || 0
                    },
                    utility: {
                        awareness: utilityAttrs.awareness || 0,
                        communication: utilityAttrs.communication || 0,
                        intelligence: utilityAttrs.intelligence || 0
                    }
                }
            });
        }
    }

    destroy() {
        // Save any pending changes before cleanup
        if (this.state.pendingUpdates.size > 0) {
            this.saveAttributesToState();
        }

        // Clean up pool displays
        if (this.poolDisplays.combat) {
            this.poolDisplays.combat.destroy();
            this.poolDisplays.combat = null;
        }
        if (this.poolDisplays.utility) {
            this.poolDisplays.utility.destroy();
            this.poolDisplays.utility = null;
        }

        super.destroy();
    }
}

const mapStateToProps = (state) => ({
    character: state,
    pools: PoolCalculator.calculatePools(state)
});

const ConnectedAttributesTab = connectToState(mapStateToProps)(AttributesTab);
export { ConnectedAttributesTab as AttributesTab };