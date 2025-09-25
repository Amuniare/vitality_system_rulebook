
// tests/utils/constants.js

export const BASE_URL = 'http://[::1]:8000/modernApp/index.html'; // Main entry point for the app

export const DEFAULT_TIMEOUT = 30000; // Default timeout for Playwright actions (ms)
export const APP_LOAD_TIMEOUT = 15000; // Timeout for initial app load (ms)

export const TAB_IDS = {
  BASIC_INFO: 'basic-info',
  ARCHETYPES: 'archetypes',
  ATTRIBUTES: 'attributes', // Assuming this will be the ID
  MAIN_POOL: 'main-pool',
  SPECIAL_ATTACKS: 'special-attacks', // Assuming
  UTILITY: 'utility', // Assuming
  SUMMARY: 'summary', // Assuming
  BASE_ATTACKS: 'base-attacks' // For the new tab
};

export const TAB_BUTTON_SELECTORS = {
  [TAB_IDS.BASIC_INFO]: 'button[data-tab="basic-info"]',
  [TAB_IDS.ARCHETYPES]: 'button[data-tab="archetypes"]',
  // Add other tab button selectors as they are defined in index.html
  [TAB_IDS.MAIN_POOL]: 'button[data-tab="main-pool"]',
};


export const OUTPUT_DIR_BASE = './output'; // Base for test artifacts

// Example selectors (these will need to be specific to your app's DOM)
export const CHARACTER_NAME_INPUT = '#character-name';
export const CHARACTER_TIER_SELECT = '#character-tier';
export const SAVE_BASIC_INFO_BUTTON = 'button[data-action="save-basic-info"]';

// Point pool display selectors (assuming IDs)
export const MAIN_POOL_DISPLAY = '#main-pool-points-display';
// Add other pool display selectors

// Add other constants like error messages, specific URLs, etc.
