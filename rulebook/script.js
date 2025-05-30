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
            // Try fallback method
            await this.loadRulebookFallback();
        }
    }

    async loadRulebook() {
        try {
            // Try multiple paths for GitHub Pages compatibility
            const possiblePaths = [
                'rulebook.md',
                './rulebook.md', 
                'rulebook/rulebook.md',
                './rulebook/rulebook.md'
            ];
            
            let markdown = null;
            let loadedPath = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log(`Attempting to load: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        markdown = await response.text();
                        loadedPath = path;
                        console.log(`Successfully loaded: ${path}`);
                        break;
                    }
                } catch (e) {
                    console.warn(`Failed to load ${path}:`, e);
                }
            }
            
            if (!markdown) {
                throw new Error('Could not load rulebook.md from any path');
            }
            
            // Parse markdown
            let html = marked.parse(markdown);
            
            // Ensure content exists before auto-linking
            if (!html || html.length < 100) {
                throw new Error('Loaded markdown appears to be empty or invalid');
            }
            
            // Apply auto-linking BEFORE adding to DOM
            html = this.autoLinker.applyAutoLinking(html);
            
            const contentElement = document.getElementById('content');
            if (!contentElement) {
                throw new Error('Content element not found');
            }
            
            contentElement.innerHTML = html;
            
            // Wait for DOM to settle before adding IDs
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Add IDs to headings for navigation (after auto-linking)
            this.addHeadingIds();
            
            console.log('Rulebook loaded and auto-linking applied successfully');
            
        } catch (error) {
            console.error('Rulebook loading failed:', error);
            const errorMessage = `
                <div class="error">
                    <h2>Failed to load rulebook</h2>
                    <p>Error: ${error.message}</p>
                    <p>This may be due to GitHub Pages file serving restrictions.</p>
                    <p>Try refreshing the page or check the browser console for details.</p>
                </div>
            `;
            document.getElementById('content').innerHTML = errorMessage;
            throw error;
        }
    }

    // Fallback method for GitHub Pages
    async loadRulebookFallback() {
        try {
            console.log('Attempting fallback loading method...');
            
            // If direct loading fails, try embedding the content
            const contentElement = document.getElementById('content');
            contentElement.innerHTML = `
                <div class="error">
                    <h2>Rulebook Loading Issue</h2>
                    <p>The rulebook content could not be loaded automatically.</p>
                    <p>This is likely due to GitHub Pages file serving restrictions.</p>
                    <h3>Possible Solutions:</h3>
                    <ul>
                        <li>Check that <code>rulebook.md</code> exists in the repository root</li>
                        <li>Ensure GitHub Pages is serving the correct branch</li>
                        <li>Try refreshing the page</li>
                        <li>Check the browser console for detailed error messages</li>
                    </ul>
                    <p>For developers: Consider converting <code>rulebook.md</code> to <code>rulebook.html</code> or embedding content directly.</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Fallback loading also failed:', error);
            document.getElementById('content').innerHTML = `
                <div class="error">
                    <h2>Complete Loading Failure</h2>
                    <p>Both primary and fallback loading methods failed.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
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
                    targetId = href.substring(1); // Remove the #
                }
                
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
                }
            }
        });

        // Mobile menu toggle (existing code)
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
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RulebookApp();
});