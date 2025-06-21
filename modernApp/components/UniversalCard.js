export class UniversalCard {
    static render(entity, context = {}) {
        const {
            character,
            selected = false,
            showCost = true,
            showDescription = true,
            compact = false,
            interactive = true,
            onSelect
        } = context;
        
        // Determine state
        const available = this.checkAvailability(entity, character);
        const affordable = this.checkAffordability(entity, character);
        
        // Build CSS classes
        const classes = [
            'universal-card',
            entity.type,
            entity.ui?.size || 'medium',
            selected ? 'selected' : '',
            !available ? 'disabled' : '',
            !affordable ? 'unaffordable' : '',
            compact ? 'compact' : '',
            interactive && available ? 'interactive' : ''
        ].filter(Boolean).join(' ');
        
        // Build data attributes
        const dataAttrs = [
            `data-entity-id="${entity.id}"`,
            `data-entity-type="${entity.type}"`,
            interactive ? `data-clickable="true"` : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${classes}" ${dataAttrs}>
                ${this.renderHeader(entity, { showCost, affordable })}
                ${showDescription ? this.renderDescription(entity) : ''}
                ${this.renderEffects(entity)}
                ${this.renderRequirements(entity, character)}
                ${this.renderStatus(entity, { selected, available })}
            </div>
        `;
    }
    
    static renderHeader(entity, options) {
        const { showCost, affordable } = options;
        
        return `
            <div class="card-header">
                <h4 class="card-title">${entity.name}</h4>
                ${showCost && entity.cost ? this.renderCost(entity.cost, affordable) : ''}
            </div>
        `;
    }
    
    static renderCost(cost, affordable = true) {
        if (!cost || cost.value === 0) {
            return '<span class="card-cost free">Free</span>';
        }
        
        const display = cost.display || `${cost.value}p`;
        const cssClass = affordable ? 'affordable' : 'unaffordable';
        
        return `<span class="card-cost ${cssClass}">${display}</span>`;
    }
    
    static renderDescription(entity) {
        if (!entity.description) return '';
        
        return `
            <div class="card-description">
                ${entity.description}
            </div>
        `;
    }
    
    static renderEffects(entity) {
        if (!entity.effects || entity.effects.length === 0) return '';
        
        const effectsHtml = entity.effects.map(effect => 
            this.renderEffect(effect)
        ).join('');
        
        return `
            <div class="card-effects">
                ${effectsHtml}
            </div>
        `;
    }
    
    static renderEffect(effect) {
        switch (effect.type) {
            case 'stat':
                return `<div class="effect stat-effect">${effect.target}: ${effect.value}</div>`;
            case 'conditional':
                return `<div class="effect conditional-effect">${effect.trigger}: ${effect.bonus}</div>`;
            default:
                return `<div class="effect">${effect.description || effect.type}</div>`;
        }
    }
    
    static renderRequirements(entity, character) {
        if (!entity.requirements || entity.requirements.length === 0) return '';
        
        const unmet = this.getUnmetRequirements(entity, character);
        if (unmet.length === 0) return '';
        
        return `
            <div class="card-requirements">
                <span class="requirement-label">Requires:</span>
                ${unmet.map(req => `<span class="requirement unmet">${req}</span>`).join('')}
            </div>
        `;
    }
    
    static renderStatus(entity, options) {
        const { selected, available } = options;
        
        if (selected) {
            return '<div class="card-status selected">✓ Selected</div>';
        }
        
        if (!available) {
            return '<div class="card-status unavailable">Unavailable</div>';
        }
        
        return '';
    }
    
    static checkAvailability(entity, character) {
        if (!entity.requirements) return true;
        
        // Check all requirements
        return entity.requirements.every(req => 
            this.checkRequirement(req, character)
        );
    }
    
    static checkAffordability(entity, character) {
        if (!entity.cost || entity.cost.value === 0) return true;
        if (!character || !character.pools) return false;
        
        const pool = character.pools[entity.cost.pool];
        if (!pool) return false;
        
        const costValue = typeof entity.cost.value === 'function' 
            ? entity.cost.value(character)
            : entity.cost.value;
            
        return pool.remaining >= costValue;
    }
    
    static checkRequirement(requirement, character) {
        // Simplified requirement checking
        switch (requirement.type) {
            case 'archetype':
                return character.archetypes[requirement.category] === requirement.value;
            case 'tier':
                return character.tier >= requirement.min;
            default:
                return true;
        }
    }
    
    static getUnmetRequirements(entity, character) {
        if (!entity.requirements) return [];
        
        return entity.requirements
            .filter(req => !this.checkRequirement(req, character))
            .map(req => req.display || req.type);
    }
}