import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseOfflineClient } from '@/lib/supabaseOfflineClient';
import { useAuth } from '@/contexts/AuthContext';

export interface ReadingProgressEntry {
    id: string;
    user_id: string;
    book_id: string;
    chapter: number;
    read_count: number;
    last_read_at: string;
    created_at: string;
}

/**
 * Fetch reading progress for a user
 */
export function useReadingProgressData() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['reading-progress', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('reading_progress')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching reading progress:', error);
                throw error;
            }

            return data as ReadingProgressEntry[];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}

/**
 * Update reading progress for a chapter (offline-first)
 */
export function useUpdateReadingProgress() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookId, chapter }: { bookId: string; chapter: number }) => {
            if (!user?.id) throw new Error('User not authenticated');

            // Check if progress exists
            const { data: existing } = await supabase
                .from('reading_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('book_id', bookId)
                .eq('chapter', chapter)
                .single();

            if (existing) {
                // Update existing progress
                const updateData = {
                    read_count: existing.read_count + 1,
                    last_read_at: new Date().toISOString(),
                };

                const result = await SupabaseOfflineClient.update(
                    'reading_progress',
                    updateData,
                    {
                        user_id: user.id,
                        book_id: bookId,
                        chapter,
                    },
                    user.id
                );

                if (result.error && !result.queued) {
                    throw result.error;
                }

                return { ...existing, ...updateData };
            } else {
                // Create new progress entry
                const insertData = {
                    user_id: user.id,
                    book_id: bookId,
                    chapter,
                    read_count: 1,
                    last_read_at: new Date().toISOString(),
                };

                const result = await SupabaseOfflineClient.insert(
                    'reading_progress',
                    insertData,
                    user.id
                );

                if (result.error && !result.queued) {
                    throw result.error;
                }

                return result.data || insertData;
            }
        },
        onMutate: async ({ bookId, chapter }) => {
            await queryClient.cancelQueries({ queryKey: ['reading-progress', user?.id] });

            const previousProgress = queryClient.getQueryData<ReadingProgressEntry[]>(['reading-progress', user?.id]);

            // Optimistically update
            queryClient.setQueryData<ReadingProgressEntry[]>(['reading-progress', user?.id], (old = []) => {
                const existing = old.find(p => p.book_id === bookId && p.chapter === chapter);

                if (existing) {
                    // Update existing
                    return old.map(p =>
                        p.book_id === bookId && p.chapter === chapter
                            ? { ...p, read_count: p.read_count + 1, last_read_at: new Date().toISOString() }
                            : p
                    );
                } else {
                    // Add new
                    const newProgress: ReadingProgressEntry = {
                        id: `temp-${Date.now()}`,
                        user_id: user!.id,
                        book_id: bookId,
                        chapter,
                        read_count: 1,
                        last_read_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                    };
                    return [...old, newProgress];
                }
            });

            return { previousProgress };
        },
        onError: (error, variables, context) => {
            if (context?.previousProgress) {
                queryClient.setQueryData(['reading-progress', user?.id], context.previousProgress);
            }
            console.error('Error updating reading progress:', error);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['reading-progress', user?.id] });
        },
    });
}

/**
 * Get reading progress for a specific chapter
 */
export function useChapterProgress(bookId: string, chapter: number) {
    const { data: allProgress } = useReadingProgressData();
    return allProgress?.find(p => p.book_id === bookId && p.chapter === chapter);
}

/**
 * Get total chapters read
 */
export function useTotalChaptersRead() {
    const { data: allProgress } = useReadingProgressData();
    return allProgress?.length ?? 0;
}
