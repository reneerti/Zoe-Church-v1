import { supabase } from '@/integrations/supabase/client';
import { OfflineStorage } from './offlineStorage';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Network status tracker
 */
class NetworkMonitor {
    private listeners: Set<(online: boolean) => void> = new Set();
    private _isOnline: boolean = navigator.onLine;

    constructor() {
        window.addEventListener('online', () => this.setOnline(true));
        window.addEventListener('offline', () => this.setOnline(false));
    }

    get isOnline(): boolean {
        return this._isOnline;
    }

    private setOnline(online: boolean) {
        if (this._isOnline !== online) {
            this._isOnline = online;
            console.log(`[NetworkMonitor] Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
            this.listeners.forEach(listener => listener(online));
        }
    }

    addListener(listener: (online: boolean) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export const networkMonitor = new NetworkMonitor();

/**
 * Offline-aware Supabase client wrapper
 * Provides methods that work offline by queuing mutations
 */
export class SupabaseOfflineClient {
    /**
     * Execute a query with offline fallback
     * If offline, returns cached data (handled by TanStack Query)
     */
    static async query<T>(
        queryFn: () => Promise<{ data: T | null; error: any }>
    ): Promise<{ data: T | null; error: any }> {
        if (!networkMonitor.isOnline) {
            console.log('[SupabaseOfflineClient] Offline: Query will use cached data');
            // TanStack Query will handle returning cached data
            // We just need to not throw an error here
            return { data: null, error: { message: 'Offline - using cached data', offline: true } };
        }

        try {
            return await queryFn();
        } catch (error: any) {
            // Network error - might be offline
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                console.log('[SupabaseOfflineClient] Network error detected:', error.message);
                return { data: null, error: { message: 'Network error - using cached data', offline: true } };
            }
            throw error;
        }
    }

    /**
     * Insert with offline queue support
     */
    static async insert<T extends Record<string, any>>(
        table: string,
        data: T,
        userId: string
    ): Promise<{ data: T | null; error: any; queued?: boolean }> {
        if (!networkMonitor.isOnline) {
            // Queue the mutation
            const mutationId = await OfflineStorage.addMutation({
                table,
                operation: 'insert',
                data,
                userId,
            });

            console.log(`[SupabaseOfflineClient] Queued INSERT for ${table}:`, mutationId);

            // Return optimistic response
            return {
                data: { ...data, id: `temp-${mutationId}` } as T,
                error: null,
                queued: true
            };
        }

        try {
            const { data: result, error } = await supabase
                .from(table)
                .insert(data)
                .select()
                .single();

            return { data: result as T, error };
        } catch (error: any) {
            // Network error - queue it
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                const mutationId = await OfflineStorage.addMutation({
                    table,
                    operation: 'insert',
                    data,
                    userId,
                });

                console.log(`[SupabaseOfflineClient] Network error - Queued INSERT for ${table}:`, mutationId);

                return {
                    data: { ...data, id: `temp-${mutationId}` } as T,
                    error: null,
                    queued: true
                };
            }

            return { data: null, error };
        }
    }

    /**
     * Update with offline queue support
     */
    static async update<T extends Record<string, any>>(
        table: string,
        data: T,
        match: Record<string, any>,
        userId: string
    ): Promise<{ data: T | null; error: any; queued?: boolean }> {
        if (!networkMonitor.isOnline) {
            const mutationId = await OfflineStorage.addMutation({
                table,
                operation: 'update',
                data: { ...data, ...match },
                userId,
            });

            console.log(`[SupabaseOfflineClient] Queued UPDATE for ${table}:`, mutationId);

            return {
                data: data as T,
                error: null,
                queued: true
            };
        }

        try {
            let query = supabase.from(table).update(data);

            // Apply match conditions
            Object.entries(match).forEach(([key, value]) => {
                query = query.eq(key, value) as any;
            });

            const { data: result, error } = await query.select().single();

            return { data: result as T, error };
        } catch (error: any) {
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                const mutationId = await OfflineStorage.addMutation({
                    table,
                    operation: 'update',
                    data: { ...data, ...match },
                    userId,
                });

                console.log(`[SupabaseOfflineClient] Network error - Queued UPDATE for ${table}:`, mutationId);

                return {
                    data: data as T,
                    error: null,
                    queued: true
                };
            }

            return { data: null, error };
        }
    }

    /**
     * Delete with offline queue support
     */
    static async delete(
        table: string,
        match: Record<string, any>,
        userId: string
    ): Promise<{ error: any; queued?: boolean }> {
        if (!networkMonitor.isOnline) {
            const mutationId = await OfflineStorage.addMutation({
                table,
                operation: 'delete',
                data: match,
                userId,
            });

            console.log(`[SupabaseOfflineClient] Queued DELETE for ${table}:`, mutationId);

            return { error: null, queued: true };
        }

        try {
            let query = supabase.from(table).delete();

            // Apply match conditions
            Object.entries(match).forEach(([key, value]) => {
                query = query.eq(key, value) as any;
            });

            const { error } = await query;

            return { error };
        } catch (error: any) {
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                const mutationId = await OfflineStorage.addMutation({
                    table,
                    operation: 'delete',
                    data: match,
                    userId,
                });

                console.log(`[SupabaseOfflineClient] Network error - Queued DELETE for ${table}:`, mutationId);

                return { error: null, queued: true };
            }

            return { error };
        }
    }

    /**
     * Upsert with offline queue support
     * For tables with unique constraints (like favorite_verses)
     */
    static async upsert<T extends Record<string, any>>(
        table: string,
        data: T,
        userId: string,
        onConflict?: string
    ): Promise<{ data: T | null; error: any; queued?: boolean }> {
        if (!networkMonitor.isOnline) {
            const mutationId = await OfflineStorage.addMutation({
                table,
                operation: 'insert', // Treat as insert in queue, will be upserted on sync
                data,
                userId,
            });

            console.log(`[SupabaseOfflineClient] Queued UPSERT for ${table}:`, mutationId);

            return {
                data: { ...data, id: `temp-${mutationId}` } as T,
                error: null,
                queued: true
            };
        }

        try {
            const query = supabase.from(table).upsert(data, { onConflict });
            const { data: result, error } = await query.select().single();

            return { data: result as T, error };
        } catch (error: any) {
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                const mutationId = await OfflineStorage.addMutation({
                    table,
                    operation: 'insert',
                    data,
                    userId,
                });

                console.log(`[SupabaseOfflineClient] Network error - Queued UPSERT for ${table}:`, mutationId);

                return {
                    data: { ...data, id: `temp-${mutationId}` } as T,
                    error: null,
                    queued: true
                };
            }

            return { data: null, error };
        }
    }
}
