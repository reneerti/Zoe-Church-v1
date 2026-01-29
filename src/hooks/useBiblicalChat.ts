import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

function normalizarEntrada(texto: string) {
  return (texto || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function compactChatAnswer(text: string) {
  const cleaned = (text || "").replace(/\r\n/g, "\n").trim();
  if (!cleaned) return "";

  const parts = cleaned
    .split(/\n{2,}/g)
    .map(p => p.trim())
    .filter(Boolean);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const norm = p.toLowerCase().replace(/\s+/g, " ").trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(p);
    if (out.length >= 3) break;
  }

  let result = out.join("\n\n").trim();

  const MAX_CHARS = 900;
  if (result.length > MAX_CHARS) {
    result = result
      .slice(0, MAX_CHARS)
      .replace(/\s+\S*$/, "")
      .trim() +
      "…";
  }

  if (!/[?？！]\s*$/.test(result)) {
    result += "\n\nQuer que eu aprofunde em algum ponto específico?";
  }

  return result;
}

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
  const activeRequestIdRef = useRef<string | null>(null);
  const lastSendRef = useRef<{ hash: string; at: number } | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Anti-dupe defensivo: bloqueia o mesmo envio em janelas muito curtas
    const hash = normalizarEntrada(trimmed);
    const now = Date.now();
    const last = lastSendRef.current;
    if (last && last.hash === hash && now - last.at < 1500) return;
    lastSendRef.current = { hash, at: now };

    if (inFlightRef.current) return;

    const requestId = crypto.randomUUID();
    activeRequestIdRef.current = requestId;

    const userMsg: Message = { role: "user", content: trimmed };

    // Usa sempre a versão mais recente das mensagens (evita closures/estado desatualizado)
    const baseMessages = messagesRef.current.filter((m, i, arr) => {
      const isLastEmptyAssistant =
        i === arr.length - 1 && m.role === "assistant" && m.content.trim() === "";
      return !isLastEmptyAssistant;
    });

    const outgoingMessages = [...baseMessages, userMsg];

    // Add user + placeholder assistant (so we only ever update one assistant message)
    setMessages(prev => {
      const next = prev.slice();

      // Evita duplicar o balão do usuário caso algum evento dispare 2x
      const lastMsg = next[next.length - 1];
      if (!(lastMsg?.role === "user" && lastMsg.content === userMsg.content)) {
        next.push(userMsg);
      }

      const tail = next[next.length - 1];
      const hasEmptyAssistantTail = tail?.role === "assistant" && tail.content.trim() === "";
      if (!hasEmptyAssistantTail) next.push({ role: "assistant", content: "" });

      return next;
    });
    setIsLoading(true);
    setError(null);
    inFlightRef.current = true;

    let assistantSoFar = "";

    const upsertAssistant = (incoming: string) => {
      if (activeRequestIdRef.current !== requestId) return;
      if (!incoming) return;

      // Alguns providers enviam conteúdo cumulativo (não delta). Detecta e troca para "replace".
      if (assistantSoFar && incoming.length > assistantSoFar.length && incoming.startsWith(assistantSoFar)) {
        assistantSoFar = incoming;
      } else if (assistantSoFar && assistantSoFar.endsWith(incoming)) {
        // Evita anexar a mesma cauda novamente
        return;
      } else {
        assistantSoFar += incoming;
      }

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
        "X-Zoe-Request-Id": requestId,
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

      // Compacta/deduplica a resposta final para evitar repetição e "paredões"
      const compacted = compactChatAnswer(assistantSoFar);
      if (compacted && compacted !== assistantSoFar) {
        setMessages(prev => {
          const lastIndex = prev.length - 1;
          const last = prev[lastIndex];
          if (!last || last.role !== "assistant") return prev;
          const next = prev.slice();
          next[lastIndex] = { ...last, content: compacted };
          return next;
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
      if (activeRequestIdRef.current === requestId) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      }
      // Remove the last user + placeholder assistant if there was an error
      setMessages(prev => (prev.length > 2 ? prev.slice(0, -2) : prev));
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        inFlightRef.current = false;
        activeRequestIdRef.current = null;
      }
    }
  }, [session]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: "assistant",
      content: "Olá! 👋 Sou o **Zoe AI**, assistente bíblico. Como posso ajudá-lo hoje? Você pode me perguntar sobre *versículos*, __contexto histórico__, ou pedir orientação espiritual baseada na Palavra de Deus.",
    }]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages, setMessages };
}
