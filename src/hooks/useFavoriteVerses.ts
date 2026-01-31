import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOfflineClient } from '@/lib/supabaseOfflineClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FavoriteVerse {
    id: string;
    user_id: string;
    verse_id: string;
    created_at: string;
    bible_verses?: {
        id: string;
        book_id: string;
        chapter: number;
        verse: number;
        text: string;
        bible_books?: {
            name: string;
            abbreviation: string;
        };
    };
}

/**
 * Fetch favorite verses for a user
 */
export function useFavoriteVerses() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['favorite-verses', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('favorite_verses')
                .select(`
          *,
          bible_verses (
            id,
            book_id,
            chapter,
            verse,
            text,
            bible_books (
              name,
              abbreviation
            )
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching favorite verses:', error);
                throw error;
            }

            return data as FavoriteVerse[];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

/**
 * Add a verse to favorites (offline-first)
 */
export function useAddFavoriteVerse() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (verseId: string) => {
            if (!user?.id) throw new Error('User not authenticated');

            const data = {
                user_id: user.id,
                verse_id: verseId,
            };

            const result = await SupabaseOfflineClient.upsert(
                'favorite_verses',
                data,
                user.id,
                'user_id,verse_id'
            );

            if (result.error && !result.queued) {
                throw result.error;
            }

            return result;
        },
        onMutate: async (verseId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['favorite-verses', user?.id] });

            // Snapshot previous value
            const previousFavorites = queryClient.getQueryData<FavoriteVerse[]>(['favorite-verses', user?.id]);

            // Optimistically update
            queryClient.setQueryData<FavoriteVerse[]>(['favorite-verses', user?.id], (old = []) => {
                const newFavorite: FavoriteVerse = {
                    id: `temp-${Date.now()}`,
                    user_id: user!.id,
                    verse_id: verseId,
                    created_at: new Date().toISOString(),
                };
                return [newFavorite, ...old];
            });

            return { previousFavorites };
        },
        onError: (error, verseId, context) => {
            // Rollback on error
            if (context?.previousFavorites) {
                queryClient.setQueryData(['favorite-verses', user?.id], context.previousFavorites);
            }
            toast.error('Erro ao adicionar favorito', {
                description: 'Tente novamente mais tarde',
            });
        },
        onSuccess: (result) => {
            if (result.queued) {
                toast.success('Favorito adicionado', {
                    description: 'Será sincronizado quando a conexão retornar',
                });
            } else {
                toast.success('Favorito adicionado');
            }
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey: ['favorite-verses', user?.id] });
        },
    });
}

/**
 * Remove a verse from favorites (offline-first)
 */
export function useRemoveFavoriteVerse() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (verseId: string) => {
            if (!user?.id) throw new Error('User not authenticated');

            const result = await SupabaseOfflineClient.delete(
                'favorite_verses',
                {
                    user_id: user.id,
                    verse_id: verseId,
                },
                user.id
            );

            if (result.error && !result.queued) {
                throw result.error;
            }

            return result;
        },
        onMutate: async (verseId) => {
            await queryClient.cancelQueries({ queryKey: ['favorite-verses', user?.id] });

            const previousFavorites = queryClient.getQueryData<FavoriteVerse[]>(['favorite-verses', user?.id]);

            // Optimistically remove
            queryClient.setQueryData<FavoriteVerse[]>(['favorite-verses', user?.id], (old = []) => {
                return old.filter(fav => fav.verse_id !== verseId);
            });

            return { previousFavorites };
        },
        onError: (error, verseId, context) => {
            if (context?.previousFavorites) {
                queryClient.setQueryData(['favorite-verses', user?.id], context.previousFavorites);
            }
            toast.error('Erro ao remover favorito', {
                description: 'Tente novamente mais tarde',
            });
        },
        onSuccess: (result) => {
            if (result.queued) {
                toast.success('Favorito removido', {
                    description: 'Será sincronizado quando a conexão retornar',
                });
            } else {
                toast.success('Favorito removido');
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['favorite-verses', user?.id] });
        },
    });
}

/**
 * Check if a verse is favorited
 */
export function useIsVerseFavorited(verseId: string) {
    const { data: favorites } = useFavoriteVerses();
    return favorites?.some(fav => fav.verse_id === verseId) ?? false;
}
