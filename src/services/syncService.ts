import { supabase } from '@/integrations/supabase/client';
import { OfflineStorage, type OfflineMutation } from '@/lib/offlineStorage';
import { networkMonitor } from '@/lib/supabaseOfflineClient';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Sync event listeners
 */
type SyncListener = (status: SyncStatus, pendingCount: number) => void;

/**
 * Background Sync Service
 * Handles synchronization of offline mutations when connection is restored
 */
export class SyncService {
    private static listeners: Set<SyncListener> = new Set();
    private static isSyncing = false;
    private static realtimeChannels: any[] = [];

    /**
     * Initialize the sync service
     * Sets up network listeners and Realtime subscriptions
     */
    static async initialize(userId: string) {
        console.log('[SyncService] Initializing for user:', userId);

        // Listen for network changes
        networkMonitor.addListener(async (online) => {
            if (online) {
                console.log('[SyncService] Network restored, starting sync...');
                toast.info('Conexão restaurada', {
                    description: 'Sincronizando suas alterações...',
                });
                await this.syncPendingMutations(userId);
            } else {
                console.log('[SyncService] Network lost, entering offline mode');
                toast.warning('Modo Offline', {
                    description: 'Suas alterações serão sincronizadas quando a conexão retornar.',
                });
            }
        });

        // Subscribe to Realtime changes for user-specific tables
        this.subscribeToRealtimeChanges(userId);

        // Initial sync if online
        if (networkMonitor.isOnline) {
            await this.syncPendingMutations(userId);
        }
    }

