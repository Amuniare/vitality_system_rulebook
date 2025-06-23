// modernApp/core/DOMVerifier.js
import { Logger } from '../utils/Logger.js';

/**
 * DOMVerifier - Ensures required DOM elements exist before initialization
 * Provides graceful fallbacks and detailed error reporting
 */
export class DOMVerifier {
    constructor() {
        this.requiredElements = new Map();
        this.optionalElements = new Map();
        this.verificationResults = {
            passed: false,
            missing: [],
            created: [],
            warnings: []
        };
    }

    /**
     * Register a required DOM element
     * @param {string} key - Unique identifier for the element
     * @param {Object} config - Element configuration
     * @param {string} config.selector - CSS selector or ID
     * @param {string} config.name - Human-readable name
     * @param {string} [config.parent] - Parent selector if element should be created
     * @param {string} [config.className] - Class to apply if creating element
     * @param {string} [config.tagName='div'] - Tag type if creating element
     */
    registerRequired(key, config) {
        this.requiredElements.set(key, {
            ...config,
            tagName: config.tagName || 'div',
            required: true
        });
    }

    /**
     * Register an optional DOM element
     */
    registerOptional(key, config) {
        this.optionalElements.set(key, {
            ...config,
            tagName: config.tagName || 'div',
            required: false
        });
    }

    /**
     * Verify all registered elements exist
     * @param {boolean} autoCreate - Whether to create missing required elements
     * @returns {Object} Verification results
     */
    verify(autoCreate = false) {
        this.verificationResults = {
            passed: true,
            missing: [],
            created: [],
            warnings: []
        };

        // Check required elements
        for (const [key, config] of this.requiredElements) {
            const element = document.querySelector(config.selector);
            
            if (!element) {
                if (autoCreate && config.parent) {
                    const created = this.createElement(key, config);
                    if (created) {
                        this.verificationResults.created.push({
                            key,
                            name: config.name,
                            selector: config.selector
                        });
                        Logger.warn(`[DOMVerifier] Created missing required element: ${config.name}`);
                    } else {
                        this.verificationResults.passed = false;
                        this.verificationResults.missing.push({
                            key,
                            name: config.name,
                            selector: config.selector,
                            parent: config.parent
                        });
                    }
                } else {
                    this.verificationResults.passed = false;
                    this.verificationResults.missing.push({
                        key,
                        name: config.name,
                        selector: config.selector
                    });
                }
            }
        }

        // Check optional elements
        for (const [key, config] of this.optionalElements) {
            const element = document.querySelector(config.selector);
            if (!element) {
                this.verificationResults.warnings.push({
                    key,
                    name: config.name,
                    selector: config.selector,
                    message: `Optional element not found: ${config.name}`
                });
            }
        }

        return this.verificationResults;
    }

    /**
     * Create a missing element
     */
    createElement(key, config) {
        const parent = document.querySelector(config.parent);
        if (!parent) {
            Logger.error(`[DOMVerifier] Cannot create element ${config.name}: parent ${config.parent} not found`);
            return null;
        }

        const element = document.createElement(config.tagName);
        
        // Set ID if selector is an ID selector
        if (config.selector.startsWith('#')) {
            element.id = config.selector.substring(1);
        }
        
        // Add classes
        if (config.className) {
            element.className = config.className;
        }
        
        // Add inline styles
        if (config.style) {
            element.setAttribute('style', config.style);
        }
        
        // Add data attribute for debugging
        element.setAttribute('data-auto-created', 'true');
        element.setAttribute('data-element-key', key);
        
        parent.appendChild(element);
        return element;
    }

    /**
     * Get verification report as formatted string
     */
    getReport() {
        const report = ['DOM Verification Report', '='.repeat(50)];
        
        if (this.verificationResults.passed) {
            report.push('✅ All required elements found');
        } else {
            report.push('❌ Verification failed');
        }

        if (this.verificationResults.missing.length > 0) {
            report.push('\nMissing Required Elements:');
            this.verificationResults.missing.forEach(item => {
                report.push(`  - ${item.name} (${item.selector})`);
                if (item.parent) {
                    report.push(`    Parent: ${item.parent}`);
                }
            });
        }

        if (this.verificationResults.created.length > 0) {
            report.push('\nAuto-Created Elements:');
            this.verificationResults.created.forEach(item => {
                report.push(`  - ${item.name} (${item.selector})`);
            });
        }

        if (this.verificationResults.warnings.length > 0) {
            report.push('\nWarnings:');
            this.verificationResults.warnings.forEach(item => {
                report.push(`  - ${item.message}`);
            });
        }

        return report.join('\n');
    }
}