class AutoLinker {
    constructor() {
        this.termDictionary = new Map();
        this.sectionMap = new Map();
        this.processed = false;
    }

    // Build dictionaries from the processed HTML content
    buildDictionaries(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Build section map from headings
        this.buildSectionMap(tempDiv);
        
        // Build term dictionary from content
        this.buildTermDictionary(tempDiv);
        
        this.processed = true;
    }

    buildSectionMap(container) {
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
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
            }
        });
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
            'Focus': 'core stats',
            'Mobility': 'core stats', 
            'Power': 'core stats',
            'Endurance': 'core stats',
            'Awareness': 'core stats',
            'Communication': 'core stats',
            'Intelligence': 'core stats',
            
            // Defense Stats
            'Avoidance': 'defense stats',
            'Durability': 'defense stats',
            'Resolve': 'defense stats',
            'Stability': 'defense stats',
            'Vitality': 'defense stats',
            
            // Combat Stats
            'Accuracy': 'combat stats',
            'Damage': 'combat stats',
            'Conditions': 'combat stats',
            'Initiative': 'combat stats',
            'Movement': 'combat stats',
            
            // Game Concepts
            'Primary Action': 'actions',
            'Secondary Action': 'actions',
            'Effort': 'effort system',
            'Tier': 'character progression',
            'Archetype': 'archetypes',
            'Limit': 'limits system',
            'Trait': 'traits',
            'Boon': 'abilities',
            'Flaw': 'abilities',
            'Special Attack': 'special attacks',
            'Upgrade': 'upgrades',
            
            // Status Effects
            'Stun': 'conditions',
            'Control': 'conditions',
            'Weaken': 'conditions',
            'Daze': 'conditions',
            'Blind': 'conditions',
            'Disarm': 'conditions',
            'Grab': 'conditions',
            'Shove': 'conditions',
            
            // Attack Types
            'Melee': 'combat',
            'Ranged': 'combat',
            'Direct': 'combat',
            'AOE': 'combat',
            'Area of Effect': 'combat'
        };

        // Find actual definition locations in the document
        Object.entries(gameTerms).forEach(([term, fallbackSection]) => {
            const definitionLocation = this.findDefinitionLocation(container, term, fallbackSection);
            if (definitionLocation) {
                this.termDictionary.set(term.toLowerCase(), {
                    term: term,
                    id: definitionLocation.id,
                    section: definitionLocation.text
                });
            }
        });
    }

    findDefinitionLocation(container, term, fallbackSection) {
        // Look for the term in headings first (most authoritative)
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (let heading of headings) {
            if (heading.textContent.toLowerCase().includes(term.toLowerCase())) {
                return { id: heading.id, text: heading.textContent.trim() };
            }
        }
        
        // Look for fallback section
        const fallbackHeading = Array.from(headings).find(h => 
            h.textContent.toLowerCase().includes(fallbackSection.toLowerCase())
        );
        
        if (fallbackHeading) {
            return { id: fallbackHeading.id, text: fallbackHeading.textContent.trim() };
        }
        
        return null;
    }

    // Apply auto-linking to HTML content
    applyAutoLinking(htmlContent) {
        if (!this.processed) {
            this.buildDictionaries(htmlContent);
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Process text nodes for linking
        this.processTextNodes(tempDiv);

        return tempDiv.innerHTML;
    }

    processTextNodes(container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip text inside links, code blocks, and other special elements
                    const parent = node.parentElement;
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
                textNode.parentNode.replaceChild(wrapper, textNode);
                
                // Unwrap the span if it only contains one child
                if (wrapper.children.length === 1 && !wrapper.textContent.trim()) {
                    wrapper.parentNode.replaceChild(wrapper.firstChild, wrapper);
                } else if (wrapper.childNodes.length === 1 && wrapper.firstChild.nodeType === Node.TEXT_NODE) {
                    wrapper.parentNode.replaceChild(wrapper.firstChild, wrapper);
                } else {
                    // Replace span with its contents
                    while (wrapper.firstChild) {
                        wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
                    }
                    wrapper.parentNode.removeChild(wrapper);
                }
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
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            
            result = result.replace(regex, (match) => {
                // Don't link if already inside a link or if it's possessive
                if (match.toLowerCase() === term.toLowerCase()) {
                    return `<a href="#${termData.id}" class="auto-link term-link" title="See ${term} in ${termData.section}">${match}</a>`;
                }
                return match;
            });
        });

        return result;
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