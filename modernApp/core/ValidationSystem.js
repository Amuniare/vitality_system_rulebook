// modernApp/core/ValidationSystem.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { NotificationSystem } from '../components/NotificationSystem.js';

/**
 * ValidationSystem - Provides advisory warnings without blocking actions
 * Implements the "Advisory Validation" principle from Architecture.md
 */
export class ValidationSystem {
    static instance = null;
    
    static getInstance() {
        if (!ValidationSystem.instance) {
            ValidationSystem.instance = new ValidationSystem();
        }
        return ValidationSystem.instance;
    }
    
    constructor() {
        if (ValidationSystem.instance) {
            return ValidationSystem.instance;
        }
        
        this.notifications = null;
        this.validationRules = new Map();
        this.warningThresholds = {
            mainPool: 0,        // Warn when over budget
            combatAttr: 0,      // Warn when over budget
            utilityAttr: 0,     // Warn when over budget
            archetypes: 7,      // Warn if not all selected
            attributes: {
                min: 8,         // Warn if any attribute below 8
                max: 20        // Warn if any attribute above 20
            }
        };
        
        Logger.info('[ValidationSystem] Instance created.');
    }
    
    init() {
        Logger.info('[ValidationSystem] Initializing...');
        
        this.notifications = NotificationSystem.getInstance();
        
        // Set up validation rules
        this.setupValidationRules();
        
        // Listen for events that need validation
        this.setupEventListeners();
        
        Logger.info('[ValidationSystem] Initialized.');
    }
    
    setupValidationRules() {
        // Main Pool validation
        this.validationRules.set('mainPool', () => {
            const pools = PoolCalculator.calculatePools();
            // CORRECTED: Use pools.mainUsed and pools.main (total available)
            const spent = pools.mainUsed;
            const available = pools.main; 
            
            if (spent > available) {
                const overage = spent - available;
                return {
                    valid: false,
                    warning: `Main Pool over budget by ${overage} points`,
                    severity: 'warning'
                };
            }
            
            return { valid: true };
        });
        
        // Combat Attributes validation
        this.validationRules.set('combatAttr', () => {
            const pools = PoolCalculator.calculatePools();
            // CORRECTED: Use pools.combatUsed and pools.combat (total available)
            const spent = pools.combatUsed;
            const available = pools.combat;
            
            if (spent > available) {
                const overage = spent - available;
                return {
                    valid: false,
                    warning: `Combat Attributes over budget by ${overage} points`,
                    severity: 'warning'
                };
            }
            
            return { valid: true };
        });
        
        // Utility Attributes validation
        this.validationRules.set('utilityAttr', () => {
            const pools = PoolCalculator.calculatePools();
            // CORRECTED: Use pools.utilityUsed and pools.utility (total available)
            const spent = pools.utilityUsed;
            const available = pools.utility;
            
            if (spent > available) {
                const overage = spent - available;
                return {
                    valid: false,
                    warning: `Utility Attributes over budget by ${overage} points`,
                    severity: 'warning'
                };
            }
            
            return { valid: true };
        });
        
        // Archetypes validation
        this.validationRules.set('archetypes', () => {
            const character = StateManager.getCharacter();
            const selectedCount = Object.keys(character.archetypes || {}).length;
            
            if (selectedCount < this.warningThresholds.archetypes) {
                return {
                    valid: false,
                    warning: `${this.warningThresholds.archetypes - selectedCount} archetype(s) not selected`,
                    severity: 'info'
                };
            }
            
            return { valid: true };
        });
        
        // Attributes validation
        this.validationRules.set('attributes', () => {
            const character = StateManager.getCharacter();
            const attributes = character.attributes || {};
            const warnings = [];
            
            Object.entries(attributes).forEach(([attr, value]) => {
                if (value < this.warningThresholds.attributes.min) {
                    warnings.push(`${attr} is below minimum (${value} < ${this.warningThresholds.attributes.min})`);
                } else if (value > this.warningThresholds.attributes.max) {
                    warnings.push(`${attr} exceeds maximum (${value} > ${this.warningThresholds.attributes.max})`);
                }
            });
            
            if (warnings.length > 0) {
                return {
                    valid: false,
                    warning: warnings.join(', '),
                    severity: 'info'
                };
            }
            
            return { valid: true };
        });
        
        // Character name validation
        this.validationRules.set('characterName', () => {
            const character = StateManager.getCharacter();
            
            if (!character.name || character.name.trim() === '' || character.name === 'New Character') {
                return {
                    valid: false,
                    warning: 'Character needs a proper name',
                    severity: 'info'
                };
            }
            
            return { valid: true };
        });
    }
    
