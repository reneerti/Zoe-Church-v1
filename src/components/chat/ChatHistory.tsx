import { useState, useEffect } from "react";
import { History, MessageSquare, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatHistoryItem {
  id: string;
  titulo: string;
  mensagens: { role: "user" | "assistant"; content: string }[];
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  onSelectHistory: (messages: { role: "user" | "assistant"; content: string }[]) => void;
  currentMessages: { role: "user" | "assistant"; content: string }[];
}

export function ChatHistory({ onSelectHistory, currentMessages }: ChatHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_historico")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      
      // Type assertion for JSONB field
      const typedData = data?.map(item => ({
        ...item,
        mensagens: item.mensagens as { role: "user" | "assistant"; content: string }[]
      })) || [];
      
      setHistory(typedData);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchHistory();
    }
  }, [open, user]);

  // Save current conversation when it has meaningful content
  const saveCurrentConversation = async () => {
    if (!user || currentMessages.length < 2) return;

    // Get first user message as title
    const firstUserMessage = currentMessages.find(m => m.role === "user");
    if (!firstUserMessage) return;

    const titulo = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");

    try {
      // Check if we already have this conversation (by matching first message)
      const { data: existing } = await supabase
        .from("chat_historico")
        .select("id, mensagens")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const existingMensagens = existing.mensagens as { role: "user" | "assistant"; content: string }[];
        const existingFirstUser = existingMensagens.find(m => m.role === "user");
        
        // If same first message, update instead of insert
        if (existingFirstUser?.content === firstUserMessage.content) {
          await supabase
            .from("chat_historico")
            .update({ 
              mensagens: currentMessages,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
          return;
        }
      }

      // Count existing history
      const { count } = await supabase
        .from("chat_historico")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // If we have 3, delete the oldest
      if (count && count >= 3) {
        const { data: oldest } = await supabase
          .from("chat_historico")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: true })
          .limit(1)
          .single();

        if (oldest) {
          await supabase
            .from("chat_historico")
            .delete()
            .eq("id", oldest.id);
        }
      }

      // Insert new conversation
      await supabase
        .from("chat_historico")
        .insert({
          user_id: user.id,
          titulo,
          mensagens: currentMessages
        });

    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  // Auto-save when conversation has new content
  useEffect(() => {
    if (currentMessages.length >= 2) {
      const timeout = setTimeout(saveCurrentConversation, 2000);
      return () => clearTimeout(timeout);
    }
  }, [currentMessages]);

  const handleSelect = (item: ChatHistoryItem) => {
    onSelectHistory(item.mensagens);
    setOpen(false);
    toast.success("Conversa carregada!");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from("chat_historico")
        .delete()
        .eq("id", id);
      
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success("Conversa removida");
    } catch (error) {
      toast.error("Erro ao remover conversa");
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return d.toLocaleDateString("pt-BR");
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Histórico">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Conversas
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma conversa salva ainda.</p>
              <p className="text-xs mt-1">Suas conversas serão salvas automaticamente.</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={cn(
                  "w-full p-3 rounded-lg border border-border bg-card",
                  "hover:bg-accent hover:border-accent transition-colors",
                  "text-left group relative"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.mensagens.length} mensagens • {formatDate(item.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Máximo de 3 conversas salvas
        </p>
      </SheetContent>
    </Sheet>
  );
}
