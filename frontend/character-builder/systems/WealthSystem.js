// WealthSystem.js - Wealth levels and purchasing power
export class WealthSystem {
    // Get wealth level definitions
    static getWealthLevels() {
        return {
            poor: {
                id: 'poor',
                name: 'Poor',
                cost: -2,
                description: 'Living paycheck-to-paycheck, cramped housing, few luxuries',
                tiers: {
                    incidental: { max: 50, description: 'Bus fare, cheap meals, second-hand clothes', requirements: 'Effortless' },
                    standard: { max: 200, description: 'Low-end laptops, plane tickets nearby', requirements: '1 per session' },
                    unusual: { max: 1000, description: 'Used cars, custom gadgets, bribes', requirements: 'Planning, skill check, downtime' },
                    extreme: { max: 5000, description: 'Surveillance systems, stolen prototypes', requirements: 'Extensive planning, very difficult check' }
                }
            },
            comfortable: {
                id: 'comfortable',
                name: 'Comfortable',
                cost: 0,
                description: 'Stable finances, apartments/small homes with amenities',
                tiers: {
                    incidental: { max: 200, description: 'Meals, taxi rides, costume repairs', requirements: 'Effortless' },
                    standard: { max: 1000, description: 'Decent laptops, multi-day travel, smartphones', requirements: '1 per session' },
                    unusual: { max: 5000, description: 'Custom vehicles, specialized equipment', requirements: 'Planning, skill check, downtime' },
                    extreme: { max: 25000, description: 'Armored vehicles, high-tech gadgets', requirements: 'Extensive planning, very difficult check' }
                }
            },
            wellOff: {
                id: 'wellOff',
                name: 'Well-Off',
                cost: 2,
                description: 'High income, large homes/luxury apartments, private security',
                tiers: {
                    incidental: { max: 1000, description: 'Personal vehicles, high-quality meals', requirements: 'Effortless' },
                    standard: { max: 5000, description: 'High-quality laptops, international travel', requirements: '1 per session' },
                    unusual: { max: 25000, description: 'Advanced vehicles, surveillance drones', requirements: 'Planning, skill check, downtime' },
                    extreme: { max: 100000, description: 'Advanced prototypes, long-term lab use', requirements: 'Extensive planning, very difficult check' }
                }
            },
            wealthy: {
                id: 'wealthy',
                name: 'Wealthy',
                cost: 5,
                description: 'Immense wealth, mansions/penthouses, cutting-edge technology',
                requiresJustification: true,
                tiers: {
                    incidental: { max: 25000, description: 'Lavish dinners, top-tier gadget upgrades', requirements: 'Effortless' },
                    standard: { max: 100000, description: 'High-end vehicles, professional-grade labs', requirements: '1 per session' },
                    unusual: { max: 1000000, description: 'High-end medical facilities, prototype tech', requirements: 'Planning, skill check, downtime' },
                    extreme: { max: 'unlimited', description: 'Custom headquarters, advanced robotics, spacecraft', requirements: 'Extensive planning, very difficult check' }
                }
            }
        };
    }
    
