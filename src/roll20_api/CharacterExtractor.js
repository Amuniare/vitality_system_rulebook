// CharacterExtractor.js - Fixed scoping issue
// Install this in your Roll20 campaign's API Scripts section

// MOVED TO GLOBAL SCOPE - accessible from all functions
const TEMPLATE_SHEETS = ['MacroMule', 'ScriptCards_TemplateMule'];

on('ready', function() {
    log('CharacterExtractor API loaded successfully - Enhanced Debug Version');
});

on('chat:message', function(msg) {
    if (msg.type !== 'api') return;
    
    const args = msg.content.split(' ');
    const command = args[0];
    
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

            case '!update-scriptcards':
                if (args.length < 2) {
                    sendChat('CharacterExtractor', '/w ' + msg.who + ' Usage: !update-scriptcards CharacterName');
                    return;
                }
                const scriptcardsCharName = args.slice(1).join(' ');
                updateCharacterScriptcardsOnly(scriptcardsCharName, msg.who);
                break;
        }

    } catch (error) {
        log('CharacterExtractor Error: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + msg.who + ' Error: ' + error.toString());
    }
});

// ============================================================================
// FIXED: IMPROVED HANDOUT EXTRACTION WITH COMPREHENSIVE ERROR HANDLING
// ============================================================================

function extractAllCharactersToHandouts(requestor) {
    /**
     * FIXED: Extract all characters to multiple handouts with enhanced debugging
     */
    log('=== STARTING ENHANCED EXTRACTION ===');
    
    const characters = findObjs({
        _type: 'character'
    });
    
    if (characters.length === 0) {
        sendChat('CharacterExtractor', '/w ' + requestor + ' No characters found.');
        return;
    }
    
    const BATCH_SIZE = 25;
    const handoutBaseName = 'CharacterExtractor_Data';
    
    sendChat('CharacterExtractor', '/w ' + requestor + ' Starting ENHANCED extraction of ' + characters.length + ' characters...');
    
    // DEBUG: Log first few character names
    log('First 5 character names: ' + characters.slice(0, 5).map(c => c.get('name')).join(', '));
    
    const totalBatches = Math.ceil(characters.length / BATCH_SIZE);
    let overallProcessed = 0;
    let overallErrors = 0;

    // Process characters in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, characters.length);
        const batchCharacters = characters.slice(startIndex, endIndex);
        
        log('=== PROCESSING BATCH ' + (batchIndex + 1) + ' ===');
        log('Batch characters: ' + batchCharacters.map(c => c.get('name')).join(', '));
        
        const batchData = {};
        let batchProcessed = 0;
        let batchErrors = 0;

        // FIXED: Process each character with comprehensive error handling
        batchCharacters.forEach(function(character) {
            const charName = character.get('name');
            
            try {
                log('--- Starting character: ' + charName + ' ---');
                
                // Check if template sheet FIRST
                if (TEMPLATE_SHEETS.indexOf(charName) !== -1) {
                    log('SKIPPING template sheet: ' + charName);
                    return; // Continue to next character
                }
                
                // FIXED: Enhanced character data extraction
                const characterData = extractCharacterDataEnhanced(character);
                
                if (characterData && characterData !== null) {
                    batchData[charName] = characterData;
                    batchProcessed++;
                    overallProcessed++;
                    log('SUCCESS: ' + charName + ' extracted (' + Object.keys(characterData).length + ' top-level keys)');
                } else {
                    log('FAILED: ' + charName + ' returned null or empty data');
                    batchErrors++;
                    overallErrors++;
                }
                
            } catch (error) {
                log('ERROR processing character ' + charName + ': ' + error.toString());
                log('Error stack: ' + error.stack);
                batchErrors++;
                overallErrors++;
            }
        });
        
        log('Batch ' + (batchIndex + 1) + ' processing complete: ' + batchProcessed + ' success, ' + batchErrors + ' errors');
        
        // Create handout for this batch
        const handoutName = handoutBaseName + '_' + (batchIndex + 1);
        
        // Remove existing handout
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
            inplayerjournals: '',
            controlledby: ''
        });
        
        // FIXED: Better handout content handling
        let handoutContent;
        if (Object.keys(batchData).length > 0) {
            const jsonData = JSON.stringify(batchData, null, 2);
            handoutContent = 'EXTRACTION_START\n' + jsonData + '\nEXTRACTION_END';
            
            const dataSize = getStringSizeInBytes(jsonData);
            const dataSizeMB = Math.round(dataSize / (1024 * 1024) * 10) / 10;
            
            log('Batch ' + (batchIndex + 1) + ' JSON size: ' + dataSizeMB + ' MB');
            
        } else {
            // Empty batch - still create handout but with empty JSON
            handoutContent = 'EXTRACTION_START\n{}\nEXTRACTION_END';
            log('Batch ' + (batchIndex + 1) + ' is empty - no valid character data');
        }
        
        // Write to handout
        try {
            dataHandout.set({
                notes: handoutContent
            });
            
            sendChat('CharacterExtractor', '/w ' + requestor + 
                    'Batch ' + (batchIndex + 1) + '/' + totalBatches + ' complete: ' + 
                    batchProcessed + ' characters written to "' + handoutName + '"');
                    
        } catch (error) {
            log('Error writing to handout ' + handoutName + ': ' + error.toString());
            sendChat('CharacterExtractor', '/w ' + requestor + 
                    'Error writing batch ' + (batchIndex + 1) + ': ' + error.toString());
        }
    }
    
    // Final summary
    log('=== EXTRACTION COMPLETE ===');
    log('Total processed: ' + overallProcessed + ', Total errors: ' + overallErrors);
    
    sendChat('CharacterExtractor', '/w ' + requestor + 
            'EXTRACTION_COMPLETE: ' + overallProcessed + ' characters extracted across ' + 
            totalBatches + ' handouts. Errors: ' + overallErrors);
}

