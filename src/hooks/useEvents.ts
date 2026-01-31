import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Event {
    id: string;
    unidade_id: string | null;
    title: string;
    description: string | null;
    date: string; // ISO date string
    time: string; // HH:MM format
    location: string | null;
    category: string;
    color: string;
    is_recurring: boolean;
    recurrence_rule: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface NewEvent {
    title: string;
    description?: string;
    date: Date;
    time: string;
    location?: string;
    category: string;
    color?: string;
    is_recurring?: boolean;
    recurrence_rule?: string;
}

/**
 * Fetch all events for the user's unidade
 */
export function useEvents() {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['events', profile?.unidadeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .or(`unidade_id.eq.${profile?.unidadeId},unidade_id.is.null`) // Eventos da unidade ou públicos
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) {
                console.error('Error fetching events:', error);
                throw error;
            }

            return data as Event[];
        },
        enabled: !!profile,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Add a new event
 */
export function useAddEvent() {
    const queryClient = useQueryClient();
    const { profile, user } = useAuth();

    return useMutation({
        mutationFn: async (newEvent: NewEvent) => {
            const { data, error } = await supabase
                .from('events')
                .insert({
                    unidade_id: profile?.unidadeId || null,
                    title: newEvent.title,
                    description: newEvent.description || null,
                    date: newEvent.date.toISOString().split('T')[0], // YYYY-MM-DD
                    time: newEvent.time,
                    location: newEvent.location || null,
                    category: newEvent.category,
                    color: newEvent.color || 'bg-primary',
                    is_recurring: newEvent.is_recurring || false,
                    recurrence_rule: newEvent.recurrence_rule || null,
                    created_by: user?.id || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Event;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Evento criado com sucesso!');
        },
        onError: (error) => {
            console.error('Error adding event:', error);
            toast.error('Erro ao criar evento');
        },
    });
}

/**
 * Update an existing event
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewEvent> }) => {
            const updateData: any = {};

            if (updates.title) updateData.title = updates.title;
            if (updates.description !== undefined) updateData.description = updates.description || null;
            if (updates.date) updateData.date = updates.date.toISOString().split('T')[0];
            if (updates.time) updateData.time = updates.time;
            if (updates.location !== undefined) updateData.location = updates.location || null;
            if (updates.category) updateData.category = updates.category;
            if (updates.color) updateData.color = updates.color;
            if (updates.is_recurring !== undefined) updateData.is_recurring = updates.is_recurring;
            if (updates.recurrence_rule !== undefined) updateData.recurrence_rule = updates.recurrence_rule || null;

            const { data, error } = await supabase
                .from('events')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Event;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Evento atualizado com sucesso!');
        },
        onError: (error) => {
            console.error('Error updating event:', error);
            toast.error('Erro ao atualizar evento');
        },
    });
}

/**
 * Delete an event
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Evento excluído com sucesso!');
        },
        onError: (error) => {
            console.error('Error deleting event:', error);
            toast.error('Erro ao excluir evento');
        },
    });
}
