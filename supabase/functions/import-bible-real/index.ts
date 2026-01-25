import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de abreviações PT-BR para abreviações da API
// A API usa abreviações em inglês minúsculas
const livrosAPI: Record<string, string> = {
  "Gn": "gn", "Êx": "ex", "Lv": "lv", "Nm": "nm", "Dt": "dt",
  "Js": "js", "Jz": "jz", "Rt": "rt", "1Sm": "1sm", "2Sm": "2sm",
  "1Rs": "1rs", "2Rs": "2rs", "1Cr": "1cr", "2Cr": "2cr",
  "Ed": "ed", "Ne": "ne", "Et": "et", "Jó": "jo", "Sl": "sl",
  "Pv": "pv", "Ec": "ec", "Ct": "ct", "Is": "is",
  "Jr": "jr", "Lm": "lm", "Ez": "ez", "Dn": "dn",
  "Os": "os", "Jl": "jl", "Am": "am", "Ob": "ob", "Jn": "jn",
  "Mq": "mq", "Na": "na", "Hc": "hc", "Sf": "sf", "Ag": "ag",
  "Zc": "zc", "Ml": "ml",
  "Mt": "mt", "Mc": "mc", "Lc": "lc", "Jo": "jo", "At": "at",
  "Rm": "rm", "1Co": "1co", "2Co": "2co", "Gl": "gl",
  "Ef": "ef", "Fp": "fp", "Cl": "cl", "1Ts": "1ts",
  "2Ts": "2ts", "1Tm": "1tm", "2Tm": "2tm", "Tt": "tt",
  "Fm": "fm", "Hb": "hb", "Tg": "tg", "1Pe": "1pe", "2Pe": "2pe",
  "1Jo": "1jo", "2Jo": "2jo", "3Jo": "3jo", "Jd": "jd", "Ap": "ap"
};

// Versões disponíveis na API A Bíblia Digital
const versoesAPI: Record<string, string> = {
  "NVI": "nvi",
  "ARA": "ra", // Almeida Revista e Atualizada
  "ACF": "acf", // Almeida Corrigida Fiel
  "NTLH": "ntlh" // Nova Tradução na Linguagem de Hoje
};

interface APIResponse {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
  };
  chapter: { number: number; verses: number };
  verses: Array<{ number: number; text: string }>;
}

