// AttributeTab.js - Attribute assignment interface
import { AttributeSystem } from '../../systems/AttributeSystem.js';

export class AttributeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-attributes');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        const pools = this.builder.calculatePointPools();

        tabContent.innerHTML = `
            <div class="attributes-section">
                <h2>Assign Attributes</h2>
                <p class="section-description">
                    Allocate your attribute points across combat and utility attributes. 
                    Each attribute cannot exceed your tier (${character.tier}).
                </p>
                
                ${this.renderCombatAttributes(character, pools)}
                ${this.renderUtilityAttributes(character, pools)}
                ${this.renderAttributeRecommendations(character)}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Purchase abilities from your main pool.</p>
                    <button id="continue-to-mainpool" class="btn-primary">Continue to Main Pool →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderCombatAttributes(character, pools) {
        const available = pools.totalAvailable.combatAttributes || 0;
        const spent = pools.totalSpent.combatAttributes || 0;
        const remaining = available - spent;

        return `
            <div class="attribute-pool combat-attributes">
                <h3>Combat Attributes</h3>
                <div class="pool-status ${remaining < 0 ? 'over-budget' : remaining === 0 ? 'fully-used' : ''}">
                    Points: <span class="points-display">${spent}/${available}</span>
                    ${remaining < 0 ? '<span class="error"> (OVER BUDGET)</span>' : ''}
                </div>
                
                <div class="attribute-grid">
                    ${this.renderAttribute('focus', 'Focus', 'Accuracy, Initiative, Resolve', character)}
                    ${this.renderAttribute('mobility', 'Mobility', 'Movement, Initiative, Avoidance', character)}
                    ${this.renderAttribute('power', 'Power', 'Damage, Conditions, Stability', character)}
                    ${this.renderAttribute('endurance', 'Endurance', 'Vitality, Durability', character)}
                </div>
            </div>
        `;
    }

    renderUtilityAttributes(character, pools) {
        const available = pools.totalAvailable.utilityAttributes || 0;
        const spent = pools.totalSpent.utilityAttributes || 0;
        const remaining = available - spent;

        return `
            <div class="attribute-pool utility-attributes">
                <h3>Utility Attributes</h3>
                <div class="pool-status ${remaining < 0 ? 'over-budget' : remaining === 0 ? 'fully-used' : ''}">
                    Points: <span class="points-display">${spent}/${available}</span>
                    ${remaining < 0 ? '<span class="error"> (OVER BUDGET)</span>' : ''}
                </div>
                
                <div class="attribute-grid">
                    ${this.renderAttribute('awareness', 'Awareness', 'Notice things, Initiative', character)}
                    ${this.renderAttribute('communication', 'Communication', 'Social skills', character)}
                    ${this.renderAttribute('intelligence', 'Intelligence', 'Knowledge and reasoning', character)}
                </div>
            </div>
        `;
    }

    renderAttribute(attrId, name, description, character) {
        const value = character.attributes[attrId] || 0;
        const max = character.tier;

        return `
            <div class="attribute-item">
                <div class="attribute-header">
                    <label class="attribute-name">${name}</label>
                    <div class="attribute-controls">
                        <button class="attr-btn minus" data-attr="${attrId}" data-change="-1" ${value <= 0 ? 'disabled' : ''}>-</button>
                        <span class="attribute-value">${value}</span>
                        <button class="attr-btn plus" data-attr="${attrId}" data-change="1" ${value >= max ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <div class="attribute-description">${description}</div>
                <div class="attribute-limit">Max: ${max}</div>
                ${this.renderAttributeSlider(attrId, value, max)}
            </div>
        `;
    }

    renderAttributeSlider(attrId, value, max) {
        return `
            <div class="attribute-slider">
                <input type="range" 
                       id="slider-${attrId}" 
                       min="0" 
                       max="${max}" 
                       value="${value}"
                       data-attr="${attrId}">
                <div class="slider-ticks">
                    ${Array.from({length: max + 1}, (_, i) => `<span class="tick ${i <= value ? 'filled' : ''}">${i}</span>`).join('')}
                </div>
            </div>
        `;
    }

    renderAttributeRecommendations(character) {
        const recommendations = AttributeSystem.getAttributeRecommendations(character);
        
        if (recommendations.length === 0) return '';

        return `
            <div class="attribute-recommendations">
                <h4>Archetype Recommendations</h4>
                <ul>
                    ${recommendations.map(rec => `
                        <li><strong>${rec.attribute}:</strong> ${rec.reason}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    setupEventListeners() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Attribute buttons
        document.querySelectorAll('.attr-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const attr = btn.dataset.attr;
                const change = parseInt(btn.dataset.change);
                this.changeAttribute(attr, change);
            });
        });

        // Attribute sliders
        document.querySelectorAll('.attribute-slider input').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const attr = slider.dataset.attr;
                const newValue = parseInt(e.target.value);
                this.setAttributeValue(attr, newValue);
            });
        });

        // Continue button
        const continueBtn = document.getElementById('continue-to-mainpool');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('mainPool');
            });
        }
    }

    changeAttribute(attrId, change) {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const currentValue = character.attributes[attrId] || 0;
        const newValue = Math.max(0, Math.min(character.tier, currentValue + change));
        
        this.setAttributeValue(attrId, newValue);
    }

    setAttributeValue(attrId, newValue) {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Validate the change
        const validation = AttributeSystem.validateAttributeAssignment(character, attrId, newValue);
        
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors.join(', '), 'error');
            this.render(); // Reset display
            return;
        }

        // Apply the change
        character.attributes[attrId] = newValue;
        
        // Update display
        this.updateAttributeDisplay(attrId, newValue);
        this.builder.updateCharacter();
    }

    updateAttributeDisplay(attrId, newValue) {
        const character = this.builder.currentCharacter;
        
        // Update value display
        const valueElement = document.querySelector(`[data-attr="${attrId}"] + .attribute-value`);
        if (valueElement) {
            valueElement.textContent = newValue;
        }

        // Update slider
        const slider = document.getElementById(`slider-${attrId}`);
        if (slider) {
            slider.value = newValue;
        }

        // Update slider ticks
        const ticks = document.querySelectorAll(`#slider-${attrId} + .slider-ticks .tick`);
        ticks.forEach((tick, index) => {
            tick.classList.toggle('filled', index <= newValue);
        });

        // Update buttons
        const minusBtn = document.querySelector(`[data-attr="${attrId}"][data-change="-1"]`);
        const plusBtn = document.querySelector(`[data-attr="${attrId}"][data-change="1"]`);
        
        if (minusBtn) minusBtn.disabled = newValue <= 0;
        if (plusBtn) plusBtn.disabled = newValue >= character.tier;

        // Update pool displays
        this.updatePoolDisplays();
    }

    updatePoolDisplays() {
        const pools = this.builder.calculatePointPools();
        
        // Combat attributes
        const combatSpent = pools.totalSpent.combatAttributes || 0;
        const combatAvailable = pools.totalAvailable.combatAttributes || 0;
        const combatRemaining = combatAvailable - combatSpent;
        
        const combatDisplay = document.querySelector('.combat-attributes .points-display');
        if (combatDisplay) {
            combatDisplay.textContent = `${combatSpent}/${combatAvailable}`;
        }
        
        const combatStatus = document.querySelector('.combat-attributes .pool-status');
        if (combatStatus) {
            combatStatus.className = `pool-status ${combatRemaining < 0 ? 'over-budget' : combatRemaining === 0 ? 'fully-used' : ''}`;
        }

        // Utility attributes
        const utilitySpent = pools.totalSpent.utilityAttributes || 0;
        const utilityAvailable = pools.totalAvailable.utilityAttributes || 0;
        const utilityRemaining = utilityAvailable - utilitySpent;
        
        const utilityDisplay = document.querySelector('.utility-attributes .points-display');
        if (utilityDisplay) {
            utilityDisplay.textContent = `${utilitySpent}/${utilityAvailable}`;
        }
        
        const utilityStatus = document.querySelector('.utility-attributes .pool-status');
        if (utilityStatus) {
            utilityStatus.className = `pool-status ${utilityRemaining < 0 ? 'over-budget' : utilityRemaining === 0 ? 'fully-used' : ''}`;
        }
    }
}