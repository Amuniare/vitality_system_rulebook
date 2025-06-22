// modernApp/components/NotificationSystem.js
import { Logger } from '../utils/Logger.js';

export class NotificationSystem {
    static instance = null;
    
    static getInstance() {
        if (!NotificationSystem.instance) {
            NotificationSystem.instance = new NotificationSystem();
        }
        return NotificationSystem.instance;
    }
    
    constructor() {
        if (NotificationSystem.instance && NotificationSystem.instance !== this) {
            // Logger.warn('[NotificationSystem] Attempted to re-instantiate singleton. Returning existing instance.');
            return NotificationSystem.instance;
        }
        
        this.container = null;
        this.queue = [];
        this.activeNotifications = new Map();
        
        NotificationSystem.instance = this; // Ensure instance is set here
        // Logger.info('[NotificationSystem] Instance created/retrieved.'); // Log once, perhaps in getInstance
    }
    
    init() {
        // This check ensures init logic runs only once for the singleton
        if (this.container) {
            // Logger.debug('[NotificationSystem] Already initialized.');
            return;
        }
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            Logger.warn('[NotificationSystem] Notification container not found in the DOM. Notifications will not be visible.');
        }
        
        Logger.info('[NotificationSystem] Initialized.');
    }
    
    show(message, type = 'info', duration = 3000) {
        if (!this.container) {
            // Try to initialize if not already (e.g. if called before app.init fully completes)
            if (!document.getElementById('notification-container')) {
                 Logger.error('[NotificationSystem] Cannot show notification - container #notification-container not found in DOM.');
                 console.warn(`Notification (type: ${type}): ${message}`); // Fallback to console
                 return;
            }
            this.init(); // Attempt to set up container if it was missing
            if (!this.container) { // Still not found after trying init
                Logger.error('[NotificationSystem] Cannot show notification - container setup failed.');
                console.warn(`Notification (type: ${type}): ${message}`);
                return;
            }
        }
        
        const id = Date.now() + Math.random(); // Add random to avoid collision if called rapidly
        const notification = this.createNotificationElement(id, message, type);
        
        this.container.appendChild(notification);
        this.activeNotifications.set(id, notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
        
        return id;
    }
    
    createNotificationElement(id, message, type) {
        const div = document.createElement('div');
        // Apply specific type class for styling, e.g., 'notification-info', 'notification-error'
        div.className = `notification notification-${type}`; 
        div.dataset.notificationId = id;
        div.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">×</button>
        `;
        
        div.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(id);
        });
        
        return div;
    }
    
    remove(id) {
        const notification = this.activeNotifications.get(id);
        if (notification) {
            notification.classList.remove('show'); // Trigger fade-out animation
            // Wait for animation to complete before removing from DOM
            notification.addEventListener('transitionend', () => {
                if (notification.parentNode) {
                    notification.remove();
                }
                this.activeNotifications.delete(id);
            }, { once: true });
            // Fallback if transitionend doesn't fire (e.g. display:none immediately)
            setTimeout(() => {
                 if (notification.parentNode) notification.remove();
                 this.activeNotifications.delete(id);
            }, 500); // Slightly longer than transition
        }
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
    
    clear() {
        this.activeNotifications.forEach((notification, id) => {
            this.remove(id); // Use remove to handle animations
        });
    }
}