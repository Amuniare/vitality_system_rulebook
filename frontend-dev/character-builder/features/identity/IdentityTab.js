// frontend/character-builder/features/identity/IdentityTab.js
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { EventManager } from '../../shared/utils/EventManager.js';
import { gameDataManager } from '../../core/GameDataManager.js';

export class IdentityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.listenersAttached = false;
        this.isUpdatingFromSelf = false; // Flag to prevent self-re-render
    }

    render() {
        const tabContent = document.getElementById('tab-identity');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }

        const bioData = gameDataManager.getBio();
        const questionnaireType = this.getQuestionnaireType(character.characterType);
        const questionnaireData = bioData.questionnaires?.[questionnaireType];
        const questionnaire = questionnaireData?.questions || [];

        tabContent.innerHTML = `
            <div class="identity-section">
                <h2>${questionnaireData?.title || 'Character Identity & Background'}</h2>
                <p class="section-description">
                    ${questionnaireData?.description || 'Define your character\'s personal history, motivations, and background details.'}
                </p>

                <div class="questionnaire-form">
                    ${questionnaire.map(question => this.renderQuestion(question, character)).join('')}
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Continue building your character with archetypes and attributes.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Archetypes →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-archetypes' }
                    })}
                </div>
            </div>
        `;

        // Reset listener flag since innerHTML destroyed all listeners
        this.listenersAttached = false;
        this.setupEventListeners();
    }

    renderQuestion(question, character) {
        const questionId = question.id;
        const currentValue = character.biographyDetails[questionId] || '';
        const isGMOnly = question.gmOnly || false;
        const gmOnlyClass = isGMOnly ? 'gm-only' : '';

        let inputHtml = '';
        
        switch (question.type) {
            case 'dropdown':
                inputHtml = this.renderDropdownQuestion(question, currentValue);
                break;
            case 'textarea':
                inputHtml = this.renderTextareaQuestion(question, currentValue);
                break;
            default:
                inputHtml = `<p>Unknown question type: ${question.type}</p>`;
        }

        return RenderUtils.renderFormGroup({
            label: question.question + (isGMOnly ? ' (GM Only)' : ''),
            inputId: `bio-${questionId}`,
            inputHtml: inputHtml,
            formGroupClass: gmOnlyClass
        });
    }

    renderDropdownQuestion(question, currentValue) {
        const selectOptions = question.options.map(option => ({
            value: option,
            label: option
        }));

        const selectHtml = RenderUtils.renderSelect({
            id: `bio-${question.id}`,
            value: currentValue,
            options: selectOptions,
            dataAttributes: { 
                action: 'update-bio-dropdown',
                'question-id': question.id
            }
        });

        // Add hidden text input for "Other" option
        const otherInputStyle = currentValue === 'Other' ? '' : 'display: none;';
        const otherValue = currentValue !== 'Other' && !question.options.includes(currentValue) ? currentValue : '';
        
        const otherInputHtml = `
            <textarea id="bio-${question.id}-other" 
                     class="other-input bio-textarea" 
                     placeholder="Please specify..." 
                     rows="3"
                     style="${otherInputStyle}"
                     data-action="update-bio-other"
                     data-question-id="${question.id}">${otherValue}</textarea>
        `;


        return selectHtml + otherInputHtml;
    }

    renderTextareaQuestion(question, currentValue) {
        return `
            <textarea id="bio-${question.id}" 
                     class="bio-textarea"
                     placeholder="${question.placeholder || ''}"
                     rows="4"
                     data-action="update-bio-textarea"
                     data-question-id="${question.id}">${currentValue}</textarea>
        `;
    }

    getQuestionnaireType(characterType) {
        // Map character types to questionnaire types
        switch (characterType) {
            case 'player_character':
                return 'pc';
            case 'npc_ally':
                return 'npc';
            case 'other':
                return 'other';
            default:
                return 'pc'; // Default fallback
        }
    }

    setupEventListeners() {
        if (this.listenersAttached) {
            return;
        }
        
        const container = document.getElementById('tab-identity');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                '[data-action="continue-to-archetypes"]': () => this.builder.switchTab('archetypes')
            },
            change: {
                '[data-action="update-bio-dropdown"]': (e, element) => {
                    this.handleDropdownChange(element);
                }
            },
            input: {
                '[data-action="update-bio-textarea"]': (e, element) => {
                    this.handleTextareaChange(element);
                },
                '[data-action="update-bio-other"]': (e, element) => {
                    this.handleOtherInputChange(element);
                }
            }
        }, this);

        this.listenersAttached = true;
    }

    handleDropdownChange(element) {
        const questionId = element.dataset.questionId;
        const value = element.value;
        
        // Show/hide the "Other" text input
        const otherInput = document.getElementById(`bio-${questionId}-other`);
        if (otherInput) {
            if (value === 'Other') {
                otherInput.style.display = '';
            } else {
                otherInput.style.display = 'none';
                otherInput.value = '';
            }
        }

        // Set flag to prevent self-re-render
        this.isUpdatingFromSelf = true;
        
        // Update character data
        this.builder.setBiographyDetail(questionId, value);
        
        // Reset flag after update
        this.isUpdatingFromSelf = false;
    }

    handleTextareaChange(element) {
        const questionId = element.dataset.questionId;
        const value = element.value;
        
        // Set flag to prevent self-re-render
        this.isUpdatingFromSelf = true;
        this.builder.setBiographyDetail(questionId, value);
        this.isUpdatingFromSelf = false;
    }

    handleOtherInputChange(element) {
        const questionId = element.dataset.questionId;
        const value = element.value;
        
        // Set flag to prevent self-re-render
        this.isUpdatingFromSelf = true;
        // Update character data with the custom "Other" value
        this.builder.setBiographyDetail(questionId, value);
        this.isUpdatingFromSelf = false;
    }

    onCharacterUpdate() {
        // Skip re-render if we're updating from our own change to prevent 
        // destroying the DOM element the user just interacted with
        if (this.isUpdatingFromSelf) {
            return;
        }
        
        // Re-render to ensure all fields are synchronized with character data
        this.render();
    }
}