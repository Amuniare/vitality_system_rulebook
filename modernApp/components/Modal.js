// modernApp/components/Modal.js
import { Logger } from '../utils/Logger.js';

let activeModal = null; // Keep track of the currently active modal

export class Modal {

    static _createModalShell(title, contentHtml, buttonsConfig = []) {
        const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = modalId;
        modalOverlay.setAttribute('role', 'dialog'); // Accessibility
        modalOverlay.setAttribute('aria-modal', 'true');
        modalOverlay.setAttribute('aria-labelledby', `modal-title-${modalId}`);

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
            <div class="modal-content" role="document">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title-${modalId}">${title}</h3>
                    <button class="modal-close-btn" data-action="close" aria-label="Close modal">×</button>
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
            this._hide(activeModal); 
        }

        document.body.appendChild(modalElement);
        document.body.classList.add('modal-open'); 
        activeModal = modalElement;

        const focusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        } else {
            modalElement.querySelector('.modal-content').focus(); // Fallback to content div
        }
        
        requestAnimationFrame(() => {
            modalElement.classList.add('open');
        });

        const closeHandler = (action = 'close') => {
            this._hide(modalElement);
            if (typeof onAction === 'function') {
                onAction(action);
            }
        };
        
        // Store handlers on the element itself to ensure they are unique per modal instance
        modalElement._clickHandler = (e) => {
            if (e.target === modalElement) { 
                closeHandler('overlay_close');
            }
            const button = e.target.closest('button[data-action]');
            if (button) {
                e.stopPropagation(); // Prevent overlay click if button is inside
                const action = button.dataset.action;
                // Custom actions will also close the modal by default through closeHandler
                closeHandler(action);
            }
        };

        modalElement._keydownHandler = (e) => {
            if (e.key === 'Escape') {
                closeHandler('escape_key');
            }
        };
        
        modalElement.addEventListener('click', modalElement._clickHandler);
        document.addEventListener('keydown', modalElement._keydownHandler);

        Logger.debug(`[Modal] Shown: ${modalElement.id}`);
    }

    static _hide(modalElement) {
        if (!modalElement || !document.body.contains(modalElement)) return;

        modalElement.classList.remove('open');
        
        const transitionEndHandler = () => {
            if (modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }
            if (modalElement._clickHandler) {
                 modalElement.removeEventListener('click', modalElement._clickHandler);
            }
            if (modalElement._keydownHandler) {
                document.removeEventListener('keydown', modalElement._keydownHandler);
            }
            modalElement.removeEventListener('transitionend', transitionEndHandler);
        };
        
        modalElement.addEventListener('transitionend', transitionEndHandler);

        // Fallback if transitionend doesn't fire (e.g. no transition defined or display:none interrupts)
        setTimeout(() => {
            if (document.body.contains(modalElement)) {
                transitionEndHandler(); // Attempt cleanup if still there
            }
        }, 500); // Slightly longer than typical transition


        if (activeModal === modalElement) {
            activeModal = null;
            document.body.classList.remove('modal-open');
        }
        Logger.debug(`[Modal] Hidden: ${modalElement.id}`);
    }

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

    static showCustom(title, contentHtml, buttonsConfig = []) {
         return new Promise((resolve) => {
            const modalElement = this._createModalShell(title, contentHtml, buttonsConfig.length > 0 ? buttonsConfig : [{ text: 'Close', action: 'close_button', className: 'btn-primary' }]);
            this._show(modalElement, (action) => {
                resolve(action);
            });
        });
    }
    
    static closeActive() {
        if (activeModal) {
            // Assuming the _hide method's default action for direct close is 'close_button' or similar
            // or simply call _hide and let it handle cleanup.
            // The onAction callback from the original _show call won't be invoked here, which is usually fine for forced close.
             this._hide(activeModal);
        }
    }
}

// REMOVED modalStyles constant and the style injection logic.