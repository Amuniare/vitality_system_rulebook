// CharacterExtractor.js - Custom Roll20 API Script for Character Data Extraction
// Install this in your Roll20 campaign's API Scripts section

on('ready', function() {
    log('CharacterExtractor API loaded successfully');
});

on('chat:message', function(msg) {
    if (msg.type !== 'api') return;
    
    const args = msg.content.split(' ');
    const command = args[0];
    const TEMPLATE_SHEETS = ['MacroMule', 'ScriptCards_TemplateMule'];  

    
    try {
        switch(command) {
            case '!extract-character':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !extract-character CharacterName');
                    return;
                }
                const charName = args.slice(1).join(' ');
                extractSingleCharacter(charName, msg.who);
                break;
                
            case '!extract-all':
                extractAllCharacters(msg.who);
                break;
                
            case '!extract-list':
                listAllCharacters(msg.who);
                break;
                
            case '!extract-test':
                testExtraction(msg.who);
                break;

            case '!extract-all-handout':
                extractAllCharactersToHandouts(msg.who);
                break;
                
            case '!get-character-data':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !get-character-data CharacterName');
                    return;
                }
                const getCharName = args.slice(1).join(' ');
                getCurrentCharacterData(getCharName, msg.who);
                break;
                
            case '!handout-open':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !handout-open HandoutName');
                    return;
                }
                const openHandoutName = args.slice(1).join(' ');
                openHandout(openHandoutName, msg.who);
                break;
                
            case '!handout-close':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !handout-close HandoutName');
                    return;
                }
                const closeHandoutName = args.slice(1).join(' ');
                closeHandout(closeHandoutName, msg.who);
                break;
                
            case '!handout-delete':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !handout-delete HandoutName');
                    return;
                }
                const deleteHandoutName = args.slice(1).join(' ');
                deleteHandout(deleteHandoutName, msg.who);
                break;
                
            case '!handout-cleanup':
                cleanupExtractionHandouts(msg.who);
                break;

            case '!update-character':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !update-character CharacterName');
                    return;
                }
                const updateCharName = args.slice(1).join(' ');
                updateCharacterFromHandout(updateCharName, msg.who);
                break;
            
            case '!create-character':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !create-character CharacterName');
                    return;
                }
                const createCharName = args.slice(1).join(' ');
                createCharacterFromHandout(createCharName, msg.who);
                break;
            
            case '!bulk-update':
                bulkUpdateFromHandout(msg.who);
                break;

            case '!handout-cleanup-updates':
                cleanupUpdateHandouts(msg.who);
                break;
        }

    } catch (error) {
        log('CharacterExtractor Error: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + msg.who + ' Error: ' + error.toString());
    }
});

// ============================================================================
// NEW: CURRENT CHARACTER DATA EXTRACTION
// ============================================================================

function getCurrentCharacterData(characterName, requestor) {
    /**
     * Extract current character data for comparison purposes
     */
    try {
        log('Getting current data for character: ' + characterName);
        
        const characters = findObjs({
            _type: 'character',
            name: characterName
        });
        
        if (characters.length === 0) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Character "' + characterName + '" not found.');
            return;
        }
        
        if (characters.length > 1) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Multiple characters named "' + characterName + '" found. Using first one.');
        }
        
        const character = characters[0];
        const characterData = extractCharacterData(character);
        
        if (characterData) {
            // Send as formatted JSON for comparison
            const jsonOutput = 'CURRENT_DATA_START\n' + JSON.stringify(characterData, null, 2) + '\nCURRENT_DATA_END';
            sendChat('CharacterExtractor', '/w ' + requestor + ' Current data extracted for: ' + characterName);
            sendChat('CharacterExtractor', '/w ' + requestor + ' ' + jsonOutput);
        } else {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to extract current data for: ' + characterName);
        }
        
    } catch (error) {
        log('Error getting current character data: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error getting current data: ' + error.toString());
    }
}

// ============================================================================
// HANDOUT UTILITY FUNCTIONS
// ============================================================================

function openHandout(handoutName, requestor) {
    /**
     * Opens a handout by name - this triggers Roll20's UI to open the handout dialog
     */
    try {
        const handouts = findObjs({
            _type: 'handout',
            name: handoutName
        });
        
        if (handouts.length === 0) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Handout "' + handoutName + '" not found.');
            return false;
        }
        
        const handout = handouts[0];
        
        // Force the handout to update, which should trigger UI refresh
        handout.set({
            notes: handout.get('notes') // This forces a refresh
        });
        
        sendChat('CharacterExtractor', '/w ' + requestor + ' Opened handout "' + handoutName + '". Check your Journal tab.');
        return true;
        
    } catch (error) {
        log('Error opening handout: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error opening handout: ' + error.toString());
        return false;
    }
}