async function fetchChapter(livroAPI: string, capitulo: number, versao: string): Promise<APIResponse | null> {
  try {
    const url = `https://www.abibliadigital.com.br/api/verses/${versao}/${livroAPI}/${capitulo}`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching ${livroAPI} ${capitulo}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Fetch error for ${livroAPI} ${capitulo}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, livro, capitulo, versao = "NVI" } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const versaoAPI = versoesAPI[versao] || "nvi";
    
    if (action === "test-api") {
      // Testar se a API está funcionando
      const testUrl = `https://www.abibliadigital.com.br/api/verses/nvi/gn/1`;
      
      try {
        const response = await fetch(testUrl);
        const data = await response.json();
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: response.status,
            url: testUrl,
            livro: data.book?.name,
            capitulo: data.chapter?.number,
            versiculos: data.verses?.length,
            amostra: data.verses?.slice(0, 3)
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: e instanceof Error ? e.message : "Unknown error",
            url: testUrl
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    if (action === "import-chapter") {
      // Importar um capítulo específico
      const livroAPICode = livrosAPI[livro];
      
      if (!livroAPICode) {
        return new Response(
          JSON.stringify({ error: `Livro não encontrado: ${livro}`, disponiveis: Object.keys(livrosAPI) }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Buscar o book_id e version_id
      const { data: book } = await supabase
        .from("bible_books")
        .select("id")
        .eq("abbreviation", livro)
        .single();
        
      const { data: version } = await supabase
        .from("bible_versions")
        .select("id")
        .eq("code", versao)
        .single();
      
      if (!book || !version) {
        return new Response(
          JSON.stringify({ error: "Livro ou versão não encontrada no banco", livro, versao }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const apiData = await fetchChapter(livroAPICode, capitulo, versaoAPI);
      
      if (!apiData || !apiData.verses || apiData.verses.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "Não foi possível buscar o capítulo da API",
            url: `https://www.abibliadigital.com.br/api/verses/${versaoAPI}/${livroAPICode}/${capitulo}`
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Atualizar os versículos no banco
      let updated = 0;
      let errors: string[] = [];
      
      for (const verse of apiData.verses) {
        const { error } = await supabase
          .from("bible_verses")
          .update({ text: verse.text })
          .eq("book_id", book.id)
          .eq("version_id", version.id)
          .eq("chapter", capitulo)
          .eq("verse", verse.number);
        
        if (error) {
          errors.push(`v${verse.number}: ${error.message}`);
        } else {
          updated++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          livro,
          livro_nome: apiData.book.name,
          capitulo, 
          versiculos_api: apiData.verses.length,
          versiculos_atualizados: updated,
          errors: errors.length > 0 ? errors : undefined
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === "import-book") {
      // Importar um livro inteiro
      const livroAPICode = livrosAPI[livro];
      
      if (!livroAPICode) {
        return new Response(
          JSON.stringify({ error: `Livro não encontrado: ${livro}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Buscar informações do livro
      const { data: book } = await supabase
        .from("bible_books")
        .select("id, chapters_count, name")
        .eq("abbreviation", livro)
        .single();
        
      const { data: version } = await supabase
        .from("bible_versions")
        .select("id")
        .eq("code", versao)
        .single();
      
      if (!book || !version) {
        return new Response(
          JSON.stringify({ error: "Livro ou versão não encontrada no banco" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      let totalUpdated = 0;
      const chaptersProcessed: number[] = [];
      
      for (let cap = 1; cap <= book.chapters_count; cap++) {
        // Delay para respeitar rate limit (20 req/hora sem auth)
        // Como precisamos de muitas requisições, vamos com delay de 3s
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const apiData = await fetchChapter(livroAPICode, cap, versaoAPI);
        
        if (apiData?.verses && apiData.verses.length > 0) {
          for (const verse of apiData.verses) {
            const { error } = await supabase
              .from("bible_verses")
              .update({ text: verse.text })
              .eq("book_id", book.id)
              .eq("version_id", version.id)
              .eq("chapter", cap)
              .eq("verse", verse.number);
            
            if (!error) {
              totalUpdated++;
            }
          }
          chaptersProcessed.push(cap);
          console.log(`✅ ${livro} cap ${cap}: ${apiData.verses.length} versículos`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          livro,
          livro_nome: book.name,
          capitulos_processados: chaptersProcessed.length,
          versiculos_atualizados: totalUpdated
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === "import-priority") {
      // Importar primeiros capítulos dos livros mais lidos
      // Rate limit: 20 req/hora sem auth, então importamos poucos capítulos
      const livrosPrioritarios = ["Gn", "Sl", "Mt", "Jo"];
      
      const { data: version } = await supabase
        .from("bible_versions")
        .select("id")
        .eq("code", versao)
        .single();
      
      if (!version) {
        return new Response(
          JSON.stringify({ error: "Versão não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const resultados: { livro: string; capitulos: number; versiculos: number }[] = [];
      
      for (const abrev of livrosPrioritarios) {
        const livroAPICode = livrosAPI[abrev];
        if (!livroAPICode) continue;
        
        const { data: book } = await supabase
          .from("bible_books")
          .select("id, chapters_count")
          .eq("abbreviation", abrev)
          .single();
        
        if (!book) continue;
        
        let versiculosAtualizados = 0;
        let capitulosProcessados = 0;
        
        // Importar apenas capítulos 1-3 de cada livro prioritário
        const maxCaps = Math.min(3, book.chapters_count);
        
        for (let cap = 1; cap <= maxCaps; cap++) {
          // Delay de 4 segundos para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          const apiData = await fetchChapter(livroAPICode, cap, versaoAPI);
          
          if (apiData?.verses && apiData.verses.length > 0) {
            for (const verse of apiData.verses) {
              const { error } = await supabase
                .from("bible_verses")
                .update({ text: verse.text })
                .eq("book_id", book.id)
                .eq("version_id", version.id)
                .eq("chapter", cap)
                .eq("verse", verse.number);
              
              if (!error) versiculosAtualizados++;
            }
            capitulosProcessados++;
            console.log(`✅ ${abrev} cap ${cap}: ${apiData.verses.length} versículos`);
          }
        }
        
        resultados.push({ 
          livro: abrev, 
          capitulos: capitulosProcessados, 
          versiculos: versiculosAtualizados 
        });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          resultados,
          total_versiculos: resultados.reduce((acc, r) => acc + r.versiculos, 0)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === "list-books") {
      // Listar livros disponíveis
      const { data: books } = await supabase
        .from("bible_books")
        .select("abbreviation, name, chapters_count, testament")
        .order("book_number");
      
      return new Response(
        JSON.stringify({ 
          books, 
          livros_mapeados: Object.keys(livrosAPI), 
          versoes: Object.keys(versoesAPI) 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Ação inválida", 
        acoes_disponiveis: ["test-api", "import-chapter", "import-book", "import-priority", "list-books"],
        exemplo: { action: "import-chapter", livro: "Gn", capitulo: 1, versao: "NVI" }
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
