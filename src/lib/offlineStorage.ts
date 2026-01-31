import { get, set, del, keys, clear } from 'idb-keyval';

/**
 * Offline mutation queue entry
 */
export interface OfflineMutation {
    id: string;
    table: string;
    operation: 'insert' | 'update' | 'delete';
    data: Record<string, any>;
    userId: string;
    timestamp: number;
    retryCount: number;
    error?: string;
}

const QUEUE_KEY_PREFIX = 'offline-mutation-';
const QUEUE_INDEX_KEY = 'offline-mutation-index';

/**
 * Offline Storage Service
 * Manages offline mutation queue using IndexedDB
 */
export class OfflineStorage {
    /**
     * Add a mutation to the offline queue
     */
    static async addMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
        const id = `${mutation.table}-${mutation.operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const fullMutation: OfflineMutation = {
            ...mutation,
            id,
            timestamp: Date.now(),
            retryCount: 0,
        };

        await set(`${QUEUE_KEY_PREFIX}${id}`, fullMutation);

        // Update index
        const index = await this.getQueueIndex();
        index.push(id);
        await set(QUEUE_INDEX_KEY, index);

        console.log('[OfflineStorage] Added mutation to queue:', id, mutation);
        return id;
    }

    /**
     * Get all pending mutations
     */
    static async getAllMutations(): Promise<OfflineMutation[]> {
        const index = await this.getQueueIndex();
        const mutations: OfflineMutation[] = [];

        for (const id of index) {
            const mutation = await get<OfflineMutation>(`${QUEUE_KEY_PREFIX}${id}`);
            if (mutation) {
                mutations.push(mutation);
            }
        }

        return mutations.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get a specific mutation by ID
     */
    static async getMutation(id: string): Promise<OfflineMutation | null> {
        return (await get<OfflineMutation>(`${QUEUE_KEY_PREFIX}${id}`)) || null;
    }

    /**
     * Update a mutation (e.g., increment retry count, add error)
     */
    static async updateMutation(id: string, updates: Partial<OfflineMutation>): Promise<void> {
        const mutation = await this.getMutation(id);
        if (!mutation) {
            console.warn('[OfflineStorage] Mutation not found:', id);
            return;
        }

        const updated = { ...mutation, ...updates };
        await set(`${QUEUE_KEY_PREFIX}${id}`, updated);
        console.log('[OfflineStorage] Updated mutation:', id, updates);
    }

    /**
     * Remove a mutation from the queue (after successful sync)
     */
    static async removeMutation(id: string): Promise<void> {
        await del(`${QUEUE_KEY_PREFIX}${id}`);

        // Update index
        const index = await this.getQueueIndex();
        const newIndex = index.filter(i => i !== id);
        await set(QUEUE_INDEX_KEY, newIndex);

        console.log('[OfflineStorage] Removed mutation from queue:', id);
    }

    /**
     * Get the count of pending mutations
     */
    static async getPendingCount(): Promise<number> {
        const index = await this.getQueueIndex();
        return index.length;
    }

    /**
     * Clear all mutations (use with caution!)
     */
    static async clearAllMutations(): Promise<void> {
        const index = await this.getQueueIndex();

        for (const id of index) {
            await del(`${QUEUE_KEY_PREFIX}${id}`);
        }

        await set(QUEUE_INDEX_KEY, []);
        console.log('[OfflineStorage] Cleared all mutations');
    }

    /**
     * Get mutations for a specific table
     */
    static async getMutationsByTable(table: string): Promise<OfflineMutation[]> {
        const allMutations = await this.getAllMutations();
        return allMutations.filter(m => m.table === table);
    }

    /**
     * Get mutations for a specific user
     */
    static async getMutationsByUser(userId: string): Promise<OfflineMutation[]> {
        const allMutations = await this.getAllMutations();
        return allMutations.filter(m => m.userId === userId);
    }

    /**
     * Private: Get the queue index
     */
    private static async getQueueIndex(): Promise<string[]> {
        return (await get<string[]>(QUEUE_INDEX_KEY)) || [];
    }

    /**
     * Clear all offline data (including cache)
     * Use on logout to prevent unauthorized access
     */
    static async clearAllOfflineData(): Promise<void> {
        await clear();
        console.log('[OfflineStorage] Cleared all offline data');
    }
}

/**
 * User profile cache for offline access
 */
export interface CachedUserProfile {
    id: string;
    role: 'super_user' | 'master' | 'usuario' | null;
    unidadeId: string | null;
    unidadeSlug: string | null;
    unidadeNome: string | null;
    nome: string | null;
    email: string;
    cachedAt: number;
}

const USER_PROFILE_KEY = 'cached-user-profile';

export class UserProfileCache {
    /**
     * Cache user profile for offline access
     */
    static async cacheProfile(profile: Omit<CachedUserProfile, 'cachedAt'>): Promise<void> {
        const cached: CachedUserProfile = {
            ...profile,
            cachedAt: Date.now(),
        };
        await set(USER_PROFILE_KEY, cached);
        console.log('[UserProfileCache] Cached user profile:', profile.email);
    }

    /**
     * Get cached user profile
     */
    static async getCachedProfile(): Promise<CachedUserProfile | null> {
        const profile = await get<CachedUserProfile>(USER_PROFILE_KEY);

        // Check if cache is stale (older than 7 days)
        if (profile && Date.now() - profile.cachedAt > 1000 * 60 * 60 * 24 * 7) {
            console.log('[UserProfileCache] Profile cache is stale');
            return null;
        }

        return profile || null;
    }

    /**
     * Clear cached profile (on logout)
     */
    static async clearProfile(): Promise<void> {
        await del(USER_PROFILE_KEY);
        console.log('[UserProfileCache] Cleared cached profile');
    }
}
