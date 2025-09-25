// modernApp/core/DataMigration.js
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced DataMigration with proper version handling and comprehensive debugging
 * Handles the migration of character data from older schemas to the current version.
 */
export class DataMigration {
    // The target schema version - using string for consistency
    static CURRENT_VERSION = '4.0';

    /**
     * Migration functions map - each function migrates from one version to the next
     */
    static migrations = new Map([
        ['1', (data) => DataMigration._migrateTo2(data)],
        ['1.0', (data) => DataMigration._migrateTo2(data)],
        ['2', (data) => DataMigration._migrateTo3(data)],
        ['2.0', (data) => DataMigration._migrateTo3(data)],
        ['3', (data) => DataMigration._migrateTo4(data)],
        ['3.0', (data) => DataMigration._migrateTo4(data)],
        ['4', (data) => DataMigration._migrateTo4_0(data)], // Fix for version mismatch
        ['4.0', (data) => data] // Already current version
    ]);

    /**
     * Migrates character data to the current version with enhanced debugging
     * @param {Object} characterData - The character data to migrate
     * @returns {Object} - The migrated character data
     */
    static async migrate(characterData) {
        if (!characterData) {
            Logger.error('[DataMigration] Cannot migrate null character data');
            throw new Error('Character data is required for migration');
        }

        let currentVersion = characterData.schemaVersion || characterData.version || '1';
        
        // Normalize version to string for consistent comparison
        currentVersion = String(currentVersion);
        
        Logger.info(`[DataMigration] Starting migration from version "${currentVersion}" to "${this.CURRENT_VERSION}"`);

        // If already current version, return as-is
        if (currentVersion === this.CURRENT_VERSION) {
            Logger.debug('[DataMigration] Data is already at current version, no migration needed');
            return characterData;
        }

        let migrationData = JSON.parse(JSON.stringify(characterData)); // Deep copy
        let migrationPath = [];
        let migrationCount = 0;
        const maxMigrations = 10; // Prevent infinite loops

        try {
            while (currentVersion !== this.CURRENT_VERSION && migrationCount < maxMigrations) {
                Logger.debug(`[DataMigration] Attempting migration from version "${currentVersion}"`);
                
                const migrationFunction = this.migrations.get(currentVersion);
                
                if (!migrationFunction) {
                    Logger.error(`[DataMigration] No migration path found for version "${currentVersion}"`);
                    Logger.debug('[DataMigration] Available migration versions:', Array.from(this.migrations.keys()));
                    throw new Error(`No migration available for version "${currentVersion}"`);
                }

                const previousVersion = currentVersion;
                const previousData = JSON.parse(JSON.stringify(migrationData));
                
                Logger.debug(`[DataMigration] Executing migration function for version "${currentVersion}"`);
                migrationData = migrationFunction(migrationData);
                
                // Update version
                currentVersion = migrationData.schemaVersion || migrationData.version || this.CURRENT_VERSION;
                currentVersion = String(currentVersion);
                
                migrationPath.push({
                    from: previousVersion,
                    to: currentVersion,
                    timestamp: Date.now()
                });
                
                migrationCount++;
                
                Logger.info(`[DataMigration] Migration step ${migrationCount}: "${previousVersion}" → "${currentVersion}"`);
                
                // Validate migration didn't break the data
                if (!migrationData.id || !migrationData.name) {
                    Logger.error('[DataMigration] Migration corrupted essential data:', {
                        id: migrationData.id,
                        name: migrationData.name,
                        fromVersion: previousVersion,
                        toVersion: currentVersion
                    });
                    throw new Error(`Migration from "${previousVersion}" to "${currentVersion}" corrupted character data`);
                }
            }

            if (migrationCount >= maxMigrations) {
                Logger.error(`[DataMigration] Migration exceeded maximum attempts (${maxMigrations})`);
                throw new Error('Migration failed: too many steps required');
            }

            // Ensure final version is set correctly
            migrationData.schemaVersion = this.CURRENT_VERSION;
            if (migrationData.version) {
                delete migrationData.version; // Remove old version field
            }

            Logger.info(`[DataMigration] Migration completed successfully:`, {
                finalVersion: this.CURRENT_VERSION,
                migrationSteps: migrationCount,
                migrationPath: migrationPath.map(step => `${step.from}→${step.to}`).join(' → '),
                characterName: migrationData.name,
                characterId: migrationData.id
            });

            return migrationData;

        } catch (error) {
            Logger.error('[DataMigration] Migration failed:', {
                error: error.message,
                originalVersion: characterData.schemaVersion || characterData.version,
                currentVersion,
                migrationPath,
                characterName: characterData.name,
                characterId: characterData.id
            });
            throw error;
        }
    }

