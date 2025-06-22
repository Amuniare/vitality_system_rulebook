// modernApp/components/SummaryPanel.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';
import { StateManager } from '../core/StateManager.js';
import { CharacterHeader } from './CharacterHeader.js';
import { PointPoolDisplay } from './PointPoolDisplay.js';

export class SummaryPanel {
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('SummaryPanel requires a valid container element.');
        }
        this.container = containerElement;
        this.characterHeader = null;
        this.pointPoolDisplay = null;

        this._boundHandleCharacterUpdate = this.handleCharacterUpdate.bind(this);
    }

    init() {
        this.container.innerHTML = `
            <div id="summary-character-header-container"></div>
            <div id="summary-point-pool-container" style="margin-top: var(--spacing-lg);"></div>
            <div id="summary-validation-status-container" style="margin-top: var(--spacing-lg);"></div>
            <!-- More summary sections can be added here -->
        `;

        const headerContainer = this.container.querySelector('#summary-character-header-container');
        this.characterHeader = new CharacterHeader(headerContainer);

        const poolContainer = this.container.querySelector('#summary-point-pool-container');
        // Using a compact display for the summary panel
        this.pointPoolDisplay = PointPoolDisplay.createCompactDisplay(poolContainer);
        // PointPoolDisplay initializes and sets up its own event listeners.

        EventBus.on('CHARACTER_LOADED', this._boundHandleCharacterUpdate);
        EventBus.on('CHARACTER_CHANGED', this._boundHandleCharacterUpdate);
        
        // Initial render based on current character
        const currentCharacter = StateManager.getCharacter();
        if (currentCharacter) {
            this.render(currentCharacter);
        }

        Logger.info('[SummaryPanel] Initialized.');
    }

    handleCharacterUpdate(data) {
        // data could be { character } from CHARACTER_LOADED or { character, updates } from CHARACTER_CHANGED
        const character = data.character || data; // Adjust if data structure varies
        if (character) {
            this.render(character);
        }
    }

    render(character) {
        if (!character) {
            Logger.warn('[SummaryPanel] Render called with no character data.');
            this.container.querySelector('#summary-character-header-container').innerHTML = '<p>No character loaded.</p>';
            // PointPoolDisplay will likely show defaults or zeros if character is null/undefined when it updates.
            return;
        }

        this.characterHeader.render(character); 
        // PointPoolDisplay updates itself via EventBus or its update() method can be called if needed.
        // Let's ensure its update is triggered if it doesn't fully self-manage on CHARACTER_CHANGED
        if (this.pointPoolDisplay && typeof this.pointPoolDisplay.update === 'function') {
             this.pointPoolDisplay.update(); // Explicitly tell it to recalculate and re-render
        }

        Logger.debug(`[SummaryPanel] Rendered for character: "${character.name}".`);
        
        // Example for validation status (if ValidationSystem UI updates are separate)
        // This part might be better handled by ValidationSystem itself if it targets a specific element
        const validationContainer = this.container.querySelector('#summary-validation-status-container');
        if (validationContainer) {
            // This is a placeholder. Actual validation display would be more complex.
            // const validationResults = ValidationSystem.getInstance().validateAll();
            // validationContainer.innerHTML = `<p>Validation: ${validationResults.valid ? 'OK' : 'Warnings Present'}</p>`;
        }
    }

    cleanup() {
        EventBus.off('CHARACTER_LOADED', this._boundHandleCharacterUpdate);
        EventBus.off('CHARACTER_CHANGED', this._boundHandleCharacterUpdate);
        if (this.pointPoolDisplay && typeof this.pointPoolDisplay.cleanup === 'function') {
            this.pointPoolDisplay.cleanup();
        }
        Logger.info('[SummaryPanel] Cleaned up.');
    }
}