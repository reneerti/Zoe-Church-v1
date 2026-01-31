import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOfflineClient } from '@/lib/supabaseOfflineClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VerseHighlight {
    id: string;
    user_id: string;
    verse_id: string;
    color: string;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

/**
 * Fetch verse highlights for a user
 */
export function useVerseHighlights() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['verse-highlights', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('verse_highlights')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching verse highlights:', error);
                throw error;
            }

            return data as VerseHighlight[];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

/**
 * Add or update a verse highlight (offline-first)
 */
export function useAddOrUpdateHighlight() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ verseId, color, note }: { verseId: string; color: HighlightColor; note?: string }) => {
            if (!user?.id) throw new Error('User not authenticated');

            const data = {
                user_id: user.id,
                verse_id: verseId,
                color,
                note: note || null,
                updated_at: new Date().toISOString(),
            };

            const result = await SupabaseOfflineClient.upsert(
                'verse_highlights',
                data,
                user.id,
                'user_id,verse_id'
            );

            if (result.error && !result.queued) {
                throw result.error;
            }

            return result;
        },
        onMutate: async ({ verseId, color, note }) => {
            await queryClient.cancelQueries({ queryKey: ['verse-highlights', user?.id] });

            const previousHighlights = queryClient.getQueryData<VerseHighlight[]>(['verse-highlights', user?.id]);

            // Optimistically update
            queryClient.setQueryData<VerseHighlight[]>(['verse-highlights', user?.id], (old = []) => {
                const existing = old.find(h => h.verse_id === verseId);

                if (existing) {
                    // Update existing highlight
                    return old.map(h =>
                        h.verse_id === verseId
                            ? { ...h, color, note: note || null, updated_at: new Date().toISOString() }
                            : h
                    );
                } else {
                    // Add new highlight
                    const newHighlight: VerseHighlight = {
                        id: `temp-${Date.now()}`,
                        user_id: user!.id,
                        verse_id: verseId,
                        color,
                        note: note || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    return [newHighlight, ...old];
                }
            });

            return { previousHighlights };
        },
        onError: (error, variables, context) => {
            if (context?.previousHighlights) {
                queryClient.setQueryData(['verse-highlights', user?.id], context.previousHighlights);
            }
            toast.error('Erro ao destacar versículo', {
                description: 'Tente novamente mais tarde',
            });
        },
        onSuccess: (result) => {
            if (result.queued) {
                toast.success('Destaque salvo', {
                    description: 'Será sincronizado quando a conexão retornar',
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['verse-highlights', user?.id] });
        },
    });
}

/**
 * Remove a verse highlight (offline-first)
 */
export function useRemoveHighlight() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (verseId: string) => {
            if (!user?.id) throw new Error('User not authenticated');

            const result = await SupabaseOfflineClient.delete(
                'verse_highlights',
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
            await queryClient.cancelQueries({ queryKey: ['verse-highlights', user?.id] });

            const previousHighlights = queryClient.getQueryData<VerseHighlight[]>(['verse-highlights', user?.id]);

            // Optimistically remove
            queryClient.setQueryData<VerseHighlight[]>(['verse-highlights', user?.id], (old = []) => {
                return old.filter(h => h.verse_id !== verseId);
            });

            return { previousHighlights };
        },
        onError: (error, verseId, context) => {
            if (context?.previousHighlights) {
                queryClient.setQueryData(['verse-highlights', user?.id], context.previousHighlights);
            }
            toast.error('Erro ao remover destaque', {
                description: 'Tente novamente mais tarde',
            });
        },
        onSuccess: (result) => {
            if (result.queued) {
                toast.success('Destaque removido', {
                    description: 'Será sincronizado quando a conexão retornar',
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['verse-highlights', user?.id] });
        },
    });
}

/**
 * Get highlight for a specific verse
 */
export function useVerseHighlight(verseId: string) {
    const { data: highlights } = useVerseHighlights();
    return highlights?.find(h => h.verse_id === verseId);
}

/**
 * Check if a verse is highlighted
 */
export function useIsVerseHighlighted(verseId: string) {
    const highlight = useVerseHighlight(verseId);
    return !!highlight;
}
