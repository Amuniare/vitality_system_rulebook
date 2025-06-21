export class PoolCalculator {
    static calculateMainPool(character) {
        const result = {
            totalAvailable: 0,
            totalSpent: 0,
            remaining: 0,
            breakdown: {
                base: 0,
                flaws: 0,
                traits: 0,
                boons: 0,
                other: 0
            }
        };
        
        // Base points from tier
        const tierBonus = Math.max(0, (character.tier - 2) * 15);
        result.breakdown.base = tierBonus;
        result.totalAvailable = tierBonus;
        
        // Add points from flaws
        if (character.flaws) {
            character.flaws.forEach(flaw => {
                const flawCost = flaw.cost?.value || 0;
                if (flawCost < 0) {
                    // Negative cost = gives points
                    result.breakdown.flaws += Math.abs(flawCost);
                    result.totalAvailable += Math.abs(flawCost);
                }
            });
        }
        
        // Subtract points for traits
        if (character.traits) {
            character.traits.forEach(trait => {
                const traitCost = trait.cost?.value || trait.cost || 0;
                result.breakdown.traits += traitCost;
                result.totalSpent += traitCost;
            });
        }
        
        // Subtract points for boons
        if (character.boons) {
            character.boons.forEach(boon => {
                const boonCost = boon.cost?.value || boon.cost || 0;
                result.breakdown.boons += boonCost;
                result.totalSpent += boonCost;
            });
        }
        
        result.remaining = result.totalAvailable - result.totalSpent;
        
        return result;
    }
    
    static calculateUtilityPool(character) {
        const result = {
            totalAvailable: 0,
            totalSpent: 0,
            remaining: 0,
            breakdown: {}
        };
        
        // Base utility points
        result.totalAvailable = Math.max(0, 5 * (character.tier - 1));
        
        // Calculate spent points
        // TODO: Add utility purchases
        
        result.remaining = result.totalAvailable - result.totalSpent;
        
        return result;
    }
    
    static calculateSpecialAttackPool(character) {
        const result = {
            totalAvailable: 30,
            totalSpent: 0,
            remaining: 30,
            breakdown: {}
        };
        
        // TODO: Calculate special attack points
        
        return result;
    }
    
    static getPool(character, poolName) {
        switch (poolName) {
            case 'main':
                return this.calculateMainPool(character);
            case 'utility':
                return this.calculateUtilityPool(character);
            case 'special':
                return this.calculateSpecialAttackPool(character);
            default:
                return { totalAvailable: 0, totalSpent: 0, remaining: 0 };
        }
    }
}