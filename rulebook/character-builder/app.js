// app.js - Main application entry point
import { CharacterBuilder } from './ui/CharacterBuilder.js';
import { VitalityCharacter } from './core/VitalityCharacter.js';
import { gameDataManager } from './core/GameDataManager.js'; // ADDED

class VitalityCharacterBuilderApp {
    constructor() {
        this.characterBuilder = null;
        this.initialized = false;
    }

    async init() {
        try {
            // 1. Wait for DOM
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
    
            // 2. Initialize GameDataManager first
            await gameDataManager.init();
    
            // 3. Initialize character builder (which sets up events)
            this.characterBuilder = new CharacterBuilder();
            await this.characterBuilder.init();
            
            this.initialized = true;
            console.log('✅ Character Builder App initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Character Builder App:', error);
            this.showInitializationError(error);
        }
    }

    showInitializationError(error) {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="error-screen">
                    <h1>Initialization Error</h1>
                    <p>Failed to load the Character Builder. Please check the console for details.</p>
                    <p class="error-details">Error: ${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary">Refresh Page</button>
                </div>
            `;
        }
    }
}

// Initialize application
const app = new VitalityCharacterBuilderApp();
app.init();

// Make globally accessible for debugging
window.vitalityApp = app;
window.gameDataManager = gameDataManager; // For debugging access