function extractCharacterDataEnhanced(character) {
    /**
     * FIXED: Enhanced character data extraction with step-by-step error handling
     */
    let charId, charName;
    
    try {
        charId = character.get('_id');
        charName = character.get('name');
        
        if (!charId || !charName) {
            log('ERROR: Invalid character ID or name - ID: ' + charId + ', Name: ' + charName);
            return null;
        }
        
        log('Extracting data for: ' + charName + ' (ID: ' + charId + ')');
        
        // Double-check template sheets (redundant safety) - NOW ACCESSIBLE
        if (TEMPLATE_SHEETS.indexOf(charName) !== -1) {
            log('Template sheet caught in extractCharacterData: ' + charName);
            return null;
        }

    } catch (error) {
        log('ERROR getting character basic info: ' + error.toString());
        return null;
    }
    
    // STEP 1: Extract attributes
    let attributes, flatAttributes, repeatingSections;
    try {
        attributes = findObjs({
            _type: 'attribute',
            _characterid: charId
        });
        
        log('Found ' + attributes.length + ' attributes for ' + charName);
        
        if (attributes.length === 0) {
            log('WARNING: No attributes found for character: ' + charName);
        }
        
        // Process attributes
        flatAttributes = {};
        repeatingSections = {};
        
        attributes.forEach(function(attr) {
            try {
                const name = attr.get('name');
                const current = attr.get('current');
                const max = attr.get('max');
                
                let value;
                if (max && max !== '') {
                    value = current + '/' + max;
                } else {
                    value = current;
                }
                
                // Separate repeating sections
                if (name.startsWith('repeating_')) {
                    const parts = name.split('_');
                    if (parts.length >= 4) {
                        const sectionName = parts[1];
                        const rowId = parts[2];
                        const fieldName = parts.slice(3).join('_');
                        
                        if (!repeatingSections[sectionName]) {
                            repeatingSections[sectionName] = {};
                        }
                        if (!repeatingSections[sectionName][rowId]) {
                            repeatingSections[sectionName][rowId] = {};
                        }
                        
                        repeatingSections[sectionName][rowId][fieldName] = value;
                    }
                } else {
                    flatAttributes[name] = value;
                }
                
            } catch (attrError) {
                log('ERROR processing attribute: ' + attrError.toString());
            }
        });
        
        log('Processed attributes: ' + Object.keys(flatAttributes).length + ' regular, ' + 
            Object.keys(repeatingSections).length + ' sections');
            
    } catch (error) {
        log('ERROR extracting attributes for ' + charName + ': ' + error.toString());
        return null;
    }
    
    // STEP 2: Extract abilities
    let abilities, abilityArray;
    try {
        abilities = findObjs({
            _type: 'ability',
            _characterid: charId
        });
        
        log('Found ' + abilities.length + ' abilities for ' + charName);
        
        abilityArray = [];
        abilities.forEach(function(ability) {
            try {
                abilityArray.push({
                    name: ability.get('name'),
                    content: ability.get('action'),
                    showInMacroBar: false,
                    isTokenAction: ability.get('istokenaction') || false
                });
            } catch (abilityError) {
                log('ERROR processing ability: ' + abilityError.toString());
            }
        });
        
    } catch (error) {
        log('ERROR extracting abilities for ' + charName + ': ' + error.toString());
        abilityArray = []; // Continue with empty abilities rather than failing
    }
    
    // STEP 3: Build final data structure
    try {
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
        
        log('SUCCESS: Built character data for ' + charName + 
            ' (' + Object.keys(flatAttributes).length + ' attrs, ' + 
            abilityArray.length + ' abilities)');
            
        return characterData;
        
    } catch (error) {
        log('ERROR building final data structure for ' + charName + ': ' + error.toString());
        return null;
    }
}


