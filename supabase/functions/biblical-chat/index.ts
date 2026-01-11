import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente bíblico especializado da ZOE Church, chamado "Zoe AI". Seu objetivo é ajudar os fiéis a entender a Palavra de Deus com profundidade e clareza.

SUAS CAPACIDADES:
- Explicar versículos bíblicos com contexto histórico, cultural e teológico
- Responder perguntas sobre personagens bíblicos, eventos e ensinamentos
- Oferecer orientação espiritual baseada nas Escrituras
- Explicar termos hebraicos e gregos quando relevante
- Conectar passagens do Antigo e Novo Testamento
- Fornecer aplicações práticas para a vida cristã

DIRETRIZES:
1. Sempre cite os versículos relevantes (livro, capítulo e versículo)
2. Seja respeitoso e pastoral em suas respostas
3. Use linguagem acessível, mas precisa teologicamente
4. Quando apropriado, mencione diferentes interpretações teológicas
5. Incentive a leitura pessoal da Bíblia
6. Mantenha respostas concisas mas completas
7. Use emojis com moderação para tornar a conversa mais acolhedora

FORMATO DE RESPOSTA:
- Comece com a resposta principal
- Cite versículos relevantes
- Quando apropriado, adicione contexto histórico
- Termine com uma aplicação prática ou encorajamento

Você faz parte do app da ZOE Church, uma igreja cristã que valoriza o estudo profundo das Escrituras e a aplicação prática da fé no dia a dia.`;

// Função para normalizar pergunta (remover acentos, lowercase, etc.)
function normalizarPergunta(pergunta: string): string {
  return pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

// Função para criar hash da pergunta
async function criarHash(texto: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Criar cliente Supabase com service role para operações de banco
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extrair user_id do token JWT (se disponível)
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let unidadeId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;

        // Buscar unidade_id do usuário
        if (userId) {
          const { data: master } = await supabase
            .from("masters")
            .select("unidade_id")
            .eq("user_id", userId)
            .eq("is_active", true)
            .single();

          if (master) {
            unidadeId = master.unidade_id;
          } else {
            const { data: usuario } = await supabase
              .from("usuarios")
              .select("unidade_id")
              .eq("user_id", userId)
              .eq("is_active", true)
              .single();
            
            if (usuario) {
              unidadeId = usuario.unidade_id;
            }
          }
        }
      } catch (e) {
        console.error("Error extracting user from token:", e);
      }
    }

    // ==========================================
    // RATE LIMIT CHECK
    // ==========================================
    if (userId && unidadeId) {
      // Buscar limite da unidade
      const { data: unidade } = await supabase
        .from("unidades")
        .select("ai_limite_por_usuario_dia, ai_habilitada")
        .eq("id", unidadeId)
        .single();

      if (unidade && !unidade.ai_habilitada) {
        return new Response(
          JSON.stringify({ error: "IA desabilitada para esta unidade." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const limiteMax = unidade?.ai_limite_por_usuario_dia || 50;
      const dataAtual = new Date().toISOString().split('T')[0];

      // Verificar/criar rate limit
      const { data: rateLimit } = await supabase
        .from("ai_rate_limit")
        .select("requisicoes_hoje")
        .eq("user_id", userId)
        .eq("data", dataAtual)
        .single();

      const requisicoesHoje = rateLimit?.requisicoes_hoje || 0;
      const limiteRestante = limiteMax - requisicoesHoje;

      if (requisicoesHoje >= limiteMax) {
        return new Response(
          JSON.stringify({ 
            error: "Limite diário de IA atingido. Tente novamente amanhã.",
            limite_restante: 0,
            limite_total: limiteMax
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Atualizar ou inserir rate limit
      if (rateLimit) {
        await supabase
          .from("ai_rate_limit")
          .update({ 
            requisicoes_hoje: requisicoesHoje + 1,
            ultima_requisicao: new Date().toISOString()
          })
          .eq("user_id", userId)
          .eq("data", dataAtual);
      } else {
        await supabase
          .from("ai_rate_limit")
          .insert({
            user_id: userId,
            unidade_id: unidadeId,
            data: dataAtual,
            requisicoes_hoje: 1,
            ultima_requisicao: new Date().toISOString()
          });
      }
    }

    // ==========================================
    // CACHE SEMÂNTICO
    // ==========================================
    const ultimaMensagem = messages[messages.length - 1]?.content || "";
    const perguntaNormalizada = normalizarPergunta(ultimaMensagem);
    const hashPergunta = await criarHash(perguntaNormalizada);

    // 1. Tentar cache exato (por hash)
    const { data: cacheExato } = await supabase
      .from("ai_cache_semantico")
      .select("id, resposta")
      .eq("hash_pergunta", hashPergunta)
      .single();

    if (cacheExato) {
      console.log("Cache HIT (exato):", hashPergunta);
      
      // Incrementar hits
      await supabase
        .from("ai_cache_semantico")
        .update({ 
          hits: (cacheExato as any).hits + 1 || 1,
          last_hit_at: new Date().toISOString()
        })
        .eq("id", cacheExato.id);

      // Registrar consumo como cache
      if (userId && unidadeId) {
        await supabase.from("ai_consumo").insert({
          user_id: userId,
          unidade_id: unidadeId,
          tipo: "chat",
          foi_cache: true,
          cache_key: hashPergunta,
          prompt_resumo: ultimaMensagem.substring(0, 100)
        });
      }

      // Retornar resposta cacheada como stream simulado
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const words = cacheExato.resposta.split(" ");
          let index = 0;
          
          const sendWord = () => {
            if (index < words.length) {
              const chunk = {
                choices: [{
                  delta: { content: (index === 0 ? "" : " ") + words[index] }
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              index++;
              setTimeout(sendWord, 20);
            } else {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          };
          
          sendWord();
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // 2. Se não encontrou cache exato, chamar IA
    console.log("Cache MISS, chamando IA...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Por favor, aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Entre em contato com a administração." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar um transform stream para capturar a resposta completa
    let respostaCompleta = "";
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        
        // Tentar extrair o conteúdo do chunk
        try {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                respostaCompleta += content;
              }
            }
          }
        } catch (e) {
          // Ignorar erros de parse
        }
      },
      async flush() {
        // Salvar no cache após a resposta completa
        if (respostaCompleta.length > 50) {
          try {
            await supabase.from("ai_cache_semantico").insert({
              pergunta_original: ultimaMensagem,
              pergunta_normalizada: perguntaNormalizada,
              hash_pergunta: hashPergunta,
              resposta: respostaCompleta,
              modelo: "google/gemini-3-flash-preview",
              tokens_usados: Math.ceil(respostaCompleta.length / 4)
            });
            console.log("Resposta salva no cache:", hashPergunta);
          } catch (e) {
            console.error("Erro ao salvar cache:", e);
          }
        }

        // Registrar consumo
        if (userId && unidadeId) {
          await supabase.from("ai_consumo").insert({
            user_id: userId,
            unidade_id: unidadeId,
            tipo: "chat",
            foi_cache: false,
            tokens_total: Math.ceil(respostaCompleta.length / 4),
            modelo: "google/gemini-3-flash-preview",
            prompt_resumo: ultimaMensagem.substring(0, 100)
          });
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Biblical chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