    setupEventListeners() {
        // Validate on any purchase
        EventBus.on('ENTITY_PURCHASED', () => this.validateAll());
        EventBus.on('ENTITY_REMOVED', () => this.validateAll());
        
        // Validate on archetype changes
        EventBus.on('ARCHETYPE_CHANGED', () => this.validate('archetypes'));
        
        // Validate on attribute changes
        EventBus.on('ATTRIBUTE_CHANGED', () => {
            this.validate('attributes');
            this.validate('combatAttr');
            this.validate('utilityAttr');
        });
        
        // Validate on character changes
        EventBus.on('CHARACTER_CHANGED', () => this.validateAll());
        EventBus.on('CHARACTER_LOADED', () => this.validateAll());
        
        // Validate before export
        EventBus.on('BEFORE_EXPORT', (data) => {
            const results = this.validateForExport();
            data.validationResults = results;
        });
    }
    
    validate(ruleName) {
        if (!this.validationRules.has(ruleName)) {
            Logger.warn(`[ValidationSystem] Unknown validation rule: ${ruleName}`);
            return { valid: true };
        }
        
        const rule = this.validationRules.get(ruleName);
        const result = rule();
        
        if (!result.valid && result.warning) {
            this.showWarning(result.warning, result.severity);
        }
        
        return result;
    }
    
    validateAll() {
        const results = new Map();
        let hasWarnings = false;
        
        for (const [ruleName, rule] of this.validationRules) {
            const result = rule();
            results.set(ruleName, result);
            
            if (!result.valid) {
                hasWarnings = true;
            }
        }
        
        // Update UI with validation status
        this.updateValidationUI(results);
        
        return {
            valid: !hasWarnings,
            results: Array.from(results.entries())
        };
    }
    
    validateForExport() {
        const validation = this.validateAll();
        
        if (!validation.valid) {
            // Show consolidated warning for export
            const warnings = validation.results
                .filter(([_, result]) => !result.valid)
                .map(([_, result]) => result.warning);
            
            this.notifications.warning(
                'Character has validation warnings:\n' + warnings.join('\n'),
                5000
            );
        }
        
        return validation;
    }
    
    showWarning(message, severity = 'warning') {
        switch (severity) {
            case 'error':
                this.notifications.error(message);
                break;
            case 'warning':
                this.notifications.warning(message);
                break;
            case 'info':
                this.notifications.info(message);
                break;
            default:
                this.notifications.show(message);
        }
    }
    
    updateValidationUI(results) {
        // Update validation indicators in the UI
        const validationIndicator = document.getElementById('validation-status');
        if (!validationIndicator) return;
        
        const hasWarnings = Array.from(results.values()).some(r => !r.valid);
        
        if (hasWarnings) {
            validationIndicator.classList.add('has-warnings');
            validationIndicator.title = 'Character has validation warnings';
        } else {
            validationIndicator.classList.remove('has-warnings');
            validationIndicator.title = 'Character validation passed';
        }
        
        // Update individual validation indicators
        results.forEach((result, ruleName) => {
            const indicator = document.querySelector(`[data-validation="${ruleName}"]`);
            if (indicator) {
                indicator.classList.toggle('invalid', !result.valid);
                indicator.title = result.warning || '';
            }
        });
    }
    
    // Public methods for checking specific validations
    isMainPoolValid() {
        return this.validate('mainPool').valid;
    }
    
    isCombatAttrValid() {
        return this.validate('combatAttr').valid;
    }
    
    isUtilityAttrValid() {
        return this.validate('utilityAttr').valid;
    }
    
    areArchetypesComplete() {
        return this.validate('archetypes').valid;
    }
    
    areAttributesValid() {
        return this.validate('attributes').valid;
    }
    
    isCharacterComplete() {
        return this.validateAll().valid;
    }
}