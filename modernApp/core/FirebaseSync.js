// modernApp/core/FirebaseSync.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../config/firebase.js';
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';

/**
 * FirebaseSync - Handles all Firebase Firestore operations for character data
 * Provides cloud storage with offline fallback capabilities
 */
export class FirebaseSync {
  constructor() {
    this.charactersCollection = 'characters';
    this.metadataCollection = 'character_metadata';
    this.isOnline = navigator.onLine;
    this.syncEnabled = false;
    this.syncQueue = [];
    this.listeners = new Map();
    
    // Monitor online/offline status
    this.setupNetworkListeners();
    
    // Initialize sync if Firebase is available
    this.init();
  }

  async init() {
    if (!isFirebaseAvailable()) {
      Logger.warn('[FirebaseSync] Firebase not available, running in offline mode');
      return;
    }

    try {
      // Test connection with a simple read
      const testQuery = query(
        collection(db, this.charactersCollection),
        limit(1)
      );
      await getDocs(testQuery);
      
      this.syncEnabled = true;
      Logger.info('[FirebaseSync] Initialized successfully');
      
      // Process any queued operations
      this.processQueue();
      
    } catch (error) {
      Logger.error('[FirebaseSync] Initialization failed:', error);
      this.syncEnabled = false;
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      Logger.info('[FirebaseSync] Network connection restored');
      if (this.syncEnabled) {
        this.processQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      Logger.info('[FirebaseSync] Network connection lost');
    });
  }

