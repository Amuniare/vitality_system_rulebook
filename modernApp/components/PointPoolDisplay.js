// modernApp/components/PointPoolDisplay.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';

/**
 * PointPoolDisplay - Reusable component for displaying point pools
 * Used across multiple tabs to show point totals and usage
 */
export class PointPoolDisplay {
    constructor(options = {}) {
        this.options = {
            showMainPool: true,
            showCombatAttr: true,
            showUtilityAttr: true,
            showValidation: true,
            compact: false,
            ...options
        };
        
        this.container = null;
        this.pools = null;
        
        // Bind methods
        this.handlePoolUpdate = this.handlePoolUpdate.bind(this);
    }
    
    init(container) {
        if (!container) {
            Logger.error('[PointPoolDisplay] Container element required');
            return;
        }
        
        this.container = container;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial render
        this.update();
        
        Logger.info('[PointPoolDisplay] Initialized');
    }
    
    setupEventListeners() {
        // Listen for any changes that affect pools
        EventBus.on('ENTITY_PURCHASED', this.handlePoolUpdate);
        EventBus.on('ENTITY_REMOVED', this.handlePoolUpdate);
        EventBus.on('ATTRIBUTE_CHANGED', this.handlePoolUpdate);
        EventBus.on('CHARACTER_CHANGED', this.handlePoolUpdate);
        EventBus.on('CHARACTER_LOADED', this.handlePoolUpdate);
    }
    
    handlePoolUpdate() {
        this.update();
    }
    
    update() {
        // Calculate current pools
        this.pools = PoolCalculator.calculatePools();
        
        // Render the display
        this.render();
    }
    
    render() {
        if (!this.container || !this.pools) {
            Logger.warn('[PointPoolDisplay] Render called but container or pools not available.');
            if (this.container) this.container.innerHTML = '<p>Pool data unavailable.</p>';
            return;
        }
        
        // Clear existing content
        this.container.innerHTML = '';
        
        // Add CSS class
        this.container.className = `point-pool-display ${this.options.compact ? 'compact' : ''}`;
        
        // Create pools container
        const poolsContainer = document.createElement('div');
        poolsContainer.className = 'pools-container';
        
        // Render each pool
        if (this.options.showMainPool && typeof this.pools.main !== 'undefined' && typeof this.pools.mainUsed !== 'undefined') {
            poolsContainer.appendChild(this.renderPool('Main Pool', { available: this.pools.main, spent: this.pools.mainUsed }, 'main-pool'));
        }
        
        if (this.options.showCombatAttr && typeof this.pools.combat !== 'undefined' && typeof this.pools.combatUsed !== 'undefined') {
            poolsContainer.appendChild(this.renderPool('Combat Attr', { available: this.pools.combat, spent: this.pools.combatUsed }, 'combat-attr'));
        }
        
        if (this.options.showUtilityAttr && typeof this.pools.utility !== 'undefined' && typeof this.pools.utilityUsed !== 'undefined') {
            poolsContainer.appendChild(this.renderPool('Utility Attr', { available: this.pools.utility, spent: this.pools.utilityUsed }, 'utility-attr'));
        }
        
        this.container.appendChild(poolsContainer);
        
        // Add validation indicator if enabled
        if (this.options.showValidation) {
            const validationIndicator = this.renderValidationIndicator();
            this.container.appendChild(validationIndicator);
        }
    }
    
    renderPool(name, pool, className) { // pool should now be an object like { available: X, spent: Y }
        const poolDiv = document.createElement('div');
        poolDiv.className = `pool ${className}`;

        // Guard against pool being undefined or not having expected properties
        if (!pool || typeof pool.available === 'undefined' || typeof pool.spent === 'undefined') {
            Logger.warn(`[PointPoolDisplay] Invalid pool data for ${name}:`, pool);
            poolDiv.innerHTML = `<span class="pool-name">${name}: Data Error</span>`;
            return poolDiv;
        }
        
        const remaining = pool.available - pool.spent;
        const isOverBudget = remaining < 0;
        
        if (this.options.compact) {
            // Compact format: "Main: 15/30"
            poolDiv.innerHTML = `
                <span class="pool-name">${name}:</span>
                <span class="pool-values ${isOverBudget ? 'over-budget' : ''}">
                    ${pool.spent}/${pool.available}
                </span>
            `;
        } else {
            // Full format with progress bar
            const percentage = pool.available > 0 
                ? Math.min(100, (pool.spent / pool.available) * 100)
                : 0;
            
            poolDiv.innerHTML = `
                <div class="pool-header">
                    <span class="pool-name">${name}</span>
                    <span class="pool-values ${isOverBudget ? 'over-budget' : ''}">
                        ${pool.spent} / ${pool.available}
                    </span>
                </div>
                <div class="pool-bar">
                    <div class="pool-bar-fill ${isOverBudget ? 'over-budget' : ''}" 
                         style="width: ${percentage}%"></div>
                </div>
                <div class="pool-remaining ${isOverBudget ? 'over-budget' : ''}">
                    ${isOverBudget ? 'Over by' : 'Remaining'}: ${Math.abs(remaining)}
                </div>
            `;
        }
        
        // Add data attributes for validation
        poolDiv.setAttribute('data-pool-type', className);
        poolDiv.setAttribute('data-validation', className.replace('-', ''));
        
        return poolDiv;
    }
    
    renderValidationIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'validation-status';
        indicator.className = 'validation-indicator';
        indicator.innerHTML = `
            <span class="validation-icon">⚠️</span>
            <span class="validation-text">Validation Status</span>
        `;
        
        return indicator;
    }
    
    cleanup() {
        // Remove event listeners
        EventBus.off('ENTITY_PURCHASED', this.handlePoolUpdate);
        EventBus.off('ENTITY_REMOVED', this.handlePoolUpdate);
        EventBus.off('ATTRIBUTE_CHANGED', this.handlePoolUpdate);
        EventBus.off('CHARACTER_CHANGED', this.handlePoolUpdate);
        EventBus.off('CHARACTER_LOADED', this.handlePoolUpdate);
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
    
    // Static factory methods for common configurations
    static createFullDisplay(container) {
        const display = new PointPoolDisplay({
            showMainPool: true,
            showCombatAttr: true,
            showUtilityAttr: true,
            showValidation: true,
            compact: false
        });
        display.init(container);
        return display;
    }
    
    static createCompactDisplay(container, options = {}) {
        const display = new PointPoolDisplay({
            showMainPool: true,
            showCombatAttr: true,
            showUtilityAttr: true,
            showValidation: false,
            compact: true,
            ...options
        });
        display.init(container);
        return display;
    }
    
    static createMainPoolOnly(container) {
        const display = new PointPoolDisplay({
            showMainPool: true,
            showCombatAttr: false,
            showUtilityAttr: false,
            showValidation: false,
            compact: true
        });
        display.init(container);
        return display;
    }
}