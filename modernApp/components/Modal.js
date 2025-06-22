// modernApp/components/Modal.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Modal - Reusable modal dialog component
 * Supports confirmations, forms, and custom content
 */
export class Modal {
    constructor(options = {}) {
        this.options = {
            title: 'Modal',
            content: '',
            closeOnOverlay: true,
            closeOnEscape: true,
            showCloseButton: true,
            buttons: [],
            className: '',
            width: 'auto',
            maxWidth: '600px',
            ...options
        };
        
        this.element = null;
        this.overlay = null;
        this.isOpen = false;
        this.callbacks = {};
        
        // Bind methods
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleOverlayClick = this.handleOverlayClick.bind(this);
        
        // Create modal on instantiation
        this.create();
    }
    
    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.display = 'none';
        
        // Create modal container
        this.element = document.createElement('div');
        this.element.className = `modal ${this.options.className}`;
        this.element.style.width = this.options.width;
        this.element.style.maxWidth = this.options.maxWidth;
        
        // Create modal structure
        this.element.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${this.options.title}</h3>
                ${this.options.showCloseButton ? '<button class="modal-close" aria-label="Close">&times;</button>' : ''}
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer"></div>
        `;
        
        // Get references to parts
        this.header = this.element.querySelector('.modal-header');
        this.body = this.element.querySelector('.modal-body');
        this.footer = this.element.querySelector('.modal-footer');
        
        // Set content
        this.setContent(this.options.content);
        
        // Add buttons
        if (this.options.buttons.length > 0) {
            this.setButtons(this.options.buttons);
        }
        
        // Add to overlay
        this.overlay.appendChild(this.element);
        
        // Set up event listeners
        this.setupEventListeners();
        
        Logger.debug('[Modal] Created');
    }
    
    setupEventListeners() {
        // Close button
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Overlay click
        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', this.handleOverlayClick);
        }
    }
    
    handleOverlayClick(e) {
        if (e.target === this.overlay) {
            this.close();
        }
    }
    
    handleKeydown(e) {
        if (e.key === 'Escape' && this.options.closeOnEscape) {
            this.close();
        }
    }
    
    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    setContent(content) {
        if (typeof content === 'string') {
            this.body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.body.innerHTML = '';
            this.body.appendChild(content);
        }
    }
    
    setButtons(buttons) {
        this.footer.innerHTML = '';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `modal-button ${button.className || ''}`;
            btn.textContent = button.text;
            
            if (button.primary) {
                btn.classList.add('primary');
            }
            
            btn.addEventListener('click', () => {
                if (button.handler) {
                    button.handler(this);
                }
                
                if (button.closeOnClick !== false) {
                    this.close();
                }
            });
            
            this.footer.appendChild(btn);
        });
    }
    
    open() {
        if (this.isOpen) return;
        
        // Add to DOM if not already
        if (!this.overlay.parentNode) {
            document.body.appendChild(this.overlay);
        }
        
        // Show modal
        this.overlay.style.display = 'flex';
        this.element.classList.add('modal-open');
        
        // Add body class to prevent scrolling
        document.body.classList.add('modal-active');
        
        // Focus first focusable element
        setTimeout(() => {
            const focusable = this.element.querySelector('button, input, select, textarea');
            if (focusable) {
                focusable.focus();
            }
        }, 100);
        
        // Add escape key listener
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this.handleKeydown);
        }
        
        this.isOpen = true;
        
        EventBus.emit('MODAL_OPENED', { modal: this });
        
        if (this.callbacks.onOpen) {
            this.callbacks.onOpen(this);
        }
        
        Logger.debug('[Modal] Opened');
    }
    
    close() {
        if (!this.isOpen) return;
        
        // Hide modal
        this.element.classList.remove('modal-open');
        
        // Wait for animation
        setTimeout(() => {
            this.overlay.style.display = 'none';
            
            // Remove body class
            document.body.classList.remove('modal-active');
            
            // Remove from DOM if configured
            if (this.options.removeOnClose && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
        }, 300);
        
        // Remove escape key listener
        if (this.options.closeOnEscape) {
            document.removeEventListener('keydown', this.handleKeydown);
        }
        
        this.isOpen = false;
        
        EventBus.emit('MODAL_CLOSED', { modal: this });
        
        if (this.callbacks.onClose) {
            this.callbacks.onClose(this);
        }
        
        Logger.debug('[Modal] Closed');
    }
    
    destroy() {
        this.close();
        
        // Remove all event listeners
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.removeEventListener('click', () => this.close());
        }
        
        if (this.options.closeOnOverlay) {
            this.overlay.removeEventListener('click', this.handleOverlayClick);
        }
        
        // Remove from DOM
        if (this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        Logger.debug('[Modal] Destroyed');
    }
    
    // Callback methods
    onOpen(callback) {
        this.callbacks.onOpen = callback;
        return this;
    }
    
    onClose(callback) {
        this.callbacks.onClose = callback;
        return this;
    }
    
    // Static factory methods
    static confirm(options = {}) {
        const modal = new Modal({
            title: options.title || 'Confirm',
            content: options.message || 'Are you sure?',
            buttons: [
                {
                    text: options.cancelText || 'Cancel',
                    className: 'secondary'
                },
                {
                    text: options.confirmText || 'Confirm',
                    className: 'primary',
                    handler: () => {
                        if (options.onConfirm) {
                            options.onConfirm();
                        }
                    }
                }
            ],
            ...options
        });
        
        modal.open();
        return modal;
    }
    
    static alert(options = {}) {
        const modal = new Modal({
            title: options.title || 'Alert',
            content: options.message || '',
            buttons: [
                {
                    text: options.buttonText || 'OK',
                    className: 'primary'
                }
            ],
            ...options
        });
        
        modal.open();
        return modal;
    }
    
    static prompt(options = {}) {
        const inputId = `modal-prompt-${Date.now()}`;
        
        const content = document.createElement('div');
        content.innerHTML = `
            ${options.message ? `<p>${options.message}</p>` : ''}
            <input type="${options.inputType || 'text'}" 
                   id="${inputId}" 
                   class="modal-input" 
                   value="${options.defaultValue || ''}"
                   placeholder="${options.placeholder || ''}">
        `;
        
        const modal = new Modal({
            title: options.title || 'Input',
            content: content,
            buttons: [
                {
                    text: options.cancelText || 'Cancel',
                    className: 'secondary'
                },
                {
                    text: options.confirmText || 'OK',
                    className: 'primary',
                    handler: (modal) => {
                        const input = document.getElementById(inputId);
                        if (options.onConfirm && input) {
                            options.onConfirm(input.value);
                        }
                    }
                }
            ],
            ...options
        });
        
        modal.open();
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
        
        return modal;
    }
}