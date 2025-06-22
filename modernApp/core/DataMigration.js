
// modernApp/core/DataMigration.js
import { Logger } from '../utils/Logger.js';

/**
 * Handles the migration of character data from older schemas to the current version.
 * This ensures backward compatibility as the application evolves.
 */
export class DataMigration {
    // The target schema version for the application.
    // This should be updated whenever a breaking change is made to the character data structure.
    static CURRENT_VERSION = '4.0';

    /**
     * A map of migration functions. Each function migrates from one version to the next.
     * The key is the version to migrate *from*.
     * The functions must be ordered chronologically by version.
     */
    static migrations = new Map([
        // ['1.0', this.from_v1_to_v2], // Example for future migrations
        // ['2.0', this.from_v2_to_v3], // Example for future migrations
        ['3.0', this.from_v3_to_v4],   // A hypothetical migration
    ]);

    /**
     * Migrates character data to the current schema version.
     * It sequentially applies all necessary migration steps.
     * @param {Object} characterData - The character data to migrate. It may or may not have a schemaVersion property.
     * @returns {Object} The migrated character data, or the original data if no migration was needed or possible.
     */
    static migrate(characterData) {
        Logger.info('[DataMigration] Starting migration check...');

        if (!characterData || typeof characterData !== 'object') {
            Logger.error('[DataMigration] Cannot migrate invalid or null character data.');
            return null;
        }

        // Assume un-versioned data is an old version that needs migration. '3.0' is a placeholder.
        let currentVersion = characterData.schemaVersion || '3.0'; 
        Logger.info(`[DataMigration] Current data version: "${currentVersion}". Target version: "${this.CURRENT_VERSION}".`);

        if (currentVersion === this.CURRENT_VERSION) {
            Logger.info('[DataMigration] Data is already at the current version. No migration needed.');
            return characterData;
        }
        
        // Clone the data to avoid mutating the original object directly during the process.
        let migratedData = { ...characterData };

        // Loop through the migrations, applying them in order until the target version is reached.
        while (this.migrations.has(currentVersion) && currentVersion !== this.CURRENT_VERSION) {
            const migrationFunc = this.migrations.get(currentVersion);
            
            if (typeof migrationFunc !== 'function') {
                Logger.error(`[DataMigration] Invalid migration function found for version "${currentVersion}". Aborting.`);
                return characterData; // Return original data on error to prevent corruption.
            }
            
            try {
                Logger.info(`[DataMigration] Applying migration from version "${currentVersion}"...`);
                migratedData = migrationFunc(migratedData);
                currentVersion = migratedData.schemaVersion;
                Logger.info(`[DataMigration] Successfully migrated to version "${currentVersion}".`);
            } catch (error) {
                Logger.error(`[DataMigration] An error occurred during migration from version "${currentVersion}":`, error);
                return characterData; // Return original data to prevent saving a partially migrated, corrupt state.
            }
        }

        if (migratedData.schemaVersion !== this.CURRENT_VERSION) {
            Logger.warn(`[DataMigration] Migration ended at version "${migratedData.schemaVersion}", but target is "${this.CURRENT_VERSION}". The data may be partially migrated or a migration script may be missing.`);
        } else {
            Logger.info('[DataMigration] Migration process completed successfully.');
        }

        return migratedData;
    }

    /**
     * A hypothetical migration function from v3.0 to v4.0.
     * This demonstrates how to safely add, remove, or rename properties.
     * @param {Object} data - The character data in v3.0 format.
     * @returns {Object} The character data in v4.0 format.
     */
    static from_v3_to_v4(data) {
        Logger.debug('[DataMigration] Executing migration logic: v3.0 -> v4.0');
        let migrated = { ...data };

        // --- Example Migration Logic ---

        // 1. ADD: Ensure new top-level arrays from the v4 schema exist.
        Logger.debug('[DataMigration v3->v4] Ensuring top-level purchase arrays exist...');
        const requiredArrays = ['traits', 'flaws', 'boons', 'features', 'senses', 'specialAttacks'];
        requiredArrays.forEach(type => {
            if (!migrated[type] || !Array.isArray(migrated[type])) {
                migrated[type] = [];
                Logger.debug(`[DataMigration v3->v4] Added missing or invalid '${type}' array.`);
            }
        });

        // 2. MODIFY: Ensure 'archetypes' is a structured object, not just a single value.
        if (typeof migrated.archetype === 'string') {
            Logger.debug('[DataMigration v3->v4] Converting legacy "archetype" string to structured object.');
            // This is a guess. The actual logic would depend on the old structure.
            migrated.archetypes = { uniqueAbility: migrated.archetype }; 
            delete migrated.archetype;
        } else if (!migrated.archetypes || typeof migrated.archetypes !== 'object') {
             Logger.debug('[DataMigration v3->v4] Initializing archetypes as an object.');
             migrated.archetypes = {};
        }

        // 3. RENAME: An old property might be renamed for clarity.
        if (migrated.characterNotes) {
            Logger.debug('[DataMigration v3->v4] Renaming "characterNotes" to "bio".');
            migrated.bio = migrated.characterNotes;
            delete migrated.characterNotes;
        }

        // --- End of Example Logic ---

        // CRITICAL: Update the schema version on the migrated object.
        migrated.schemaVersion = '4.0';
        Logger.debug(`[DataMigration v3->v4] Set schemaVersion to "${migrated.schemaVersion}".`);

        return migrated;
    }
}
