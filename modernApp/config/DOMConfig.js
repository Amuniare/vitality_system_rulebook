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
    const keys = configPath.split('.');
    let config = DOMConfig;
    
    for (const key of keys) {
        config = config[key];
        if (!config) {
            console.error(`Invalid DOM config path: ${configPath}`);
            return null;
        }
    }
    
    return document.querySelector(config.selector);
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