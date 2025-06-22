// modernApp/components/PointPoolDisplay.js
import { Logger } from '../utils/Logger.js';
import { Formatters } from '../utils/Formatters.js';

/**
 * A component to display various character point pools.
 */
export class PointPoolDisplay {
    /**
     * @param {HTMLElement} container - The DOM element to render the display into.
     * @param {Array<Object>} poolConfigs - Configuration for which pools to display.
     *        Each object: { key: 'main', label: 'Main Pool', dataKeyTotal: 'main', dataKeyRemaining: 'mainRemaining' }
     */
    constructor(container, poolConfigs) {
        if (!container) {
            throw new Error('PointPoolDisplay requires a valid container element.');
        }
        if (!poolConfigs || poolConfigs.length === 0) {
            throw new Error('PointPoolDisplay requires poolConfigs.');
        }
        this.container = container;
        this.poolConfigs = poolConfigs; 
        Logger.info('[PointPoolDisplay] Initialized.');
    }

    /**
     * Renders the point pool display with the given pool data.
     * @param {Object} poolsData - An object containing pool values, e.g., 
     *                             { main: 30, mainRemaining: 10, combat: 8, combatRemaining: 8, ... }
     *                             Keys should match `totalKey` and `remainingKey` in poolConfigs.
     */
    render(poolsData) {
        if (!poolsData) {
            Logger.warn('[PointPoolDisplay] Render called with no poolsData.');
            this.container.innerHTML = '<p class="text-muted">Pool data not available.</p>';
            return;
        }

        let html = '<div class="point-pools-container">';
        this.poolConfigs.forEach(config => {
            const total = poolsData[config.totalKey] !== undefined ? poolsData[config.totalKey] : 'N/A';
            const remaining = poolsData[config.remainingKey] !== undefined ? poolsData[config.remainingKey] : 'N/A';
            
            const isOverBudget = typeof remaining === 'number' && remaining < 0;
            const displayClass = isOverBudget ? 'pool-value over-budget' : 'pool-value';
            const remainingDisplay = typeof remaining === 'number' ? Formatters.formatNumber(remaining) : remaining;
            const totalDisplay = typeof total === 'number' ? Formatters.formatNumber(total) : total;

            html += `
                <div class="pool-info-item" data-pool-key="${config.key}">
                    <span class="pool-label">${config.label}:</span>
                    <span class="${displayClass}">${remainingDisplay} / ${totalDisplay}</span>
                </div>
            `;
        });
        html += '</div>';
        this.container.innerHTML = html;
        Logger.debug('[PointPoolDisplay] Rendered pools:', poolsData);
    }
}

// REMOVED pointPoolDisplayStyles constant and the style injection logic.