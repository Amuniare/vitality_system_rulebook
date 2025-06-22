// state/StateManager.js
export class StateManager {
    constructor() {
        this.state = {
            character: {
                name: '',
                archetype: null,
                tier: 4,
                powerLevel: 2
            },
            pools: {
                main: { total: 30, spent: 0 },
                secondary: { total: 0, spent: 0 },
                companion: { total: 0, spent: 0 }
            },
            purchases: {},
            entities: {
                flaws: [],
                traits: [],
                boons: [],
                actions: [],
                trait2: [],
                companions: []
            }
        };
        
        this.listeners = [];
        this.initialize();
    }

    initialize() {
        // Calculate initial pool values
        this.recalculatePools();
    }

    dispatch(action) {
        console.log('[StateManager] Dispatching:', action.type, action.payload);
        
        switch (action.type) {
            case 'PURCHASE_ENTITY':
                this.purchaseEntity(action.payload);
                break;
            case 'REMOVE_ENTITY':
                this.removeEntity(action.payload);
                break;
            case 'UPDATE_CHARACTER':
                this.updateCharacter(action.payload);
                break;
            case 'SET_ENTITIES':
                this.setEntities(action.payload);
                break;
        }
        
        this.notifyListeners();
    }

    purchaseEntity(payload) {
        const { entityId, entityType } = payload;
        const entity = this.findEntity(entityId, entityType);
        
        if (!entity) {
            console.error('Entity not found:', entityId, entityType);
            return;
        }

        const poolType = this.getPoolForEntityType(entityType);
        const availablePoints = this.getAvailablePoints(poolType);

        if (availablePoints < entity.cost) {
            console.error('Not enough points:', availablePoints, '<', entity.cost);
            return;
        }

        // Create purchase record
        const purchaseId = Date.now().toString();
        this.state.purchases[purchaseId] = {
            id: purchaseId,
            entityId: entity.id,
            entityType: entityType,
            cost: entity.cost,
            poolType: poolType,
            entity: entity
        };

        // Update pool spent amount
        this.recalculatePoolSpent(poolType);
    }

    removeEntity(payload) {
        const { purchaseId, entityType } = payload;
        
        if (this.state.purchases[purchaseId]) {
            const poolType = this.state.purchases[purchaseId].poolType;
            delete this.state.purchases[purchaseId];
            this.recalculatePoolSpent(poolType);
        }
    }

    findEntity(entityId, entityType) {
        const entityList = this.state.entities[entityType + 's'] || this.state.entities[entityType] || [];
        return entityList.find(e => e.id === entityId);
    }

    getPoolForEntityType(entityType) {
        const mapping = {
            'flaw': 'main',
            'trait': 'main',
            'boon': 'main',
            'action': 'main',
            'trait2': 'secondary',
            'companion': 'companion'
        };
        return mapping[entityType] || 'main';
    }

    recalculatePools() {
        const tier = this.state.character.tier || 4;
        const powerLevel = this.state.character.powerLevel || 2;
        
        // Main pool calculation
        this.state.pools.main.total = (tier - powerLevel) * 15;
        
        // Secondary pool (if traits part 2 is enabled)
        this.state.pools.secondary.total = Math.floor(this.state.pools.main.total * 0.5);
        
        // Recalculate spent for all pools
        Object.keys(this.state.pools).forEach(poolType => {
            this.recalculatePoolSpent(poolType);
        });
    }

    recalculatePoolSpent(poolType) {
        const spent = Object.values(this.state.purchases)
            .filter(p => p.poolType === poolType)
            .reduce((sum, p) => sum + p.cost, 0);
        
        this.state.pools[poolType].spent = spent;
    }

    getAvailablePoints(poolType) {
        const pool = this.state.pools[poolType];
        if (!pool) return 0;
        return pool.total - pool.spent;
    }

    hasPurchased(entityId, entityType) {
        return Object.values(this.state.purchases).some(
            p => p.entityId === entityId && p.entityType === entityType
        );
    }

    getPurchaseForEntity(entityId, entityType) {
        return Object.values(this.state.purchases).find(
            p => p.entityId === entityId && p.entityType === entityType
        );
    }

    updateCharacter(updates) {
        this.state.character = { ...this.state.character, ...updates };
        this.recalculatePools();
    }

    setEntities(payload) {
        const { type, entities } = payload;
        this.state.entities[type] = entities;
    }

    getState() {
        return this.state;
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Update the getPoolForEntityType method in StateManager

    getPoolForEntityType(entityType) {
        const mapping = {
            // Main pool entities
            'flaw': 'main',
            'trait': 'main',
            'boon': 'main',
            'action': 'main',
            'uniqueAbility': 'main',
            'specialAttack': 'main',
            'archetypeUpgrade': 'main',
            
            // Secondary pool entities
            'trait2': 'secondary',
            
            // Companion pool entities
            'companion': 'companion',
            
            // Free/automatic entities (no cost)
            'archetypeTrait': null
        };
        return mapping[entityType] || 'main';
    }
}