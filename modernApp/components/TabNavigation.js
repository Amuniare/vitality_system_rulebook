
// modernApp/components/TabNavigation.js
import { Component } from '../core/Component.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';

/**
 * Universal TabNavigation component following the architecture pattern
 * Manages tab navigation UI with support for disabled tabs and dynamic configuration
 */
export class TabNavigation extends Component {
    static propSchema = {
        tabs: { type: 'array', required: true },
        activeTab: { type: 'string', default: null },
        orientation: { type: 'string', default: 'horizontal' }, // horizontal, vertical
        allowKeyboardNavigation: { type: 'boolean', default: true },
        showBadges: { type: 'boolean', default: true },
        showIcons: { type: 'boolean', default: true }
    };

    constructor(props = {}, container = null) {
        super(props, container);
        
        this.currentTabId = this.props.activeTab;
        this.tabElements = [];
        
        Logger.debug(`[TabNavigation] Created with ID ${this.componentId}`);
    }

    async onInit() {
        this.render();
        this.attachEventListeners();
        
        // Listen for external tab changes
        this.subscribe('TAB_CHANGED', (data) => {
            this.setActiveTab(data.currentTab);
        });
        
        // Set initial active tab
        if (this.props.activeTab) {
            this.setActiveTab(this.props.activeTab);
        }
        
        Logger.info(`[TabNavigation] Initialized ${this.componentId} with ${this.props.tabs.length} tabs`);
    }

    render() {
        if (!this.container) {
            Logger.warn(`[TabNavigation] No container provided for ${this.componentId}`);
            return;
        }

        const tabsHtml = this.props.tabs.map(tab => this.renderTab(tab)).join('');
        
        this.container.innerHTML = `
            <nav class="tab-navigation ${this.props.orientation}" role="tablist">
                ${tabsHtml}
            </nav>
        `;
        
        // Cache tab elements for performance
        this.tabElements = this.container.querySelectorAll('[data-tab]');
        
        this.performanceMetrics.renderCount++;
        Logger.debug(`[TabNavigation] Rendered ${this.componentId} with ${this.props.tabs.length} tabs`);
    }

    renderTab(tab) {
        const isActive = tab.id === this.currentTabId;
        const isDisabled = tab.disabled || false;
        
        let classes = ['tab-btn'];
        if (isActive) classes.push('active');
        if (isDisabled) classes.push('disabled');
        if (tab.className) classes.push(tab.className);
        
        const attributes = [
            `data-tab="${tab.id}"`,
            `role="tab"`,
            `aria-selected="${isActive}"`,
            `aria-controls="${tab.id}-content"`,
            `tabindex="${isActive ? '0' : '-1'}"`
        ];
        
        if (isDisabled) {
            attributes.push('disabled');
        }
        
        return `
            <button class="${classes.join(' ')}" ${attributes.join(' ')}>
                ${this.renderTabContent(tab)}
                ${this.renderTabBadge(tab)}
            </button>
        `;
    }

    renderTabContent(tab) {
        const parts = [];
        
        if (this.props.showIcons && tab.icon) {
            parts.push(`<i class="tab-icon ${tab.icon}" aria-hidden="true"></i>`);
        }
        
        parts.push(`<span class="tab-label">${tab.label}</span>`);
        
        return parts.join(' ');
    }

    renderTabBadge(tab) {
        if (!this.props.showBadges || !tab.badge) return '';
        
        const badgeClass = tab.badgeClass || 'tab-badge';
        return `<span class="${badgeClass}" aria-label="Badge: ${tab.badge}">${tab.badge}</span>`;
    }