function closeHandout(handoutName, requestor) {
    /**
     * Closes a handout (this is more of a notification since API can't directly close UI)
     */
    sendChat('CharacterExtractor', '/w ' + requestor + ' To close handout "' + handoutName + '", click the X button in the handout dialog or press Escape.');
}

function deleteHandout(handoutName, requestor) {
    /**
     * Deletes a handout by name
     */
    try {
        const handouts = findObjs({
            _type: 'handout',
            name: handoutName
        });
        
        if (handouts.length === 0) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Handout "' + handoutName + '" not found.');
            return false;
        }
        
        // Delete all handouts with this name
        let deletedCount = 0;
        handouts.forEach(function(handout) {
            handout.remove();
            deletedCount++;
        });
        
        sendChat('CharacterExtractor', '/w ' + requestor + ' Deleted ' + deletedCount + ' handout(s) named "' + handoutName + '".');
        return true;
        
    } catch (error) {
        log('Error deleting handout: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error deleting handout: ' + error.toString());
        return false;
    }
}

function cleanupExtractionHandouts(requestor) {
    /**
     * Deletes all CharacterExtractor handouts for cleanup
     */
    try {
        const handouts = findObjs({
            _type: 'handout'
        });
        
        let deletedCount = 0;
        handouts.forEach(function(handout) {
            const name = handout.get('name');
            if (name.startsWith('CharacterExtractor_Data')) {
                handout.remove();
                deletedCount++;
            }
        });
        
        sendChat('CharacterExtractor', '/w ' + requestor + ' Cleanup complete: deleted ' + deletedCount + ' extraction handout(s).');
        
    } catch (error) {
        log('Error during cleanup: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error during cleanup: ' + error.toString());
    }
}

function cleanupUpdateHandouts(requestor) {
    /**
     * Deletes all CharacterUpdater handouts for cleanup
     */
    try {
        const handouts = findObjs({
            _type: 'handout'
        });
        
        let deletedCount = 0;
        handouts.forEach(function(handout) {
            const name = handout.get('name');
            if (name.startsWith('CharacterUpdater_')) {
                handout.remove();
                deletedCount++;
            }
        });
        
        sendChat('CharacterExtractor', '/w ' + requestor + ' Update cleanup complete: deleted ' + deletedCount + ' update handout(s).');
        
    } catch (error) {
        log('Error during update cleanup: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error during update cleanup: ' + error.toString());
    }
}

// ============================================================================
// ORIGINAL EXTRACTION FUNCTIONS (UNCHANGED)
// ============================================================================

function extractSingleCharacter(characterName, requestor) {
    log('Extracting character: ' + characterName);
    
    const characters = findObjs({
        _type: 'character',
        name: characterName
    });
    
    if (characters.length === 0) {
        sendChat('CharacterExtractor', '/w ' + requestor + ' Character "' + characterName + '" not found.');
        return;
    }
    
    if (characters.length > 1) {
        sendChat('CharacterExtractor', '/w ' + requestor + ' Multiple characters named "' + characterName + '" found. Using first one.');
    }
    
    const character = characters[0];
    const characterData = extractCharacterData(character);
    
    // Send as formatted JSON
    const jsonOutput = 'EXTRACT_SINGLE_START\n' + JSON.stringify(characterData, null, 2) + '\nEXTRACT_SINGLE_END';
    sendChat('CharacterExtractor', '/w ' + requestor + ' ' + jsonOutput);
}

