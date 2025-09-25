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
            console.log('Markdown loaded, length:', markdown.length);
            
            let html = marked.parse(markdown);
            console.log('HTML parsed, length:', html.length);
            
            // Add IDs to headings BEFORE auto-linking
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            this.addHeadingIdsToElement(tempDiv);
            html = tempDiv.innerHTML;
            
            
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
            // Handle navigation links
            if (e.target.matches('.nav-item')) {
                e.preventDefault();
                
                const targetId = e.target.getAttribute('data-target');
                
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
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

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RulebookApp();
});