// ============================================================================
// UTILITY FUNCTIONS (UNCHANGED)
// ============================================================================

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

// ============================================================================
// OTHER FUNCTIONS (KEEPING ORIGINAL IMPLEMENTATIONS)
// ============================================================================

function getCurrentCharacterData(characterName, requestor) {
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
        const characterData = extractCharacterDataEnhanced(character);
        
        if (characterData) {
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
    const characterData = extractCharacterDataEnhanced(character);
    
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
            
            allCharacterData[charName] = extractCharacterDataEnhanced(character);
            processed++;
            
            if (processed % 10 === 0) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Processed ' + processed + '/' + characters.length + ' characters...');
            }
            
        } catch (error) {
            log('Error processing character ' + character.get('name') + ': ' + error.toString());
        }
    });
    
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
// HANDOUT UTILITY FUNCTIONS (UNCHANGED)
// ============================================================================

function openHandout(handoutName, requestor) {
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
        
        handout.set({
            notes: handout.get('notes')
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
    sendChat('CharacterExtractor', '/w ' + requestor + ' To close handout "' + handoutName + '", click the X button in the handout dialog or press Escape.');
}

function deleteHandout(handoutName, requestor) {
    try {
        const handouts = findObjs({
            _type: 'handout',
            name: handoutName
        });
        
        if (handouts.length === 0) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' Handout "' + handoutName + '" not found.');
            return false;
        }
        
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

// CHARACTER UPDATE FUNCTIONS (keeping existing implementations for now)
// These would need similar enhancements but keeping them unchanged for this fix

function findDataHandout(characterName) {
    const handoutName = 'CharacterUpdater_' + characterName;
    const handouts = findObjs({
        _type: 'handout',
        name: handoutName
    });
    
    return handouts.length > 0 ? handouts[0] : null;
}

function updateCharacterFromHandout(characterName, requestor) {
    try {
        log('Starting update for character: ' + characterName);
        
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
        
        const dataHandout = findDataHandout(characterName);
        if (!dataHandout) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' No data handout found for "' + characterName + '".');
            return false;
        }
        
        log('Found data handout for: ' + characterName);
        
        parseCharacterDataFromHandout(dataHandout, function(characterData) {
            if (!characterData) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to parse character data from handout.');
                return;
            }
            
            log('Successfully parsed character data, starting update...');
            
            const success = updateCharacterWithData(character, characterData, requestor);
            
            if (success) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Successfully updated character: ' + characterName);
                log('Character update completed successfully: ' + characterName);
            } else {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to update character: ' + characterName);
                log('Character update failed: ' + characterName);
            }
        });
        
        return true;
        
    } catch (error) {
        log('Error updating character: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error updating character: ' + error.toString());
        return false;
    }
}

function createCharacterFromHandout(characterName, requestor) {
    try {
        log('Starting creation for character: ' + characterName);
        
        const existingChars = findObjs({
            _type: 'character',
            name: characterName
        });
        
        if (existingChars.length > 0) {
            log('Character already exists, falling back to update: ' + characterName);
            sendChat('CharacterExtractor', '/w ' + requestor + ' Character "' + characterName + '" already exists. Switching to update mode...');
            
            return updateCharacterFromHandout(characterName, requestor);
        }
        
        const dataHandout = findDataHandout(characterName);
        if (!dataHandout) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' No data handout found for "' + characterName + '".');
            return false;
        }
        
        log('Found data handout for new character: ' + characterName);
        
        parseCharacterDataFromHandout(dataHandout, function(characterData) {
            if (!characterData) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to parse character data from handout.');
                return;
            }
            
            log('Successfully parsed character data, creating character...');
            
            const character = createObj('character', {
                name: characterName,
                inplayerjournals: characterData.permissions.see_by || '',
                controlledby: characterData.permissions.edit_by || ''
            });
            
            log('Created new character object: ' + characterName);
            
            const success = updateCharacterWithData(character, characterData, requestor);
            
            if (success) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Successfully created character: ' + characterName);
                log('Character creation completed successfully: ' + characterName);
            } else {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to create character: ' + characterName);
                log('Character creation failed: ' + characterName);
            }
        });
        
        return true;
        
    } catch (error) {
        log('Error creating character: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error creating character: ' + error.toString());
        return false;
    }
}

