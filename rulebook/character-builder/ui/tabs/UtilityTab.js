// UtilityTab.js - Utility purchases interface
export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <div class="utility-section">
                <h2>Utility Abilities</h2>
                <p class="section-description">
                    Purchase expertise, features, senses, and descriptors using your utility pool.
                </p>
                
                <div class="coming-soon">
                    <h3>🚧 Under Construction</h3>
                    <p>The utility interface is being built. Features will include:</p>
                    <ul>
                        <li>Expertise selection (activity and situational)</li>
                        <li>Feature purchases (1p, 3p, 5p, 10p tiers)</li>
                        <li>Sense enhancement options</li>
                        <li>Descriptor selection and applications</li>
                    </ul>
                </div>
                
                <div class="next-step">
                    <button id="continue-to-summary" class="btn-primary">Continue to Summary →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const continueBtn = document.getElementById('continue-to-summary');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('summary');
            });
        }
    }
}