  // Character Operations
  async saveCharacter(characterId, characterData) {
    if (!this.syncEnabled || !this.isOnline) {
      Logger.debug('[FirebaseSync] Queuing character save for later sync');
      this.syncQueue.push({
        operation: 'save',
        characterId,
        data: characterData,
        timestamp: Date.now()
      });
      return { success: false, queued: true };
    }

    try {
      const docRef = doc(db, this.charactersCollection, characterId);
      const dataToSave = {
        ...characterData,
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      await setDoc(docRef, dataToSave, { merge: true });
      
      // Also save metadata for gallery
      await this.saveCharacterMetadata(characterId, characterData);
      
      Logger.debug(`[FirebaseSync] Saved character: ${characterData.name} (${characterId})`);
      EventBus.emit('CHARACTER_SYNCED', { characterId, action: 'save' });
      
      return { success: true, queued: false };
      
    } catch (error) {
      Logger.error(`[FirebaseSync] Failed to save character ${characterId}:`, error);
      
      // Queue for later if it's a network error
      if (this.isNetworkError(error)) {
        this.syncQueue.push({
          operation: 'save',
          characterId,
          data: characterData,
          timestamp: Date.now()
        });
        return { success: false, queued: true };
      }
      
      return { success: false, queued: false, error: error.message };
    }
  }

  async loadCharacter(characterId) {
    if (!this.syncEnabled) {
      return null;
    }

    try {
      const docRef = doc(db, this.charactersCollection, characterId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        Logger.debug(`[FirebaseSync] Loaded character: ${data.name} (${characterId})`);
        return data;
      } else {
        Logger.debug(`[FirebaseSync] Character not found: ${characterId}`);
        return null;
      }
      
    } catch (error) {
      Logger.error(`[FirebaseSync] Failed to load character ${characterId}:`, error);
      return null;
    }
  }

  async deleteCharacter(characterId) {
    if (!this.syncEnabled || !this.isOnline) {
      this.syncQueue.push({
        operation: 'delete',
        characterId,
        timestamp: Date.now()
      });
      return { success: false, queued: true };
    }

    try {
      const docRef = doc(db, this.charactersCollection, characterId);
      await deleteDoc(docRef);
      
      // Also delete metadata
      await this.deleteCharacterMetadata(characterId);
      
      Logger.debug(`[FirebaseSync] Deleted character: ${characterId}`);
      EventBus.emit('CHARACTER_SYNCED', { characterId, action: 'delete' });
      
      return { success: true, queued: false };
      
    } catch (error) {
      Logger.error(`[FirebaseSync] Failed to delete character ${characterId}:`, error);
      
      if (this.isNetworkError(error)) {
        this.syncQueue.push({
          operation: 'delete',
          characterId,
          timestamp: Date.now()
        });
        return { success: false, queued: true };
      }
      
      return { success: false, queued: false, error: error.message };
    }
  }

  // Gallery Operations
  async getAllCharacters(options = {}) {
    if (!this.syncEnabled) {
      return [];
    }

    try {
      const {
        limitCount = 50,
        orderByField = 'updatedAt',
        orderDirection = 'desc',
        filterTier = null,
        filterType = null
      } = options;

      let q = collection(db, this.charactersCollection);
      
      // Apply filters
      if (filterTier) {
        q = query(q, where('tier', '==', filterTier));
      }
      
      if (filterType) {
        q = query(q, where('characterType', '==', filterType));
      }
      
      // Apply ordering and limit
      q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const characters = [];
      
      querySnapshot.forEach((doc) => {
        characters.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      Logger.debug(`[FirebaseSync] Retrieved ${characters.length} characters from gallery`);
      return characters;
      
    } catch (error) {
      Logger.error('[FirebaseSync] Failed to get characters:', error);
      return [];
    }
  }

  async getCharacterMetadata(options = {}) {
    if (!this.syncEnabled) {
      return [];
    }

    try {
      const {
        limitCount = 100,
        orderByField = 'updatedAt',
        orderDirection = 'desc'
      } = options;

      const q = query(
        collection(db, this.metadataCollection),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const metadata = [];
      
      querySnapshot.forEach((doc) => {
        metadata.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return metadata;
      
    } catch (error) {
      Logger.error('[FirebaseSync] Failed to get character metadata:', error);
      return [];
    }
  }

  // Metadata Operations (for gallery)
  async saveCharacterMetadata(characterId, characterData) {
    try {
      const metadataRef = doc(db, this.metadataCollection, characterId);
      const metadata = {
        id: characterId,
        name: characterData.name || 'Unnamed Character',
        tier: characterData.tier || 1,
        characterType: characterData.characterType || 'standard',
        createdAt: characterData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Add key stats for gallery display
        mainArchetype: this.getMainArchetype(characterData),
        totalPoints: this.calculateTotalPoints(characterData),
        level: this.calculateLevel(characterData)
      };

      await setDoc(metadataRef, metadata, { merge: true });
      
    } catch (error) {
      Logger.error(`[FirebaseSync] Failed to save metadata for ${characterId}:`, error);
    }
  }

  async deleteCharacterMetadata(characterId) {
    try {
      const metadataRef = doc(db, this.metadataCollection, characterId);
      await deleteDoc(metadataRef);
    } catch (error) {
      Logger.error(`[FirebaseSync] Failed to delete metadata for ${characterId}:`, error);
    }
  }

  // Real-time listeners
  subscribeToCharacter(characterId, callback) {
    if (!this.syncEnabled) {
      return () => {}; // Return empty unsubscribe function
    }

    const docRef = doc(db, this.charactersCollection, characterId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    }, (error) => {
      Logger.error(`[FirebaseSync] Subscription error for ${characterId}:`, error);
    });

    // Store listener for cleanup
    this.listeners.set(characterId, unsubscribe);
    
    return unsubscribe;
  }

  unsubscribeFromCharacter(characterId) {
    const unsubscribe = this.listeners.get(characterId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(characterId);
    }
  }

  // Queue Management
  async processQueue() {
    if (!this.syncEnabled || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    Logger.info(`[FirebaseSync] Processing ${this.syncQueue.length} queued operations`);
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const operation of queue) {
      try {
        switch (operation.operation) {
          case 'save':
            await this.saveCharacter(operation.characterId, operation.data);
            break;
          case 'delete':
            await this.deleteCharacter(operation.characterId);
            break;
          default:
            Logger.warn(`[FirebaseSync] Unknown queued operation: ${operation.operation}`);
        }
      } catch (error) {
        Logger.error(`[FirebaseSync] Failed to process queued operation:`, error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }
  }

  // Utility Methods
  isNetworkError(error) {
    return error.code === 'unavailable' || 
           error.message.includes('network') || 
           error.message.includes('offline');
  }

  getMainArchetype(characterData) {
    if (!characterData.archetypes) return 'None';
    
    const archetypes = Object.entries(characterData.archetypes);
    if (archetypes.length === 0) return 'None';
    
    // Return the first archetype or the one with highest level
    const mainArchetype = archetypes.reduce((prev, current) => 
      (current[1].level || 0) > (prev[1].level || 0) ? current : prev
    );
    
    return mainArchetype[0] || 'None';
  }

  calculateTotalPoints(characterData) {
    // Simple calculation - can be enhanced based on your point system
    let total = 0;
    
    if (characterData.combatAttributes) {
      total += Object.values(characterData.combatAttributes).reduce((sum, val) => sum + (val || 0), 0);
    }
    
    if (characterData.utilityAttributes) {
      total += Object.values(characterData.utilityAttributes).reduce((sum, val) => sum + (val || 0), 0);
    }
    
    return total;
  }

  calculateLevel(characterData) {
    // Simple level calculation based on tier and points
    const tier = characterData.tier || 1;
    const points = this.calculateTotalPoints(characterData);
    return Math.floor(tier + (points / 10));
  }

  // Status and Debug
  getStatus() {
    return {
      syncEnabled: this.syncEnabled,
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      activeListeners: this.listeners.size,
      firebaseAvailable: isFirebaseAvailable()
    };
  }

  getQueuedOperations() {
    return [...this.syncQueue];
  }

  clearQueue() {
    this.syncQueue = [];
    Logger.info('[FirebaseSync] Queue cleared');
  }

  // Cleanup
  cleanup() {
    // Unsubscribe from all listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    // Clear network listeners
    window.removeEventListener('online', this.setupNetworkListeners);
    window.removeEventListener('offline', this.setupNetworkListeners);
    
    Logger.info('[FirebaseSync] Cleanup completed');
  }
}