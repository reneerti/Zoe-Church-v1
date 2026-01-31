import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateResponse, getContextualSuggestions, ChatContext } from "@/lib/chatAI";

type Message = {
  role: "user" | "assistant";
  content: string;
  id?: string; // ID único para evitar duplicatas
};

// Utilitário para simular streaming de resposta (efeito visual)
function* streamText(text: string, chunkSize: number = 3) {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(0, i + chunkSize);
    // Pausa curta para efeito de digitação
  }
}

export function useBiblicalChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou o **Zoe AI**, assistente bíblico. Como posso ajudá-lo hoje? Você pode me perguntar sobre *versículos*, __contexto histórico__, ou pedir orientação espiritual baseada na Palavra de Deus.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Refs para controle de concorrência
  const inFlightRef = useRef(false);
  const messagesRef = useRef<Message[]>(messages);
  const historyLoadedRef = useRef(false);
  const lastRequestTimestampRef = useRef<{ input: string; timestamp: number } | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Carrega histórico do banco ao iniciar
  useEffect(() => {
    if (!user?.id || historyLoadedRef.current) return;

    const loadHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (!error && data && data.length > 0) {
          const historicMessages = data.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

          // Adiciona mensagem de boas-vindas + histórico
          setMessages([messages[0], ...historicMessages]);
          historyLoadedRef.current = true;
        }
      } catch (err) {
        console.error('[ZOE-AI] Erro ao carregar histórico:', err);
      }
    };

    loadHistory();
  }, [user?.id]);

  // Atualiza sugestões contextuais
  useEffect(() => {
    if (!user?.id) return;

    const context: ChatContext = {
      userId: user.id,
      lastReadBook: profile?.last_read_book,
      lastReadChapter: profile?.last_read_chapter,
    };

    const newSuggestions = getContextualSuggestions(context);
    setSuggestions(newSuggestions);
  }, [user?.id, profile]);

  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // DEBOUNCE AGRESSIVO: Bloqueia requisições idênticas nos últimos 1000ms
    const now = Date.now();
    if (lastRequestTimestampRef.current
      && lastRequestTimestampRef.current.input === trimmed
      && (now - lastRequestTimestampRef.current.timestamp) < 1000) {
      console.log('[ZOE-AI] Requisição duplicada bloqueada (debounce)');
      return;
    }

    // Atualiza timestamp da última requisição
    lastRequestTimestampRef.current = { input: trimmed, timestamp: now };

    // Bloqueia se já há requisição em andamento
    if (inFlightRef.current) {
      console.log('[ZOE-AI] Requisição já em andamento, ignorando...');
      return;
    }

    // Gera IDs únicos para as mensagens
    const userMsgId = `user-${Date.now()}-${Math.random()}`;
    const assistantMsgId = `assistant-${Date.now()}-${Math.random()}`;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      id: userMsgId
    };

    // Marca como em processamento IMEDIATAMENTE
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    // Adiciona user + placeholder assistant COM IDs únicos
    setMessages(prev => {
      // Verifica se mensagem do usuário já existe (por conteúdo ou ID)
      const userExists = prev.some(m =>
        (m.id === userMsgId) ||
        (m.role === 'user' && m.content === trimmed && prev.indexOf(m) === prev.length - 1)
      );

      if (userExists) {
        console.log('[ZOE-AI] Mensagem de usuário já existe, pulando...');
        return prev;
      }

      return [
        ...prev,
        userMsg,
        { role: "assistant", content: "", id: assistantMsgId }
      ];
    });

    try {
      // Cria contexto do chat
      const context: ChatContext = {
        userId: user?.id || 'anonymous',
        lastReadBook: profile?.last_read_book,
        lastReadChapter: profile?.last_read_chapter,
      };

      // Gera resposta usando IA emulada
      const responseText = await generateResponse(trimmed, context);

      // Simula streaming para UX consistente
      const stream = streamText(responseText, 5);

      for (const chunk of stream) {
        // Pequeno delay para efeito de digitação
        await new Promise(resolve => setTimeout(resolve, 20));

        setMessages(prev => {
          const lastIndex = prev.length - 1;
          const last = prev[lastIndex];

          // Verifica se o último item é o assistant com o ID correto
          if (!last || last.role !== "assistant" || last.id !== assistantMsgId) {
            return prev;
          }

          const next = [...prev];
          next[lastIndex] = { ...last, content: chunk };
          return next;
        });
      }

      // Salva no banco de dados (offline-first)
      if (user?.id) {
        try {
          await supabase.from('chat_messages').insert([
            {
              user_id: user.id,
              role: 'user',
              content: trimmed,
              created_at: new Date().toISOString(),
            },
            {
              user_id: user.id,
              role: 'assistant',
              content: responseText,
              created_at: new Date().toISOString(),
            },
          ]);
          console.log('[ZOE-AI] Mensagens salvas no banco');
        } catch (dbError) {
          console.warn('[ZOE-AI] Erro ao salvar no banco:', dbError);
        }
      }

    } catch (e) {
      console.error("[ZOE-AI] Error:", e);
      setError(e instanceof Error ? e.message : "Erro ao processar mensagem");

      // Remove user + placeholder em caso de erro
      setMessages(prev => {
        // Remove apenas as mensagens com os IDs específicos
        return prev.filter(m => m.id !== userMsgId && m.id !== assistantMsgId);
      });
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [user?.id, profile]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: "assistant",
      content: "Olá! 👋 Sou o **Zoe AI**, assistente bíblico. Como posso ajudá-lo hoje? Você pode me perguntar sobre *versículos*, __contexto histórico__, ou pedir orientação espiritual baseada na Palavra de Deus.",
    }]);
    setError(null);

    // Limpa histórico do banco (opcional)
    if (user?.id) {
      supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .then(() => console.log('[ZOE-AI] Histórico limpo'));
    }
  }, [user?.id]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages,
    suggestions,
  };
}
