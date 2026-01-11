import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === 'import-sample-verses') {
      // Get Bible versions
      const { data: versions } = await supabase
        .from('bible_versions')
        .select('id, code');

      if (!versions || versions.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No Bible versions found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Get Genesis book
      const { data: genesis } = await supabase
        .from('bible_books')
        .select('id')
        .eq('abbreviation', 'Gn')
        .single();

      if (!genesis) {
        return new Response(
          JSON.stringify({ error: 'Genesis not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Sample verses for Genesis 1 (NVI)
      const nviVersion = versions.find(v => v.code === 'NVI');
      if (nviVersion) {
        const genesisVerses = [
          { verse: 1, text: "No princípio Deus criou os céus e a terra." },
          { verse: 2, text: "Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas." },
          { verse: 3, text: "Disse Deus: 'Haja luz', e houve luz." },
          { verse: 4, text: "Deus viu que a luz era boa, e separou a luz das trevas." },
          { verse: 5, text: "Deus chamou à luz Dia, e às trevas chamou Noite. Passaram-se a tarde e a manhã; esse foi o primeiro dia." },
          { verse: 6, text: "Depois disse Deus: 'Haja entre as águas um firmamento que separe águas de águas'." },
          { verse: 7, text: "Assim Deus fez o firmamento e separou as águas que ficaram abaixo do firmamento das que ficaram por cima. E assim foi." },
          { verse: 8, text: "Ao firmamento Deus chamou Céu. Passaram-se a tarde e a manhã; esse foi o segundo dia." },
          { verse: 9, text: "E disse Deus: 'Ajuntem-se num só lugar as águas que estão debaixo do céu, e apareça a parte seca'. E assim foi." },
          { verse: 10, text: "À parte seca Deus chamou Terra, e às águas reunidas chamou Mares. E Deus viu que ficou bom." },
        ];

        const versesToInsert = genesisVerses.map(v => ({
          book_id: genesis.id,
          version_id: nviVersion.id,
          chapter: 1,
          verse: v.verse,
          text: v.text,
        }));

        // Check if verses already exist
        const { data: existing } = await supabase
          .from('bible_verses')
          .select('id')
          .eq('book_id', genesis.id)
          .eq('version_id', nviVersion.id)
          .eq('chapter', 1)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('bible_verses').insert(versesToInsert);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Sample verses imported' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import-sample-hymns') {
      // Sample Harpa hymns
      const sampleHymns = [
        {
          hymn_number: 1,
          title: "Chuvas de Graça",
          author: "D. W. Whittle",
          lyrics: `Chuvas de graça, chuvas pedimos,
Chuvas que venham do amor de Jesus!
Gotas preciosas, nós esperamos,
Benditas chuvas derrama, Jesus!

Graça, oh Senhor, vem nos dar!
Manda-nos chuvas de bênçãos do céu!

Chuvas de graça que nos animem,
Chuvas benditas nos vem conceder!
Gotas preciosas de alegria e vida,
Graça divina nos vem trazer!`,
          chorus: `Graça, oh Senhor, vem nos dar!
Manda-nos chuvas de bênçãos do céu!`
        },
        {
          hymn_number: 2,
          title: "Saudosa Lembrança",
          author: "J. H. Tenney",
          lyrics: `Saudosa lembrança do tempo feliz
Que outrora passei junto à cruz!
Quão grata memória que ainda me diz
Que salvo ali fui por Jesus!

Que paz, que amor naquela hora senti!
A graça me encheu de louvor!
E desde esse dia ainda há paz em mim,
A doce paz do Salvador!`,
          chorus: `Que paz, que amor naquela hora senti!
A graça me encheu de louvor!`
        },
        {
          hymn_number: 3,
          title: "Sempre Firme",
          author: "P. P. Bliss",
          lyrics: `Sempre firme, sempre firme,
Ao pendão da santa cruz;
Sempre firme, sempre firme,
Pelo poder de Jesus!

Eis o real pendão erguido,
E ganhando o mundo está;
Sempre firme, sempre firme,
Que Jesus nos guiará!`,
          chorus: `Sempre firme, sempre firme,
Ao pendão da santa cruz;
Sempre firme, sempre firme,
Pelo poder de Jesus!`
        },
      ];

      // Check if hymns already exist
      const { data: existing } = await supabase
        .from('harpa_hymns')
        .select('id')
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('harpa_hymns').insert(sampleHymns);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Sample hymns imported' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
