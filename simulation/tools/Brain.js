const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

/**
 * Brain class - Encapsulates LLM API interactions for character plan generation
 * Handles concept generation and detailed plan creation with error handling and logging
 */
class Brain {
    constructor(apiKey, modelName = 'gemini-1.5-flash') {
        if (!apiKey) {
            throw new Error('API key is required for Brain initialization');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.modelName = modelName;
        this.requestCount = 0;
        this.logger = console; // Can be replaced with custom logger
        
        // Request configuration
        this.generationConfig = {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
        };
        
        // Retry configuration
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Generate a character concept based on a prompt
     * @param {string} prompt - The concept generation prompt
     * @returns {Promise<Object>} - Generated concept with name and focus
     */
    async generateConcept(prompt) {
        this.logger.log(`[Brain] Generating concept (Request #${++this.requestCount})`);
        
        try {
            const response = await this._makeRequest(prompt);
            const concept = this._parseConceptResponse(response);
            
            this.logger.log(`[Brain] Concept generated: "${concept.name}"`);
            return concept;
        } catch (error) {
            this.logger.error(`[Brain] Concept generation failed:`, error.message);
            throw error;
        }
    }

    /**
     * Generate a detailed character creation plan
     * @param {Object} concept - The character concept {name, focus}
     * @param {string} rulebook - The complete game rulebook text
     * @returns {Promise<Array>} - Array of step objects for character creation
     */
    async generatePlan(concept, rulebook) {
        this.logger.log(`[Brain] Generating plan for "${concept.name}" (Request #${++this.requestCount})`);
        
        const planPrompt = this._buildPlanPrompt(concept, rulebook);
        
        try {
            const response = await this._makeRequest(planPrompt);
            const plan = this._parsePlanResponse(response);
            
            this.logger.log(`[Brain] Plan generated with ${plan.length} steps`);
            return plan;
        } catch (error) {
            this.logger.error(`[Brain] Plan generation failed for "${concept.name}":`, error.message);
            throw error;
        }
    }

    /**
     * Make a request to the LLM with retry logic
     * @param {string} prompt - The prompt to send
     * @returns {Promise<string>} - The response text
     * @private
     */
    async _makeRequest(prompt) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.logger.log(`[Brain] API request attempt ${attempt}/${this.maxRetries}`);
                
                const result = await this.model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: this.generationConfig,
                });

                if (!result.response) {
                    throw new Error('No response received from API');
                }

                const responseText = result.response.text();
                if (!responseText || responseText.trim().length === 0) {
                    throw new Error('Empty response received from API');
                }

                this.logger.log(`[Brain] API request successful (${responseText.length} chars)`);
                return responseText;
                
            } catch (error) {
                lastError = error;
                this.logger.warn(`[Brain] API request attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * attempt; // Exponential backoff
                    this.logger.log(`[Brain] Retrying in ${delay}ms...`);
                    await this._sleep(delay);
                }
            }
        }
        
        throw new Error(`All ${this.maxRetries} API request attempts failed. Last error: ${lastError.message}`);
    }

    /**
     * Parse concept response and validate JSON structure
     * @param {string} response - Raw API response
     * @returns {Object} - Parsed concept {name, focus}
     * @private
     */
    _parseConceptResponse(response) {
        try {
            // Extract JSON from response (handles markdown code blocks)
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.trim();
            
            const concept = JSON.parse(jsonStr);
            
            // Validate required fields
            if (!concept.name || !concept.focus) {
                throw new Error('Concept must have "name" and "focus" fields');
            }
            
            if (typeof concept.name !== 'string' || typeof concept.focus !== 'string') {
                throw new Error('Concept name and focus must be strings');
            }
            
            return {
                name: concept.name.trim(),
                focus: concept.focus.trim()
            };
            
        } catch (error) {
            throw new Error(`Failed to parse concept response: ${error.message}. Response: ${response.substring(0, 200)}...`);
        }
    }

    /**
     * Parse plan response and validate structure
     * @param {string} response - Raw API response
     * @returns {Array} - Array of step objects
     * @private
     */
    _parsePlanResponse(response) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.trim();
            
            const plan = JSON.parse(jsonStr);
            
            // Validate plan is an array
            if (!Array.isArray(plan)) {
                throw new Error('Plan must be an array of steps');
            }
            
            // Validate each step has required fields
            plan.forEach((step, index) => {
                if (!step.action || !step.payload) {
                    throw new Error(`Step ${index + 1} must have "action" and "payload" fields`);
                }
                
                if (typeof step.action !== 'string') {
                    throw new Error(`Step ${index + 1} action must be a string`);
                }
                
                if (typeof step.payload !== 'object') {
                    throw new Error(`Step ${index + 1} payload must be an object`);
                }
            });
            
            return plan;
            
        } catch (error) {
            throw new Error(`Failed to parse plan response: ${error.message}. Response: ${response.substring(0, 200)}...`);
        }
    }

    /**
     * Build the plan generation prompt
     * @param {Object} concept - Character concept
     * @param {string} rulebook - Game rulebook text
     * @returns {string} - Complete plan prompt
     * @private
     */
    _buildPlanPrompt(concept, rulebook) {
        return `You are an expert Vitality RPG character builder. Create a detailed, step-by-step character creation plan.

CHARACTER CONCEPT:
Name: ${concept.name}
Focus: ${concept.focus}

GAME RULES:
${rulebook}

INSTRUCTIONS:
Create a JSON array of steps to build this character. Each step should have:
- "action": The type of action (e.g., "choose_archetypes", "distribute_attributes", "design_special_attack")
- "payload": An object containing the specific choices for that step

VALID ACTIONS:
- "choose_archetypes": Select movement, utility, and combat archetypes
- "distribute_attributes": Allocate points to combat and utility attributes
- "purchase_traits": Buy traits and flaws from the main pool
- "design_special_attack": Create a custom special attack
- "select_utility_abilities": Choose utility abilities and expertise
- "set_basic_info": Set character name, background, etc.

REQUIREMENTS:
- Plan must be executable by the Vitality character builder
- All choices must be valid according to the game rules
- Plan should create a viable, balanced character
- Include at least 4-6 steps covering major character creation areas
- Ensure the character matches the concept's focus and playstyle

Return only the JSON array, wrapped in markdown code blocks.`;
    }

    /**
     * Sleep utility for retry delays
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current request statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        return {
            modelName: this.modelName,
            requestCount: this.requestCount,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay
        };
    }
}

module.exports = Brain;