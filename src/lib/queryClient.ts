import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

/**
 * Custom IndexedDB persister using idb-keyval
 * Provides better performance and storage capacity than localStorage
 */
const createIDBPersister = () => {
    return {
        persistClient: async (client: any) => {
            await set('REACT_QUERY_OFFLINE_CACHE', client);
        },
        restoreClient: async () => {
            return await get('REACT_QUERY_OFFLINE_CACHE');
        },
        removeClient: async () => {
            await del('REACT_QUERY_OFFLINE_CACHE');
        },
    };
};

/**
 * QueryClient configured for offline-first operation
 * - Persists cache to IndexedDB
 * - Infinite staleTime for immutable data (Bible content)
 * - Retry logic for failed mutations
 * - Offline mutation queue enabled
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Default staleTime for dynamic data (5 minutes)
            // Individual queries can override this
            staleTime: 1000 * 60 * 5,

            // Keep data in cache for 24 hours
            gcTime: 1000 * 60 * 60 * 24,

            // Retry failed queries (important for offline scenarios)
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus by default (can be overridden per query)
            refetchOnWindowFocus: false,

            // Don't refetch on mount for cached data
            refetchOnMount: false,

            // Refetch on reconnect to get latest data
            refetchOnReconnect: true,

            // Network mode: always try to fetch, but use cache if offline
            networkMode: 'offlineFirst',
        },
        mutations: {
            // Retry failed mutations (important for offline queue)
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Network mode: queue mutations when offline
            networkMode: 'offlineFirst',
        },
    },
});

/**
 * Initialize query client persistence
 * Call this once at app startup
 */
export const initializeQueryPersistence = () => {
    const persister = createIDBPersister();

    persistQueryClient({
        queryClient,
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        buster: 'zoe-church-v1', // Change this to invalidate all cached data
    });
};
