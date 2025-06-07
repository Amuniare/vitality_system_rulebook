// rulebook/character-builder/ui/tabs/BasicInfoTab.js
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class BasicInfoTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-basicInfo');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="basic-info-section">
                <h2>Character Information</h2>
                <p class="section-description">Enter your character's basic information to begin building.</p>

                ${RenderUtils.renderFormGroup({
                    label: 'Hero Name *',
                    inputId: 'character-name',
                    inputHtml: `<input type="text" id="character-name" placeholder="Enter your hero name" value="${character.name || ''}" data-action="update-char-name">`,
                    description: "The name your character uses in their heroic identity"
                })}

                ${RenderUtils.renderFormGroup({
                    label: 'Real Name',
                    inputId: 'real-name',
                    inputHtml: `<input type="text" id="real-name" placeholder="Enter your character's real name" value="${character.realName || ''}" data-action="update-real-name">`,
                    description: "Your character's civilian identity (optional)"
                })}

                ${RenderUtils.renderFormGroup({
                    label: 'Character Tier *',
                    inputId: 'tier-select',
                    inputHtml: RenderUtils.renderSelect({
                        id: 'tier-select',
                        value: character.tier || 4,
                        options: Array.from({length: 10}, (_, i) => ({ value: i + 1, label: `${i + 1} - ${this.getTierDescription(i + 1)}`})),
                        dataAttributes: { action: 'update-tier' }
                    }),
                    description: "Tier represents your character's overall power level and experience"
                })}

                <div class="tier-info">
                    <h3>Tier Information</h3>
                    <div id="tier-description-display"></div>
                    <div class="tier-effects">
                        <h4>Tier Effects:</h4>
                        <ul id="tier-effects-list"></ul>
                    </div>
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Choose your 7 archetype categories to define your character's core abilities.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Archetypes →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-archetypes' }
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners(); // For direct event listeners if any, or rely on CharacterBuilder
        this.updateTierDisplay(character.tier); // Initial display
    }


    getTierDescription(tier) {
        // ... (same as before)
        const descriptions = {
            1: "Novice", 2: "Developing", 3: "Competent", 4: "Professional", 5: "Veteran",
            6: "Expert", 7: "Elite", 8: "Master", 9: "Legendary", 10: "World-class Expert"
        };
        return descriptions[tier] || "Unknown";
    }
    getTierFlavorText(tier) {
        // ... (same as before)
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


    setupEventListeners() {
        // EventManager at CharacterBuilder level will handle data-action inputs/changes.
    }

    updateName(newName) { // Called by CharacterBuilder
        this.builder.setCharacterName(newName);
    }
    
    updateRealName(newRealName) { // Called by CharacterBuilder
        this.builder.setCharacterRealName(newRealName);
    }
    
    updateTier(newTier) { // Called by CharacterBuilder
        this.builder.setCharacterTier(newTier);
        this.updateTierDisplay(parseInt(newTier));
    }

    updateTierDisplay(tier) {
        const descElement = document.getElementById('tier-description-display');
        if (descElement) {
            descElement.innerHTML = `
                <p><strong>Tier ${tier}:</strong> ${this.getTierDescription(tier)}</p>
                <p>${this.getTierFlavorText(tier)}</p>
            `;
        }

        const effectsList = document.getElementById('tier-effects-list');
        if (effectsList) {
             // These values should ideally come from TierSystem.js or GameConstants.js
            effectsList.innerHTML = `
                <li><strong>Bonus to all actions:</strong> +${tier}</li>
                <li><strong>Maximum attribute rank:</strong> ${tier}</li>
                <li><strong>Combat attribute points:</strong> ${tier * 2}</li>
                <li><strong>Utility attribute points:</strong> ${tier}</li>
                <li><strong>Main pool points:</strong> ${Math.max(0, (tier - 2) * 15)}</li>
                <li><strong>Utility pool points:</strong> ${Math.max(0, 5 * (tier - 1))}</li>
                <li><strong>HP (Base):</strong> 100 (Actual HP includes Endurance bonuses)</li>
            `;
        }
    }
     // onCharacterUpdate can re-call render if needed, or more granular updates.
    onCharacterUpdate() {
        // If only tier could change that affects this tab's specific display (beyond header)
        const tierSelect = document.getElementById('tier-select');
        if (tierSelect && this.builder.currentCharacter && tierSelect.value != this.builder.currentCharacter.tier) {
             tierSelect.value = this.builder.currentCharacter.tier;
             this.updateTierDisplay(this.builder.currentCharacter.tier);
        }
         const nameInput = document.getElementById('character-name');
         if(nameInput && this.builder.currentCharacter && nameInput.value !== this.builder.currentCharacter.name) {
            nameInput.value = this.builder.currentCharacter.name;
         }
         const realNameInput = document.getElementById('real-name');
         if(realNameInput && this.builder.currentCharacter && realNameInput.value !== this.builder.currentCharacter.realName) {
            realNameInput.value = this.builder.currentCharacter.realName;
         }
    }
}

