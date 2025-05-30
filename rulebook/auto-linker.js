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
                    level: parseInt(heading.tagName.charAt(1))
                });
                
                // Store common variations
                const variations = this.generateSectionVariations(text);
                variations.forEach(variation => {
                    if (!this.sectionMap.has(variation.toLowerCase())) {
                        this.sectionMap.set(variation.toLowerCase(), {
                            id: heading.id,
                            text: text,
                            level: parseInt(heading.tagName.charAt(1))
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

        // Find actual definition locations in the document
        Object.entries(gameTerms).forEach(([term, fallbackSections]) => {
            const definitionLocation = this.findDefinitionLocation(container, term, fallbackSections);
            if (definitionLocation) {
                this.termDictionary.set(term.toLowerCase(), {
                    term: term,
                    id: definitionLocation.id,
                    section: definitionLocation.text
                });
            }
        });
        
        console.log('Term dictionary entries:', Array.from(this.termDictionary.keys()).slice(0, 10));
    }

    findDefinitionLocation(container, term, fallbackSections) {
        // Look for the term in headings first (most authoritative)
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (let heading of headings) {
            if (heading.textContent.toLowerCase().includes(term.toLowerCase())) {
                return { id: heading.id, text: heading.textContent.trim() };
            }
        }
        
        // Look for fallback sections
        for (let fallbackSection of fallbackSections) {
            const fallbackHeading = Array.from(headings).find(h => 
                h.textContent.toLowerCase().includes(fallbackSection.toLowerCase())
            );
            
            if (fallbackHeading) {
                return { id: fallbackHeading.id, text: fallbackHeading.textContent.trim() };
            }
        }
        
        // If no specific section found, try to find any section that mentions the term
        const allText = container.textContent.toLowerCase();
        if (allText.includes(term.toLowerCase())) {
            // Find the first heading, as a last resort
            const firstHeading = headings[0];
            if (firstHeading && firstHeading.id) {
                return { id: firstHeading.id, text: firstHeading.textContent.trim() };
            }
        }
        
        return null;
    }

    // Apply auto-linking to HTML content
    applyAutoLinking(htmlContent) {
        if (!this.processed) {
            this.buildDictionaries(htmlContent);
        }

        console.log('Applying auto-linking to content...');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Process text nodes for linking
        this.processTextNodes(tempDiv);

        const result = tempDiv.innerHTML;
        
        // Count links created for debugging
        const linkCount = (result.match(/class="auto-link"/g) || []).length;
        console.log('Auto-links created:', linkCount);

        return result;
    }

    processTextNodes(container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip text inside links, code blocks, and other special elements
                    let parent = node.parentElement;
                    const skipTags = ['A', 'CODE', 'PRE', 'SCRIPT', 'STYLE'];
                    
                    while (parent && parent !== container) {
                        if (skipTags.includes(parent.tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        parent = parent.parentElement;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Process each text node
        textNodes.forEach(textNode => {
            const newContent = this.linkifyText(textNode.textContent);
            if (newContent !== textNode.textContent) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = newContent;
                
                // Replace the text node with the wrapper's contents
                while (wrapper.firstChild) {
                    textNode.parentNode.insertBefore(wrapper.firstChild, textNode);
                }
                textNode.parentNode.removeChild(textNode);
            }
        });
    }

    linkifyText(text) {
        let result = text;

        // 1. Link section references first (higher priority)
        result = this.linkSectionReferences(result);

        // 2. Link game terms
        result = this.linkGameTerms(result);

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

    linkGameTerms(text) {
        let result = text;

        // Sort terms by length (descending) to handle longer terms first
        const sortedTerms = Array.from(this.termDictionary.keys())
            .sort((a, b) => b.length - a.length);

        sortedTerms.forEach(termKey => {
            const termData = this.termDictionary.get(termKey);
            const term = termData.term;
            
            // Create regex that matches whole words only
            const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
            
            result = result.replace(regex, (match) => {
                // Don't link if already inside a link
                return `<a href="#${termData.id}" class="auto-link term-link" title="See ${term} in ${termData.section}">${match}</a>`;
            });
        });

        return result;
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