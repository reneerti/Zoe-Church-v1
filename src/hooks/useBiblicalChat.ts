import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

export function useBiblicalChat() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou o **Zoe AI**, assistente bíblico. Como posso ajudá-lo hoje? Você pode me perguntar sobre *versículos*, __contexto histórico__, ou pedir orientação espiritual baseada na Palavra de Deus.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim()) return;
    if (inFlightRef.current) return;

    const userMsg: Message = { role: "user", content: input };
    const outgoingMessages = [...messages, userMsg];

    // Add user + placeholder assistant (so we only ever update one assistant message)
    setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
    setIsLoading(true);
    setError(null);
    inFlightRef.current = true;

    let assistantSoFar = "";

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];
        if (!last || last.role !== "assistant") return prev;
        const next = prev.slice();
        next[lastIndex] = { ...last, content: assistantSoFar };
        return next;
      });
    };

    try {
      // Use Supabase functions URL directly
      const functionUrl = `https://allfhenlhsjkuatczato.supabase.co/functions/v1/biblical-chat`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbGZoZW5saHNqa3VhdGN6YXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDIyOTUsImV4cCI6MjA4MzY3ODI5NX0.kCFkQ4iB_8fjxi7IHhpyqUVP0y0aIIGX6xtVNIWpIpE",
      };

      // Add auth header if user is logged in
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const resp = await fetch(functionUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: outgoingMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          throw new Error(errorData.error || "Você atingiu o limite diário de consultas. Tente novamente amanhã! 🙏");
        }
        if (resp.status === 402) {
          throw new Error(errorData.error || "Limite de uso atingido para hoje.");
        }
        throw new Error(errorData.error || "Erro ao processar mensagem");
      }

      if (!resp.body) throw new Error("Resposta vazia");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      // Remove the last user + placeholder assistant if there was an error
      setMessages(prev => (prev.length > 2 ? prev.slice(0, -2) : prev));
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [messages, session]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: "assistant",
      content: "Olá! 👋 Sou o **Zoe AI**, assistente bíblico. Como posso ajudá-lo hoje? Você pode me perguntar sobre *versículos*, __contexto histórico__, ou pedir orientação espiritual baseada na Palavra de Deus.",
    }]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages, setMessages };
}
