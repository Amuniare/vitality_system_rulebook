// modernApp/tabs/AttributesTab.js
import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { PointPoolDisplay } from '../components/PointPoolDisplay.js';
import { AttributeControl } from '../components/AttributeControl.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';

export class AttributesTab {
    constructor(container) {
        this.container = container;
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
        
        this.poolDisplays = {
            combat: null,
            utility: null
        };
        
        this._boundHandleCharacterUpdate = this.handleCharacterUpdate.bind(this);
        this._boundHandleAttributeChange = this.handleAttributeChange.bind(this);
    }
    
    async init() {
        EventBus.on('CHARACTER_LOADED', this._boundHandleCharacterUpdate);
        EventBus.on('CHARACTER_CHANGED', this._boundHandleCharacterUpdate);
        Logger.info('[AttributesTab] Initialized.');
    }
    
    handleCharacterUpdate() {
        if (this.container && this.container.style.display !== 'none') {
            this.render();
        }
    }
    
    render() {
        if (!this.container) return;
        
        const character = StateManager.getCharacter();
        if (!character) {
            this.container.innerHTML = '<p>No character loaded.</p>';
            return;
        }
        
        // FIX 3 APPLIED HERE: Changed calculateAllPools(character) to calculatePools()
        const pools = PoolCalculator.calculatePools(); 
        // END OF FIX 3 APPLICATION
        const tier = character.tier || 1;
        
        this.container.innerHTML = `
            <div class="attributes-tab">
                <div class="tab-header">
                    <h2>Attribute Allocation</h2>
                    <p>Distribute your attribute points between combat and utility attributes.</p>
                </div>
                
                <div class="attributes-layout">
                    <div class="combat-attributes-section">
                        <h3>Combat Attributes</h3>
                        <div class="pool-display-container" id="combat-pool-display"></div>
                        <div class="attributes-grid">
                            ${this.renderAttributeControls('combat', character, pools.combatRemaining, tier)}
                        </div>
                    </div>
                    
                    <div class="utility-attributes-section">
                        <h3>Utility Attributes</h3>
                        <div class="pool-display-container" id="utility-pool-display"></div>
                        <div class="attributes-grid">
                            ${this.renderAttributeControls('utility', character, pools.utilityRemaining, tier)}
                        </div>
                    </div>
                </div>
                
                <div class="attributes-summary">
                    ${this.renderDerivedStats(character)}
                </div>
            </div>
        `;
        
        this.poolDisplays.combat = PointPoolDisplay.createCompactDisplay(
            this.container.querySelector('#combat-pool-display'),
            { showMainPool: false, showCombatAttr: true, showUtilityAttr: false }
        );
        
        this.poolDisplays.utility = PointPoolDisplay.createCompactDisplay(
            this.container.querySelector('#utility-pool-display'),
            { showMainPool: false, showCombatAttr: false, showUtilityAttr: true }
        );
        
        AttributeControl.attachHandlers(this.container, this._boundHandleAttributeChange);
    }
    
    renderAttributeControls(poolType, character, availablePointsInPool, tier) {
        const attributes = this.attributeDefinitions[poolType];
        const maxPerAttribute = tier * 3; 
        
        return attributes.map(attr => {
            const currentValue = character.attributes?.[attr.id] || 0;
            // Disable increase if no points left in pool AND current value is 0 or max
            // or if already at max for this attribute
            const canIncrease = currentValue < maxPerAttribute && availablePointsInPool > 0;
            
            return AttributeControl.render({
                attributeId: attr.id,
                label: attr.name,
                value: currentValue,
                min: 0,
                max: maxPerAttribute,
                pool: poolType,
                // Disable increase button if at max OR no points left in this specific pool
                // Decrease button is handled by its own logic (value > min)
                // This is a bit simplified, a more robust check might be needed in AttributeControl itself
                // based on points spent vs points available.
                // The 'disabled' here is a general hint.
                disabled: !canIncrease && currentValue === 0 // General disable if cannot afford first point
            });
        }).join('');
    }
    
    renderDerivedStats(character) {
        const hp = 50 + (character.attributes?.endurance || 0) * 10;
        const initiative = (character.attributes?.awareness || 0) + (character.tier || 0);
        const moveSpeed = 30 + (character.attributes?.mobility || 0) * 5;
        
        return `
            <div class="derived-stats">
                <h3>Derived Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Hit Points:</span>
                        <span class="stat-value">${hp}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Initiative:</span>
                        <span class="stat-value">+${initiative}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Move Speed:</span>
                        <span class="stat-value">${moveSpeed} ft</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    handleAttributeChange(attributeId, newValue, oldValue) {
        Logger.info(`[AttributesTab] Attribute ${attributeId} changed from ${oldValue} to ${newValue}`);
        
        const character = StateManager.getCharacter();
        const updatedAttributes = {
            ...character.attributes,
            [attributeId]: newValue
        };
        
        StateManager.dispatch('UPDATE_ATTRIBUTES', updatedAttributes);
    }
    
    cleanup() {
        EventBus.off('CHARACTER_LOADED', this._boundHandleCharacterUpdate);
        EventBus.off('CHARACTER_CHANGED', this._boundHandleCharacterUpdate);
        
        if (this.poolDisplays.combat) this.poolDisplays.combat.cleanup();
        if (this.poolDisplays.utility) this.poolDisplays.utility.cleanup();
        
        Logger.info('[AttributesTab] Cleanup called.');
    }
}