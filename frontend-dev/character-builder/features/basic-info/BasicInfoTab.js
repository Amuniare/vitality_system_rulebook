// frontend/character-builder/features/basic-info/BasicInfoTab.js
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { EventManager } from '../../shared/utils/EventManager.js';
import { gameDataManager } from '../../core/GameDataManager.js';

export class BasicInfoTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.listenersAttached = false;
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
                    label: 'Character Type',
                    inputId: 'character-type-select',
                    inputHtml: RenderUtils.renderSelect({
                        id: 'character-type-select',
                        value: character.characterType || "player_character",
                        options: this.getCharacterTypeOptions(),
                        dataAttributes: { action: 'update-character-type', testid: 'character-type' }
                    }),
                    description: "The type of character being created"
                })}

                ${this.renderPlayerNameField(character)}

                ${this.renderCharacterSubTypeField(character)}

                ${RenderUtils.renderFormGroup({
                    label: 'Hero Name *',
                    inputId: 'character-name',
                    inputHtml: `<input type="text" id="character-name" data-testid="character-name" placeholder="Enter your hero name" value="${character.name || ''}" data-action="update-char-name">`,
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
                        dataAttributes: { action: 'update-tier', testid: 'character-tier' }
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
                    <p><strong>Next Step:</strong> Define your character's background and motivations.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Identity →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-identity' }
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners(); // For direct event listeners if any, or rely on CharacterBuilder
        this.updateTierDisplay(character.tier); // Initial display
    }


    getCharacterTypeOptions() {
        const characterTypes = gameDataManager.getCharacterTypes();
        return characterTypes.map(type => ({
            value: type.id,
            label: type.name
        }));
    }

    getCharacterTypeHP() {
        const character = this.builder.currentCharacter;
        if (!character || !character.characterType) {
            return 100; // Default fallback
        }
        
        const characterTypes = gameDataManager.getCharacterTypes();
        const currentType = characterTypes.find(type => type.id === character.characterType);
        
        if (!currentType) return 100;
        
        // If it's "other" type, check for sub-type
        if (character.characterType === "other" && character.characterSubType) {
            const subType = currentType.subTypes?.find(sub => sub.id === character.characterSubType);
            return subType ? subType.hp : currentType.hp;
        }
        
        return currentType.hp;
    }

    renderPlayerNameField(character) {
        // Only show player name field if character type is "player_character"
        if (character.characterType === "player_character") {
            return RenderUtils.renderFormGroup({
                label: 'Player Name',
                inputId: 'player-name',
                inputHtml: `<input type="text" id="player-name" placeholder="Enter player name" value="${character.playerName || ''}" data-action="update-player-name">`,
                description: "The name of the player controlling this character"
            });
        }
        return '';
    }

    renderCharacterSubTypeField(character) {
        // Only show sub-type field if character type is "other"
        if (character.characterType === "other") {
            const characterTypes = gameDataManager.getCharacterTypes();
            const otherType = characterTypes.find(type => type.id === "other");
            const subTypeOptions = otherType?.subTypes?.map(subType => ({
                value: subType.id,
                label: subType.name
            })) || [];

            // Add empty option
            subTypeOptions.unshift({ value: "", label: "Select Sub-Type..." });

            return RenderUtils.renderFormGroup({
                label: 'Character Sub-Type *',
                inputId: 'character-subtype-select',
                inputHtml: RenderUtils.renderSelect({
                    id: 'character-subtype-select',
                    value: character.characterSubType || "",
                    options: subTypeOptions,
                    dataAttributes: { action: 'update-character-subtype', testid: 'character-subtype' }
                }),
                description: "The specific type of non-player character"
            });
        }
        return '';
    }

    getTierDescription(tier) {
        const tiers = gameDataManager.getTiers();
        return tiers.tiers?.[tier]?.name || "Unknown";
    }
    
    getTierFlavorText(tier) {
        const tiers = gameDataManager.getTiers();
        return tiers.tiers?.[tier]?.description || "A hero of unknown caliber.";
    }


    setupEventListeners() {
        if (this.listenersAttached) {
            return;
        }
        
        const container = document.getElementById('tab-basicInfo');
        if (!container) return;
        
        EventManager.delegateEvents(container, {
            click: {
                '[data-action="continue-to-identity"]': () => this.builder.switchTab('identity')
            },
            input: {
                '[data-action="update-player-name"]': (e, element) => {
                    this.updatePlayerName(element.value);
                },
                '[data-action="update-char-name"]': (e, element) => {
                    this.updateName(element.value);
                },
                '[data-action="update-real-name"]': (e, element) => {
                    this.updateRealName(element.value);
                }
            },
            change: {
                '[data-action="update-character-type"]': (e, element) => {
                    this.updateCharacterType(element.value);
                },
                '[data-action="update-character-subtype"]': (e, element) => {
                    this.updateCharacterSubType(element.value);
                },
                '[data-action="update-tier"]': (e, element) => {
                    this.updateTier(element.value);
                }
            }
        }, this);
        
        this.listenersAttached = true;
        console.log('✅ BasicInfoTab event listeners attached ONCE.');
    }

    updatePlayerName(newPlayerName) { // Called by CharacterBuilder
        this.builder.setCharacterPlayerName(newPlayerName);
    }

    updateName(newName) { // Called by CharacterBuilder
        this.builder.setCharacterName(newName);
    }
    
    updateRealName(newRealName) { // Called by CharacterBuilder
        this.builder.setCharacterRealName(newRealName);
    }
    
    updateCharacterType(newType) { // Called by CharacterBuilder
        this.builder.setCharacterType(newType);
        // Re-render the tab to show/hide player name field and sub-type field
        this.render();
    }
    
    updateCharacterSubType(newSubType) { // Called by CharacterBuilder
        this.builder.setCharacterSubType(newSubType);
        this.updateTierDisplay(this.builder.currentCharacter.tier);
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
            const baseHP = this.getCharacterTypeHP();
            effectsList.innerHTML = `
                <li><strong>Bonus to all actions:</strong> +${tier}</li>
                <li><strong>Maximum attribute rank:</strong> ${tier}</li>
                <li><strong>Combat attribute points:</strong> ${tier * 2}</li>
                <li><strong>Utility attribute points:</strong> ${tier}</li>
                <li><strong>Main pool points:</strong> ${Math.max(0, (tier - 2) * 15)}</li>
                <li><strong>Utility pool points:</strong> ${Math.max(0, 5 * (tier - 1))}</li>
                <li><strong>HP (Base):</strong> ${baseHP}</li>
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
         const playerNameInput = document.getElementById('player-name');
         if(playerNameInput && this.builder.currentCharacter && playerNameInput.value !== this.builder.currentCharacter.playerName) {
            playerNameInput.value = this.builder.currentCharacter.playerName;
         }
         const nameInput = document.getElementById('character-name');
         if(nameInput && this.builder.currentCharacter && nameInput.value !== this.builder.currentCharacter.name) {
            nameInput.value = this.builder.currentCharacter.name;
         }
         const realNameInput = document.getElementById('real-name');
         if(realNameInput && this.builder.currentCharacter && realNameInput.value !== this.builder.currentCharacter.realName) {
            realNameInput.value = this.builder.currentCharacter.realName;
         }
         const characterTypeSelect = document.getElementById('character-type-select');
         if(characterTypeSelect && this.builder.currentCharacter && characterTypeSelect.value !== this.builder.currentCharacter.characterType) {
            characterTypeSelect.value = this.builder.currentCharacter.characterType;
         }
         const characterSubTypeSelect = document.getElementById('character-subtype-select');
         if(characterSubTypeSelect && this.builder.currentCharacter && characterSubTypeSelect.value !== this.builder.currentCharacter.characterSubType) {
            characterSubTypeSelect.value = this.builder.currentCharacter.characterSubType || "";
         }
    }
}