    attachEventListeners() {
        this.addEventListener(this.container, 'click', (e) => {
            const tabButton = e.target.closest('[data-tab]');
            if (!tabButton || tabButton.disabled) return;

            e.preventDefault();
            const tabId = tabButton.dataset.tab;
            
            if (tabId !== this.currentTabId) {
                this.handleTabClick(tabId);
            }
        });

        if (this.props.allowKeyboardNavigation) {
            this.addEventListener(this.container, 'keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });
        }
    }

    handleTabClick(tabId) {
        Logger.debug(`[TabNavigation] Tab "${tabId}" clicked`);
        
        // Emit tab switch request
        this.emitComponentEvent('tab-switch-requested', { 
            previousTab: this.currentTabId,
            newTab: tabId 
        });
        
        // Also emit legacy event for backward compatibility
        EventBus.emit('tab-selected', tabId);
    }

    handleKeyboardNavigation(e) {
        const currentIndex = this.props.tabs.findIndex(tab => tab.id === this.currentTabId);
        if (currentIndex === -1) return;
        
        let newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIndex = this.findPreviousEnabledTab(currentIndex);
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIndex = this.findNextEnabledTab(currentIndex);
                break;
            case 'Home':
                e.preventDefault();
                newIndex = this.findFirstEnabledTab();
                break;
            case 'End':
                e.preventDefault();
                newIndex = this.findLastEnabledTab();
                break;
            default:
                return;
        }
        
        if (newIndex !== currentIndex && newIndex !== -1) {
            const newTabId = this.props.tabs[newIndex].id;
            this.handleTabClick(newTabId);
        }
    }

    findNextEnabledTab(fromIndex) {
        for (let i = fromIndex + 1; i < this.props.tabs.length; i++) {
            if (!this.props.tabs[i].disabled) return i;
        }
        // Wrap around
        for (let i = 0; i < fromIndex; i++) {
            if (!this.props.tabs[i].disabled) return i;
        }
        return fromIndex;
    }

    findPreviousEnabledTab(fromIndex) {
        for (let i = fromIndex - 1; i >= 0; i--) {
            if (!this.props.tabs[i].disabled) return i;
        }
        // Wrap around
        for (let i = this.props.tabs.length - 1; i > fromIndex; i--) {
            if (!this.props.tabs[i].disabled) return i;
        }
        return fromIndex;
    }

    findFirstEnabledTab() {
        return this.props.tabs.findIndex(tab => !tab.disabled);
    }

    findLastEnabledTab() {
        for (let i = this.props.tabs.length - 1; i >= 0; i--) {
            if (!this.props.tabs[i].disabled) return i;
        }
        return -1;
    }

    /**
     * Updates the visual state of the tabs to show which one is active.
     * This should be called by the main application logic after a tab has been successfully switched.
     * @param {string} tabId - The ID of the tab to mark as active.
     */
    setActiveTab(tabId) {
        if (!tabId) {
            Logger.warn(`[TabNavigation] setActiveTab called with null or undefined tabId for ${this.componentId}`);
            return;
        }

        const previousTab = this.currentTabId;
        this.currentTabId = tabId;
        
        // Update visual state of all tabs
        this.tabElements.forEach(tabElement => {
            const isActive = tabElement.dataset.tab === tabId;
            tabElement.classList.toggle('active', isActive);
            tabElement.setAttribute('aria-selected', isActive.toString());
            tabElement.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        
        // Update internal props
        this.updateProps({ activeTab: tabId });
        
        Logger.debug(`[TabNavigation] Active tab changed from "${previousTab}" to "${tabId}" in ${this.componentId}`);
        
        // Emit state change event
        this.emitComponentEvent('tab-activated', { 
            previousTab, 
            currentTab: tabId,
            componentId: this.componentId 
        });
    }

    /**
     * Get the currently active tab ID
     */
    getActiveTab() {
        return this.currentTabId;
    }

    /**
     * Check if a tab is enabled
     */
    isTabEnabled(tabId) {
        const tab = this.props.tabs.find(t => t.id === tabId);
        return tab && !tab.disabled;
    }

    /**
     * Enable or disable a tab
     */
    setTabEnabled(tabId, enabled = true) {
        const tabIndex = this.props.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        this.props.tabs[tabIndex].disabled = !enabled;
        
        // Re-render to reflect the change
        this.render();
        
        Logger.debug(`[TabNavigation] Tab "${tabId}" ${enabled ? 'enabled' : 'disabled'} in ${this.componentId}`);
    }

    /**
     * Update tab badge
     */
    setTabBadge(tabId, badge) {
        const tabIndex = this.props.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        this.props.tabs[tabIndex].badge = badge;
        
        // Re-render to reflect the change
        this.render();
        
        Logger.debug(`[TabNavigation] Tab "${tabId}" badge set to "${badge}" in ${this.componentId}`);
    }

    /**
     * Legacy support methods for backward compatibility
     */
    init() {
        // This component initializes in constructor via super.init()
        Logger.debug(`[TabNavigation] Legacy init() called for ${this.componentId}`);
    }
}