function extractAllCharacters(requestor) {
    log('Extracting all characters...');
    
    const characters = findObjs({
        _type: 'character'
    });
    
    if (characters.length === 0) {
        sendChat('CharacterExtractor', '/w ' + requestor + ' No characters found.');
        return;
    }
    
    sendChat('CharacterExtractor', '/w ' + requestor + ' Starting extraction of ' + characters.length + ' characters...');
    
    const allCharacterData = {};
    let processed = 0;
    
    characters.forEach(function(character) {
        try {
            const charName = character.get('name');
            log('Processing character: ' + charName);
            
            allCharacterData[charName] = extractCharacterData(character);
            processed++;
            
            // Send progress updates every 10 characters
            if (processed % 10 === 0) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Processed ' + processed + '/' + characters.length + ' characters...');
            }
            
        } catch (error) {
            log('Error processing character ' + character.get('name') + ': ' + error.toString());
        }
    });
    
    // Send final result
    const jsonOutput = 'EXTRACT_ALL_START\n' + JSON.stringify(allCharacterData, null, 2) + '\nEXTRACT_ALL_END';
    sendChat('CharacterExtractor', '/w ' + requestor + ' Extraction complete! ' + processed + ' characters processed.');
    sendChat('CharacterExtractor', '/w ' + requestor + ' ' + jsonOutput);
}

function listAllCharacters(requestor) {
    const characters = findObjs({
        _type: 'character'
    });
    
    const characterNames = characters.map(function(char) {
        return char.get('name');
    }).sort();
    
    const listOutput = 'CHARACTER_LIST_START\n' + JSON.stringify(characterNames, null, 2) + '\nCHARACTER_LIST_END';
    sendChat('CharacterExtractor', '/w ' + requestor + ' Found ' + characterNames.length + ' characters: ' + listOutput);
}

function testExtraction(requestor) {
    sendChat('CharacterExtractor', '/w ' + requestor + ' CharacterExtractor API is working correctly!');
    
    const characters = findObjs({
        _type: 'character'
    });
    
    sendChat('CharacterExtractor', '/w ' + requestor + ' Found ' + characters.length + ' total characters in campaign.');
    
    if (characters.length > 0) {
        const testChar = characters[0];
        sendChat('CharacterExtractor', '/w ' + requestor + ' Test character: "' + testChar.get('name') + '"');
        
        const attributes = findObjs({
            _type: 'attribute', 
            _characterid: testChar.get('_id')
        });
        
        sendChat('CharacterExtractor', '/w ' + requestor + ' Test character has ' + attributes.length + ' attributes.');
    }
}

// ============================================================================
// ENHANCED CHARACTER UPDATE FUNCTIONS
// ============================================================================

function findDataHandout(characterName) {
    /**
     * Find the data handout for a specific character
     */
    const handoutName = 'CharacterUpdater_' + characterName;
    const handouts = findObjs({
        _type: 'handout',
        name: handoutName
    });
    
    return handouts.length > 0 ? handouts[0] : null;
}

function updateCharacterFromHandout(characterName, requestor) {
    /**
     * Update an existing character from handout data - WITH CHARACTER CHECK
     */
    try {
        log('Starting update for character: ' + characterName);
        
        // Find the character
        const characters = findObjs({
            _type: 'character',
            name: characterName
        });
        
        if (characters.length === 0) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Character "' + characterName + '" not found.');
            return false;
        }
        
        const character = characters[0];
        log('Found character: ' + characterName);
        
        // Find the data handout
        const dataHandout = findDataHandout(characterName);
        if (!dataHandout) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' No data handout found for "' + characterName + '".');
            return false;
        }
        
        log('Found data handout for: ' + characterName);
        
        // Get character data from handout - WITH CALLBACK
        parseCharacterDataFromHandout(dataHandout, function(characterData) {
            if (!characterData) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to parse character data from handout.');
                return;
            }
            
            log('Successfully parsed character data, starting update...');
            
            // Update the character
            const success = updateCharacterWithData(character, characterData, requestor);
            
            if (success) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Successfully updated character: ' + characterName);
                log('Character update completed successfully: ' + characterName);
            } else {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to update character: ' + characterName);
                log('Character update failed: ' + characterName);
            }
        });
        
        return true; // Indicate async operation started
        
    } catch (error) {
        log('Error updating character: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error updating character: ' + error.toString());
        return false;
    }
}