    /**
     * Migration function: v1 → v2
     */
    static _migrateTo2(data) {
        Logger.debug('[DataMigration] Migrating to version 2.0');
        
        const migrated = { ...data };
        
        // Add basic structure improvements for v2
        if (!migrated.archetypes) {
            migrated.archetypes = {};
        }
        
        if (!migrated.attributes) {
            migrated.attributes = {
                power: 8,
                endurance: 8,
                agility: 8,
                intellect: 8,
                awareness: 8,
                will: 8
            };
        }
        
        migrated.schemaVersion = '2.0';
        return migrated;
    }

    /**
     * Migration function: v2 → v3
     */
    static _migrateTo3(data) {
        Logger.debug('[DataMigration] Migrating to version 3.0');
        
        const migrated = { ...data };
        
        // Add pools structure for v3
        if (!migrated.pools) {
            migrated.pools = {
                mainPool: { available: 300, spent: 0 },
                combatAttributes: { available: 70, spent: 0 },
                utilityAttributes: { available: 70, spent: 0 }
            };
        }
        
        // Add purchases tracking
        if (!migrated.purchases) {
            migrated.purchases = {
                flaws: [],
                traits: [],
                boons: [],
                uniqueAbilities: [],
                actionUpgrades: []
            };
        }
        
        migrated.schemaVersion = '3.0';
        return migrated;
    }

    /**
     * Migration function: v3 → v4
     */
    static _migrateTo4(data) {
        Logger.debug('[DataMigration] Migrating to version 4.0');
        
        const migrated = { ...data };
        
        // Add unified purchase system for v4
        if (!migrated.unifiedPurchases) {
            migrated.unifiedPurchases = [];
            
            // Migrate old purchases to unified format
            if (migrated.purchases) {
                Object.entries(migrated.purchases).forEach(([category, items]) => {
                    items.forEach(item => {
                        migrated.unifiedPurchases.push({
                            id: item.id || `migrated_${category}_${Date.now()}`,
                            category,
                            entityId: item.entityId || item.id,
                            data: item,
                            timestamp: Date.now()
                        });
                    });
                });
            }
        }
        
        migrated.schemaVersion = '4.0';
        return migrated;
    }

    /**
     * Migration function: v4 (string) → v4.0 (string) - Fix version mismatch
     */
    static _migrateTo4_0(data) {
        Logger.debug('[DataMigration] Migrating from version "4" to "4.0" (version format fix)');
        
        const migrated = { ...data };
        
        // Ensure all v4.0 features are present
        if (!migrated.unifiedPurchases) {
            migrated.unifiedPurchases = [];
        }
        
        // Ensure correct version format
        migrated.schemaVersion = '4.0';
        
        // Remove old version field if present
        if (migrated.version) {
            delete migrated.version;
        }
        
        Logger.debug('[DataMigration] Version format migration complete');
        return migrated;
    }

    /**
     * Validates that character data has required fields for the current version
     */
    static validate(characterData) {
        const requiredFields = ['id', 'name', 'schemaVersion'];
        const missing = requiredFields.filter(field => !characterData[field]);
        
        if (missing.length > 0) {
            Logger.error('[DataMigration] Validation failed - missing required fields:', missing);
            return false;
        }
        
        if (characterData.schemaVersion !== this.CURRENT_VERSION) {
            Logger.warn(`[DataMigration] Validation warning - version mismatch: expected "${this.CURRENT_VERSION}", got "${characterData.schemaVersion}"`);
            return false;
        }
        
        Logger.debug('[DataMigration] Validation passed');
        return true;
    }

    /**
     * Gets migration information for debugging
     */
    static getMigrationInfo() {
        return {
            currentVersion: this.CURRENT_VERSION,
            availableMigrations: Array.from(this.migrations.keys()),
            migrationCount: this.migrations.size
        };
    }

    /**
     * Checks if a version can be migrated to current
     */
    static canMigrate(version) {
        const versionStr = String(version);
        
        if (versionStr === this.CURRENT_VERSION) {
            return true;
        }
        
        return this.migrations.has(versionStr);
    }
}