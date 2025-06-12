#!/usr/bin/env node

const Brain = require('./Brain');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Character Plan Generator - Mass produces diverse character creation plans
 * for the Vitality Simulation & Optimization Engine
 */
class PlanGenerator {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.brain = null;
        this.conceptPrompts = null;
        this.rulebook = null;
        this.outputDir = path.join(__dirname, '..', '..', 'tests', 'plans');
        
        // Progress tracking
        this.totalPlans = 0;
        this.successfulPlans = 0;
        this.failedPlans = 0;
        this.startTime = null;
    }

    /**
     * Initialize the generator by loading dependencies
     */
    async initialize() {
        console.log('🧠 Initializing Plan Generator...');
        
        // Validate API key
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        
        // Initialize Brain
        this.brain = new Brain(this.apiKey);
        console.log('✅ Brain initialized');
        
        // Load concept prompts
        await this._loadConceptPrompts();
        console.log('✅ Concept prompts loaded');
        
        // Load rulebook
        await this._loadRulebook();
        console.log('✅ Rulebook loaded');
        
        // Ensure output directory exists
        await this._ensureOutputDirectory();
        console.log('✅ Output directory ready');
        
        console.log('🚀 Plan Generator ready!\n');
    }

    /**
     * Generate the specified number of character plans
     * @param {number} count - Number of plans to generate
     */
    async generatePlans(count = 10) {
        this.totalPlans = count;
        this.startTime = Date.now();
        
        console.log(`📋 Generating ${count} character plans...\n`);
        
        for (let i = 1; i <= count; i++) {
            await this._generateSinglePlan(i);
            
            // Progress update every 10 plans
            if (i % 10 === 0 || i === count) {
                this._reportProgress(i);
            }
            
            // Brief pause between requests to be API-friendly
            if (i < count) {
                await this._sleep(500);
            }
        }
        
        this._reportFinalStats();
    }

    /**
     * Generate a single character plan
     * @param {number} planNumber - The plan number for naming
     * @private
     */
    async _generateSinglePlan(planNumber) {
        const planId = planNumber.toString().padStart(3, '0');
        const filename = `plan_${planId}.json`;
        const filepath = path.join(this.outputDir, filename);
        
        try {
            console.log(`[${planId}] Generating concept...`);
            
            // Generate concept
            const concept = await this.brain.generateConcept(this.conceptPrompts);
            console.log(`[${planId}] Concept: "${concept.name}"`);
            
            // Generate plan
            console.log(`[${planId}] Generating plan...`);
            const plan = await this.brain.generatePlan(concept, this.rulebook);
            
            // Create plan file with metadata
            const planFile = {
                metadata: {
                    id: planId,
                    generatedAt: new Date().toISOString(),
                    concept: concept,
                    stepCount: plan.length,
                    generator: 'PlanGenerator v1.0'
                },
                steps: plan
            };
            
            // Save plan file
            await fs.writeFile(filepath, JSON.stringify(planFile, null, 2), 'utf8');
            
            console.log(`[${planId}] ✅ Plan saved (${plan.length} steps)`);
            this.successfulPlans++;
            
        } catch (error) {
            console.error(`[${planId}] ❌ Failed: ${error.message}`);
            this.failedPlans++;
            
            // Save error info for debugging
            const errorFile = {
                metadata: {
                    id: planId,
                    generatedAt: new Date().toISOString(),
                    error: error.message,
                    generator: 'PlanGenerator v1.0'
                },
                error: true
            };
            
            const errorPath = path.join(this.outputDir, `plan_${planId}_error.json`);
            await fs.writeFile(errorPath, JSON.stringify(errorFile, null, 2), 'utf8');
        }
    }

    /**
     * Load concept prompts from file
     * @private
     */
    async _loadConceptPrompts() {
        const promptPath = path.join(__dirname, '..', '..', 'tests', 'prompts', '01_generate_build_concept.txt');
        
        try {
            this.conceptPrompts = await fs.readFile(promptPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to load concept prompts from ${promptPath}: ${error.message}`);
        }
    }

    /**
     * Load rulebook from file
     * @private
     */
    async _loadRulebook() {
        const rulebookPath = path.join(__dirname, '..', '..', 'rulebook', 'rules', 'rulebook.md');
        
        try {
            const rulebookContent = await fs.readFile(rulebookPath, 'utf8');
            // Truncate rulebook if too long for API limits (keep first 50k chars)
            this.rulebook = rulebookContent.length > 50000 
                ? rulebookContent.substring(0, 50000) + '\n\n[Content truncated for API limits]'
                : rulebookContent;
        } catch (error) {
            throw new Error(`Failed to load rulebook from ${rulebookPath}: ${error.message}`);
        }
    }

    /**
     * Ensure output directory exists
     * @private
     */
    async _ensureOutputDirectory() {
        try {
            await fs.access(this.outputDir);
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
        }
        
        // Create .gitignore to exclude generated files
        const gitignorePath = path.join(this.outputDir, '.gitignore');
        const gitignoreContent = '# Generated plan files\n*.json\n!.gitignore\n!README.md\n';
        
        try {
            await fs.access(gitignorePath);
        } catch {
            await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
        }
    }

    /**
     * Report progress during generation
     * @param {number} current - Current plan number
     * @private
     */
    _reportProgress(current) {
        const elapsed = Date.now() - this.startTime;
        const rate = current / (elapsed / 1000);
        const eta = ((this.totalPlans - current) / rate) / 60;
        
        console.log(`\n📊 Progress: ${current}/${this.totalPlans} (${Math.round(current/this.totalPlans*100)}%)`);
        console.log(`   ✅ Successful: ${this.successfulPlans}`);
        console.log(`   ❌ Failed: ${this.failedPlans}`);
        console.log(`   ⏱️  Rate: ${rate.toFixed(1)} plans/sec`);
        console.log(`   🔮 ETA: ${eta.toFixed(1)} minutes\n`);
    }

    /**
     * Report final generation statistics
     * @private
     */
    _reportFinalStats() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const rate = this.totalPlans / elapsed;
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 PLAN GENERATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`📋 Total Plans: ${this.totalPlans}`);
        console.log(`✅ Successful: ${this.successfulPlans} (${Math.round(this.successfulPlans/this.totalPlans*100)}%)`);
        console.log(`❌ Failed: ${this.failedPlans} (${Math.round(this.failedPlans/this.totalPlans*100)}%)`);
        console.log(`⏱️  Total Time: ${elapsed.toFixed(1)} seconds`);
        console.log(`📈 Average Rate: ${rate.toFixed(1)} plans/sec`);
        
        const brainStats = this.brain.getStats();
        console.log(`🧠 API Requests: ${brainStats.requestCount}`);
        console.log(`📁 Output Directory: ${this.outputDir}`);
        
        if (this.failedPlans > 0) {
            console.log(`\n⚠️  ${this.failedPlans} plans failed. Check *_error.json files for details.`);
        }
        
        console.log('\n🎯 Plans ready for Playwright testing!');
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        count: 10,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--count' || arg === '-c') {
            const count = parseInt(args[i + 1]);
            if (isNaN(count) || count < 1) {
                throw new Error('Count must be a positive integer');
            }
            options.count = count;
            i++; // Skip next argument
        } else if (!isNaN(parseInt(arg))) {
            // Positional argument for count
            options.count = parseInt(arg);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    
    return options;
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
Vitality Character Plan Generator

USAGE:
  node generate_plans.js [OPTIONS] [COUNT]

OPTIONS:
  -c, --count <number>   Number of plans to generate (default: 10)
  -h, --help            Show this help message

EXAMPLES:
  node generate_plans.js                 # Generate 10 plans
  node generate_plans.js 50              # Generate 50 plans
  node generate_plans.js --count 100     # Generate 100 plans

ENVIRONMENT:
  GEMINI_API_KEY         Required: Your Google AI API key

OUTPUT:
  Generated plans will be saved to tests/plans/ directory
  Each plan is a JSON file with metadata and executable steps
`);
}

/**
 * Main execution
 */
async function main() {
    try {
        const options = parseArgs();
        
        if (options.help) {
            showHelp();
            return;
        }
        
        const generator = new PlanGenerator();
        await generator.initialize();
        await generator.generatePlans(options.count);
        
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        
        if (error.message.includes('GEMINI_API_KEY')) {
            console.error('\n💡 Make sure to set your GEMINI_API_KEY environment variable:');
            console.error('   export GEMINI_API_KEY="your-api-key-here"');
            console.error('   or create a .env file with GEMINI_API_KEY=your-api-key-here');
        }
        
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = PlanGenerator;