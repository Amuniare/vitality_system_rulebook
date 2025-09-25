import { RenderUtils } from '../../../shared/utils/RenderUtils.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../../systems/UtilitySystem.js';

export class UtilityOverviewSection {
    constructor(builder) {
        this.builder = builder;
    }

    render(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0;
        const available = pools.totalAvailable.utilityPool || 0;
        const spent = pools.totalSpent.utilityPool || 0;
        
        return `
            <div class="utility-overview-box">
                <div class="utility-overview-header">
                    <h3>Utility Pool Overview</h3>
                    ${RenderUtils.renderPointDisplay(spent, available, 'Utility Pool', {
                        showRemaining: true,
                        variant: utilityPool < 0 ? 'error' : (utilityPool === 0 && spent > 0 ? 'warning' : 'default')
                    })}
                </div>
                
                ${this.renderUtilityCategoryBreakdown(character)}
                ${this.renderSelectedUtilities(character)}
            </div>
        `;
    }

    renderUtilityCategoryBreakdown(character) {
        const categories = [
            { key: 'expertise', label: 'Expertise', type: 'expertise' },
            { key: 'features', label: 'Features', type: 'simple' },
            { key: 'senses', label: 'Senses', type: 'simple' },
            { key: 'movement', label: 'Movement', type: 'simple' },
            { key: 'descriptors', label: 'Descriptors', type: 'simple' }
        ];

        const breakdown = categories.map(category => {
            let count = 0;
            let cost = 0;

            if (category.type === 'expertise') {
                const expertise = character.utilityPurchases.expertise || {};
                Object.values(expertise).forEach(levels => {
                    count += (levels.basic || []).length + (levels.mastered || []).length;
                    cost += (levels.basic || []).length * 2 + (levels.mastered || []).length * 4;
                });
            } else {
                const items = character.utilityPurchases[category.key] || [];
                count = items.length;
                cost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
            }

            return { ...category, count, cost };
        });

        const totalItems = breakdown.reduce((sum, cat) => sum + cat.count, 0);

        return `
            <div class="utility-breakdown">
                <h4>Category Breakdown (${totalItems} abilities)</h4>
                <div class="breakdown-grid">
                    ${breakdown.map(cat => `
                        <div class="breakdown-item">
                            <span class="breakdown-label">${cat.label}</span>
                            <span class="breakdown-count">${cat.count}</span>
                            <span class="breakdown-cost">${cat.cost}p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSelectedUtilities(character) {
        const allPurchases = [];

        allPurchases.push(...(character.utilityPurchases.features || []).map(item => ({...item, category: 'features', typeLabel: 'Feature'})));
        allPurchases.push(...(character.utilityPurchases.senses || []).map(item => ({...item, category: 'senses', typeLabel: 'Sense'})));
        allPurchases.push(...(character.utilityPurchases.movement || []).map(item => ({...item, category: 'movement', typeLabel: 'Movement'})));
        allPurchases.push(...(character.utilityPurchases.descriptors || []).map(item => ({...item, category: 'descriptors', typeLabel: 'Descriptor'})));

        Object.entries(character.utilityPurchases.expertise || {}).forEach(([attribute, levels]) => {
            (levels.basic || []).forEach(id => allPurchases.push({ id, name: id, cost: UtilitySystem.getExpertiseCost('activity', 'basic'), category: 'expertise', typeLabel: 'Expertise (Basic)', attribute, level: 'basic' }));
            (levels.mastered || []).forEach(id => allPurchases.push({ id, name: id, cost: UtilitySystem.getExpertiseCost('activity', 'mastered'), category: 'expertise', typeLabel: 'Expertise (Mastered)', attribute, level: 'mastered' }));
        });

        if (allPurchases.length === 0) {
            return `
                <div class="selected-utilities">
                    <h4>Selected Utilities</h4>
                    <div class="empty-state">No utility abilities purchased yet. Browse the categories below to add some.</div>
                </div>
            `;
        }
        
        return `
            <div class="selected-utilities">
                <div class="purchased-utilities-grid">
                    ${allPurchases.map(item => this.renderSelectedItem(item)).join('')}
                </div>
            </div>
        `;
    }

    renderSelectedItem(item) {
        const removeData = {
            action: 'remove-utility-item',
            'category-key': item.category,
            'item-id': item.id,
            ...(item.category === 'expertise' && { 'attribute': item.attribute, 'level': item.level })
        };
        const costText = item.cost !== undefined ? `${item.cost}p` : '';

        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-details">${item.typeLabel}</span>
                    ${costText ? `<span class="item-cost">${costText}</span>` : ''}
                </div>
                ${RenderUtils.renderButton({ text: 'Remove', variant: 'danger', size: 'small', dataAttributes: removeData })}
            </div>
        `;
    }
}