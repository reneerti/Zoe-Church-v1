import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    return new Response(response.body, {
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
