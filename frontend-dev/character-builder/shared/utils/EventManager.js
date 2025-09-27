// EventManager.js - COMPLETE REWRITE with working context binding and debounce
export class EventManager {
    // Event delegation with proper context binding
    static delegateEvents(container, eventMap, context = null) {
        if (!container || !container.addEventListener) {
            console.error('Invalid container for event delegation:', container);
            return;
        }
        
        Object.entries(eventMap).forEach(([eventType, handlers]) => {
            container.addEventListener(eventType, (e) => {
                Object.entries(handlers).forEach(([selector, handler]) => {
                    const matchingElement = e.target.matches?.(selector) ? e.target : e.target.closest?.(selector);
                    if (matchingElement) {
                        try {
                            if (context && typeof handler === 'function') {
                                handler.call(context, e, matchingElement);
                            } else if (typeof handler === 'function') {
                                handler(e, matchingElement);
                            }
                        } catch (error) {
                            console.error(`❌ Delegated ${eventType} error for ${selector}:`, error);
                        }
                    }
                });
            });
        });
    }
    
    // Working debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle utility
    static throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function executedFunction(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
}

// Export debounce as standalone function too
export const debounce = EventManager.debounce;