// MainPoolTab.js - Main pool purchases (traits, flaws, boons)
export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <div class="main-pool-section">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Use your main pool points to purchase traits, flaws, boons, and other abilities.
                </p>
                
                <div class="coming-soon">
                    <h3>🚧 Under Construction</h3>
                    <p>The main pool interface is being built. Features will include:</p>
                    <ul>
                        <li>Trait selection with conditional bonuses</li>
                        <li>Flaw selection for extra points</li>
                        <li>Boon purchases for unique abilities</li>
                        <li>Primary action upgrades</li>
                    </ul>
                </div>
                
                <div class="next-step">
                    <button id="continue-to-special-attacks" class="btn-primary">Continue to Special Attacks →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const continueBtn = document.getElementById('continue-to-special-attacks');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('specialAttacks');
            });
        }
    }
}