function createCharacterFromHandout(characterName, requestor) {
    /**
     * Create a new character from handout data - WITH FALLBACK TO UPDATE
     */
    try {
        log('Starting creation for character: ' + characterName);
        
        // ENHANCED: Check if character already exists
        const existingChars = findObjs({
            _type: 'character',
            name: characterName
        });
        
        if (existingChars.length > 0) {
            log('Character already exists, falling back to update: ' + characterName);
            sendChat('CharacterExtractor', '/w ' + requestor + ' Character "' + characterName + '" already exists. Switching to update mode...');
            
            // FALLBACK: Call update instead of failing
            return updateCharacterFromHandout(characterName, requestor);
        }
        
        // Find the data handout
        const dataHandout = findDataHandout(characterName);
        if (!dataHandout) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' No data handout found for "' + characterName + '".');
            return false;
        }
        
        log('Found data handout for new character: ' + characterName);
        
        // Get character data from handout - WITH CALLBACK
        parseCharacterDataFromHandout(dataHandout, function(characterData) {
            if (!characterData) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to parse character data from handout.');
                return;
            }
            
            log('Successfully parsed character data, creating character...');
            
            // Create new character
            const character = createObj('character', {
                name: characterName,
                inplayerjournals: characterData.permissions.see_by || '',
                controlledby: characterData.permissions.edit_by || ''
            });
            
            log('Created new character object: ' + characterName);
            
            // Update with data
            const success = updateCharacterWithData(character, characterData, requestor);
            
            if (success) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Successfully created character: ' + characterName);
                log('Character creation completed successfully: ' + characterName);
            } else {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to create character: ' + characterName);
                log('Character creation failed: ' + characterName);
            }
        });
        
        return true; // Indicate async operation started
        
    } catch (error) {
        log('Error creating character: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error creating character: ' + error.toString());
        return false;
    }
}

function bulkUpdateFromHandout(requestor) {
    /**
     * Update multiple characters from a bulk update handout - FIXED with callback
     */
    try {
        sendChat('CharacterExtractor', '/w ' + requestor + ' Starting bulk character update...');
        
        const bulkHandout = findObjs({
            _type: 'handout',
            name: 'CharacterUpdater_BulkData'
        })[0];
        
        if (!bulkHandout) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Bulk data handout "CharacterUpdater_BulkData" not found.');
            return false;
        }
        
        // Parse bulk data - NOW WITH CALLBACK
        bulkHandout.get('notes', function(handoutNotes) {
            try {
                if (!handoutNotes) {
                    sendChat('CharacterExtractor', '/w ' + requestor + ' Bulk handout is empty.');
                    return;
                }
                
                // Extract JSON from handout
                const startMarker = 'BULK_UPDATE_START\n';
                const endMarker = '\nBULK_UPDATE_END';
                
                const startIdx = handoutNotes.indexOf(startMarker);
                const endIdx = handoutNotes.indexOf(endMarker);
                
                if (startIdx === -1 || endIdx === -1) {
                    sendChat('CharacterExtractor', '/w ' + requestor + ' Invalid bulk data format.');
                    return;
                }
                
                const jsonStr = handoutNotes.substring(startIdx + startMarker.length, endIdx);
                
                let bulkData;
                try {
                    bulkData = JSON.parse(jsonStr);
                } catch (e) {
                    sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to parse bulk data JSON.');
                    return;
                }
                
                // Process each character
                let processed = 0;
                let created = 0;
                let updated = 0;
                let errors = 0;
                
                for (const characterName in bulkData) {
                    try {
                        const characterData = bulkData[characterName];
                        
                        // Check if character exists
                        const existingChars = findObjs({
                            _type: 'character',
                            name: characterName
                        });
                        
                        let character;
                        let isNew = false;
                        
                        if (existingChars.length === 0) {
                            // Create new character
                            character = createObj('character', {
                                name: characterName,
                                inplayerjournals: characterData.permissions.see_by || '',
                                controlledby: characterData.permissions.edit_by || ''
                            });
                            isNew = true;
                        } else {
                            character = existingChars[0];
                        }
                        
                        // Update character with data
                        const success = updateCharacterWithData(character, characterData, requestor);
                        
                        if (success) {
                            if (isNew) {
                                created++;
                            } else {
                                updated++;
                            }
                        } else {
                            errors++;
                        }
                        
                        processed++;
                        
                        // Progress update every 10 characters
                        if (processed % 10 === 0) {
                            sendChat('CharacterExtractor', '/w ' + requestor + ' Progress: ' + processed + ' characters processed...');
                        }
                        
                    } catch (error) {
                        log('Error processing character ' + characterName + ': ' + error.toString());
                        errors++;
                    }
                }
                
                sendChat('CharacterExtractor', '/w ' + requestor + 
                        'BULK_UPDATE_COMPLETE: ' + processed + ' characters processed. ' +
                        created + ' created, ' + updated + ' updated, ' + errors + ' errors.');
                
            } catch (error) {
                log('Error in bulk update callback: ' + error.toString());
                sendChat('CharacterExtractor', '/w ' + requestor + ' Bulk update error: ' + error.toString());
            }
        });
        
        return true; // Indicate async operation started
        
    } catch (error) {
        log('Error in bulk update: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Bulk update error: ' + error.toString());
        return false;
    }
}

