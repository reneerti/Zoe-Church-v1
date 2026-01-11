import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HarpaHymn {
  id: string;
  hymn_number: number;
  title: string;
  lyrics: string;
  chorus: string | null;
  author: string | null;
}

export interface FavoriteHymn {
  id: string;
  hymn_id: string;
  user_id: string;
}

export function useHarpaHymns() {
  return useQuery({
    queryKey: ["harpa-hymns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("harpa_hymns")
        .select("*")
        .order("hymn_number");
      
      if (error) throw error;
      return data as HarpaHymn[];
    },
  });
}

export function useHarpaHymn(hymnNumber: number) {
  return useQuery({
    queryKey: ["harpa-hymn", hymnNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("harpa_hymns")
        .select("*")
        .eq("hymn_number", hymnNumber)
        .single();
      
      if (error) throw error;
      return data as HarpaHymn;
    },
    enabled: !!hymnNumber,
  });
}

export function useFavoriteHymns(userId?: string) {
  return useQuery({
    queryKey: ["favorite-hymns", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("favorite_hymns")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data as FavoriteHymn[];
    },
    enabled: !!userId,
  });
}

export function useToggleFavoriteHymn(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hymnId, isFavorite }: { hymnId: string; isFavorite: boolean }) => {
      if (!userId) throw new Error("User not authenticated");

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_hymns")
          .delete()
          .eq("user_id", userId)
          .eq("hymn_id", hymnId);
        
        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorite_hymns")
          .insert({ user_id: userId, hymn_id: hymnId });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-hymns", userId] });
    },
  });
}
