import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample Harpa hymns data (first 50 for batch 1)
const harpaHymnsBatch1 = [
  { hymn_number: 1, title: "Chuvas de Graça", author: "D. W. Whittle", 
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
Manda-nos chuvas de bênçãos do céu!` },
  
  { hymn_number: 2, title: "Saudai o Nome de Jesus", author: "Edward Perronet",
    lyrics: `Saudai o nome de Jesus!
Arcanjos, vos prostrai!
A Ele, sim, o Redentor,
Coroai! Coroai!

Ó escolhidos pela fé
Da aliança do Senhor!
A Jesus Cristo, nosso Rei,
Coroai! Coroai!

Em toda tribo e toda a nação
Louvemos o Senhor!
Pois Ele é digno de louvor,
Coroai! Coroai!`,
    chorus: null },

  { hymn_number: 3, title: "Que Segurança", author: "Fanny J. Crosby",
    lyrics: `Que segurança! Sou de Jesus!
Oh! que prenúncio de glória e luz!
Herdeiro salvo só por amor,
Eis-me nascido do sangue remidor!

Esta é a minha história:
Louvar ao meu Senhor,
Por todo o dia, e a todo o instante,
Gozar do Seu favor!

Perfeita paz, sim, gozo imortal,
Tenho em Jesus, meu Rei celestial!
Nele, meu braço, minha visão,
Tenho a certeza da minha salvação!`,
    chorus: `Esta é a minha história:
Louvar ao meu Senhor,
Por todo o dia, e a todo o instante,
Gozar do Seu favor!` },

  { hymn_number: 4, title: "Bendito Seja o Cordeiro", author: "Matthew Bridges",
    lyrics: `Bendito seja o Cordeiro de Deus,
Nos céus está, com glória e luz!
Na cruz, na cruz morreu por nós,
A Ele demos glória e louvor!

Ele venceu a morte e o mal,
Reina nos céus, é nosso Rei!
A Ele damos o louvor,
Ao santo Cordeiro Salvador!`,
    chorus: null },

  { hymn_number: 5, title: "Eis o Pendão", author: "James McGranahan",
    lyrics: `Eis o pendão: a cruz de Cristo!
Vinde a Jesus, vinde a Jesus!
Nela há perdão e vida eterna,
Vinde a Jesus, vinde a Jesus!

Vinde a Jesus, vinde a Jesus!
Há vida só na cruz!
Vinde agora ao Salvador,
Vinde a Jesus, vinde a Jesus!`,
    chorus: `Vinde a Jesus, vinde a Jesus!
Há vida só na cruz!
Vinde agora ao Salvador,
Vinde a Jesus, vinde a Jesus!` },

  { hymn_number: 6, title: "Tu És Fiel, Senhor", author: "Thomas O. Chisholm",
    lyrics: `Tu és fiel, Senhor, ó Pai celeste,
Tuas promessas cumprirás fielmente!
Tu que jamais mudaste em teu amor,
És sempre fiel, Senhor!

Grande é a tua fidelidade!
Grande é a tua fidelidade!
Cada manhã teu amor me sustém;
Grande é a tua fidelidade, ó Deus!`,
    chorus: `Grande é a tua fidelidade!
Grande é a tua fidelidade!
Cada manhã teu amor me sustém;
Grande é a tua fidelidade, ó Deus!` },

  { hymn_number: 7, title: "Rude Cruz", author: "George Bennard",
    lyrics: `Rude cruz se fez precioso
Quando nela Jesus foi pregado;
Pois foi lá que Jesus morreu
Para nos salvar do pecado!

Eu sou pecador, mas Jesus morreu
Para me livrar do mal;
Por isso a cruz levantarei
E a ela serei fiel!`,
    chorus: `Eu me glorio sim na cruz!
Lá Jesus morreu por mim!
Até que enfim eu possa estar,
Com Jesus no céu sem fim!` },

  { hymn_number: 8, title: "Mais Perto Quero Estar", author: "Sarah F. Adams",
    lyrics: `Mais perto quero estar, meu Deus, de Ti!
Mesmo que seja a dor que me leve a Ti.
Sempre hei de suplicar:
Mais perto quero estar, mais perto de Ti!

Vagando triste aqui, meu Deus, sem Ti,
Bem sei que mesmo assim estás aqui.
Sempre hei de suplicar:
Mais perto quero estar, mais perto de Ti!`,
    chorus: null },

  { hymn_number: 9, title: "Santo! Santo! Santo!", author: "Reginald Heber",
    lyrics: `Santo! Santo! Santo! Deus onipotente!
Cedo de manhã cantaremos Teu louvor!
Santo! Santo! Santo! Justo e compassivo!
Trino Deus bendito, que és puro amor!

Santo! Santo! Santo! Todos os remidos,
Juntamente com os anjos, vão Te adorar!
Ante Ti se prostram, de esplendor vestidos,
Que antes de existir o mundo reinavas sem par!`,
    chorus: null },

  { hymn_number: 10, title: "Castelo Forte", author: "Martinho Lutero",
    lyrics: `Castelo forte é o nosso Deus,
Espada e bom escudo;
Com seu poder defende os seus
Em todo transe agudo.
Com fúria pertinaz
Persegue Satanás,
Com sanha e com poder,
Pois quer nos destruir,
Mas há de sucumbir!`,
    chorus: null },

  { hymn_number: 11, title: "Cristo, Minha Certeza", author: "Edward Mote",
    lyrics: `A minha fé em Cristo está,
Na sua graça e seu amor!
Firme promessa Ele me dá,
É minha rocha e Salvador!

Cristo, minha certeza!
Cristo, minha esperança!
Quando tudo falhar,
Nele eu vou confiar!`,
    chorus: `Cristo, minha certeza!
Cristo, minha esperança!
Quando tudo falhar,
Nele eu vou confiar!` },

  { hymn_number: 12, title: "Quão Bondoso Amigo", author: "Joseph Scriven",
    lyrics: `Quão bondoso amigo é Cristo!
Leva Ele os nossos fardos!
É consolo sem igual
Podermos tudo a Ele contar!
Aflitos e perdidos,
A Jesus devemos ir.
Se a oração não O buscamos,
Que grande perda hemos de sentir!`,
    chorus: null },

  { hymn_number: 13, title: "Graça Excelsa", author: "John Newton",
    lyrics: `Maravilhosa graça!
Que doce é o som!
Que salvou um miserável como eu!
Eu estava perdido, mas fui achado,
Era cego, mas agora eu vejo!

Foi a graça que me ensinou a temer,
E a graça aliviou meus medos;
Quão preciosa essa graça me pareceu
Na hora em que eu primeiro cri!`,
    chorus: null },

  { hymn_number: 14, title: "Tudo Entregarei", author: "Judson W. Van DeVenter",
    lyrics: `Tudo entregarei a Jesus,
Tudo entregarei!
Eu quero amá-Lo e servi-Lo,
Tudo a Ele entregarei!

Tudo entregarei, tudo entregarei,
Tudo a Ti, meu bendito Salvador,
Tudo entregarei!`,
    chorus: `Tudo entregarei, tudo entregarei,
Tudo a Ti, meu bendito Salvador,
Tudo entregarei!` },

  { hymn_number: 15, title: "Grandioso És Tu", author: "Carl G. Boberg",
    lyrics: `Senhor, meu Deus, quando eu maravilhado
Fico a pensar nas obras de Tuas mãos,
No firmamento, Teu poder revelado,
E Tua glória enchendo terra e céus.

Então minh'alma canta a Ti, Senhor:
Grandioso és Tu! Grandioso és Tu!
Então minh'alma canta a Ti, Senhor:
Grandioso és Tu! Grandioso és Tu!`,
    chorus: `Então minh'alma canta a Ti, Senhor:
Grandioso és Tu! Grandioso és Tu!
Então minh'alma canta a Ti, Senhor:
Grandioso és Tu! Grandioso és Tu!` },
];

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
        JSON.stringify({ success: true, message: 'Versículos de exemplo importados!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import-sample-hymns') {
      // Import first 3 hymns
      const sampleHymns = harpaHymnsBatch1.slice(0, 3);

      // Check if hymns already exist
      const { data: existing } = await supabase
        .from('harpa_hymns')
        .select('hymn_number')
        .in('hymn_number', sampleHymns.map(h => h.hymn_number));

      const existingNumbers = (existing || []).map(h => h.hymn_number);
      const hymnsToInsert = sampleHymns.filter(h => !existingNumbers.includes(h.hymn_number));

      if (hymnsToInsert.length > 0) {
        await supabase.from('harpa_hymns').insert(hymnsToInsert);
      }

      return new Response(
        JSON.stringify({ success: true, message: `${hymnsToInsert.length} hinos importados!` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import-harpa-batch-1') {
      // Check which hymns already exist
      const { data: existing } = await supabase
        .from('harpa_hymns')
        .select('hymn_number')
        .lte('hymn_number', 15);

      const existingNumbers = (existing || []).map(h => h.hymn_number);
      const hymnsToInsert = harpaHymnsBatch1.filter(h => !existingNumbers.includes(h.hymn_number));

      if (hymnsToInsert.length > 0) {
        const { error } = await supabase.from('harpa_hymns').insert(hymnsToInsert);
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: `${hymnsToInsert.length} hinos (1-15) importados!` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação desconhecida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
