
// modernApp/components/CharacterHeader.js
import { Logger } from '../utils/Logger.js';
import { Formatters } from '../utils/Formatters.js';

/**
 * A component to display the primary character header information.
 * It listens for character updates and re-renders itself.
 */
export class CharacterHeader {
    /**
     * @param {HTMLElement} container - The DOM element to render the header into.
     */
    constructor(container) {
        if (!container) {
            throw new Error('CharacterHeader requires a valid container element.');
        }
        this.container = container;
        Logger.info('[CharacterHeader] Initialized.');
    }

    /**
     * Renders the header with the given character data.
     * @param {Object} character - The character object.
     */
    render(character) {
        if (!character) {
            Logger.warn('[CharacterHeader] Render called with no character data.');
            this.container.innerHTML = '<p>No character loaded.</p>';
            return;
        }

        const name = character.name || 'Unnamed Character';
        const tier = character.tier || 'N/A';
        const type = character.characterType || 'Unspecified';

        this.container.innerHTML = `
            <div class="character-header-main">
                <h1 class="character-name">${name}</h1>
                <div class="character-meta">
                    <span class="meta-item"><strong>Tier:</strong> ${tier}</span>
                    <span class="meta-item"><strong>Type:</strong> ${Formatters.camelToTitle(type)}</span>
                </div>
            </div>
        `;
        Logger.debug(`[CharacterHeader] Rendered for character: "${name}".`);
    }

    /**
     * Updates the header display. This is typically called from a state management listener.
     * @param {Object} character - The updated character object.
     */
    update(character) {
        Logger.debug('[CharacterHeader] Updating display...');
        this.render(character);
    }
}
