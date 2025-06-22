import { Logger } from '../utils/Logger.js';

export class NotificationSystem {
    static container = null;
    static queue = [];
    static activeNotifications = new Map();
    
    static init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            // ✅ Use Logger
            Logger.warn('[NotificationSystem] Notification container not found in the DOM.');
        }
    }
    
    static show(message, type = 'info', duration = 3000) {
        if (!this.container) return;
        
        const id = Date.now().toString();
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.activeNotifications.set(id, notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto-remove if duration is set
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
        
        return id;
    }
    
    static createNotification(id, message, type) {
        const div = document.createElement('div');
        div.className = `notification notification-${type}`;
        div.dataset.notificationId = id;
        
        div.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" data-action="close-notification">×</button>
        `;
        
        // Handle close button
        div.querySelector('[data-action="close-notification"]').addEventListener('click', () => {
            this.remove(id);
        });
        
        return div;
    }
    
    static remove(id) {
        const notification = this.activeNotifications.get(id);
        if (!notification) return;
        
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        setTimeout(() => {
            notification.remove();
            this.activeNotifications.delete(id);
        }, 300);
    }
    
    static clear() {
        this.activeNotifications.forEach((notification, id) => {
            this.remove(id);
        });
    }
}