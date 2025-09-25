export class SummaryHeader {
    constructor() {
        // Pure display component - no state needed
    }

    render(character) {
        if (!character) {
            return `
                <div class="card">
                    <h3>Character Overview</h3>
                    <div class="card-content">
                        <p>No character data available</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3>Character Overview</h3>
                <div class="card-content">
                    <div class="summary-item">
                        <span class="summary-label">Name</span>
                        <strong class="summary-value">${character.name || 'Unnamed Character'}</strong>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Real Name</span>
                        <strong class="summary-value">${character.realName || 'N/A'}</strong>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Player Name</span>
                        <strong class="summary-value">${character.playerName || 'N/A'}</strong>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Character Tier</span>
                        <strong class="summary-value">${character.tier || 'Not Set'}</strong>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Character Type</span>
                        <strong class="summary-value">${character.characterType || 'Not Set'}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}