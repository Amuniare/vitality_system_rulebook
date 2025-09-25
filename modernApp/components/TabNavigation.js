
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
        this._listenersAttached = false; // Prevent duplicate listener attachment
        
        Logger.debug(`[TabNavigation] Created with ID ${this.componentId}`);
        Logger.debug(`[TabNavigation] Container:`, container);
        Logger.debug(`[TabNavigation] Props:`, props);
        Logger.debug(`[TabNavigation] Number of tabs:`, props.tabs?.length || 0);
    }

    async onInit() {
        // Content containers already exist in HTML - no need to create them
        // this.createTabContentContainers();
        
        // Event listeners will be attached in onMount() after DOM elements exist
        
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

    onRender() {
        Logger.debug(`[TabNavigation] Starting render for ${this.componentId}`);
        
        // ENHANCED DEBUGGING: Check props first
        Logger.debug(`[TabNavigation] Props at render start:`, this.props);
        Logger.debug(`[TabNavigation] Props.tabs at render start:`, this.props.tabs);
        Logger.debug(`[TabNavigation] Props.tabs type:`, typeof this.props.tabs);
        Logger.debug(`[TabNavigation] Props.tabs is Array:`, Array.isArray(this.props.tabs));
        Logger.debug(`[TabNavigation] Props.tabs length:`, this.props.tabs?.length);
        
        if (!this.props.tabs || !Array.isArray(this.props.tabs) || this.props.tabs.length === 0) {
            Logger.error(`[TabNavigation] CRITICAL: No tabs data available for rendering!`);
            Logger.error(`[TabNavigation] Props.tabs value:`, this.props.tabs);
            Logger.error(`[TabNavigation] Full props:`, this.props);
            
            // Provide fallback error display for user
            if (this.container) {
                const errorHtml = `
                    <div class="tab-navigation-error" style="padding: 10px; background: #ffebee; border: 1px solid #f44336; color: #c62828; border-radius: 4px; margin: 10px 0;">
                        <strong>⚠️ Tab Navigation Error:</strong> No tabs configured<br>
                        <small>Component ID: ${this.componentId}</small><br>
                        <small>Check browser console for details</small>
                    </div>
                `;
                this.container.innerHTML = errorHtml;
            }
            return;
        }
        
        if (!this.container) {
            Logger.error(`[TabNavigation] No container provided for ${this.componentId}`);
            return;
        }

        Logger.debug(`[TabNavigation] Container element:`, this.container);
        Logger.debug(`[TabNavigation] Container tagName:`, this.container.tagName);
        Logger.debug(`[TabNavigation] Container ID:`, this.container.id);

        // Generate HTML for each tab
        Logger.debug(`[TabNavigation] About to generate HTML for ${this.props.tabs.length} tabs`);
        const tabsHtml = this.props.tabs.map((tab, index) => {
            Logger.debug(`[TabNavigation] Rendering tab ${index}:`, tab);
            const html = this.renderTab(tab);
            Logger.debug(`[TabNavigation] Generated HTML for tab ${index}:`, html);
            return html;
        }).join('');
        
        Logger.debug(`[TabNavigation] Generated tabs HTML:`, tabsHtml);
        Logger.debug(`[TabNavigation] Generated tabs HTML length:`, tabsHtml.length);
        
        // Since the container is already a nav element, just add the tabs directly
        const finalHtml = tabsHtml;
        
        Logger.debug(`[TabNavigation] Final HTML to inject:`, finalHtml);
        this.container.innerHTML = finalHtml;
        
        // Add the required classes and attributes to the existing nav element
        this.container.classList.add('tab-navigation', this.props.orientation);
        this.container.setAttribute('role', 'tablist');
        
        // Cache tab elements for performance
        this.tabElements = this.container.querySelectorAll('[data-tab]');
        Logger.debug(`[TabNavigation] Found ${this.tabElements.length} tab elements after render`);
        Logger.debug(`[TabNavigation] Tab elements:`, Array.from(this.tabElements).map(el => ({
            id: el.id,
            dataTab: el.dataset.tab,
            textContent: el.textContent,
            classes: Array.from(el.classList)
        })));
        
        // DEBUG: Check currentTabId state
        Logger.info(`[TabNavigation] 🔍 currentTabId during render: "${this.currentTabId}"`);
        Logger.debug(`[TabNavigation] Active tab should be: ${this.currentTabId}`);
        
        // Now attach event listeners to the rendered DOM elements
        if (this.tabElements.length > 0) {
            Logger.info(`[TabNavigation] 🎯 ATTACHING EVENT LISTENERS to ${this.tabElements.length} rendered tab buttons`);
            
            // Add flag to prevent duplicate listener attachment
            if (!this._listenersAttached) {
                this.attachEventListeners();
                this._listenersAttached = true;
                Logger.info(`[TabNavigation] ✅ Event listeners successfully attached`);
            } else {
                Logger.debug(`[TabNavigation] Event listeners already attached, skipping`);
            }
        } else {
            Logger.error(`[TabNavigation] ❌ No tab elements found after render - cannot attach listeners`);
        }
        
        this.performanceMetrics.renderCount++;
        Logger.debug(`[TabNavigation] Rendered ${this.componentId} with ${this.props.tabs.length} tabs`);
        Logger.debug(`[TabNavigation] Container innerHTML after render:`, this.container.innerHTML);
        Logger.debug(`[TabNavigation] Container children count:`, this.container.children.length);
    }

    onMount() {
        Logger.debug(`[TabNavigation] Mounting ${this.componentId}`);
        // Event listeners will be attached in onRender() after DOM elements exist
        Logger.info(`[TabNavigation] Successfully mounted ${this.componentId}`);
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
        Logger.info(`[TabNavigation] 🎯 Attaching event listeners to container`);
        Logger.debug(`[TabNavigation] Container ID: ${this.container?.id}`);
        Logger.debug(`[TabNavigation] Available tab buttons: ${this.tabElements.length}`);
        
        // Global click listener for debugging (can be removed later)
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-tab]')) {
                Logger.info(`[TabNavigation] 🎯 GLOBAL: Document click detected on tab:`, e.target.closest('[data-tab]').dataset.tab);
            }
        }, { once: false, passive: true });
        
        this.addEventListener(this.container, 'click', (e) => {
            Logger.info(`[TabNavigation] 🎯 CLICK EVENT RECEIVED!`);
            Logger.debug(`[TabNavigation] Click target:`, e.target);
            Logger.debug(`[TabNavigation] Target tag:`, e.target.tagName);
            
            const tabButton = e.target.closest('[data-tab]');
            Logger.debug(`[TabNavigation] Found tab button:`, tabButton);
            
            if (!tabButton || tabButton.disabled) {
                Logger.debug(`[TabNavigation] Ignoring click - no tab button or disabled`);
                return;
            }

            e.preventDefault();
            const tabId = tabButton.dataset.tab;
            Logger.info(`[TabNavigation] 🎯 TAB CLICKED: ${tabId}`);
            
            if (tabId !== this.currentTabId) {
                Logger.info(`[TabNavigation] 🎯 SWITCHING TO TAB: ${tabId}`);
                this.handleTabClick(tabId);
            } else {
                Logger.debug(`[TabNavigation] Tab ${tabId} already active`);
            }
        });

        if (this.props.allowKeyboardNavigation) {
            this.addEventListener(this.container, 'keydown', (e) => {
                Logger.debug(`[TabNavigation] ENHANCED DEBUG: Keyboard event:`, e.key);
                this.handleKeyboardNavigation(e);
            });
        }
        
        Logger.debug(`[TabNavigation] ENHANCED DEBUG: Event listeners attached successfully`);
    }

    handleTabClick(tabId) {
        Logger.info(`[TabNavigation] 🎯 HANDLING TAB CLICK: ${tabId}`);
        Logger.debug(`[TabNavigation] Previous tab: ${this.currentTabId}`);
        
        // Emit tab switch request
        Logger.info(`[TabNavigation] 🎯 EMITTING tab-switch-requested event`);
        this.emitComponentEvent('tab-switch-requested', { 
            previousTab: this.currentTabId,
            newTab: tabId 
        });
        
        // Also emit legacy event for backward compatibility
        Logger.debug(`[TabNavigation] Emitting legacy tab-selected event via EventBus`);
        EventBus.emit('tab-selected', tabId);
        
        Logger.info(`[TabNavigation] 🎯 TAB CLICK HANDLING COMPLETE`);
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
        this._requestRender();
        
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
        this._requestRender();
        
        Logger.debug(`[TabNavigation] Tab "${tabId}" badge set to "${badge}" in ${this.componentId}`);
    }

    /**
     * Create content containers for each tab - implements self-contained architecture
     * This ensures components don't depend on external DOM setup
     * Uses Component base class utilities for consistent container creation
     */
    createTabContentContainers() {
        Logger.debug(`[TabNavigation] Creating content containers for ${this.props.tabs.length} tabs`);
        
        // Ensure main tab content container exists using Component utilities
        const tabContentContainer = this.ensureContainer('tab-content', {
            className: 'tab-content-container',
            parent: this.container.parentNode || document.querySelector('.app-main'),
            options: {
                insertBefore: this.container.nextSibling
            }
        });

        if (!tabContentContainer) {
            Logger.error(`[TabNavigation] Failed to create or find main tab content container`);
            return;
        }
        
        // Create individual tab content containers using Component utilities
        const containerConfigs = this.props.tabs.map(tab => ({
            id: `${tab.id}-content`,
            className: 'tab-content-panel',
            options: {
                style: { display: 'none' }, // Hidden by default
                attributes: {
                    'role': 'tabpanel',
                    'aria-labelledby': `tab-${tab.id}`
                }
            }
        }));

        const createdContainers = this.createMultipleContainers(containerConfigs, tabContentContainer);
        
        Logger.info(`[TabNavigation] Content container setup complete: ${createdContainers.size}/${this.props.tabs.length} containers ready`);
    }

    /**
     * Legacy support methods for backward compatibility
     */
    init() {
        // This component initializes in constructor via super.init()
        Logger.debug(`[TabNavigation] Legacy init() called for ${this.componentId}`);
    }
}
