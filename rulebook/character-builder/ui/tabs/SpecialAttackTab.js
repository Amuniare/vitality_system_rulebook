// SpecialAttackTab.js - Special attack creation and management
export class SpecialAttackTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-specialAttacks');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <div class="special-attacks-section">
                <h2>Special Attacks</h2>
                <p class="section-description">
                    Create custom attacks with limits and upgrades based on your special attack archetype.
                </p>
                
                <div class="coming-soon">
                    <h3>🚧 Under Construction</h3>
                    <p>The special attack builder is being developed. Features will include:</p>
                    <ul>
                        <li>Attack creation based on archetype rules</li>
                        <li>Limits system for point generation</li>
                        <li>Upgrade selection and validation</li>
                        <li>Attack type and effect configuration</li>
                    </ul>
                </div>
                
                <div class="next-step">
                    <button id="continue-to-utility" class="btn-primary">Continue to Utility →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const continueBtn = document.getElementById('continue-to-utility');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('utility');
            });
        }
    }
}