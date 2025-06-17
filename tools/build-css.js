// tools/build-css.js
const fs = require('fs').promises;
const path = require('path');

// Define the order of concatenation. This is the single source of truth.
const cssPartials = [
    // 1. Base styles (variables, globals, etc.)
    'base/_variables.css',
    'base/_globals.css',
    'base/_typography.css',
    'base/_layout.css',

    // 2. Reusable components
    'components/_buttons.css',
    'components/_cards.css',
    'components/_forms.css',
    'components/_tabs.css',
    'components/_tooltips.css',

    // 3. Tab-specific styles
    'tabs/_welcome-screen.css',
    'tabs/_identity.css',
    'tabs/_archetypes.css',
    'tabs/_attributes.css',
    'tabs/_main-pool.css',
    'tabs/_special-attacks.css',
    'tabs/_utility.css',
    'tabs/_summary.css',

    // 4. Utility classes (animations, helpers)
    'utils/_animations.css',
    'utils/_utilities.css',
    'utils/_misc.css'
];

// Define paths
const cssDir = path.join(__dirname, '..', 'frontend', 'character-builder', 'assets', 'css');
const outputFile = path.join(cssDir, 'character-builder.css');
const partialsDir = cssDir; // Partials are in subdirectories of the main css dir

async function buildCss() {
    console.log('🚀 Starting CSS build...');

    try {
        const fileContents = await Promise.all(
            cssPartials.map(partial => {
                const partialPath = path.join(partialsDir, partial);
                // Add comments to indicate the source of each partial in the final file
                const contentPromise = fs.readFile(partialPath, 'utf-8');
                return contentPromise.then(content => `/* --- Start of ${partial.replace(/\\/g, '/')} --- */\n${content}\n/* --- End of ${partial.replace(/\\/g, '/')} --- */\n`);
            })
        );

        const concatenatedCss = fileContents.join('\n');
        await fs.writeFile(outputFile, concatenatedCss);

        console.log(`✅ CSS build successful! ${fileContents.length} partials combined into character-builder.css`);

    } catch (error) {
        console.error('❌ CSS build failed:', error);
        process.exit(1); // Exit with an error code
    }
}

buildCss();