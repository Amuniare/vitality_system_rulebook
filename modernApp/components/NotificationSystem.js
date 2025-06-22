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
        if (NotificationSystem.instance) {
            return NotificationSystem.instance;
        }
        
        this.container = null;
        this.queue = [];
        this.activeNotifications = new Map();
        
        Logger.info('[NotificationSystem] Instance created.');
    }
    
    init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            Logger.warn('[NotificationSystem] Notification container not found in the DOM.');
        }
        
        Logger.info('[NotificationSystem] Initialized.');
    }
    
    show(message, type = 'info', duration = 3000) {
        if (!this.container) {
            Logger.error('[NotificationSystem] Cannot show notification - container not found.');
            return;
        }
        
        const id = Date.now();
        const notification = this.createNotificationElement(id, message, type);
        
        this.container.appendChild(notification);
        this.activeNotifications.set(id, notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
        
        return id;
    }
    
    createNotificationElement(id, message, type) {
        const div = document.createElement('div');
        div.className = `notification notification-${type}`;
        div.dataset.notificationId = id;
        div.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;
        
        // Add close handler
        div.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(id);
        });
        
        return div;
    }
    
    remove(id) {
        const notification = this.activeNotifications.get(id);
        if (notification) {
            notification.remove();
            this.activeNotifications.delete(id);
        }
    }
    
    // Convenience methods
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
            this.remove(id);
        });
    }
}