function parseCharacterDataFromHandout(handout, callback) {
    /**
     * Parse character data from handout content - FIXED to handle HTML formatting and entity encoding
     */
    try {
        // Use callback to get handout notes
        handout.get('notes', function(handoutNotes) {
            try {
                if (!handoutNotes) {
                    log('Handout notes are empty');
                    callback(null);
                    return;
                }
                
                // SOLUTION: Strip HTML tags and decode entities before processing
                let cleanContent = handoutNotes;
                
                // Remove common HTML tags that Roll20 adds
                cleanContent = cleanContent.replace(/<p>/g, '');
                cleanContent = cleanContent.replace(/<\/p>/g, '\n');
                cleanContent = cleanContent.replace(/<br\s*\/?>/g, '\n');
                cleanContent = cleanContent.replace(/<div>/g, '');
                cleanContent = cleanContent.replace(/<\/div>/g, '\n');
                
                // Remove any remaining HTML tags
                cleanContent = cleanContent.replace(/<[^>]*>/g, '');
                
                // CRITICAL: Decode HTML entities back to original symbols
                cleanContent = cleanContent.replace(/&amp;/g, '&');
                cleanContent = cleanContent.replace(/&lt;/g, '<');
                cleanContent = cleanContent.replace(/&gt;/g, '>');
                cleanContent = cleanContent.replace(/&quot;/g, '"');
                cleanContent = cleanContent.replace(/&#39;/g, "'");
                cleanContent = cleanContent.replace(/&nbsp;/g, ' ');
                
                // Clean up extra whitespace and newlines
                cleanContent = cleanContent.replace(/\n\s*\n/g, '\n');
                cleanContent = cleanContent.trim();
                
                log('Cleaned handout content preview: ' + cleanContent.substring(0, 200));
                
                // Extract JSON from between markers
                const startMarker = 'CHARACTER_DATA_START';
                const endMarker = 'CHARACTER_DATA_END';
                
                const startIdx = cleanContent.indexOf(startMarker);
                const endIdx = cleanContent.indexOf(endMarker);
                
                if (startIdx === -1 || endIdx === -1) {
                    log('Data markers not found in cleaned handout. Content preview: ' + cleanContent.substring(0, 200));
                    callback(null);
                    return;
                }
                
                // Extract JSON string (skip the marker line)
                const jsonStart = cleanContent.indexOf('\n', startIdx) + 1;
                const jsonStr = cleanContent.substring(jsonStart, endIdx).trim();
                
                log('Attempting to parse JSON string (first 100 chars): ' + jsonStr.substring(0, 100));
                
                const characterData = JSON.parse(jsonStr);
                log('Successfully parsed character data from handout');
                callback(characterData);
                
            } catch (error) {
                log('Error parsing handout JSON: ' + error.toString());
                log('Failed JSON string preview: ' + (jsonStr || 'undefined').substring(0, 200));
                callback(null);
            }
        });
        
    } catch (error) {
        log('Error getting handout notes: ' + error.toString());
        callback(null);
    }
}

function updateCharacterWithData(character, characterData, requestor) {
    /**
     * Update a character object with the provided data
     */
    try {
        const charId = character.get('_id');
        
        // 1. Update basic attributes
        if (characterData.attributes) {
            updateCharacterAttributes(charId, characterData.attributes);
        }
        
        // 2. Update repeating sections
        if (characterData.repeating_sections) {
            updateRepeatingSections(charId, characterData.repeating_sections);
        }
        
        // 3. Update abilities - ENHANCED VERSION
        if (characterData.abilities) {
            updateCharacterAbilitiesEnhanced(charId, characterData.abilities);
        }
        
        // 4. Update permissions
        if (characterData.permissions) {
            character.set({
                inplayerjournals: characterData.permissions.see_by || '',
                controlledby: characterData.permissions.edit_by || ''
            });
        }
        
        return true;
        
    } catch (error) {
        log('Error updating character with data: ' + error.toString());
        return false;
    }
}




function updateCharacterAttributes(charId, attributes) {
    /**
     * Update character attributes
     */
    for (const attrName in attributes) {
        const attrValue = attributes[attrName];
        
        // Handle attributes with max values (like HP)
        let current = attrValue;
        let max = '';
        
        if (typeof attrValue === 'string' && attrValue.includes('/')) {
            const parts = attrValue.split('/');
            current = parts[0];
            max = parts[1];
        }
        
        // Find existing attribute or create new one
        let attr = findObjs({
            _type: 'attribute',
            _characterid: charId,
            name: attrName
        })[0];
        
        if (!attr) {
            attr = createObj('attribute', {
                _characterid: charId,
                name: attrName,
                current: current,
                max: max
            });
        } else {
            attr.set({
                current: current,
                max: max
            });
        }
    }
}

function updateRepeatingSections(charId, repeatingSections) {
    /**
     * Update repeating sections
     */
    for (const sectionName in repeatingSections) {
        const sectionData = repeatingSections[sectionName];
        
        // Clear existing section first
        clearRepeatingSection(charId, sectionName);
        
        // Add new rows
        for (const rowId in sectionData) {
            const rowData = sectionData[rowId];
            
            for (const fieldName in rowData) {
                const fieldValue = rowData[fieldName];
                const fullAttrName = 'repeating_' + sectionName + '_' + rowId + '_' + fieldName;
                
                createObj('attribute', {
                    _characterid: charId,
                    name: fullAttrName,
                    current: fieldValue,
                    max: ''
                });
            }
        }
    }
}

function clearRepeatingSection(charId, sectionName) {
    /**
     * Clear all attributes in a repeating section
     */
    const prefix = 'repeating_' + sectionName + '_';
    const attrs = findObjs({
        _type: 'attribute',
        _characterid: charId
    });
    
    attrs.forEach(function(attr) {
        if (attr.get('name').startsWith(prefix)) {
            attr.remove();
        }
    });
}


// ============================================================================
// IMPROVED HANDOUT EXTRACTION (BATCHED)
// ============================================================================

function extractAllCharactersToHandouts(requestor) {
    /**
     * Extract all characters to multiple handouts to avoid Firebase 10MB limit
     * Uses batches of 25 characters per handout (reduced from 50)
     */
    log('Starting batched extraction to handouts...');
    
    const characters = findObjs({
        _type: 'character'
    });
    
    if (characters.length === 0) {
        sendChat('CharacterExtractor', '/w ' + requestor + ' No characters found.');
        return;
    }
    
    const BATCH_SIZE = 25; // Reduced from 50 to 25 characters per handout
    const handoutBaseName = 'CharacterExtractor_Data';
    
    sendChat('CharacterExtractor', '/w ' + requestor + ' Starting batched extraction of ' + characters.length + ' characters...');
    sendChat('CharacterExtractor', '/w ' + requestor + ' Using ' + BATCH_SIZE + ' characters per handout to avoid size limits.');
    
    // Calculate number of batches needed
    const totalBatches = Math.ceil(characters.length / BATCH_SIZE);
    let overallProcessed = 0;




    // Process characters in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, characters.length);
        const batchCharacters = characters.slice(startIndex, endIndex);
        
        const batchData = {};
        let batchProcessed = 0;
        

        batchCharacters.forEach(function(character) {
            try {
                const charName = character.get('name');
                
                // Skip template sheets
                if (TEMPLATE_SHEETS.indexOf(charName) !== -1) {
                    log('Skipping template sheet: ' + charName);
                    return; // Continue to next character
                }
                
                log('Processing character: ' + charName + ' (batch ' + (batchIndex + 1) + ')');
                
                const characterData = extractCharacterData(character);
                
                // Skip if extractCharacterData returned null (template sheets)
                if (characterData !== null) {
                    batchData[charName] = characterData;
                    batchProcessed++;
                    overallProcessed++;
                }
                
            } catch (error) {
                log('Error processing character ' + character.get('name') + ': ' + error.toString());
            }
        });
        
        // Create handout for this batch
        const handoutName = handoutBaseName + '_' + (batchIndex + 1);
        
        // Remove existing handout with this name
        const existingHandouts = findObjs({
            _type: 'handout',
            name: handoutName
        });
        existingHandouts.forEach(function(handout) {
            handout.remove();
        });
        
        // Create new handout
        const dataHandout = createObj('handout', {
            name: handoutName,
            inplayerjournals: '',  // Only visible to GM
            controlledby: ''       // Only GM can edit
        });
        
        // Convert batch data to JSON string
        const jsonData = JSON.stringify(batchData, null, 2);
        
        // Calculate approximate size in bytes (UTF-8)
        const dataSize = getStringSizeInBytes(jsonData);
        const dataSizeKB = Math.round(dataSize / 1024);
        const dataSizeMB = Math.round(dataSize / (1024 * 1024) * 10) / 10;
        
        log('Batch ' + (batchIndex + 1) + ' data size: ' + dataSizeKB + ' KB (' + dataSizeMB + ' MB)');
        
        // Check if size is approaching Firebase limit (10MB = 10,485,760 bytes)
        if (dataSize > 9000000) { // 9MB hard warning
            log('ERROR: Batch ' + (batchIndex + 1) + ' size (' + dataSizeMB + ' MB) exceeds safe limit!');
            sendChat('CharacterExtractor', '/w ' + requestor + 
                    'ERROR: Batch ' + (batchIndex + 1) + ' (' + dataSizeMB + ' MB) is too large. Skipping to prevent crash.');
            continue; // Skip this batch
        } else if (dataSize > 7000000) { // 7MB warning threshold
            log('WARNING: Batch ' + (batchIndex + 1) + ' size (' + dataSizeMB + ' MB) is approaching Firebase limit!');
            sendChat('CharacterExtractor', '/w ' + requestor + 
                    'WARNING: Batch ' + (batchIndex + 1) + ' is large (' + dataSizeMB + ' MB)');
        }
        
        // Write data to handout notes with markers
        try {
            dataHandout.set({
                notes: 'EXTRACTION_START\n' + jsonData + '\nEXTRACTION_END'
            });
            
            // Send progress update
            sendChat('CharacterExtractor', '/w ' + requestor + 
                    'Batch ' + (batchIndex + 1) + '/' + totalBatches + ' complete: ' + 
                    batchProcessed + ' characters written to "' + handoutName + '" (' + 
                    dataSizeMB + ' MB)');
                    
        } catch (error) {
            log('Error writing to handout ' + handoutName + ': ' + error.toString());
            sendChat('CharacterExtractor', '/w ' + requestor + 
                    'Error writing batch ' + (batchIndex + 1) + ': ' + error.toString());
            
            // If this was a Firebase size error, try to continue with next batch
            if (error.toString().includes('string greater than')) {
                sendChat('CharacterExtractor', '/w ' + requestor + 
                        'Batch ' + (batchIndex + 1) + ' was too large (' + dataSizeMB + ' MB). Continuing with next batch...');
            }
        }
    }
    
    // Send completion message
    sendChat('CharacterExtractor', '/w ' + requestor + 
            'EXTRACTION_COMPLETE: ' + overallProcessed + ' characters extracted across ' + 
            totalBatches + ' handouts. Use !handout-cleanup to delete handouts when done.');
    
    log('Batched extraction complete: ' + overallProcessed + ' characters across ' + totalBatches + ' handouts');
}

