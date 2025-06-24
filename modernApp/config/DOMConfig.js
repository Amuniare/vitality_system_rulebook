// modernApp/config/DOMConfig.js

/**
 * Centralized DOM element configuration
 * Single source of truth for all DOM references in the application
 */
export const DOMConfig = {
    // Main application structure
    app: {
        root: {
            selector: '#app',
            name: 'Application Root',
            required: true
        },
        header: {
            selector: '.app-header',
            name: 'Application Header',
            required: true
        },
        main: {
            selector: '.app-main',
            name: 'Main Content Area',
            required: true
        }
    },

    // Navigation elements
    navigation: {
        tabContainer: {
            selector: '#tab-navigation',
            name: 'Tab Navigation Container',
            required: true,
            parent: '.app-main',
            className: 'tab-navigation'
        },
        tabButtons: {
            selector: '.tab-btn',
            name: 'Tab Buttons',
            required: false,
            multiple: true
        }
    },

    // Character management
    character: {
        header: {
            selector: '#character-header',
            name: 'Character Header',
            required: true,
            parent: '.app-header',
            className: 'character-header'
        },
        listPanel: {
            selector: '.character-manager-panel',
            name: 'Character Manager Panel',
            required: true
        },
        listContainer: {
            selector: '#character-list',
            name: 'Character List Container',
            required: true,
            parent: '.character-manager-panel',
            className: 'character-list-wrapper'
        },
        listControls: {
            selector: '#character-list-controls',
            name: 'Character List Controls',
            required: true,
            parent: '.character-manager-panel'
        },
        listContent: {
            selector: '#character-list-content',
            name: 'Character List Content',
            required: true,
            parent: '.character-manager-panel'
        }
    },

    // Content areas
    content: {
        tabContent: {
            selector: '#tab-content',
            name: 'Tab Content Container',
            required: true,
            parent: '.tab-container'
        },
        summaryPanel: {
            selector: '.character-summary',
            name: 'Character Summary Panel',
            required: true
        },
        summaryContent: {
            selector: '#summary-content',
            name: 'Summary Content Container',
            required: true,
            parent: '.character-summary'
        }
    },

    // Tab-specific content containers
    tabs: {
        basicInfoContent: {
            selector: '#basic-info-content',
            name: 'Basic Info Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        archetypesContent: {
            selector: '#archetypes-content',
            name: 'Archetypes Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        attributesContent: {
            selector: '#attributes-content',
            name: 'Attributes Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        mainPoolContent: {
            selector: '#main-pool-content',
            name: 'Main Pool Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        secondaryPoolContent: {
            selector: '#secondary-pool-content',
            name: 'Secondary Pool Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        advantagesContent: {
            selector: '#advantages-content',
            name: 'Advantages Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        disadvantagesContent: {
            selector: '#disadvantages-content',
            name: 'Disadvantages Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        identityContent: {
            selector: '#identity-content',
            name: 'Identity Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        },
        summaryTabContent: {
            selector: '#summary-tab-content',
            name: 'Summary Tab Content',
            required: true,
            parent: '#tab-content',
            className: 'tab-content-panel',
            style: 'display: none;'
        }
    },

    // UI components
    components: {
        notifications: {
            selector: '#notifications',
            name: 'Notifications Container',
            required: true,
            parent: '.app-header',
            className: 'notification-container'
        },
        modals: {
            selector: '#modal-container',
            name: 'Modal Container',
            required: false,
            parent: 'body',
            className: 'modal-container'
        }
    },

    // Utility method to get all configurations flat
    getAllConfigs() {
        const configs = [];
        const processObject = (obj, prefix = '') => {
            Object.entries(obj).forEach(([key, value]) => {
                if (typeof value === 'object' && !value.selector) {
                    processObject(value, `${prefix}${key}.`);
                } else if (value.selector) {
                    configs.push({
                        key: `${prefix}${key}`,
                        ...value
                    });
                }
            });
        };
        
        processObject(this);
        return configs.filter(config => config.key !== 'getAllConfigs');
    }
};

// Helper function to get element using config key
export function getElement(configPath) {
    console.debug(`[DOMConfig] Looking up element for path: ${configPath}`);
    const keys = configPath.split('.');
    let config = DOMConfig;
    
    for (const key of keys) {
        config = config[key];
        if (!config) {
            console.error(`[DOMConfig] Invalid DOM config path: ${configPath}`);
            return null;
        }
    }
    
    console.debug(`[DOMConfig] Found config for ${configPath}:`, config);
    const element = document.querySelector(config.selector);
    console.debug(`[DOMConfig] Element found for selector ${config.selector}:`, element);
    return element;
}

// Helper to get multiple elements
export function getElements(configPath) {
    const keys = configPath.split('.');
    let config = DOMConfig;
    
    for (const key of keys) {
        config = config[key];
        if (!config) {
            console.error(`Invalid DOM config path: ${configPath}`);
            return [];
        }
    }
    
    return document.querySelectorAll(config.selector);
}