export class ArchetypesSummary {
    constructor() {
        // Pure display component - no state needed
    }

    render(archetypeNames) {
        if (!archetypeNames || typeof archetypeNames !== 'object') {
            return `
                <div class="card">
                    <h3>Selected Archetypes</h3>
                    <div class="card-content">
                        <p>No archetype data available</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3>Selected Archetypes</h3>
                <div class="card-content">
                    <div class="stat-item">
                        <span>Movement:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.movement)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Attack Type:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.attackType)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Effect Type:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.effectType)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Unique Ability:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.uniqueAbility)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Defensive:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.defensive)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Special Attack:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.specialAttack)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Utility:</span>
                        <strong>${this.getArchetypeDisplay(archetypeNames.utility)}</strong>
                    </div>
                </div>
            </div>
        `;
    }

    getArchetypeDisplay(archetype) {
        if (!archetype || archetype === '' || archetype === null) {
            return '<em>Not Selected</em>';
        }
        return archetype;
    }
}