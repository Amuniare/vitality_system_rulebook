// EventManager.js - FIXED
export class EventManager {
    static delegateEvents(container, eventMap, context = null) {
        if (!container || !container.addEventListener) {
            console.error('Invalid container for event delegation:', container);
            return;
        }
        
        Object.entries(eventMap).forEach(([eventType, handlers]) => {
            container.addEventListener(eventType, (e) => {
                Object.entries(handlers).forEach(([selector, handler]) => {
                    const matchingElement = e.target.matches(selector) ? e.target : e.target.closest(selector);
                    if (matchingElement) {
                        try {
                            // Use the provided context or the handler's own context
                            if (context && typeof handler === 'function') {
                                handler.call(context, e, matchingElement);
                            } else {
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
}