function extractCharacterData(character) {
    const charId = character.get('_id');
    const charName = character.get('name');
    
    log('Extracting data for character: ' + charName + ' (ID: ' + charId + ')');
    
    // Skip template sheets
    if (TEMPLATE_SHEETS.indexOf(charName) !== -1) {
        log('Skipping template sheet: ' + charName);
        return null;  // Signal to skip this character
    }

    

    
    // Get all attributes for this character
    const attributes = findObjs({
        _type: 'attribute',
        _characterid: charId
    });
    
    // Convert attributes to flat key-value pairs (preserving Roll20 structure)
    const flatAttributes = {};
    const repeatingSections = {};
    
    attributes.forEach(function(attr) {
        const name = attr.get('name');
        const current = attr.get('current');
        const max = attr.get('max');
        
        // Store the raw Roll20 attribute value
        let value;
        if (max && max !== '') {
            value = current + '/' + max;  // For attributes with max values like HP
        } else {
            value = current;
        }
        
        // Separate repeating sections from regular attributes
        if (name.startsWith('repeating_')) {
            // Parse repeating section: repeating_sectionname_rowid_fieldname
            const parts = name.split('_');
            if (parts.length >= 4) {
                const sectionName = parts[1];
                const rowId = parts[2];
                const fieldName = parts.slice(3).join('_');
                
                // Initialize section and row if needed
                if (!repeatingSections[sectionName]) {
                    repeatingSections[sectionName] = {};
                }
                if (!repeatingSections[sectionName][rowId]) {
                    repeatingSections[sectionName][rowId] = {};
                }
                
                // Store the field value
                repeatingSections[sectionName][rowId][fieldName] = value;
            }
        } else {
            // Regular attribute
            flatAttributes[name] = value;
        }
    });
    
    // Extract abilities as array (clean version)
    const abilities = findObjs({
        _type: 'ability',
        _characterid: charId
    });
    
    const abilityArray = [];
    abilities.forEach(function(ability) {
        abilityArray.push({
            name: ability.get('name'),
            content: ability.get('action'),
            showInMacroBar: false,  // Default to false for now
            isTokenAction: ability.get('istokenaction') || false
        });
    });
    
    // Build final character data structure (new flat format)
    const characterData = {
        metadata: {
            characterId: charId,
            extractedAt: new Date().toISOString(),
            name: charName,
            attributeCount: attributes.length
        },
        attributes: flatAttributes,
        repeating_sections: repeatingSections,
        abilities: abilityArray,
        permissions: {
            see_by: character.get('inplayerjournals') || '',
            edit_by: character.get('controlledby') || ''
        }
    };
    
    log('Successfully extracted data for: ' + charName + ' (found ' + abilityArray.length + ' abilities)');
    return characterData;
}




