// app.js - Main application entry point
import { CharacterBuilder } from './ui/CharacterBuilder.js';
import { VitalityCharacter } from './core/VitalityCharacter.js';

class VitalityCharacterBuilderApp {
    constructor() {
        this.characterBuilder = null;
        this.initialized = false;
    }

    async init() {
        console.log('Initializing Vitality Character Builder...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize character builder
            this.characterBuilder = new CharacterBuilder();
            await this.characterBuilder.init();
            
            this.initialized = true;
            console.log('✅ Character Builder initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Character Builder:', error);
            this.showInitializationError(error);
        }
    }

    showInitializationError(error) {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="error-screen">
                    <h1>Initialization Error</h1>
                    <p>Failed to load the Character Builder. Please refresh the page.</p>
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

// Make globally accessible
window.vitalityApp = app;