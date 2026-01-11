import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BibleBook {
  id: string;
  book_number: number;
  name: string;
  abbreviation: string;
  testament: "AT" | "NT";
  chapters_count: number;
}

export interface BibleVersion {
  id: string;
  code: string;
  name: string;
}

export interface ReadingProgress {
  id: string;
  book_id: string;
  chapter: number;
  read_count: number;
  last_read_at: string;
}

export function useBibleVersions() {
  return useQuery({
    queryKey: ["bible-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_versions")
        .select("*")
        .order("code");
      
      if (error) throw error;
      return data as BibleVersion[];
    },
  });
}

export function useBibleBooks() {
  return useQuery({
    queryKey: ["bible-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_books")
        .select("*")
        .order("book_number");
      
      if (error) throw error;
      return data as BibleBook[];
    },
  });
}

export function useReadingProgress(userId?: string) {
  return useQuery({
    queryKey: ["reading-progress", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data as ReadingProgress[];
    },
    enabled: !!userId,
  });
}

// Calculate reading intensity (0-4) based on read count
export function getReadingIntensity(readCount: number): number {
  if (readCount === 0) return 0;
  if (readCount === 1) return 1;
  if (readCount <= 3) return 2;
  if (readCount <= 7) return 3;
  return 4;
}

// Get color class based on intensity
export function getIntensityColor(intensity: number): string {
  switch (intensity) {
    case 0: return "bg-muted/30";
    case 1: return "bg-primary/20";
    case 2: return "bg-primary/40";
    case 3: return "bg-primary/60";
    case 4: return "bg-primary/80";
    default: return "bg-muted/30";
  }
}

// Get border color based on intensity
export function getIntensityBorder(intensity: number): string {
  switch (intensity) {
    case 0: return "border-border";
    case 1: return "border-primary/30";
    case 2: return "border-primary/50";
    case 3: return "border-primary/70";
    case 4: return "border-primary";
    default: return "border-border";
  }
}