    /**
     * Subscribe to Realtime changes from Supabase
     */
    private static subscribeToRealtimeChanges(userId: string) {
        // Subscribe to favorite_verses changes
        const favoritesChannel = supabase
            .channel('favorite_verses_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'favorite_verses',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[SyncService] Favorite verses changed:', payload);
                    queryClient.invalidateQueries({ queryKey: ['favorite-verses', userId] });
                }
            )
            .subscribe();

        // Subscribe to reading_progress changes
        const progressChannel = supabase
            .channel('reading_progress_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reading_progress',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[SyncService] Reading progress changed:', payload);
                    queryClient.invalidateQueries({ queryKey: ['reading-progress', userId] });
                }
            )
            .subscribe();

        // Subscribe to verse_highlights changes
        const highlightsChannel = supabase
            .channel('verse_highlights_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'verse_highlights',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[SyncService] Verse highlights changed:', payload);
                    queryClient.invalidateQueries({ queryKey: ['verse-highlights', userId] });
                }
            )
            .subscribe();

        this.realtimeChannels = [favoritesChannel, progressChannel, highlightsChannel];
    }

    /**
     * Unsubscribe from all Realtime channels
     */
    static async cleanup() {
        console.log('[SyncService] Cleaning up...');
        for (const channel of this.realtimeChannels) {
            await supabase.removeChannel(channel);
        }
        this.realtimeChannels = [];
    }

    /**
     * Sync all pending mutations
     */
    static async syncPendingMutations(userId: string): Promise<void> {
        if (this.isSyncing) {
            console.log('[SyncService] Sync already in progress, skipping...');
            return;
        }

        if (!networkMonitor.isOnline) {
            console.log('[SyncService] Offline, cannot sync');
            return;
        }

        this.isSyncing = true;
        this.notifyListeners('syncing', 0);

        try {
            const mutations = await OfflineStorage.getMutationsByUser(userId);

            if (mutations.length === 0) {
                console.log('[SyncService] No pending mutations');
                this.notifyListeners('idle', 0);
                return;
            }

            console.log(`[SyncService] Syncing ${mutations.length} pending mutations...`);

            let successCount = 0;
            let errorCount = 0;

            for (const mutation of mutations) {
                try {
                    await this.syncMutation(mutation);
                    await OfflineStorage.removeMutation(mutation.id);
                    successCount++;

                    // Update progress
                    const remaining = mutations.length - successCount - errorCount;
                    this.notifyListeners('syncing', remaining);
                } catch (error: any) {
                    console.error('[SyncService] Failed to sync mutation:', mutation.id, error);
                    errorCount++;

                    // Update retry count
                    await OfflineStorage.updateMutation(mutation.id, {
                        retryCount: mutation.retryCount + 1,
                        error: error.message,
                    });

                    // Remove if too many retries (max 5)
                    if (mutation.retryCount >= 5) {
                        console.error('[SyncService] Max retries reached, removing mutation:', mutation.id);
                        await OfflineStorage.removeMutation(mutation.id);
                        toast.error('Erro na sincronização', {
                            description: `Não foi possível sincronizar uma alteração em ${mutation.table}`,
                        });
                    }
                }
            }

            console.log(`[SyncService] Sync complete: ${successCount} success, ${errorCount} errors`);

            if (successCount > 0) {
                toast.success('Sincronização completa', {
                    description: `${successCount} ${successCount === 1 ? 'alteração sincronizada' : 'alterações sincronizadas'}`,
                });
                this.notifyListeners('success', errorCount);
            } else if (errorCount > 0) {
                this.notifyListeners('error', errorCount);
            } else {
                this.notifyListeners('idle', 0);
            }

            // Invalidate all queries to refresh data
            queryClient.invalidateQueries();
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            this.notifyListeners('error', await OfflineStorage.getPendingCount());
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sync a single mutation
     */
    private static async syncMutation(mutation: OfflineMutation): Promise<void> {
        const { table, operation, data } = mutation;

        console.log(`[SyncService] Syncing ${operation} on ${table}:`, data);

        switch (operation) {
            case 'insert':
                await this.syncInsert(table, data);
                break;
            case 'update':
                await this.syncUpdate(table, data);
                break;
            case 'delete':
                await this.syncDelete(table, data);
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }

    /**
     * Sync an insert operation
     */
    private static async syncInsert(table: string, data: Record<string, any>): Promise<void> {
        // Remove temporary ID if present
        const cleanData = { ...data };
        if (cleanData.id?.startsWith('temp-')) {
            delete cleanData.id;
        }

        // For tables with unique constraints, use upsert
        if (table === 'favorite_verses' || table === 'verse_highlights') {
            const { error } = await supabase.from(table).upsert(cleanData).select().single();
            if (error) throw error;
        } else {
            const { error } = await supabase.from(table).insert(cleanData).select().single();
            if (error) throw error;
        }
    }

    /**
     * Sync an update operation
     */
    private static async syncUpdate(table: string, data: Record<string, any>): Promise<void> {
        // Extract match conditions (user_id, verse_id, book_id, etc.)
        const { user_id, verse_id, book_id, chapter, ...updateData } = data;

        let query = supabase.from(table).update(updateData);

        if (user_id) query = query.eq('user_id', user_id);
        if (verse_id) query = query.eq('verse_id', verse_id);
        if (book_id) query = query.eq('book_id', book_id);
        if (chapter !== undefined) query = query.eq('chapter', chapter);

        const { error } = await query.select().single();
        if (error) throw error;
    }

    /**
     * Sync a delete operation
     */
    private static async syncDelete(table: string, data: Record<string, any>): Promise<void> {
        let query = supabase.from(table).delete();

        // Apply all conditions from data
        Object.entries(data).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { error } = await query;
        if (error) throw error;
    }

    /**
     * Add a listener for sync status changes
     */
    static addListener(listener: SyncListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of status change
     */
    private static notifyListeners(status: SyncStatus, pendingCount: number) {
        this.listeners.forEach(listener => listener(status, pendingCount));
    }

    /**
     * Get current sync status
     */
    static async getStatus(): Promise<{ status: SyncStatus; pendingCount: number }> {
        const pendingCount = await OfflineStorage.getPendingCount();
        const status: SyncStatus = this.isSyncing ? 'syncing' : pendingCount > 0 ? 'idle' : 'idle';
        return { status, pendingCount };
    }

    /**
     * Manually trigger sync
     */
    static async manualSync(userId: string): Promise<void> {
        if (!networkMonitor.isOnline) {
            toast.error('Sem conexão', {
                description: 'Conecte-se à internet para sincronizar',
            });
            return;
        }

        await this.syncPendingMutations(userId);
    }
}