function bulkUpdateFromHandout(requestor) {
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
        
        bulkHandout.get('notes', function(handoutNotes) {
            try {
                if (!handoutNotes) {
                    sendChat('CharacterExtractor', '/w ' + requestor + ' Bulk handout is empty.');
                    return;
                }
                
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
                
                let processed = 0;
                let created = 0;
                let updated = 0;
                let errors = 0;
                
                for (const characterName in bulkData) {
                    try {
                        const characterData = bulkData[characterName];
                        
                        const existingChars = findObjs({
                            _type: 'character',
                            name: characterName
                        });
                        
                        let character;
                        let isNew = false;
                        
                        if (existingChars.length === 0) {
                            character = createObj('character', {
                                name: characterName,
                                inplayerjournals: characterData.permissions.see_by || '',
                                controlledby: characterData.permissions.edit_by || ''
                            });
                            isNew = true;
                        } else {
                            character = existingChars[0];
                        }
                        
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
        
        return true;
        
    } catch (error) {
        log('Error in bulk update: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Bulk update error: ' + error.toString());
        return false;
    }
}

function parseCharacterDataFromHandout(handout, callback) {
    try {
        handout.get('notes', function(handoutNotes) {
            try {
                if (!handoutNotes) {
                    log('Handout notes are empty');
                    callback(null);
                    return;
                }
                
                let cleanContent = handoutNotes;
                
                cleanContent = cleanContent.replace(/<p>/g, '');
                cleanContent = cleanContent.replace(/<\/p>/g, '\n');
                cleanContent = cleanContent.replace(/<br\s*\/?>/g, '\n');
                cleanContent = cleanContent.replace(/<div>/g, '');
                cleanContent = cleanContent.replace(/<\/div>/g, '\n');
                
                cleanContent = cleanContent.replace(/<[^>]*>/g, '');
                
                cleanContent = cleanContent.replace(/&amp;/g, '&');
                cleanContent = cleanContent.replace(/&lt;/g, '<');
                cleanContent = cleanContent.replace(/&gt;/g, '>');
                cleanContent = cleanContent.replace(/&quot;/g, '"');
                cleanContent = cleanContent.replace(/&#39;/g, "'");
                cleanContent = cleanContent.replace(/&nbsp;/g, ' ');
                
                cleanContent = cleanContent.replace(/\n\s*\n/g, '\n');
                cleanContent = cleanContent.trim();
                
                log('Cleaned handout content preview: ' + cleanContent.substring(0, 200));
                
                const startMarker = 'CHARACTER_DATA_START';
                const endMarker = 'CHARACTER_DATA_END';
                
                const startIdx = cleanContent.indexOf(startMarker);
                const endIdx = cleanContent.indexOf(endMarker);
                
                if (startIdx === -1 || endIdx === -1) {
                    log('Data markers not found in cleaned handout. Content preview: ' + cleanContent.substring(0, 200));
                    callback(null);
                    return;
                }
                
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
    try {
        const charId = character.get('_id');
        
        if (characterData.attributes) {
            updateCharacterAttributes(charId, characterData.attributes);
        }
        
        if (characterData.repeating_sections) {
            updateRepeatingSections(charId, characterData.repeating_sections);
        }
        
        if (characterData.abilities) {
            updateCharacterAbilitiesEnhanced(charId, characterData.abilities);
        }
        
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
    for (const attrName in attributes) {
        const attrValue = attributes[attrName];
        
        let current = attrValue;
        let max = '';
        
        if (typeof attrValue === 'string' && attrValue.includes('/')) {
            const parts = attrValue.split('/');
            current = parts[0];
            max = parts[1];
        }
        
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
    for (const sectionName in repeatingSections) {
        const sectionData = repeatingSections[sectionName];
        
        clearRepeatingSection(charId, sectionName);
        
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

function updateCharacterAbilitiesEnhanced(charId, abilities) {
    try {
        const existingAbilities = findObjs({
            _type: 'ability',
            _characterid: charId
        });
        
        existingAbilities.forEach(function(ability) {
            ability.remove();
        });
        
        log('Creating ' + abilities.length + ' abilities for character ID: ' + charId);
        
        const character = getObj('character', charId);
        const currentMacroBar = character.get('macrobar') || '';
        let newMacroBar = [];
        
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

// ============================================================================
// SCRIPTCARDS-ONLY UPDATE FUNCTIONS
// ============================================================================

function updateCharacterScriptcardsOnly(characterName, requestor) {
    try {
        log('Starting scriptcards-only update for character: ' + characterName);
        
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
        
        // Find the scriptcards data handout
        const scriptcardsHandout = findScriptcardsHandout(characterName);
        if (!scriptcardsHandout) {
            sendChat('CharacterExtractor', '/w ' + requestor + ' No scriptcards handout found for "' + characterName + '".');
            return false;
        }
        
        log('Found scriptcards handout for: ' + characterName);
        
        // Parse the scriptcards data from handout
        parseScriptcardsDataFromHandout(scriptcardsHandout, function(scriptcardsData) {
            if (!scriptcardsData) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to parse scriptcards data from handout.');
                return;
            }
            
            log('Successfully parsed scriptcards data, starting abilities update...');
            
            // Update only the abilities using existing enhanced function
            try {
                updateCharacterAbilitiesEnhanced(character.get('_id'), scriptcardsData.abilities);
                sendChat('CharacterExtractor', '/w ' + requestor + ' Successfully updated scriptcards for: ' + characterName);
                log('Scriptcards update completed successfully: ' + characterName);
            } catch (error) {
                sendChat('CharacterExtractor', '/w ' + requestor + ' Failed to update scriptcards for: ' + characterName);
                log('Scriptcards update failed: ' + characterName + ' - ' + error.toString());
            }
        });
        
        return true;
        
    } catch (error) {
        log('Error updating scriptcards: ' + error.toString());
        sendChat('CharacterExtractor', '/w ' + requestor + ' Error updating scriptcards: ' + error.toString());
        return false;
    }
}

function findScriptcardsHandout(characterName) {
    const handoutName = 'ScriptcardsUpdater_' + characterName;
    const handouts = findObjs({
        _type: 'handout',
        name: handoutName
    });
    
    return handouts.length > 0 ? handouts[0] : null;
}

function parseScriptcardsDataFromHandout(handout, callback) {
    try {
        handout.get('notes', function(handoutNotes) {
            try {
                if (!handoutNotes) {
                    log('Scriptcards handout notes are empty');
                    callback(null);
                    return;
                }
                
                // Clean HTML content (same cleaning logic as main parser)
                let cleanContent = handoutNotes;
                
                cleanContent = cleanContent.replace(/<p>/g, '');
                cleanContent = cleanContent.replace(/<\/p>/g, '\n');
                cleanContent = cleanContent.replace(/<br\s*\/?>/g, '\n');
                cleanContent = cleanContent.replace(/<div>/g, '');
                cleanContent = cleanContent.replace(/<\/div>/g, '\n');
                
                cleanContent = cleanContent.replace(/<[^>]*>/g, '');
                
                cleanContent = cleanContent.replace(/&amp;/g, '&');
                cleanContent = cleanContent.replace(/&lt;/g, '<');
                cleanContent = cleanContent.replace(/&gt;/g, '>');
                cleanContent = cleanContent.replace(/&quot;/g, '"');
                cleanContent = cleanContent.replace(/&#39;/g, "'");
                cleanContent = cleanContent.replace(/&nbsp;/g, ' ');
                
                cleanContent = cleanContent.replace(/\n\s*\n/g, '\n');
                cleanContent = cleanContent.trim();
                
                log('Cleaned scriptcards handout content preview: ' + cleanContent.substring(0, 200));
                
                // Look for scriptcards-specific markers
                const startMarker = 'SCRIPTCARDS_DATA_START';
                const endMarker = 'SCRIPTCARDS_DATA_END';
                
                const startIdx = cleanContent.indexOf(startMarker);
                const endIdx = cleanContent.indexOf(endMarker);
                
                if (startIdx === -1 || endIdx === -1) {
                    log('Scriptcards data markers not found in cleaned handout. Content preview: ' + cleanContent.substring(0, 200));
                    callback(null);
                    return;
                }
                
                const jsonStart = cleanContent.indexOf('\n', startIdx) + 1;
                const jsonStr = cleanContent.substring(jsonStart, endIdx).trim();
                
                log('Attempting to parse scriptcards JSON string (first 100 chars): ' + jsonStr.substring(0, 100));
                
                const scriptcardsData = JSON.parse(jsonStr);
                log('Successfully parsed scriptcards data from handout');
                callback(scriptcardsData);
                
            } catch (error) {
                log('Error parsing scriptcards handout JSON: ' + error.toString());
                log('Failed JSON string preview: ' + (jsonStr || 'undefined').substring(0, 200));
                callback(null);
            }
        });
        
    } catch (error) {
        log('Error getting scriptcards handout notes: ' + error.toString());
        callback(null);
    }
}

