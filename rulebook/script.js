class RulebookApp {
    constructor() {
        this.init();
    }

    async init() {
        try {
            await this.loadRulebook();
            this.generateNavigation();
            this.setupEventListeners();
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
            const html = marked.parse(markdown);
            
            document.getElementById('content').innerHTML = html;
            
            // Add IDs to headings for navigation
            this.addHeadingIds();
            
        } catch (error) {
            throw new Error(`Failed to load rulebook: ${error.message}`);
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
        // Smooth scroll for navigation links
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Mobile menu toggle (if needed)
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '☰ Menu';
        menuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        document.body.appendChild(menuToggle);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RulebookApp();
});