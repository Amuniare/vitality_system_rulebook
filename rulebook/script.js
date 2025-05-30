class RulebookApp {
    constructor() {
        this.autoLinker = new AutoLinker();
        this.init();
    }

    async init() {
        try {
            await this.loadRulebook();
            this.generateNavigation();
            this.setupEventListeners();
            this.logAutoLinkingStats();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            document.getElementById('content').innerHTML = 
                '<div class="error">Failed to load rulebook. Please try refreshing the page.</div>';
        }
    }

    async loadRulebook() {
        try {
            const response = await fetch('rulebook.md');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const markdown = await response.text();
            console.log('Markdown loaded, length:', markdown.length);
            
            let html = marked.parse(markdown);
            console.log('HTML parsed, length:', html.length);
            
            // Add IDs to headings BEFORE auto-linking
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            this.addHeadingIdsToElement(tempDiv);
            html = tempDiv.innerHTML;
            
            // Apply auto-linking AFTER headings have IDs
            console.log('Applying auto-linking...');
            html = this.autoLinker.applyAutoLinking(html);
            console.log('Auto-linking applied');
            
            document.getElementById('content').innerHTML = html;
            
        } catch (error) {
            throw new Error(`Failed to load rulebook: ${error.message}`);
        }
    }

    addHeadingIdsToElement(element) {
        const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = this.createSlug(heading.textContent) + '-' + index;
            }
        });
    }

    addHeadingIds() {
        const headings = document.querySelectorAll('#content h1, #content h2, #content h3');
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = this.createSlug(heading.textContent) + '-' + index;
            }
        });
    }

    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    generateNavigation() {
        const headings = document.querySelectorAll('#content h1, #content h2, #content h3');
        const navContent = document.getElementById('nav-content');
        
        if (headings.length === 0) {
            navContent.innerHTML = '<div class="loading">No headings found</div>';
            return;
        }

        let navHTML = '';
        headings.forEach(heading => {
            const level = heading.tagName.toLowerCase();
            const text = heading.textContent;
            const id = heading.id;
            
            navHTML += `
                <a href="#${id}" class="nav-item ${level}" data-target="${id}">
                    ${text}
                </a>
            `;
        });

        navContent.innerHTML = navHTML;
    }

    setupEventListeners() {
        // Smooth scroll for navigation links (existing auto-links work automatically)
        document.addEventListener('click', (e) => {
            // Handle both navigation and auto-links
            if (e.target.matches('.nav-item, .auto-link')) {
                e.preventDefault();
                
                let targetId;
                if (e.target.classList.contains('nav-item')) {
                    targetId = e.target.getAttribute('data-target');
                } else {
                    // Auto-link
                    const href = e.target.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        targetId = href.substring(1); // Remove the #
                    }
                }
                
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        // Add visual feedback for auto-linked terms
                        if (e.target.classList.contains('auto-link')) {
                            targetElement.classList.add('highlighted');
                            setTimeout(() => {
                                targetElement.classList.remove('highlighted');
                            }, 2000);
                        }
                    } else {
                        console.warn('Target element not found:', targetId);
                    }
                }
            }
        });

        // Mobile menu toggle
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '☰ Menu';
        menuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        document.body.appendChild(menuToggle);
    }

    logAutoLinkingStats() {
        const stats = this.autoLinker.getStats();
        console.log('Auto-linking Statistics:', stats);
        
        // Debug: Count actual auto-links in the document
        const autoLinks = document.querySelectorAll('.auto-link');
        console.log('Auto-links found in document:', autoLinks.length);
        
        if (autoLinks.length === 0) {
            console.warn('No auto-links were created. Check if terms are being detected.');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RulebookApp();
});