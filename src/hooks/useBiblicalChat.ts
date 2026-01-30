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
  
  // Refs para controle de concorrência
  const inFlightRef = useRef(false);
  const activeRequestIdRef = useRef<string | null>(null);
  const lastSendRef = useRef<{ hash: string; at: number } | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  
  // Rastreamento de chunks para evitar duplicação
  const processedChunksRef = useRef<Set<string>>(new Set());
  const fullResponseRef = useRef<string>("");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Anti-dupe: bloqueia mesmo envio em janela curta
    const hash = normalizarEntrada(trimmed);
    const now = Date.now();
    const last = lastSendRef.current;
    if (last && last.hash === hash && now - last.at < 2000) return;
    lastSendRef.current = { hash, at: now };

    // Bloqueia se já há requisição em andamento
    if (inFlightRef.current) return;

    // Novo request ID e reset de estado
    const requestId = crypto.randomUUID();
    activeRequestIdRef.current = requestId;
    processedChunksRef.current = new Set();
    fullResponseRef.current = "";

    const userMsg: Message = { role: "user", content: trimmed };

    // Mensagens para enviar (sem placeholder vazio)
    const baseMessages = messagesRef.current.filter((m, i, arr) => {
      const isLastEmptyAssistant =
        i === arr.length - 1 && m.role === "assistant" && m.content.trim() === "";
      return !isLastEmptyAssistant;
    });

    const outgoingMessages = [...baseMessages, userMsg];

    // Adiciona user + placeholder assistant
    setMessages(prev => {
      const next = [...prev];
      
      // Evita duplicar mensagem do usuário
      const lastMsg = next[next.length - 1];
      if (!(lastMsg?.role === "user" && lastMsg.content === userMsg.content)) {
        next.push(userMsg);
      }

      // Adiciona placeholder do assistant se não existir
      const tail = next[next.length - 1];
      if (!(tail?.role === "assistant" && tail.content.trim() === "")) {
        next.push({ role: "assistant", content: "" });
      }

      return next;
    });
    
    setIsLoading(true);
    setError(null);
    inFlightRef.current = true;

    // Função para atualizar resposta do assistant (anti-duplicação)
    const updateAssistantResponse = (newContent: string) => {
      if (activeRequestIdRef.current !== requestId) return;
      if (!newContent) return;

      // Cria hash único para detectar chunks duplicados
      const chunkHash = `${fullResponseRef.current.length}:${newContent}`;
      if (processedChunksRef.current.has(chunkHash)) {
        console.log("[ZOE-AI] Chunk duplicado ignorado:", chunkHash);
        return;
      }
      processedChunksRef.current.add(chunkHash);

      // Verifica se o chunk já está no final da resposta (repetição)
      if (fullResponseRef.current.endsWith(newContent)) {
        console.log("[ZOE-AI] Conteúdo repetido no final, ignorando");
        return;
      }

      // Verifica se é conteúdo cumulativo (provider envia tudo de novo)
      if (newContent.startsWith(fullResponseRef.current) && newContent.length > fullResponseRef.current.length) {
        // É cumulativo - substitui tudo
        fullResponseRef.current = newContent;
      } else {
        // É delta - anexa
        fullResponseRef.current += newContent;
      }

      const currentResponse = fullResponseRef.current;
      
      setMessages(prev => {
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];
        if (!last || last.role !== "assistant") return prev;
        
        // Só atualiza se o conteúdo for diferente
        if (last.content === currentResponse) return prev;
        
        const next = [...prev];
        next[lastIndex] = { ...last, content: currentResponse };
        return next;
      });
    };

    try {
      const functionUrl = `https://allfhenlhsjkuatczato.supabase.co/functions/v1/biblical-chat`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbGZoZW5saHNqa3VhdGN6YXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDIyOTUsImV4cCI6MjA4MzY3ODI5NX0.kCFkQ4iB_8fjxi7IHhpyqUVP0y0aIIGX6xtVNIWpIpE",
        "X-Zoe-Request-Id": requestId,
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let resp: Response;
      try {
        resp = await fetch(functionUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ messages: outgoingMessages }),
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            throw new Error("A requisição expirou. Tente novamente.");
          }
          if (fetchError.message.includes("Failed to fetch")) {
            throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
          }
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Processa linhas completas
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content) {
              updateAssistantResponse(content);
            }
          } catch {
            // JSON incompleto, volta pro buffer
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Processa resto do buffer
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content) {
              updateAssistantResponse(content);
            }
          } catch { /* ignore */ }
        }
      }

      // Compacta resposta final (remove parágrafos duplicados)
      const finalResponse = fullResponseRef.current;
      const compacted = compactChatAnswer(finalResponse);
      if (compacted && compacted !== finalResponse) {
        setMessages(prev => {
          const lastIndex = prev.length - 1;
          const last = prev[lastIndex];
          if (!last || last.role !== "assistant") return prev;
          const next = [...prev];
          next[lastIndex] = { ...last, content: compacted };
          return next;
        });
      }
    } catch (e) {
      console.error("[ZOE-AI] Error:", e);
      if (activeRequestIdRef.current === requestId) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
        // Remove user + placeholder em caso de erro
        setMessages(prev => (prev.length > 2 ? prev.slice(0, -2) : prev));
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        inFlightRef.current = false;
        activeRequestIdRef.current = null;
        processedChunksRef.current = new Set();
      }
    }
  }, [session]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: "assistant",
      content: "Olá! 👋 Sou o **Zoe AI**, assistente bíblico. Como posso ajudá-lo hoje? Você pode me perguntar sobre *versículos*, __contexto histórico__, ou pedir orientação espiritual baseada na Palavra de Deus.",
    }]);
    setError(null);
    fullResponseRef.current = "";
    processedChunksRef.current = new Set();
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages, setMessages };
}
