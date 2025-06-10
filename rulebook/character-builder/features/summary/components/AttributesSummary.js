export class AttributesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(character, stats) {
        if (!character || !stats) {
            return `
                <div class="card">
                    <h3>Core Attributes</h3>
                    <div class="card-content">
                        <p>No attribute data available</p>
                    </div>
                </div>
                <div class="card">
                    <h3>Calculated Stats</h3>
                    <div class="card-content">
                        <p>No stat data available</p>
                    </div>
                </div>
            `;
        }

        return `
            ${this.renderCoreAttributes(character)}
            ${this.renderCalculatedStats(stats)}
        `;
    }

    renderCoreAttributes(character) {
        const attributes = character.attributes || {};
        
        return `
            <div class="card">
                <h3>Core Attributes</h3>
                <div class="card-content">
                    <div class="stat-item">
                        <span>Focus:</span>
                        <strong>${attributes.focus || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Mobility:</span>
                        <strong>${attributes.mobility || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Power:</span>
                        <strong>${attributes.power || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Endurance:</span>
                        <strong>${attributes.endurance || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Awareness:</span>
                        <strong>${attributes.awareness || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Communication:</span>
                        <strong>${attributes.communication || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Intelligence:</span>
                        <strong>${attributes.intelligence || 0}</strong>
                    </div>
                </div>
            </div>
        `;
    }

    renderCalculatedStats(stats) {
        // Check if stats has a final property (nested structure)
        const finalStats = stats.final || stats;
        
        return `
            <div class="card">
                <h3>Calculated Stats</h3>
                <div class="card-content">
                    <div class="stat-item">
                        <span>Accuracy:</span>
                        <strong>${finalStats.accuracy || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Damage:</span>
                        <strong>${finalStats.damage || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Conditions:</span>
                        <strong>${finalStats.conditions || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>HP:</span>
                        <strong>${finalStats.hp || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Avoidance:</span>
                        <strong>${finalStats.avoidance || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Durability:</span>
                        <strong>${finalStats.durability || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Resolve:</span>
                        <strong>${finalStats.resolve || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Stability:</span>
                        <strong>${finalStats.stability || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Vitality:</span>
                        <strong>${finalStats.vitality || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Initiative:</span>
                        <strong>${finalStats.initiative || 0}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Movement:</span>
                        <strong>${finalStats.movement || 0}${finalStats.movement ? ' sp' : ''}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}