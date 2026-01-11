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

export interface BibleVerse {
  id: string;
  version_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
  created_at: string;
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
      const { data, error } = await supabase.from("bible_versions").select("*").order("code");

      if (error) {
        console.error("Erro ao buscar versões:", error);
        throw error;
      }
      return data as BibleVersion[];
    },
  });
}

export function useBibleBooks() {
  return useQuery({
    queryKey: ["bible-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bible_books").select("*").order("book_number");

      if (error) {
        console.error("Erro ao buscar livros:", error);
        throw error;
      }
      return data as BibleBook[];
    },
  });
}

// Buscar um livro pelo nome (para navegação)
export function useBibleBookByName(bookName: string) {
  return useQuery({
    queryKey: ["bible-book", bookName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_books")
        .select("*")
        .ilike("name", bookName.replace(/-/g, " "))
        .single();

      if (error) {
        console.error("Erro ao buscar livro:", error);
        throw error;
      }
      return data as BibleBook;
    },
    enabled: !!bookName,
  });
}

// Buscar versículos de um capítulo específico
export function useBibleVerses(bookId: string, chapter: number, versionId: string) {
  return useQuery({
    queryKey: ["bible-verses", bookId, chapter, versionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_verses")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("version_id", versionId)
        .order("verse");

      if (error) {
        console.error("Erro ao buscar versículos:", error);
        throw error;
      }
      return data as BibleVerse[];
    },
    enabled: !!bookId && !!chapter && !!versionId,
  });
}

// Buscar versículos por código da versão (mais prático)
export function useBibleVersesByVersionCode(bookId: string, chapter: number, versionCode: string) {
  return useQuery({
    queryKey: ["bible-verses-by-code", bookId, chapter, versionCode],
    queryFn: async () => {
      // Primeiro busca o ID da versão pelo código
      const { data: versionData, error: versionError } = await supabase
        .from("bible_versions")
        .select("id")
        .eq("code", versionCode)
        .single();

      if (versionError) {
        console.error("Erro ao buscar versão:", versionError);
        throw versionError;
      }

      // Depois busca os versículos
      const { data, error } = await supabase
        .from("bible_verses")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("version_id", versionData.id)
        .order("verse");

      if (error) {
        console.error("Erro ao buscar versículos:", error);
        throw error;
      }
      return data as BibleVerse[];
    },
    enabled: !!bookId && !!chapter && !!versionCode,
  });
}

// Buscar versão pelo código
export function useBibleVersionByCode(code: string) {
  return useQuery({
    queryKey: ["bible-version", code],
    queryFn: async () => {
      const { data, error } = await supabase.from("bible_versions").select("*").eq("code", code).single();

      if (error) {
        console.error("Erro ao buscar versão:", error);
        throw error;
      }
      return data as BibleVersion;
    },
    enabled: !!code,
  });
}

export function useReadingProgress(userId?: string) {
  return useQuery({
    queryKey: ["reading-progress", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase.from("reading_progress").select("*").eq("user_id", userId);

      if (error) {
        console.error("Erro ao buscar progresso:", error);
        throw error;
      }
      return data as ReadingProgress[];
    },
    enabled: !!userId,
  });
}

// Buscar busca por texto (usando texto_normalizado ou texto_tsv)
export function useSearchBibleVerses(searchTerm: string, versionCode?: string) {
  return useQuery({
    queryKey: ["bible-search", searchTerm, versionCode],
    queryFn: async () => {
      let query = supabase
        .from("bible_verses")
        .select(
          `
          *,
          bible_books!inner(name, abbreviation),
          bible_versions!inner(code, name)
        `,
        )
        .textSearch("texto_tsv", searchTerm, {
          type: "websearch",
          config: "portuguese",
        })
        .limit(50);

      if (versionCode) {
        query = query.eq("bible_versions.code", versionCode);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro na busca:", error);
        throw error;
      }
      return data;
    },
    enabled: searchTerm.length >= 3,
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
    case 0:
      return "bg-muted/30";
    case 1:
      return "bg-primary/20";
    case 2:
      return "bg-primary/40";
    case 3:
      return "bg-primary/60";
    case 4:
      return "bg-primary/80";
    default:
      return "bg-muted/30";
  }
}

// Get border color based on intensity
export function getIntensityBorder(intensity: number): string {
  switch (intensity) {
    case 0:
      return "border-border";
    case 1:
      return "border-primary/30";
    case 2:
      return "border-primary/50";
    case 3:
      return "border-primary/70";
    case 4:
      return "border-primary";
    default:
      return "border-border";
  }
}
