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
                    <div class="stat-item">
                        <span>Name:</span>
                        <strong>${character.basicInfo?.characterName || 'Unnamed Character'}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Real Name:</span>
                        <strong>${character.basicInfo?.realName || 'Unknown'}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Player Name:</span>
                        <strong>${character.basicInfo?.playerName || 'Unknown Player'}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Character Tier:</span>
                        <strong>${character.basicInfo?.tier || 'Not Set'}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Character Type:</span>
                        <strong>${character.basicInfo?.characterType || 'Not Set'}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}