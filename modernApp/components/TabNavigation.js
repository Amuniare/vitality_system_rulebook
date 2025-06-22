
// modernApp/components/TabNavigation.js
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';

/**
 * Manages the main tab navigation UI component.
 * Handles user clicks and visual state changes.
 */
export class TabNavigation {
    /**
     * @param {HTMLElement} navElement - The <nav> element containing the tab buttons.
     * @param {string} initialTabId - The ID of the tab to be active on initialization.
     */
    constructor(navElement, initialTabId) {
        if (!navElement) {
            throw new Error('TabNavigation requires a valid navigation element.');
        }
        this.navElement = navElement;
        this.tabs = this.navElement.querySelectorAll('[data-tab]');
        this.currentTabId = initialTabId;

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.setActiveTab(this.currentTabId);
        Logger.info(`[TabNavigation] Initialized with active tab: "${this.currentTabId}".`);
    }

    attachEventListeners() {
        this.navElement.addEventListener('click', (e) => {
            const tabButton = e.target.closest('[data-tab]');
            if (!tabButton) return;

            e.preventDefault();
            const tabId = tabButton.dataset.tab;
            
            if (tabId !== this.currentTabId) {
                Logger.debug(`[TabNavigation] Tab "${tabId}" clicked.`);
                // Emit an event for the main app to handle the tab content switching.
                EventBus.emit('tab-selected', tabId);
                // The main app is responsible for calling setActiveTab after the switch.
            }
        });
    }

    /**
     * Updates the visual state of the tabs to show which one is active.
     * This should be called by the main application logic after a tab has been successfully switched.
     * @param {string} tabId - The ID of the tab to mark as active.
     */
    setActiveTab(tabId) {
        if (!tabId) {
            Logger.warn('[TabNavigation] setActiveTab called with null or undefined tabId.');
            return;
        }

        this.currentTabId = tabId;
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        Logger.info(`[TabNavigation] Active tab set to: "${tabId}".`);
    }
}