function getStringSizeInBytes(str) {
    let sizeInBytes = 0;
    
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        
        if (code < 0x80) {
            sizeInBytes += 1;
        } else if (code < 0x800) {
            sizeInBytes += 2;
        } else if (code < 0xD800 || code >= 0xE000) {
            sizeInBytes += 3;
        } else {
            // Surrogate pair
            i++; // Skip the next character
            sizeInBytes += 4;
        }
    }
    
    return sizeInBytes;
}



function updateCharacterAbilitiesEnhanced(charId, abilities) {
    /**
     * Update character abilities with macro bar and token action support
     */
    try {
        // Clear existing abilities
        const existingAbilities = findObjs({
            _type: 'ability',
            _characterid: charId
        });
        
        existingAbilities.forEach(function(ability) {
            ability.remove();
        });
        
        log('Creating ' + abilities.length + ' abilities for character ID: ' + charId);
        
        // Get character for macro bar updates
        const character = getObj('character', charId);
        const currentMacroBar = character.get('macrobar') || '';
        let newMacroBar = [];
        
        // Create new abilities
        abilities.forEach(function(abilityData, index) {
            try {
                const abilityProps = {
                    _characterid: charId,
                    name: abilityData.name,
                    action: abilityData.content,
                    istokenaction: abilityData.isTokenAction || false
                };
                
                const newAbility = createObj('ability', abilityProps);
                
                if (newAbility) {
                    log('  [OK] Created: ' + abilityData.name + ' (token: ' + (abilityData.isTokenAction || false) + ')');
                    
                    // Add to macro bar if specified
                    if (abilityData.showInMacroBar) {
                        newMacroBar.push(newAbility.get('_id'));
                    }
                } else {
                    log('  [FAIL] Failed to create: ' + abilityData.name);
                }
                
            } catch (error) {
                log('Error creating ability ' + abilityData.name + ': ' + error.toString());
            }
        });
        
        // Update macro bar if needed
        if (newMacroBar.length > 0) {
            character.set('macrobar', newMacroBar.join(','));
            log('Updated macro bar with ' + newMacroBar.length + ' abilities');
        }
        
        log('Ability creation complete for character ID: ' + charId);
        
    } catch (error) {
        log('Error in ability update: ' + error.toString());
        throw error;
    }
}

// Update bulk processing to skip template sheets
function extractAllCharactersToHandouts(requestor) {
    // ... existing code ...
    
    batchCharacters.forEach(function(character) {
        try {
            const charName = character.get('name');
            
            // Skip template sheets
            if (TEMPLATE_SHEETS.indexOf(charName) !== -1) {
                log('Skipping template sheet: ' + charName);
                return; // Continue to next character
            }
            
            log('Processing character: ' + charName + ' (batch ' + (batchIndex + 1) + ')');
            
            const characterData = extractCharacterData(character);
            
            // Skip if extractCharacterData returned null (template sheets)
            if (characterData !== null) {
                batchData[charName] = characterData;
                batchProcessed++;
                overallProcessed++;
            }
            
        } catch (error) {
            log('Error processing character ' + character.get('name') + ': ' + error.toString());
        }
    });
    
    // ... rest of function ...
}


