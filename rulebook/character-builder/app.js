// app.js - COMPLETE REWRITE with proper initialization order
import { CharacterBuilder } from './ui/CharacterBuilder.js';
import { VitalityCharacter } from './core/VitalityCharacter.js';
import { gameDataManager } from './core/GameDataManager.js';

class VitalityCharacterBuilderApp {
    constructor() {
        this.characterBuilder = null;
        this.initialized = false;
    }

    async init() {
        console.log('Initializing Vitality Character Builder App...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize GameDataManager first and wait for data to load
            console.log('🔵 Initializing GameDataManager...');
            await gameDataManager.init();
            console.log('🟢 GameDataManager initialized.');

            // Initialize character builder
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
window.gameDataManager = gameDataManager;