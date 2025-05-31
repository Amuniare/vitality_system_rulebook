// BasicInfoTab.js - Character name and tier selection
export class BasicInfoTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-basicInfo');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        
        tabContent.innerHTML = `
            <div class="basic-info-section">
                <h2>Character Information</h2>
                <p class="section-description">Enter your character's basic information to begin building.</p>
                
                <div class="form-group">
                    <label for="character-name">Hero Name *</label>
                    <input type="text" 
                           id="character-name" 
                           placeholder="Enter your hero name"
                           value="${character?.name || ''}"
                           class="large-input">
                    <small>The name your character uses in their heroic identity</small>
                </div>
                
                <div class="form-group">
                    <label for="real-name">Real Name</label>
                    <input type="text" 
                           id="real-name" 
                           placeholder="Enter your character's real name"
                           value="${character?.realName || ''}"
                           class="large-input">
                    <small>Your character's civilian identity (optional)</small>
                </div>
                
                <div class="form-group">
                    <label for="tier-select">Character Tier *</label>
                    <select id="tier-select" class="large-input">
                        ${this.generateTierOptions(character?.tier || 4)}
                    </select>
                    <small>Tier represents your character's overall power level and experience</small>
                </div>
                
                <div class="tier-info">
                    <h3>Tier Information</h3>
                    <div id="tier-description"></div>
                    <div class="tier-effects">
                        <h4>Tier Effects:</h4>
                        <ul id="tier-effects-list"></ul>
                    </div>
                </div>
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Choose your 7 archetype categories to define your character's core abilities.</p>
                    <button id="continue-to-archetypes" class="btn-primary">Continue to Archetypes →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateTierInfo();
    }

    generateTierOptions(selectedTier) {
        let options = '';
        for (let tier = 1; tier <= 10; tier++) {
            const selected = tier === selectedTier ? 'selected' : '';
            const description = this.getTierDescription(tier);
            options += `<option value="${tier}" ${selected}>${tier} - ${description}</option>`;
        }
        return options;
    }

    getTierDescription(tier) {
        const descriptions = {
            1: "Novice",
            2: "Developing", 
            3: "Competent",
            4: "Professional",
            5: "Veteran",
            6: "Expert",
            7: "Elite",
            8: "Master",
            9: "Legendary",
            10: "World-class Expert"
        };
        return descriptions[tier] || "Unknown";
    }

    setupEventListeners() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        // Character name
        const nameInput = document.getElementById('character-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                character.name = e.target.value || 'Unnamed Character';
                this.builder.updateCharacter();
            });
        }

        // Real name
        const realNameInput = document.getElementById('real-name');
        if (realNameInput) {
            realNameInput.addEventListener('input', (e) => {
                character.realName = e.target.value;
                this.builder.updateCharacter();
            });
        }

        // Tier selection
        const tierSelect = document.getElementById('tier-select');
        if (tierSelect) {
            tierSelect.addEventListener('change', (e) => {
                const newTier = parseInt(e.target.value);
                character.tier = newTier;
                this.updateTierInfo();
                this.builder.updateCharacter();
            });
        }

        // Continue button
        const continueBtn = document.getElementById('continue-to-archetypes');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('archetypes');
            });
        }
    }

    updateTierInfo() {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const tier = character.tier;
        
        // Update description
        const descElement = document.getElementById('tier-description');
        if (descElement) {
            descElement.innerHTML = `
                <p><strong>Tier ${tier}:</strong> ${this.getTierDescription(tier)}</p>
                <p>${this.getTierFlavorText(tier)}</p>
            `;
        }

        // Update effects list
        const effectsList = document.getElementById('tier-effects-list');
        if (effectsList) {
            effectsList.innerHTML = `
                <li><strong>Bonus to all actions:</strong> +${tier}</li>
                <li><strong>Maximum attribute rank:</strong> ${tier}</li>
                <li><strong>Combat attribute points:</strong> ${tier * 2}</li>
                <li><strong>Utility attribute points:</strong> ${tier}</li>
                <li><strong>Main pool points:</strong> ${Math.max(0, (tier - 2) * 15)}</li>
                <li><strong>Utility pool points:</strong> ${Math.max(0, 5 * (tier - 1))}</li>
                <li><strong>Base HP:</strong> ${100 + (tier * 5)}</li>
            `;
        }
    }

    getTierFlavorText(tier) {
        const flavorTexts = {
            1: "Just starting out on your heroic journey. You have potential but lack experience.",
            2: "Developing your abilities and gaining confidence in your powers.",
            3: "A competent hero who can handle most everyday threats reliably.",
            4: "A professional hero with established capabilities and reputation.",
            5: "A veteran hero with significant experience and refined abilities.",
            6: "An expert hero whose skills are recognized and respected.",
            7: "An elite hero operating at the highest levels of competence.",
            8: "A master hero pushing the boundaries of human capability.",
            9: "A legendary hero whose deeds inspire others and shape history.",
            10: "A world-class expert representing the absolute pinnacle of heroic achievement."
        };
        return flavorTexts[tier] || "A hero of unknown caliber.";
    }
}