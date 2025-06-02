// CharacterBuilder.js - DIAGNOSTIC VERSION
import { VitalityCharacter } from '../core/VitalityCharacter.js';

export class CharacterBuilder {
    constructor() {
        console.log('🟡 CharacterBuilder constructor started');
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.currentTab = 'basicInfo';
        this.initialized = false;
        console.log('✅ CharacterBuilder constructor completed');
    }

    async init() {
        try {
            console.log('🟡 CharacterBuilder.init() started');
            
            // Check if DOM is ready
            if (document.readyState === 'loading') {
                console.log('⚠️ DOM still loading, waiting for DOMContentLoaded');
                return new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('✅ DOMContentLoaded fired, continuing init');
                        this.initAfterDOM().then(resolve);
                    });
                });
            } else {
                console.log('✅ DOM already ready, continuing init');
                await this.initAfterDOM();
            }
            
        } catch (error) {
            console.error('❌ CharacterBuilder initialization failed:', error);
            throw error;
        }
    }

    async initAfterDOM() {
        console.log('🟡 initAfterDOM started');
        
        // Test if button exists BEFORE setting up listeners
        this.testButtonExistence();
        
        // Initialize components with error handling
        try {
            console.log('🟡 Initializing components...');
            this.initializeComponents();
            console.log('✅ Components initialized');
        } catch (error) {
            console.error('❌ Component initialization failed:', error);
            // Continue anyway for debugging
        }
        
        // Initialize tabs with error handling  
        try {
            console.log('🟡 Initializing tabs...');
            this.initializeTabs();
            console.log('✅ Tabs initialized');
        } catch (error) {
            console.error('❌ Tab initialization failed:', error);
            // Continue anyway for debugging
        }
        
        // Set up event listeners
        console.log('🟡 Setting up event listeners...');
        this.setupEventListeners();
        console.log('✅ Event listeners setup completed');
        
        // Show welcome screen
        console.log('🟡 Showing welcome screen...');
        this.showWelcomeScreen();
        console.log('✅ Welcome screen shown');
        
        this.initialized = true;
        console.log('✅ CharacterBuilder fully initialized');
    }

    testButtonExistence() {
        console.log('🔍 Testing button existence...');
        const newCharacterBtn = document.getElementById('new-character-btn');
        
        if (newCharacterBtn) {
            console.log('✅ new-character-btn found:', newCharacterBtn);
            console.log('Button details:', {
                id: newCharacterBtn.id,
                className: newCharacterBtn.className,
                textContent: newCharacterBtn.textContent,
                disabled: newCharacterBtn.disabled
            });
        } else {
            console.error('❌ new-character-btn NOT FOUND!');
            console.log('Available elements with buttons:', document.querySelectorAll('button'));
            console.log('Available elements with IDs:', 
                Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
    }

    initializeComponents() {
        console.log('🟡 Initializing UI components...');
        // Simplified - remove components that might be missing
        this.characterTree = { render: () => console.log('CharacterTree.render() called') };
        this.pointPoolDisplay = { update: () => console.log('PointPoolDisplay.update() called') };
        this.validationDisplay = { update: () => console.log('ValidationDisplay.update() called') };
        console.log('✅ Components created (mock versions)');
    }

    initializeTabs() {
        console.log('🟡 Creating tabs...');
        // Simplified - remove tabs that might be missing
        this.tabs = {
            basicInfo: { render: () => console.log('BasicInfoTab.render() called') }
        };
        console.log('✅ Tabs created (mock versions)');
    }

    setupEventListeners() {
        console.log('🟡 setupEventListeners started');
        
        // Test button existence again
        const newCharacterBtn = document.getElementById('new-character-btn');
        console.log('Button found in setupEventListeners:', !!newCharacterBtn);
        
        if (newCharacterBtn) {
            console.log('✅ Button found, adding event listener...');
            
            // Add listener with extensive logging
            newCharacterBtn.addEventListener('click', (e) => {
                console.log('🎉 NEW CHARACTER BUTTON CLICKED!', e);
                console.log('Event details:', {
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget
                });
                
                try {
                    this.createNewCharacter();
                } catch (error) {
                    console.error('❌ Error in createNewCharacter:', error);
                }
            });
            
            console.log('✅ Event listener added successfully');
            
            // Test click programmatically
            console.log('🧪 Testing programmatic click...');
            setTimeout(() => {
                console.log('Triggering test click...');
                newCharacterBtn.click();
            }, 1000);
            
        } else {
            console.error('❌ Button not found in setupEventListeners!');
        }
        
        console.log('✅ setupEventListeners completed');
    }

    createNewCharacter() {
        console.log('🟡 createNewCharacter called');
        
        try {
            const name = prompt('Character name:') || 'New Character';
            console.log('Character name entered:', name);
            
            const character = new VitalityCharacter(null, name);
            console.log('VitalityCharacter created:', character);
            
            this.characters[character.id] = character;
            console.log('Character added to collection:', this.characters);
            
            this.saveCharacters();
            console.log('Characters saved');
            
            this.loadCharacter(character.id);
            console.log('Character loaded');
            
            this.characterTree.render();
            console.log('Character tree rendered');
            
            console.log('✅ createNewCharacter completed successfully');
            
        } catch (error) {
            console.error('❌ Error in createNewCharacter:', error);
            alert('Error creating character: ' + error.message);
        }
    }

    loadCharacter(characterId) {
        console.log('🟡 loadCharacter called with ID:', characterId);
        this.currentCharacter = this.characters[characterId];
        if (this.currentCharacter) {
            this.showCharacterBuilder();
            this.updateAllDisplays();
            this.switchTab('basicInfo');
        }
    }

    showWelcomeScreen() {
        console.log('🟡 showWelcomeScreen called');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        console.log('Welcome screen element:', !!welcomeScreen);
        console.log('Character builder element:', !!characterBuilder);
        
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (characterBuilder) characterBuilder.classList.add('hidden');
        
        this.characterTree.render();
    }

    showCharacterBuilder() {
        console.log('🟡 showCharacterBuilder called');
        const welcomeScreen = document.getElementById('welcome-screen');
        const characterBuilder = document.getElementById('character-builder');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (characterBuilder) characterBuilder.classList.remove('hidden');
    }

    updateAllDisplays() {
        console.log('🟡 updateAllDisplays called');
        if (!this.currentCharacter) return;
        
        this.pointPoolDisplay.update();
        this.validationDisplay.update();
        this.characterTree.render();
    }

    switchTab(tabName) {
        console.log('🟡 switchTab called with:', tabName);
        // Simplified implementation
    }

    updateCharacter() {
        console.log('🟡 updateCharacter called');
        if (!this.currentCharacter) return;
        
        this.currentCharacter.touch();
        this.updateAllDisplays();
    }

    // Storage methods
    loadCharacters() {
        console.log('🟡 loadCharacters called');
        return {}; // Start with empty character list
    }

    saveCharacters() {
        console.log('🟡 saveCharacters called (no-op)');
        // No-op - we only download individual files now
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Notification (${type}):`, message);
        alert(`${type.toUpperCase()}: ${message}`);
    }
}