    // Validate wealth level selection
    static validateWealthSelection(character, wealthId, justification = null) {
        const errors = [];
        const warnings = [];
        
        const wealth = this.getWealthLevels()[wealthId];
        if (!wealth) {
            errors.push(`Invalid wealth level: ${wealthId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if narrative justification required
        if (wealth.requiresJustification && (!justification || justification.trim().length < 10)) {
            errors.push('This wealth level requires narrative justification (minimum 10 characters)');
        }
        
        // Check campaign restrictions (would be set by GM)
        const campaignRestrictions = this.getCampaignWealthRestrictions();
        if (campaignRestrictions.forbidden && campaignRestrictions.forbidden.includes(wealthId)) {
            errors.push(`${wealth.name} wealth level is not available in this campaign`);
        }
        
        if (campaignRestrictions.requiresApproval && campaignRestrictions.requiresApproval.includes(wealthId)) {
            warnings.push(`${wealth.name} wealth level requires GM approval`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Set character wealth level
    static setCharacterWealth(character, wealthId, justification = null) {
        const validation = this.validateWealthSelection(character, wealthId, justification);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const wealth = this.getWealthLevels()[wealthId];
        
        character.wealth = {
            level: wealthId,
            name: wealth.name,
            cost: wealth.cost,
            justification: justification,
            setAt: new Date().toISOString()
        };
        
        return character;
    }
    
    // Calculate available points for wealth (could be from utility pool or separate)
    static calculateAvailableWealthPoints(character) {
        // This could be implemented as part of utility pool or separate system
        // For now, assume wealth comes from separate allocation
        return 10; // Base allocation for wealth choices
    }
    
    // Get campaign-specific wealth restrictions
    static getCampaignWealthRestrictions() {
        // This would be set by GM/campaign settings
        return {
            baseLevel: 'comfortable', // Default level
            forbidden: [], // Wealth levels not allowed
            requiresApproval: ['wealthy'], // Levels requiring GM approval
            costMultiplier: 1.0 // Adjust costs for campaign
        };
    }
    
    // Check what character can afford at their wealth level
    static canAfford(character, amount, tier = 'incidental') {
        if (!character.wealth) {
            return { canAfford: false, reason: 'No wealth level set' };
        }
        
        const wealthLevel = this.getWealthLevels()[character.wealth.level];
        if (!wealthLevel) {
            return { canAfford: false, reason: 'Invalid wealth level' };
        }
        
        const tierData = wealthLevel.tiers[tier];
        if (!tierData) {
            return { canAfford: false, reason: 'Invalid expense tier' };
        }
        
        if (tierData.max === 'unlimited' || amount <= tierData.max) {
            return {
                canAfford: true,
                requirements: tierData.requirements,
                description: tierData.description
            };
        }
        
        // Check if affordable at higher tier
        const tierOrder = ['incidental', 'standard', 'unusual', 'extreme'];
        const currentIndex = tierOrder.indexOf(tier);
        
        for (let i = currentIndex + 1; i < tierOrder.length; i++) {
            const higherTier = tierOrder[i];
            const higherTierData = wealthLevel.tiers[higherTier];
            
            if (higherTierData.max === 'unlimited' || amount <= higherTierData.max) {
                return {
                    canAfford: true,
                    suggestedTier: higherTier,
                    requirements: higherTierData.requirements,
                    description: higherTierData.description
                };
            }
        }
        
        return {
            canAfford: false,
            reason: `Amount ($${amount}) exceeds maximum for ${wealthLevel.name} level`,
            maxAmount: wealthLevel.tiers.extreme.max
        };
    }
    
    // Get purchase examples for wealth level
    static getPurchaseExamples(wealthId, tier = null) {
        const wealth = this.getWealthLevels()[wealthId];
        if (!wealth) return [];
        
        if (tier) {
            const tierData = wealth.tiers[tier];
            return tierData ? [tierData.description] : [];
        }
        
        return Object.entries(wealth.tiers).map(([tierName, tierData]) => ({
            tier: tierName,
            maxAmount: tierData.max,
            examples: tierData.description,
            requirements: tierData.requirements
        }));
    }
    
    // Generate wealth usage tracking
    static trackWealthUsage(character, amount, tier, description, success = true) {
        if (!character.wealthTracking) {
            character.wealthTracking = {
                thisSession: [],
                history: []
            };
        }
        
        const usage = {
            amount,
            tier,
            description,
            success,
            timestamp: new Date().toISOString(),
            session: 'current' // Would be set by session tracking
        };
        
        character.wealthTracking.thisSession.push(usage);
        
        return character;
    }
    
    // Check session usage limits
    static checkSessionUsage(character, tier) {
        if (!character.wealthTracking) return { canUse: true, used: 0, limit: null };
        
        const thisSession = character.wealthTracking.thisSession || [];
        const tierUsage = thisSession.filter(usage => usage.tier === tier && usage.success);
        
        const limits = {
            standard: 1, // 1 per session for standard tier
            unusual: null, // No hard limit, but requires checks
            extreme: null // No hard limit, but requires extensive planning
        };
        
        const limit = limits[tier];
        const used = tierUsage.length;
        
        return {
            canUse: !limit || used < limit,
            used,
            limit,
            usageHistory: tierUsage
        };
    }
    
    // Calculate total wealth investment cost
    static calculateWealthCost(character) {
        return character.wealth ? character.wealth.cost : 0;
    }
    
    // Get wealth summary for character sheet
    static getWealthSummary(character) {
        if (!character.wealth) {
            return {
                level: 'None',
                description: 'No wealth level selected',
                capabilities: {}
            };
        }
        
        const wealth = this.getWealthLevels()[character.wealth.level];
        const sessionUsage = this.checkSessionUsage(character, 'standard');
        
        return {
            level: wealth.name,
            description: wealth.description,
            cost: wealth.cost,
            justification: character.wealth.justification,
            capabilities: wealth.tiers,
            sessionUsage: {
                standardTierUsed: sessionUsage.used,
                standardTierLimit: sessionUsage.limit
            },
            totalTrackedExpenses: character.wealthTracking ? 
                character.wealthTracking.thisSession.length : 0
        };
    }
    
    // Reset session tracking (called at start of new session)
    static resetSessionTracking(character) {
        if (character.wealthTracking) {
            // Move current session to history
            if (character.wealthTracking.thisSession.length > 0) {
                character.wealthTracking.history.push({
                    session: new Date().toISOString(),
                    expenses: [...character.wealthTracking.thisSession]
                });
            }
            
            // Clear current session
            character.wealthTracking.thisSession = [];
            
            // Keep only last 10 sessions in history
            if (character.wealthTracking.history.length > 10) {
                character.wealthTracking.history = character.wealthTracking.history.slice(-10);
            }
        }
        
        return character;
    }
}