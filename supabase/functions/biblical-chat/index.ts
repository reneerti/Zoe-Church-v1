import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente bíblico especializado, chamado "Zoe AI". Seu objetivo é ajudar os fiéis a entender a Palavra de Deus com profundidade e clareza.

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

FORMATAÇÃO DE TEXTO:
- Use **negrito** para destacar palavras importantes, versículos e conceitos chave
- Use *itálico* para citações bíblicas e termos em hebraico/grego
- Use __sublinhado__ para alertas ou pontos muito importantes
- Combine formatações quando necessário: ***negrito itálico***

FORMATO DE RESPOSTA:
- Comece com a resposta principal
- Cite versículos relevantes em **negrito**
- Quando apropriado, adicione contexto histórico em *itálico*
- Termine com uma aplicação prática ou encorajamento

IMPORTANTE:
- Se você não souber responder algo, diga: "🤔 **PENSANDO...** Essa é uma pergunta interessante que precisa de mais reflexão. _Mas fique à vontade para fazer outra pergunta enquanto isso!_ __Esta pergunta está sendo pensada.__"
- Sempre responda em português do Brasil`;

const SIMILARIDADE_MINIMA = 0.92;

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

// Função para gerar embedding via Lovable AI (text-embedding-3-small)
async function gerarEmbedding(texto: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: texto,
      }),
    });

    if (!response.ok) {
      console.error("Erro ao gerar embedding:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    return null;
  }
}

// Função para detectar categoria da pergunta
function detectarCategoria(pergunta: string): string {
  const p = pergunta.toLowerCase();
  
  if (/deus|senhor|jeová|pai celestial|criador/.test(p)) return 'deus';
  if (/jesus|cristo|messias|salvador|filho de deus/.test(p)) return 'jesus';
  if (/espírito santo|espírito|consolador/.test(p)) return 'espirito_santo';
  if (/salvação|salvo|salvar|redenção/.test(p)) return 'salvacao';
  if (/oração|orar|rezar|prece/.test(p)) return 'oracao';
  if (/fé|crer|acreditar|crença/.test(p)) return 'fe';
  if (/amor|amar|caridade|compaixão/.test(p)) return 'amor';
  if (/pecado|pecar|tentação|perdão/.test(p)) return 'pecado';
  if (/céu|paraíso|vida eterna|eternidade/.test(p)) return 'escatologia';
  if (/igreja|comunhão|corpo de cristo/.test(p)) return 'igreja';
  if (/profecia|apocalipse|fim dos tempos/.test(p)) return 'profecia';
  
  return 'geral';
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
    // RATE LIMIT CHECK (por unidade/usuário)
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
    // CACHE GLOBAL (compartilhado entre unidades)
    // ==========================================
    const ultimaMensagem = messages[messages.length - 1]?.content || "";
    const perguntaNormalizada = normalizarPergunta(ultimaMensagem);
    const hashPergunta = await criarHash(perguntaNormalizada);
    const categoria = detectarCategoria(ultimaMensagem);

    // 1. Tentar cache exato (por hash) - MAIS RÁPIDO
    const { data: cacheExato } = await supabase
      .from("ai_cache_semantico")
      .select("id, resposta, hits")
      .eq("hash_pergunta", hashPergunta)
      .single();

    if (cacheExato) {
      console.log("✅ Cache HIT (exato):", hashPergunta.substring(0, 16));
      
      // Incrementar hits
      await supabase
        .from("ai_cache_semantico")
        .update({ 
          hits: (cacheExato.hits || 0) + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq("id", cacheExato.id);

      // Registrar consumo como cache (por unidade para métricas)
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
      return streamCachedResponse(cacheExato.resposta, corsHeaders);
    }

    // 2. Tentar cache semântico (por embedding) - BUSCA SIMILAR
    const embedding = await gerarEmbedding(perguntaNormalizada, LOVABLE_API_KEY);
    
    if (embedding) {
      const { data: cacheSimilar } = await supabase.rpc('buscar_cache_similar_global', {
        p_embedding: `[${embedding.join(',')}]`,
        p_similaridade_minima: SIMILARIDADE_MINIMA,
        p_limite: 1,
        p_categoria: null // Buscar em todas as categorias
      });

      if (cacheSimilar && cacheSimilar.length > 0) {
        const match = cacheSimilar[0];
        console.log(`✅ Cache HIT (semântico): ${(match.similaridade * 100).toFixed(1)}%`);
        
        // Incrementar hits do cache encontrado
        await supabase.rpc('incrementar_hit_cache', { p_cache_id: match.id });

        // Registrar consumo como cache
        if (userId && unidadeId) {
          await supabase.from("ai_consumo").insert({
            user_id: userId,
            unidade_id: unidadeId,
            tipo: "chat",
            foi_cache: true,
            cache_key: match.id,
            prompt_resumo: ultimaMensagem.substring(0, 100)
          });
        }

        return streamCachedResponse(match.resposta, corsHeaders);
      }
    }

    // 3. Cache MISS - Chamar IA
    console.log("❌ Cache MISS, chamando Lovable AI...");

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
        // Salvar no CACHE GLOBAL após a resposta completa
        if (respostaCompleta.length > 50) {
          try {
            // Salvar com embedding para busca semântica futura
            const novoEmbedding = embedding ? `[${embedding.join(',')}]` : null;
            
            await supabase.from("ai_cache_semantico").insert({
              pergunta_original: ultimaMensagem,
              pergunta_normalizada: perguntaNormalizada,
              hash_pergunta: hashPergunta,
              embedding: novoEmbedding,
              categoria: categoria,
              resposta: respostaCompleta,
              modelo: "google/gemini-3-flash-preview",
              tokens_usados: Math.ceil(respostaCompleta.length / 4),
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
            });
            console.log("💾 Resposta salva no cache global:", hashPergunta.substring(0, 16));
          } catch (e) {
            console.error("Erro ao salvar cache:", e);
          }
        }

        // Registrar consumo (por unidade para métricas)
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

// Função auxiliar para simular stream de resposta cacheada
function streamCachedResponse(resposta: string, headers: Record<string, string>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const words = resposta.split(" ");
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
          setTimeout(sendWord, 15); // 15ms entre palavras para simular streaming
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      };
      
      sendWord();
    }
  });

  return new Response(stream, {
    headers: { ...headers, "Content-Type": "text/event-stream" },
  });
}