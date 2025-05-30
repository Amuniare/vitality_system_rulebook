class AutoLinker {
    constructor() {
        this.termDictionary = new Map();
        this.sectionMap = new Map();
        this.processed = false;
    }

    // Build dictionaries from the processed HTML content
    buildDictionaries(htmlContent) {
        console.log('Building auto-link dictionaries...');
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Build section map from headings
        this.buildSectionMap(tempDiv);
        
        // Build term dictionary from content
        this.buildTermDictionary(tempDiv);
        
        this.processed = true;
        
        console.log('Dictionaries built:', {
            sections: this.sectionMap.size,
            terms: this.termDictionary.size
        });
    }

    buildSectionMap(container) {
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        console.log('Found headings:', headings.length);
        
        headings.forEach(heading => {
            if (heading.id) {
                const text = heading.textContent.trim();
                
                // Store exact matches
                this.sectionMap.set(text.toLowerCase(), {
                    id: heading.id,
                    text: text,
                    level: parseInt(heading.tagName.charAt(1)),
                    element: heading
                });
                
                // Store common variations
                const variations = this.generateSectionVariations(text);
                variations.forEach(variation => {
                    if (!this.sectionMap.has(variation.toLowerCase())) {
                        this.sectionMap.set(variation.toLowerCase(), {
                            id: heading.id,
                            text: text,
                            level: parseInt(heading.tagName.charAt(1)),
                            element: heading
                        });
                    }
                });
            } else {
                console.warn('Heading without ID found:', heading.textContent);
            }
        });
        
        console.log('Section map entries:', Array.from(this.sectionMap.keys()).slice(0, 10));
    }

    generateSectionVariations(text) {
        const variations = [];
        
        // Remove common prefixes/suffixes
        const cleaned = text.replace(/^(Chapter|Section|Part)\s+/i, '')
                           .replace(/\s+(Section|Chapter|Rules?)$/i, '');
        
        variations.push(cleaned);
        
        // Add "the X section" variation
        variations.push(`the ${cleaned.toLowerCase()} section`);
        variations.push(`${cleaned.toLowerCase()} section`);
        variations.push(`${cleaned.toLowerCase()} rules`);
        
        // Handle multi-word sections
        if (cleaned.includes(' ')) {
            const words = cleaned.split(' ');
            if (words.length === 2) {
                variations.push(words[0]); // First word only
            }
        }
        
        return variations;
    }

    buildTermDictionary(container) {
        // Vitality System specific terms with their likely definition locations
        const gameTerms = {
            // Core Stats
            'Focus': ['focus', 'core stats', 'attributes'],
            'Mobility': ['mobility', 'core stats', 'attributes'],
            'Power': ['power', 'core stats', 'attributes'],
            'Endurance': ['endurance', 'core stats', 'attributes'],
            'Awareness': ['awareness', 'core stats', 'attributes'],
            'Communication': ['communication', 'core stats', 'attributes'],
            'Intelligence': ['intelligence', 'core stats', 'attributes'],
            
            // Defense Stats
            'Avoidance': ['avoidance', 'defense', 'defenses'],
            'Durability': ['durability', 'defense', 'defenses'],
            'Resolve': ['resolve', 'defense', 'defenses'],
            'Stability': ['stability', 'defense', 'defenses'],
            'Vitality': ['vitality', 'defense', 'defenses'],
            
            // Combat Stats
            'Accuracy': ['accuracy', 'combat', 'attack'],
            'Damage': ['damage', 'combat', 'attack'],
            'Conditions': ['conditions', 'combat', 'status effects'],
            'Initiative': ['initiative', 'combat'],
            'Movement': ['movement', 'combat'],
            
            // Game Concepts
            'Primary Action': ['actions', 'action economy'],
            'Secondary Action': ['actions', 'action economy'],
            'Effort': ['effort', 'effort system'],
            'Tier': ['tier', 'character progression'],
            'Archetype': ['archetype', 'archetypes'],
            'Limit': ['limit', 'limits'],
            'Trait': ['trait', 'traits'],
            'Boon': ['boon', 'abilities'],
            'Flaw': ['flaw', 'abilities'],
            'Special Attack': ['special attack', 'attacks'],
            'Upgrade': ['upgrade', 'upgrades'],
            
            // Status Effects
            'Stun': ['stun', 'conditions', 'status effects'],
            'Control': ['control', 'conditions', 'status effects'],
            'Weaken': ['weaken', 'conditions', 'status effects'],
            'Daze': ['daze', 'conditions', 'status effects'],
            'Blind': ['blind', 'conditions', 'status effects'],
            'Disarm': ['disarm', 'conditions', 'status effects'],
            'Grab': ['grab', 'conditions', 'status effects'],
            'Shove': ['shove', 'conditions', 'status effects'],
            
            // Attack Types
            'Melee': ['melee', 'combat', 'attack types'],
            'Ranged': ['ranged', 'combat', 'attack types'],
            'Direct': ['direct', 'combat', 'attack types'],
            'AOE': ['aoe', 'area of effect', 'combat'],
            'Area of Effect': ['aoe', 'area of effect', 'combat']
        };

        // Find actual definition locations in the document with multiple candidates
        Object.entries(gameTerms).forEach(([term, fallbackSections]) => {
            const definitionLocations = this.findAllDefinitionLocations(container, term, fallbackSections);
            if (definitionLocations.length > 0) {
                this.termDictionary.set(term.toLowerCase(), {
                    term: term,
                    candidates: definitionLocations // Store all possible targets
                });
            }
        });
        
        console.log('Term dictionary entries:', Array.from(this.termDictionary.keys()).slice(0, 10));
    }

    findAllDefinitionLocations(container, term, fallbackSections) {
        const locations = [];
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        // Look for headings that contain the term
        for (let heading of headings) {
            const headingText = heading.textContent.toLowerCase();
            const termLower = term.toLowerCase();
            
            if (headingText.includes(termLower)) {
                locations.push({
                    id: heading.id,
                    text: heading.textContent.trim(),
                    level: parseInt(heading.tagName.charAt(1)),
                    element: heading,
                    relevance: this.calculateRelevance(headingText, termLower)
                });
            }
        }
        
        // Look for fallback sections
        for (let fallbackSection of fallbackSections) {
            const fallbackHeading = Array.from(headings).find(h => 
                h.textContent.toLowerCase().includes(fallbackSection.toLowerCase())
            );
            
            if (fallbackHeading) {
                // Check if we already have this location
                const exists = locations.some(loc => loc.id === fallbackHeading.id);
                if (!exists) {
                    locations.push({
                        id: fallbackHeading.id,
                        text: fallbackHeading.textContent.trim(),
                        level: parseInt(fallbackHeading.tagName.charAt(1)),
                        element: fallbackHeading,
                        relevance: 0.5 // Lower relevance for fallback matches
                    });
                }
            }
        }
        
        // Sort by relevance (higher is better) and then by heading level (lower is more specific)
        return locations.sort((a, b) => {
            if (b.relevance !== a.relevance) {
                return b.relevance - a.relevance;
            }
            return a.level - b.level; // Lower level = more specific
        });
    }

    calculateRelevance(headingText, term) {
        // Exact match gets highest score
        if (headingText === term) return 1.0;
        
        // Term is the main part of the heading
        if (headingText.startsWith(term + ' ') || headingText.endsWith(' ' + term)) {
            return 0.9;
        }
        
        // Term appears as a complete word
        const words = headingText.split(/\s+/);
        if (words.includes(term)) {
            return 0.8;
        }
        
        // Term is contained within a word
        return 0.3;
    }

    // Apply auto-linking to HTML content
    applyAutoLinking(htmlContent) {
        if (!this.processed) {
            this.buildDictionaries(htmlContent);
        }

        console.log('Applying auto-linking to content...');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Process text nodes for linking with context awareness
        this.processTextNodesWithContext(tempDiv);

        const result = tempDiv.innerHTML;
        
        // Count links created for debugging
        const linkCount = (result.match(/class="auto-link"/g) || []).length;
        console.log('Auto-links created:', linkCount);

        return result;
    }


    processTextNodesWithContext(container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip text inside links, code blocks, headings, bold text, and other special elements
                    let parent = node.parentElement;
                    const skipTags = [
                        'A',           // Links (existing and auto-generated)
                        'CODE', 'PRE', // Code blocks
                        'SCRIPT', 'STYLE', // Scripts and styles
                        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', // All headings
                        'STRONG', 'B', // Bold text
                        'EM', 'I',     // Italic text
                        'TITLE'        // Title attributes
                    ];
                    
                    while (parent && parent !== container) {
                        // Check tag name
                        if (skipTags.includes(parent.tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // Check for auto-link class
                        if (parent.classList && parent.classList.contains('auto-link')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // Check for CSS-based bold styling
                        if (this.isBoldStyled(parent)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // Check if parent is a heading by role or class
                        if (this.isHeadingElement(parent)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        parent = parent.parentElement;
                    }
                    
                    // Skip very short text nodes
                    if (node.textContent.trim().length < 3) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Additional check: skip if the text is the same as a heading
                    if (this.isTextSameAsNearbyHeading(node, container)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
    
        // ... rest of the method
    }
    
    // Add these helper methods to your AutoLinker class:
    
    isBoldStyled(element) {
        try {
            const computedStyle = window.getComputedStyle(element);
            const fontWeight = computedStyle.fontWeight;
            
            // Check for bold font weights
            return fontWeight === 'bold' || 
                   fontWeight === 'bolder' || 
                   parseInt(fontWeight) >= 600;
        } catch (e) {
            return false;
        }
    }
    
    isHeadingElement(element) {
        // Check by tag name
        if (/^H[1-6]$/i.test(element.tagName)) {
            return true;
        }
        
        // Check by role attribute
        if (element.getAttribute('role') === 'heading') {
            return true;
        }
        
        // Check by common heading classes
        const headingClasses = ['heading', 'title', 'header', 'subtitle'];
        return headingClasses.some(cls => 
            element.classList && element.classList.contains(cls)
        );
    }
    
    isTextSameAsNearbyHeading(textNode, container) {
        const text = textNode.textContent.trim().toLowerCase();
        if (text.length < 3) return false;
        
        // Find all headings in the container
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
        
        return Array.from(headings).some(heading => {
            const headingText = heading.textContent.trim().toLowerCase();
            return headingText === text || headingText.includes(text);
        });
    }


    findCurrentSection(textNode, container) {
        // Walk up the DOM to find the current section
        let element = textNode.parentElement;
        
        while (element && element !== container) {
            // Check if this element is a heading or has an id that matches a section
            if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
                if (element.id) {
                    return {
                        id: element.id,
                        text: element.textContent.trim(),
                        level: parseInt(element.tagName.charAt(1))
                    };
                }
            }
            element = element.parentElement;
        }
        
        // If we didn't find a direct parent heading, look for the preceding heading
        let walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) => {
                    return node.tagName && node.tagName.match(/^H[1-6]$/) && node.id ? 
                        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                }
            }
        );

        let lastHeading = null;
        let currentNode;
        
        while (currentNode = walker.nextNode()) {
            // Check if we've passed our text node
            if (currentNode.compareDocumentPosition(textNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
                break;
            }
            lastHeading = currentNode;
        }
        
        if (lastHeading) {
            return {
                id: lastHeading.id,
                text: lastHeading.textContent.trim(),
                level: parseInt(lastHeading.tagName.charAt(1))
            };
        }
        
        return null;
    }

    linkifyTextWithContext(text, currentSection) {
        let result = text;

        // Only process text that's likely to contain linkable terms
        if (text.trim().length < 3) {
            return result;
        }

        // 1. Link section references first (higher priority)
        result = this.linkSectionReferences(result);

        // 2. Link game terms with context awareness
        if (!result.includes('auto-link')) {
            result = this.linkGameTermsWithContext(result, currentSection);
        }

        return result;
    }

    linkSectionReferences(text) {
        // Patterns for section references
        const patterns = [
            /\b(?:see|refer to|check|in the|visit the)\s+([^.!?]+?)\s+(?:section|chapter|rules?)\b/gi,
            /\b(?:the)\s+([^.!?]+?)\s+(?:section|chapter|rules?)\b/gi,
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Section|Chapter|Rules?)\b/g
        ];

        let result = text;
        
        patterns.forEach(pattern => {
            result = result.replace(pattern, (match, sectionName) => {
                const cleanSection = sectionName.trim().toLowerCase();
                const section = this.sectionMap.get(cleanSection);
                
                if (section) {
                    return match.replace(sectionName, 
                        `<a href="#${section.id}" class="auto-link section-link" title="Go to ${section.text}">${sectionName}</a>`
                    );
                }
                
                return match;
            });
        });

        return result;
    }

    linkGameTermsWithContext(text, currentSection) {
        let result = text;

        // Sort terms by length (descending) to handle longer terms first
        const sortedTerms = Array.from(this.termDictionary.keys())
            .sort((a, b) => b.length - a.length);

        sortedTerms.forEach(termKey => {
            const termData = this.termDictionary.get(termKey);
            const term = termData.term;
            
            // Find the best target for this term given the current context
            const bestTarget = this.findBestTarget(termData.candidates, currentSection, term);
            
            if (bestTarget) {
                // Create regex that matches whole words only
                const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
                
                result = result.replace(regex, (match) => {
                    return `<a href="#${bestTarget.id}" class="auto-link term-link" title="See ${term} in ${bestTarget.text}">${match}</a>`;
                });
            }
        });

        return result;
    }

    findBestTarget(candidates, currentSection, term) {
        if (!candidates || candidates.length === 0) {
            return null;
        }
        
        // If we have no current section context, return the best candidate
        if (!currentSection) {
            return candidates[0];
        }
        
        // Filter out candidates that would link back to the current section or its close relatives
        const validCandidates = candidates.filter(candidate => {
            // Don't link to the exact same section
            if (candidate.id === currentSection.id) {
                return false;
            }
            
            // Don't link if the current section is more specific and contains the term
            if (currentSection.text.toLowerCase().includes(term.toLowerCase()) && 
                currentSection.level > candidate.level) {
                return false;
            }
            
            // Don't link to parent sections if we're already in a specific subsection
            if (candidate.text.toLowerCase().includes(currentSection.text.toLowerCase()) &&
                candidate.level < currentSection.level) {
                return false;
            }
            
            return true;
        });
        
        // If no valid candidates after filtering, don't create a link
        if (validCandidates.length === 0) {
            return null;
        }
        
        // Return the best remaining candidate
        return validCandidates[0];
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Get statistics about auto-linking
    getStats() {
        return {
            totalTerms: this.termDictionary.size,
            totalSections: this.sectionMap.size,
            processed: this.processed
        };
    }
}