// app.js - Simplified System Initialization
import { CharacterBuilder } from './CharacterBuilder.js';
import { VitalityCharacter } from '../core/VitalityCharacter.js';
import { gameDataManager } from '../core/GameDataManager.js';

class VitalityCharacterBuilderApp {
    constructor() {
        this.characterBuilder = null;
        this.initialized = false;
    }

    async init() {
        console.log('🚀 Initializing Vitality Character Builder App (Simplified System)...');

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize GameDataManager first and wait for simplified data to load
            console.log('📚 Initializing GameDataManager (simplified system)...');
            await gameDataManager.init();
            console.log('✅ GameDataManager loaded simplified data successfully');

            // Initialize character builder (no longer needs gameDataManager parameter)
            console.log('🏗️ Initializing CharacterBuilder...');
            this.characterBuilder = new CharacterBuilder();
            await this.characterBuilder.init();
            console.log('✅ CharacterBuilder initialized');

            // Make accessible for debugging and global access
            window.characterBuilder = this.characterBuilder;
            window.gameDataManager = gameDataManager;

            this.initialized = true;
            console.log('🎉 Simplified Character Builder App ready!');

            // Show loading completion
            this.hideLoadingScreen();

        } catch (error) {
            console.error('❌ Failed to initialize Simplified Character Builder App:', error);
            this.showInitializationError(error);
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showInitializationError(error) {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="error-screen" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 60vh;
                    text-align: center;
                    padding: 2rem;
                ">
                    <h1 style="color: #f44336;">Initialization Error</h1>
                    <p>Failed to load the Simplified Character Builder. Please check the console for details.</p>
                    <p class="error-details" style="
                        background: #ffeaea;
                        border: 1px solid #f44336;
                        padding: 1rem;
                        border-radius: 4px;
                        margin: 1rem 0;
                        font-family: monospace;
                    ">Error: ${error.message}</p>
                    <p style="color: #666; margin: 1rem 0;">
                        This usually indicates a missing data file or JavaScript error.
                    </p>
                    <div>
                        <button id="refresh-page-btn" class="btn btn-primary" style="
                            background: #2196F3;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 0 5px;
                        ">Refresh Page</button>
                        <button id="back-to-hub-btn" class="btn btn-secondary" style="
                            background: #666;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 0 5px;
                        ">← Back to Hub</button>
                    </div>
                </div>
            `;

            // Add event listeners
            const refreshBtn = document.getElementById('refresh-page-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => location.reload());
            }

            const backBtn = document.getElementById('back-to-hub-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.location.href = '../index.html';
                });
            }
        }
    }

    // Health check method for debugging
    checkSystemHealth() {
        const health = {
            gameDataManager: !!gameDataManager.initialized,
            characterBuilder: !!this.characterBuilder?.initialized,
            archetypes: gameDataManager.getArchetypes(),
            boons: gameDataManager.getBoons(),
            tabsLoaded: this.characterBuilder ? Object.keys(this.characterBuilder.tabs) : []
        };

        console.log('🔍 System Health Check:', health);
        return health;
    }
}

// Initialize application
console.log('🌟 Starting Vitality System Character Builder v3.0 (Simplified)');
const app = new VitalityCharacterBuilderApp();
app.init();

// Make globally accessible for debugging
window.vitalityApp = app;
window.gameDataManager = gameDataManager;

// Add global health check function
window.checkHealth = () => app.checkSystemHealth();

// Log system info
console.log('💡 Debug Commands:');
console.log('  - window.checkHealth() - Check system status');
console.log('  - window.characterBuilder - Access character builder');
console.log('  - window.gameDataManager - Access game data');
console.log('  - window.vitalityApp - Access main app');