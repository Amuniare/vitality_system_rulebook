
// modernApp/components/Modal.js
import { Logger } from '../utils/Logger.js';

let activeModal = null; // Keep track of the currently active modal

export class Modal {

    static _createModalShell(title, contentHtml, buttonsConfig = []) {
        const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = modalId;

        let buttonsHtml = '';
        if (buttonsConfig.length > 0) {
            buttonsHtml = `
                <div class="modal-actions">
                    ${buttonsConfig.map(btn => `
                        <button class="btn ${btn.className || 'btn-secondary'}" data-action="${btn.action}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close-btn" data-action="close">×</button>
                </div>
                <div class="modal-body">
                    ${contentHtml}
                </div>
                ${buttonsHtml}
            </div>
        `;
        return modalOverlay;
    }

    static _show(modalElement, onAction) {
        if (activeModal) {
            Logger.warn('[Modal] Another modal is already active. Closing it first.');
            this._hide(activeModal); // Hide previous modal if any
        }

        document.body.appendChild(modalElement);
        document.body.classList.add('modal-open'); // For potential body scroll lock
        activeModal = modalElement;

        // Focus on the first focusable element or the modal itself
        const focusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        } else {
            modalElement.focus(); // Fallback
        }
        
        // Animation
        requestAnimationFrame(() => {
            modalElement.classList.add('open');
        });

        // Event listeners
        const closeHandler = (action = 'close') => {
            this._hide(modalElement);
            if (typeof onAction === 'function') {
                onAction(action);
            }
        };

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) { // Click on overlay
                closeHandler('overlay_close');
            }
            const button = e.target.closest('button[data-action]');
            if (button) {
                const action = button.dataset.action;
                if (action === 'close') {
                    closeHandler('close_button');
                } else if (action) {
                    closeHandler(action); // Custom button actions
                }
            }
        });

        const keydownHandler = (e) => {
            if (e.key === 'Escape') {
                closeHandler('escape_key');
            }
        };
        modalElement.keydownHandler = keydownHandler; // Store for removal
        document.addEventListener('keydown', keydownHandler);

        Logger.debug(`[Modal] Shown: ${modalElement.id}`);
    }

    static _hide(modalElement) {
        if (!modalElement || !document.body.contains(modalElement)) return;

        modalElement.classList.remove('open');
        
        // Remove after transition
        modalElement.addEventListener('transitionend', () => {
            if (modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }
             // Remove keydown listener specific to this modal
            if (modalElement.keydownHandler) {
                document.removeEventListener('keydown', modalElement.keydownHandler);
            }
        }, { once: true });


        if (activeModal === modalElement) {
            activeModal = null;
            document.body.classList.remove('modal-open');
        }
        Logger.debug(`[Modal] Hidden: ${modalElement.id}`);
    }

    /**
     * Shows a confirmation dialog.
     * @param {string} title - The title of the modal.
     * @param {string} message - The message to display.
     * @returns {Promise<boolean>} - A promise that resolves to true if OK is clicked, false otherwise.
     */
    static confirm(title, message) {
        return new Promise((resolve) => {
            const buttons = [
                { text: 'Cancel', action: 'cancel', className: 'btn-secondary' },
                { text: 'OK', action: 'ok', className: 'btn-primary' }
            ];
            const modalElement = this._createModalShell(title, `<p>${message}</p>`, buttons);
            
            this._show(modalElement, (action) => {
                resolve(action === 'ok');
            });
        });
    }

    /**
     * Shows a modal with custom HTML content.
     * @param {string} title - The title of the modal.
     * @param {string} contentHtml - The HTML string for the modal body.
     * @param {Array<Object>} [buttonsConfig=[]] - Configuration for buttons, e.g., [{text: 'Save', action: 'save', className: 'btn-primary'}].
     * @returns {Promise<string>} - A promise that resolves with the action string of the button clicked.
     */
    static showCustom(title, contentHtml, buttonsConfig = []) {
         return new Promise((resolve) => {
            const modalElement = this._createModalShell(title, contentHtml, buttonsConfig.length > 0 ? buttonsConfig : [{ text: 'Close', action: 'close', className: 'btn-primary' }]);
            this._show(modalElement, (action) => {
                resolve(action);
            });
        });
    }
    
    static closeActive() {
        if (activeModal) {
            this._hide(activeModal);
        }
    }
}

// Minimal CSS for Modal (can be moved to modern-app.css)
const modalStyles = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    transition: opacity var(--transition-base);
    padding: var(--spacing-md);
}
.modal-overlay.open {
    opacity: 1;
}
.modal-content {
    background-color: var(--color-bg-secondary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    transform: scale(0.95);
    transition: transform var(--transition-base);
}
.modal-overlay.open .modal-content {
    transform: scale(1);
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-primary);
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}
.modal-title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
}
.modal-close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--font-size-xxl);
    cursor: pointer;
    line-height: 1;
    padding: 0 var(--spacing-sm);
}
.modal-close-btn:hover {
    color: var(--color-text-primary);
}
.modal-body {
    margin-bottom: var(--spacing-lg);
    line-height: 1.6;
}
.modal-body p {
    margin-bottom: var(--spacing-sm);
}
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
}
body.modal-open {
    overflow: hidden; /* Prevent background scrolling */
}
`;

if (!document.getElementById('modal-component-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'modal-component-styles';
    styleEl.textContent = modalStyles;
    document.head.appendChild(styleEl);
}
