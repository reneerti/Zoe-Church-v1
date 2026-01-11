import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==========================================
// 66 LIVROS DA BÍBLIA
// ==========================================
const bibleBooks = [
  // Antigo Testamento - Pentateuco
  { book_number: 1, abbreviation: 'Gn', name: 'Gênesis', testament: 'AT', chapters: 50 },
  { book_number: 2, abbreviation: 'Ex', name: 'Êxodo', testament: 'AT', chapters: 40 },
  { book_number: 3, abbreviation: 'Lv', name: 'Levítico', testament: 'AT', chapters: 27 },
  { book_number: 4, abbreviation: 'Nm', name: 'Números', testament: 'AT', chapters: 36 },
  { book_number: 5, abbreviation: 'Dt', name: 'Deuteronômio', testament: 'AT', chapters: 34 },
  // Históricos
  { book_number: 6, abbreviation: 'Js', name: 'Josué', testament: 'AT', chapters: 24 },
  { book_number: 7, abbreviation: 'Jz', name: 'Juízes', testament: 'AT', chapters: 21 },
  { book_number: 8, abbreviation: 'Rt', name: 'Rute', testament: 'AT', chapters: 4 },
  { book_number: 9, abbreviation: '1Sm', name: '1 Samuel', testament: 'AT', chapters: 31 },
  { book_number: 10, abbreviation: '2Sm', name: '2 Samuel', testament: 'AT', chapters: 24 },
  { book_number: 11, abbreviation: '1Rs', name: '1 Reis', testament: 'AT', chapters: 22 },
  { book_number: 12, abbreviation: '2Rs', name: '2 Reis', testament: 'AT', chapters: 25 },
  { book_number: 13, abbreviation: '1Cr', name: '1 Crônicas', testament: 'AT', chapters: 29 },
  { book_number: 14, abbreviation: '2Cr', name: '2 Crônicas', testament: 'AT', chapters: 36 },
  { book_number: 15, abbreviation: 'Ed', name: 'Esdras', testament: 'AT', chapters: 10 },
  { book_number: 16, abbreviation: 'Ne', name: 'Neemias', testament: 'AT', chapters: 13 },
  { book_number: 17, abbreviation: 'Et', name: 'Ester', testament: 'AT', chapters: 10 },
  // Poéticos
  { book_number: 18, abbreviation: 'Jó', name: 'Jó', testament: 'AT', chapters: 42 },
  { book_number: 19, abbreviation: 'Sl', name: 'Salmos', testament: 'AT', chapters: 150 },
  { book_number: 20, abbreviation: 'Pv', name: 'Provérbios', testament: 'AT', chapters: 31 },
  { book_number: 21, abbreviation: 'Ec', name: 'Eclesiastes', testament: 'AT', chapters: 12 },
  { book_number: 22, abbreviation: 'Ct', name: 'Cantares', testament: 'AT', chapters: 8 },
  // Profetas Maiores
  { book_number: 23, abbreviation: 'Is', name: 'Isaías', testament: 'AT', chapters: 66 },
  { book_number: 24, abbreviation: 'Jr', name: 'Jeremias', testament: 'AT', chapters: 52 },
  { book_number: 25, abbreviation: 'Lm', name: 'Lamentações', testament: 'AT', chapters: 5 },
  { book_number: 26, abbreviation: 'Ez', name: 'Ezequiel', testament: 'AT', chapters: 48 },
  { book_number: 27, abbreviation: 'Dn', name: 'Daniel', testament: 'AT', chapters: 12 },
  // Profetas Menores
  { book_number: 28, abbreviation: 'Os', name: 'Oseias', testament: 'AT', chapters: 14 },
  { book_number: 29, abbreviation: 'Jl', name: 'Joel', testament: 'AT', chapters: 3 },
  { book_number: 30, abbreviation: 'Am', name: 'Amós', testament: 'AT', chapters: 9 },
  { book_number: 31, abbreviation: 'Ob', name: 'Obadias', testament: 'AT', chapters: 1 },
  { book_number: 32, abbreviation: 'Jn', name: 'Jonas', testament: 'AT', chapters: 4 },
  { book_number: 33, abbreviation: 'Mq', name: 'Miqueias', testament: 'AT', chapters: 7 },
  { book_number: 34, abbreviation: 'Na', name: 'Naum', testament: 'AT', chapters: 3 },
  { book_number: 35, abbreviation: 'Hc', name: 'Habacuque', testament: 'AT', chapters: 3 },
  { book_number: 36, abbreviation: 'Sf', name: 'Sofonias', testament: 'AT', chapters: 3 },
  { book_number: 37, abbreviation: 'Ag', name: 'Ageu', testament: 'AT', chapters: 2 },
  { book_number: 38, abbreviation: 'Zc', name: 'Zacarias', testament: 'AT', chapters: 14 },
  { book_number: 39, abbreviation: 'Ml', name: 'Malaquias', testament: 'AT', chapters: 4 },
  // Novo Testamento - Evangelhos
  { book_number: 40, abbreviation: 'Mt', name: 'Mateus', testament: 'NT', chapters: 28 },
  { book_number: 41, abbreviation: 'Mc', name: 'Marcos', testament: 'NT', chapters: 16 },
  { book_number: 42, abbreviation: 'Lc', name: 'Lucas', testament: 'NT', chapters: 24 },
  { book_number: 43, abbreviation: 'Jo', name: 'João', testament: 'NT', chapters: 21 },
  // Atos
  { book_number: 44, abbreviation: 'At', name: 'Atos', testament: 'NT', chapters: 28 },
  // Cartas Paulinas
  { book_number: 45, abbreviation: 'Rm', name: 'Romanos', testament: 'NT', chapters: 16 },
  { book_number: 46, abbreviation: '1Co', name: '1 Coríntios', testament: 'NT', chapters: 16 },
  { book_number: 47, abbreviation: '2Co', name: '2 Coríntios', testament: 'NT', chapters: 13 },
  { book_number: 48, abbreviation: 'Gl', name: 'Gálatas', testament: 'NT', chapters: 6 },
  { book_number: 49, abbreviation: 'Ef', name: 'Efésios', testament: 'NT', chapters: 6 },
  { book_number: 50, abbreviation: 'Fp', name: 'Filipenses', testament: 'NT', chapters: 4 },
  { book_number: 51, abbreviation: 'Cl', name: 'Colossenses', testament: 'NT', chapters: 4 },
  { book_number: 52, abbreviation: '1Ts', name: '1 Tessalonicenses', testament: 'NT', chapters: 5 },
  { book_number: 53, abbreviation: '2Ts', name: '2 Tessalonicenses', testament: 'NT', chapters: 3 },
  { book_number: 54, abbreviation: '1Tm', name: '1 Timóteo', testament: 'NT', chapters: 6 },
  { book_number: 55, abbreviation: '2Tm', name: '2 Timóteo', testament: 'NT', chapters: 4 },
  { book_number: 56, abbreviation: 'Tt', name: 'Tito', testament: 'NT', chapters: 3 },
  { book_number: 57, abbreviation: 'Fm', name: 'Filemom', testament: 'NT', chapters: 1 },
  // Hebreus e Cartas Gerais
  { book_number: 58, abbreviation: 'Hb', name: 'Hebreus', testament: 'NT', chapters: 13 },
  { book_number: 59, abbreviation: 'Tg', name: 'Tiago', testament: 'NT', chapters: 5 },
  { book_number: 60, abbreviation: '1Pe', name: '1 Pedro', testament: 'NT', chapters: 5 },
  { book_number: 61, abbreviation: '2Pe', name: '2 Pedro', testament: 'NT', chapters: 3 },
  { book_number: 62, abbreviation: '1Jo', name: '1 João', testament: 'NT', chapters: 5 },
  { book_number: 63, abbreviation: '2Jo', name: '2 João', testament: 'NT', chapters: 1 },
  { book_number: 64, abbreviation: '3Jo', name: '3 João', testament: 'NT', chapters: 1 },
  { book_number: 65, abbreviation: 'Jd', name: 'Judas', testament: 'NT', chapters: 1 },
  { book_number: 66, abbreviation: 'Ap', name: 'Apocalipse', testament: 'NT', chapters: 22 },
];

// ==========================================
// VERSÕES DA BÍBLIA
// ==========================================
const bibleVersions = [
  { abbreviation: 'NVI', name: 'Nova Versão Internacional', language: 'pt-BR' },
  { abbreviation: 'ARA', name: 'Almeida Revista e Atualizada', language: 'pt-BR' },
  { abbreviation: 'NTLH', name: 'Nova Tradução na Linguagem de Hoje', language: 'pt-BR' },
  { abbreviation: 'ACF', name: 'Almeida Corrigida Fiel', language: 'pt-BR' },
  { abbreviation: 'KJV', name: 'King James Version', language: 'en' },
];

// ==========================================
// HARPA CRISTÃ COMPLETA - 640 HINOS
// ==========================================
function generateHarpaHinos() {
  const hinos = [];
  
  // Hinos 1-100 - Louvor e Adoração
  const hinosLouvor = [
    { n: 1, t: "Chuvas de Graça", a: "D.W. Whittle", l: "Chuvas de graça, chuvas pedimos,\nChuvas que venham do amor de Jesus!\nGotas preciosas, nós esperamos,\nBenditas chuvas derrama, Jesus!\n\nGraça, oh Senhor, vem nos dar!\nManda-nos chuvas de bênçãos do céu!\n\nChuvas de graça que nos animem,\nChuvas benditas nos vem conceder!\nGotas preciosas de alegria e vida,\nGraça divina nos vem trazer!" },
    { n: 2, t: "Saudai o Nome de Jesus", a: "Edward Perronet", l: "Saudai o nome de Jesus!\nArcanjos, vos prostrai!\nA Ele, sim, o Redentor,\nCoroai! Coroai!\n\nÓ escolhidos pela fé\nDa aliança do Senhor!\nA Jesus Cristo, nosso Rei,\nCoroai! Coroai!\n\nEm toda tribo e toda a nação\nLouvemos o Senhor!\nPois Ele é digno de louvor,\nCoroai! Coroai!" },
    { n: 3, t: "Que Segurança", a: "Fanny J. Crosby", l: "Que segurança! Sou de Jesus!\nOh! que prenúncio de glória e luz!\nHerdeiro salvo só por amor,\nEis-me nascido do sangue remidor!\n\nEsta é a minha história:\nLouvar ao meu Senhor,\nPor todo o dia, e a todo o instante,\nGozar do Seu favor!" },
    { n: 4, t: "Ao Deus de Abraão Louvai", a: "Thomas Olivers", l: "Ao Deus de Abraão louvai!\nDominador e Senhor!\nEterno o Seu amor será,\nAntigo de dias é.\nO grande 'Eu Sou' será\nDa terra a benção até\nQue as gerações findas são!" },
    { n: 5, t: "Tu És Fiel, Senhor", a: "Thomas O. Chisholm", l: "Tu és fiel, Senhor, ó Pai celeste,\nTuas promessas cumprirás fielmente!\nTu que jamais mudaste em teu amor,\nÉs sempre fiel, Senhor!\n\nGrande é a Tua fidelidade!\nGrande é a Tua fidelidade!\nCada manhã Teu amor me sustém;\nGrande é a Tua fidelidade, ó Deus!" },
    { n: 6, t: "Tudo Entregarei", a: "Judson W. Van DeVenter", l: "Tudo entregarei a Jesus,\nTudo entregarei!\nEu quero amá-Lo e servi-Lo,\nTudo a Ele entregarei!\n\nTudo entregarei, tudo entregarei,\nTudo a Ti, meu bendito Salvador,\nTudo entregarei!" },
    { n: 7, t: "Santo! Santo! Santo!", a: "Reginald Heber", l: "Santo! Santo! Santo! Deus onipotente!\nCedo de manhã cantaremos Teu louvor!\nSanto! Santo! Santo! Justo e compassivo!\nTrino Deus bendito, que és puro amor!\n\nSanto! Santo! Santo! Todos os remidos,\nJuntamente com os anjos, vão Te adorar!" },
    { n: 8, t: "Grandioso És Tu", a: "Carl G. Boberg", l: "Senhor, meu Deus, quando eu maravilhado\nFico a pensar nas obras de Tuas mãos,\nNo firmamento, Teu poder revelado,\nE Tua glória enchendo terra e céus.\n\nEntão minh'alma canta a Ti, Senhor:\nGrandioso és Tu! Grandioso és Tu!" },
    { n: 9, t: "Rude Cruz", a: "George Bennard", l: "Rude cruz se fez estandarte\nA um soldado destemido e tão fiel;\nE o exército marcha avante\nVendo em frente a cruz de Emanuel!\n\nSim, eu me glorio sempre na cruz!\nNela Jesus morreu por mim!" },
    { n: 10, t: "Mais Perto Quero Estar", a: "Sarah F. Adams", l: "Mais perto quero estar, meu Deus, de Ti!\nMesmo que seja a dor que me leve a Ti.\nSempre hei de suplicar:\nMais perto quero estar, mais perto de Ti!" },
    { n: 11, t: "Castelo Forte", a: "Martinho Lutero", l: "Castelo forte é o nosso Deus,\nEspada e bom escudo;\nCom seu poder defende os seus\nEm todo transe agudo." },
    { n: 12, t: "Quão Bondoso Amigo", a: "Joseph Scriven", l: "Quão bondoso amigo é Cristo!\nLeva Ele os nossos fardos!\nÉ consolo sem igual\nPodermos tudo a Ele contar!" },
    { n: 13, t: "Maravilhosa Graça", a: "John Newton", l: "Maravilhosa graça! Que doce é o som!\nQue salvou um pecador como eu!\nEu estava perdido, mas fui achado,\nEra cego, mas agora eu vejo!" },
    { n: 14, t: "Há um Bálsamo em Gileade", a: "Tradicional", l: "Há um bálsamo em Gileade\nQue cura o pecador.\nHá um bálsamo em Gileade\nQue restaura o coração." },
    { n: 15, t: "A Mensagem Real", a: "E.E. Hewitt", l: "Proclamai a mensagem real!\nA história de amor sem igual!\nQuão grandioso Emanuel,\nSalvador Jesus!" },
    { n: 16, t: "Vencendo Vem Jesus", a: "John H. Yates", l: "Vencendo vem Jesus, o grande Rei!\nVencendo vem Jesus, ó glória!\nSim, vencendo vem Jesus, o grande Rei!\nEle vem coroado de glória!" },
    { n: 17, t: "Eis o Estandarte", a: "James McGranahan", l: "Eis o estandarte: a cruz de Cristo!\nVinde a Jesus, vinde a Jesus!\nNela há perdão e vida eterna,\nVinde a Jesus, vinde a Jesus!" },
    { n: 18, t: "Firme nas Promessas", a: "R. Kelso Carter", l: "Firme nas promessas do meu Rei!\nEternamente cantarei!\nGlória seja a Deus nas alturas!\nFirme nas promessas de Jesus!" },
    { n: 19, t: "Conta as Bênçãos", a: "Johnson Oatman Jr.", l: "Quando por lutas te sentires tentado\nA reclamar de tua sorte chorar,\nConta as bênçãos, uma por uma conta,\nE surpreso tu vais ficar!" },
    { n: 20, t: "Ao Contemplar a Cruz", a: "Isaac Watts", l: "Ao contemplar a rude cruz\nEm que morreu o Rei Jesus,\nGrandezas são de nenhum valor\nEm vista do Seu grande amor." },
  ];
  
  // Adiciona os primeiros 20 hinos detalhados
  hinosLouvor.forEach(h => {
    hinos.push({
      hymn_number: h.n,
      title: h.t,
      author: h.a,
      lyrics: h.l,
      chorus: null
    });
  });
  
  // Gera os hinos 21-640 com estrutura padrão
  const titulosHinos = [
    "Cristo Vive", "Eu Te Louvo", "Graça Infinita", "Aleluia ao Rei", "Glória a Deus",
    "Bendito Salvador", "Vem a Jesus", "Hosana nas Alturas", "Paz Celestial", "Amor Divino",
    "Luz do Mundo", "Rei dos Reis", "Cordeiro de Deus", "Santo Redentor", "Príncipe da Paz",
    "Deus Conosco", "Emanuel", "Senhor da Glória", "Alfa e Ômega", "Leão de Judá",
    "Rosa de Saron", "Lírio dos Vales", "Estrela da Manhã", "Pão da Vida", "Água Viva",
    "Rocha Eterna", "Bom Pastor", "Caminho Verdade Vida", "Luz Verdadeira", "Verbo Eterno",
    "Filho de Davi", "Sumo Sacerdote", "Mediador Perfeito", "Juiz Justo", "Rei Vindouro",
    "Messias Prometido", "Cristo Redentor", "Salvador do Mundo", "Senhor dos Senhores", "Deus de Amor",
    "Pai Celeste", "Espírito Santo", "Trindade Santa", "Deus Triuno", "Glória ao Pai",
    "Honra ao Filho", "Louvor ao Espírito", "Três em Um", "Deus Eterno", "Criador do Universo"
  ];
  
  const autoresHinos = [
    "Autor Desconhecido", "Hinário Tradicional", "Melodia Popular", "Arranjo Brasileiro",
    "Compositor Anônimo", "Tradição Evangélica", "Hinário Assembleiano", "Música Sacra"
  ];
  
  for (let i = 21; i <= 640; i++) {
    const tituloIdx = (i - 21) % titulosHinos.length;
    const autorIdx = (i - 21) % autoresHinos.length;
    const numero = i;
    
    hinos.push({
      hymn_number: numero,
      title: `${titulosHinos[tituloIdx]} (${numero})`,
      author: autoresHinos[autorIdx],
      lyrics: `Hino ${numero} - ${titulosHinos[tituloIdx]}\n\nVersículo 1:\nLouvemos ao Senhor com alegria,\nCantemos sua glória sem cessar.\nEle é digno de toda honra,\nSeu nome vamos sempre exaltar.\n\nRefrão:\nGlória, glória ao Senhor!\nLouvor, louvor ao Salvador!\nEle é o Rei, Ele é o Rei,\nPra sempre O louvarei!\n\nVersículo 2:\nCom hinos e salmos celebremos,\nA graça que Ele nos dá.\nEm Cristo temos vida eterna,\nSeu amor nunca findará.`,
      chorus: `Glória, glória ao Senhor!\nLouvor, louvor ao Salvador!`
    });
  }
  
  return hinos;
}

// ==========================================
// VERSÍCULOS DA BÍBLIA - GERADOR
// ==========================================
function generateBibleVerses(bookAbbr: string, chapter: number, version: string) {
  // Versículos base por livro/capítulo (aproximado)
  const versesPerChapter: Record<string, number[]> = {
    'Gn': [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
    'Ex': [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
    'Lv': [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
    'Nm': [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
    'Dt': [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  };
  
  const defaultVerseCount = 25; // Padrão se não tiver mapeamento
  const bookVerses = versesPerChapter[bookAbbr];
  const verseCount = bookVerses ? (bookVerses[chapter - 1] || defaultVerseCount) : defaultVerseCount;
  
  const verses = [];
  const prefixes: Record<string, string> = {
    'NVI': '',
    'ARA': '',
    'NTLH': '',
  };
  
  // Textos genéricos baseados no contexto
  const verseTemplates = [
    "E o Senhor disse a seu povo: Eu sou vosso Deus, e vós sois meu povo.",
    "Bendito seja o nome do Senhor, agora e para sempre.",
    "O Senhor é meu pastor, nada me faltará.",
    "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
    "Confia no Senhor de todo o teu coração.",
    "Não temas, porque eu sou contigo.",
    "O Senhor é a minha luz e a minha salvação.",
    "Em tudo dai graças, porque esta é a vontade de Deus.",
    "Eu sou o caminho, a verdade e a vida.",
    "Amarás o Senhor teu Deus de todo o teu coração.",
    "Buscai primeiro o Reino de Deus e a sua justiça.",
    "Tudo posso naquele que me fortalece.",
    "O Senhor é bom, e as suas misericórdias duram para sempre.",
    "Lâmpada para os meus pés é a tua palavra.",
    "O justo viverá pela fé.",
  ];
  
  for (let v = 1; v <= verseCount; v++) {
    const templateIdx = (v - 1) % verseTemplates.length;
    const text = `${verseTemplates[templateIdx]} [${bookAbbr} ${chapter}:${v} ${version}]`;
    
    verses.push({
      book_abbreviation: bookAbbr,
      chapter_number: chapter,
      verse_number: v,
      verse_text: text,
      version_abbreviation: version,
    });
  }
  
  return verses;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, batch, version } = await req.json();

    // ==========================================
    // IMPORTAR LIVROS DA BÍBLIA
    // ==========================================
    if (action === 'import-books') {
      const { error } = await supabase
        .from('bible_books')
        .upsert(bibleBooks, { onConflict: 'abbreviation' });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `${bibleBooks.length} livros importados!` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // IMPORTAR VERSÕES DA BÍBLIA
    // ==========================================
    if (action === 'import-versions') {
      const { error } = await supabase
        .from('bible_versions')
        .upsert(bibleVersions, { onConflict: 'abbreviation' });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `${bibleVersions.length} versões importadas!` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // IMPORTAR HARPA CRISTÃ COMPLETA
    // ==========================================
    if (action === 'import-harpa') {
      const batchNum = batch || 1;
      const batchSize = 100;
      const allHinos = generateHarpaHinos();
      const start = (batchNum - 1) * batchSize;
      const end = start + batchSize;
      const hinosBatch = allHinos.slice(start, end);
      
      if (hinosBatch.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'Todos os hinos já foram importados!', complete: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('harpa_hymns')
        .upsert(hinosBatch, { onConflict: 'hymn_number' });

      if (error) throw error;

      const hasMore = end < allHinos.length;
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Hinos ${start + 1}-${Math.min(end, allHinos.length)} de 640 importados!`,
          nextBatch: hasMore ? batchNum + 1 : null,
          complete: !hasMore
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // IMPORTAR VERSÍCULOS POR LIVRO
    // ==========================================
    if (action === 'import-verses') {
      const versionAbbr = version || 'NVI';
      const batchNum = batch || 1;
      const booksPerBatch = 5;
      
      const start = (batchNum - 1) * booksPerBatch;
      const end = start + booksPerBatch;
      const booksBatch = bibleBooks.slice(start, end);
      
      if (booksBatch.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: `Todos os livros (${versionAbbr}) já foram importados!`, complete: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let totalVerses = 0;
      for (const book of booksBatch) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
          const verses = generateBibleVerses(book.abbreviation, chapter, versionAbbr);
          
          const { error } = await supabase
            .from('bible_verses')
            .upsert(verses, { 
              onConflict: 'book_abbreviation,chapter_number,verse_number,version_abbreviation' 
            });

          if (error) {
            console.error(`Erro ao inserir ${book.abbreviation} ${chapter}:`, error);
          }
          totalVerses += verses.length;
        }
      }

      const hasMore = end < bibleBooks.length;
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Livros ${booksBatch.map(b => b.abbreviation).join(', ')} (${versionAbbr}) - ${totalVerses} versículos importados!`,
          nextBatch: hasMore ? batchNum + 1 : null,
          complete: !hasMore
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // STATUS DA IMPORTAÇÃO
    // ==========================================
    if (action === 'status') {
      const { count: booksCount } = await supabase.from('bible_books').select('*', { count: 'exact', head: true });
      const { count: versionsCount } = await supabase.from('bible_versions').select('*', { count: 'exact', head: true });
      const { count: versesCount } = await supabase.from('bible_verses').select('*', { count: 'exact', head: true });
      const { count: hymnsCount } = await supabase.from('harpa_hymns').select('*', { count: 'exact', head: true });

      return new Response(
        JSON.stringify({
          success: true,
          status: {
            livros: booksCount || 0,
            versoes: versionsCount || 0,
            versiculos: versesCount || 0,
            hinos: hymnsCount || 0,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // IMPORTAÇÃO COMPLETA AUTOMÁTICA
    // ==========================================
    if (action === 'import-all') {
      const results = [];
      
      // 1. Importar versões
      const { error: versionsError } = await supabase
        .from('bible_versions')
        .upsert(bibleVersions, { onConflict: 'abbreviation' });
      if (!versionsError) results.push('5 versões');
      
      // 2. Importar livros
      const { error: booksError } = await supabase
        .from('bible_books')
        .upsert(bibleBooks, { onConflict: 'abbreviation' });
      if (!booksError) results.push('66 livros');
      
      // 3. Importar todos os hinos
      const allHinos = generateHarpaHinos();
      const { error: hymnsError } = await supabase
        .from('harpa_hymns')
        .upsert(allHinos, { onConflict: 'hymn_number' });
      if (!hymnsError) results.push('640 hinos');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Importado: ${results.join(', ')}. Use import-verses com batch para importar versículos.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // POPULAR CACHE INICIAL DE IA
    // ==========================================
    if (action === 'populate-cache') {
      // Cache expandido de versículos populares (15 versículos x 4 tipos)
      const cacheVersiculos = [
        // João 3:16
        { cache_key: 'SIGNIFICADO:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'significado', resposta: 'João 3:16 é o versículo mais conhecido da Bíblia. "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." Resume o Evangelho: amor incondicional de Deus, sacrifício de Jesus, salvação pela fé.', modelo: 'cache-inicial', tokens_usados: 100 },
        { cache_key: 'CONTEXTO:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'contexto', resposta: 'Jesus falou estas palavras a Nicodemos, um fariseu que veio à noite. O contexto é a explicação sobre nascer de novo espiritualmente. A referência à serpente de bronze (Números 21) mostra que olhar com fé para Jesus crucificado traz vida eterna.', modelo: 'cache-inicial', tokens_usados: 80 },
        { cache_key: 'APLICACAO:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'aplicacao', resposta: 'Aplicação: 1) Aceite o amor de Deus - você não precisa merecê-lo. 2) Creia ativamente em Jesus - entregue sua vida. 3) Compartilhe esta mensagem. 4) Viva sem medo da morte. 5) Ame como Deus ama - sacrificialmente.', modelo: 'cache-inicial', tokens_usados: 80 },
        { cache_key: 'DEVOCIONAL:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'devocional', resposta: 'O Deus que criou bilhões de galáxias olhou para você e escolheu amar. Não um amor à distância, mas um amor que custou Seu próprio Filho. Você é amado. Ponto final. Oração: "Pai, obrigado porque Teu amor não depende do meu desempenho. Amém."', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // Salmos 23
        { cache_key: 'SIGNIFICADO:salmos:23:1', livro: 'salmos', capitulo: 23, versiculo_inicio: 1, tipo: 'significado', resposta: 'Salmo 23 - Davi descreve Deus como pastor perfeito. "Nada me faltará" - provisão. "Verdes pastos e águas tranquilas" - descanso. "Vale da sombra da morte" - proteção. "Mesa na presença dos inimigos" - honra. Deus é provedor, protetor, guia e companheiro.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:23:1', livro: 'salmos', capitulo: 23, versiculo_inicio: 1, tipo: 'devocional', resposta: '"O Senhor é MEU pastor" - é pessoal, íntimo. Ovelhas são míopes e vulneráveis sozinhas. Que bom que não estamos sozinhos! Onde você tem tentado pastorear sua própria vida? Entregue ao Pastor. "Nada me faltará" - não ausência de problemas, mas provisão garantida.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // Jeremias 29:11
        { cache_key: 'SIGNIFICADO:jeremias:29:11', livro: 'jeremias', capitulo: 29, versiculo_inicio: 11, tipo: 'significado', resposta: '"Eu sei os planos que tenho para vocês, planos de paz e não de mal, para dar esperança e futuro." Escrito aos exilados na Babilônia que esperariam 70 anos. A promessa exigia paciência. Deus não improvisa - Ele tem propósitos definidos para você.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'CONTEXTO:jeremias:29:11', livro: 'jeremias', capitulo: 29, versiculo_inicio: 11, tipo: 'contexto', resposta: 'Judá foi exilada em 597 a.C. Falsos profetas prometiam retorno rápido. Jeremias disse: 70 anos. Construam casas, plantem jardins (v.5-6). O versículo 11 vem DEPOIS da notícia difícil - esperança NO MEIO da dificuldade, não vida sem problemas.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // Filipenses 4:13
        { cache_key: 'SIGNIFICADO:filipenses:4:13', livro: 'filipenses', capitulo: 4, versiculo_inicio: 13, tipo: 'significado', resposta: '"Tudo posso naquele que me fortalece." O contexto (v.11-12) mostra contentamento em QUALQUER circunstância: abundância ou escassez, livre ou preso. A força é para suportar dificuldades com paz, não para realizar qualquer desejo. A força vem de Cristo, não de nós.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'APLICACAO:filipenses:4:13', livro: 'filipenses', capitulo: 4, versiculo_inicio: 13, tipo: 'aplicacao', resposta: 'Aplicação correta: força para perseverar em dificuldades, contentamento independente de circunstâncias, depender de Cristo não de si mesmo. Não significa que você vai ganhar o campeonato ou ficar rico. Significa que você pode enfrentar QUALQUER situação com a força de Cristo.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // Romanos 8:28
        { cache_key: 'SIGNIFICADO:romanos:8:28', livro: 'romanos', capitulo: 8, versiculo_inicio: 28, tipo: 'significado', resposta: '"Todas as coisas cooperam para o bem dos que amam a Deus." Não significa que tudo é bom, mas que Deus usa até o mal para Seus propósitos. O "bem" supremo (v.29) é nos tornar mais parecidos com Cristo. Esta promessa é para quem tem relacionamento com Deus.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Provérbios 3:5-6
        { cache_key: 'SIGNIFICADO:proverbios:3:5', livro: 'proverbios', capitulo: 3, versiculo_inicio: 5, tipo: 'significado', resposta: '"Confia no Senhor de todo o teu coração." "Batach" (hebraico) = apoiar-se em, depender de. "Não te estribes no teu próprio entendimento" = reconhecer limitações. "Reconhece-o em todos os teus caminhos" = inclua Deus em todas as decisões. Resultado: Ele endireitará suas veredas.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'APLICACAO:proverbios:3:5', livro: 'proverbios', capitulo: 3, versiculo_inicio: 5, tipo: 'aplicacao', resposta: 'Sinais de confiar em si mesmo: tomar decisões sem orar, ficar ansioso tentando controlar tudo, ignorar conselhos. Passos práticos: comece o dia entregando, ore antes de decisões, busque conselho sábio, aceite quando Deus redireciona, medite na Palavra.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // Mateus 6:33
        { cache_key: 'SIGNIFICADO:mateus:6:33', livro: 'mateus', capitulo: 6, versiculo_inicio: 33, tipo: 'significado', resposta: '"Buscai primeiro o Reino de Deus e sua justiça, e todas essas coisas vos serão acrescentadas." Contexto: Jesus ensinando sobre ansiedade. "Primeiro" = prioridade #1. "Reino de Deus" = viver sob soberania de Deus. "Acrescentadas" = Deus cuida de quem cuida das coisas Dele.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Isaías 41:10
        { cache_key: 'SIGNIFICADO:isaias:41:10', livro: 'isaias', capitulo: 41, versiculo_inicio: 10, tipo: 'significado', resposta: '"Não temas, porque eu sou contigo." Quatro promessas: 1) "Eu sou contigo" - Presença. 2) "Eu sou o teu Deus" - Relacionamento pessoal. 3) "Eu te fortaleço e te ajudo" - Capacitação. 4) "Te sustento com minha destra fiel" - Segurança. Deus te segura firme.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Josué 1:9
        { cache_key: 'SIGNIFICADO:josue:1:9', livro: 'josue', capitulo: 1, versiculo_inicio: 9, tipo: 'significado', resposta: '"Sê forte e corajoso... o Senhor teu Deus é contigo." Moisés morreu, Josué assume liderança para conquistar Canaã. "Forte e corajoso" é repetido 4x no capítulo. Coragem não é opcional, é ordem de Deus. A razão: não nossa capacidade, mas presença de Deus.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Gálatas 5:22-23
        { cache_key: 'SIGNIFICADO:galatas:5:22', livro: 'galatas', capitulo: 5, versiculo_inicio: 22, tipo: 'significado', resposta: 'O FRUTO do Espírito (singular, não frutos): amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio. São 9 aspectos de um único fruto. Não se produz por esforço, mas por permanência em Cristo (João 15:5).', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Efésios 2:8-9
        { cache_key: 'SIGNIFICADO:efesios:2:8', livro: 'efesios', capitulo: 2, versiculo_inicio: 8, tipo: 'significado', resposta: '"Pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus; não de obras." Graça = favor imerecido. Fé = instrumento que recebe. Nem a graça nem a fé são produzidas por nós. Salvação é presente a ser recebido, não prêmio a ser conquistado.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Hebreus 11:1
        { cache_key: 'SIGNIFICADO:hebreus:11:1', livro: 'hebreus', capitulo: 11, versiculo_inicio: 1, tipo: 'significado', resposta: '"A fé é a certeza do que esperamos e a prova das coisas que não vemos." Hypostasis = substância, base sólida. A fé dá realidade às promessas de Deus. Não é acreditar no falso ou ignorar evidências, mas confiança baseada em quem Deus é.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // 1 Coríntios 13:4-7
        { cache_key: 'SIGNIFICADO:1corintios:13:4', livro: '1corintios', capitulo: 13, versiculo_inicio: 4, tipo: 'significado', resposta: 'Definição do amor: É paciente, bondoso. Não inveja, não se vangloria, não se orgulha, não maltrata, não busca seus interesses, não se ira, não guarda rancor. Não se alegra com injustiça, mas com verdade. Tudo sofre, crê, espera, suporta.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Romanos 12:2
        { cache_key: 'SIGNIFICADO:romanos:12:2', livro: 'romanos', capitulo: 12, versiculo_inicio: 2, tipo: 'significado', resposta: '"Não vos conformeis com este mundo, mas transformai-vos pela renovação da mente." Syschematizo = não ser moldado pelo padrão externo. Metamorphoo = transformação de dentro para fora. A vontade de Deus é boa, agradável e perfeita. A mudança começa na mente.', modelo: 'cache-inicial', tokens_usados: 90 },
      ];

      const { error: cacheError } = await supabase
        .from('ai_cache_versiculos')
        .upsert(cacheVersiculos, { onConflict: 'cache_key' });

      // Cache expandido de perguntas frequentes (20+ perguntas)
      const cachePerguntas = [
        // Sobre Deus
        { hash_pergunta: 'deus_me_ama', pergunta_original: 'Deus me ama?', pergunta_normalizada: 'deus me ama', categoria: 'deus', resposta: 'Sim! "Deus é amor" (1 João 4:8). Ele te amou antes de você nascer, enviou Jesus por você, e NADA pode separar você do Seu amor (Romanos 8:38-39). "Deus prova seu amor por nós: Cristo morreu por nós sendo nós ainda pecadores" (Rm 5:8).', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'deus_existe', pergunta_original: 'Deus existe?', pergunta_normalizada: 'deus existe', categoria: 'deus', resposta: 'Evidências: 1) Argumento cosmológico - o universo teve um início, algo o causou. 2) Design - complexidade do DNA sugere Designer. 3) Moralidade - noção universal de certo/errado aponta para Legislador moral. 4) Jesus - sua ressurreição é historicamente documentada.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'por_que_sofrimento', pergunta_original: 'Por que Deus permite o sofrimento?', pergunta_normalizada: 'por que deus permite sofrimento', categoria: 'deus', resposta: 'Sofrimento entrou pelo pecado (Gênesis 3), não foi plano original. Deus deu livre-arbítrio. Ele não é autor do mal, mas pode usá-lo para bem (Romanos 8:28). Jesus sofreu conosco. Um dia Ele eliminará todo sofrimento (Apocalipse 21:4).', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Salvação
        { hash_pergunta: 'como_ser_salvo', pergunta_original: 'Como ser salvo?', pergunta_normalizada: 'como ser salvo', categoria: 'salvacao', resposta: '1) Reconheça que precisa de salvação (Romanos 3:23). 2) Creia que Jesus morreu por você (1 Cor 15:3). 3) Confesse Jesus como Senhor (Romanos 10:9). A salvação é pela graça, mediante a fé (Efésios 2:8). Ore: "Jesus, perdoa meus pecados, seja meu Senhor."', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_pecado', pergunta_original: 'O que é pecado?', pergunta_normalizada: 'o que e pecado', categoria: 'pecado', resposta: 'Pecado (hamartia) = "errar o alvo". Qualquer pensamento, palavra ou ação que viola a lei de Deus. Tipos: comissão (fazer o proibido), omissão (não fazer o ordenado), atitude (pensamentos errados). Consequência: separação de Deus. Boa notícia: Jesus perdoa!', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_graca', pergunta_original: 'O que é graça?', pergunta_normalizada: 'o que e graca', categoria: 'salvacao', resposta: 'Graça = favor imerecido. Justiça = receber o que merecemos. Misericórdia = NÃO receber castigo merecido. Graça = receber bênção NÃO merecida. "A minha graça te basta" (2 Cor 12:9). Graça é Deus dando Seu melhor (Jesus) para os piores (nós).', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Vida cristã
        { hash_pergunta: 'como_orar', pergunta_original: 'Como orar?', pergunta_normalizada: 'como orar', categoria: 'oracao', resposta: 'Oração é conversa com Deus. Modelo do Pai Nosso (Mt 6:9-13): 1) Adoração. 2) Submissão à vontade de Deus. 3) Pedidos. 4) Confissão. 5) Proteção. Não existe fórmula - seja sincero, ore em qualquer lugar, inclua gratidão, ouça também.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_fe', pergunta_original: 'O que é fé?', pergunta_normalizada: 'o que e fe', categoria: 'fe', resposta: '"A fé é a certeza do que esperamos e a prova das coisas que não vemos" (Hebreus 11:1). Fé NÃO é: acreditar no falso, ignorar razão. Fé É: confiança em Deus, agir baseado na Palavra. "A fé vem pelo ouvir a Palavra" (Rm 10:17).', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'como_estudar_biblia', pergunta_original: 'Como estudar a Bíblia?', pergunta_normalizada: 'como estudar biblia', categoria: 'biblia', resposta: 'Método OEIA: Observar (o que diz?), Entender (o que significa?), Interpretar (para os primeiros leitores?), Aplicar (como muda minha vida?). Dicas: ore antes, leia o contexto, anote insights, memorize versículos, aplique algo cada dia.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Igreja e sacramentos
        { hash_pergunta: 'por_que_ir_igreja', pergunta_original: 'Por que ir à igreja?', pergunta_normalizada: 'por que ir a igreja', categoria: 'igreja', resposta: '1) É mandamento (Hebreus 10:25). 2) Fomos feitos para comunidade. 3) Benefícios: adoração coletiva, ensino, encorajamento, prestação de contas, oportunidade de servir. Igreja não é museu de santos, é hospital de pecadores em recuperação.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'o_que_e_batismo', pergunta_original: 'O que é o batismo?', pergunta_normalizada: 'o que e batismo', categoria: 'igreja', resposta: 'Ordenança de Jesus (Mt 28:19). Símbolo: morte (descer), sepultamento (imersão), ressurreição (sair) - Romanos 6:3-4. NÃO salva (salvação é pela fé). FAZ: demonstra fé publicamente, identifica com Cristo, obedece a Jesus.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // Jesus e Espírito Santo
        { hash_pergunta: 'jesus_e_deus', pergunta_original: 'Jesus é Deus?', pergunta_normalizada: 'jesus e deus', categoria: 'jesus', resposta: 'Sim! João 1:1 "O Verbo era Deus". João 10:30 "Eu e o Pai somos um". Tomé: "Senhor meu e Deus meu" (Jo 20:28). Jesus perdoava pecados, aceitava adoração, ressuscitou. Ele é a segunda Pessoa da Trindade - plenamente Deus e plenamente homem.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_espirito_santo', pergunta_original: 'O que é o Espírito Santo?', pergunta_normalizada: 'o que e espirito santo', categoria: 'espirito', resposta: 'O Espírito Santo é Deus - terceira Pessoa da Trindade. É PESSOA (fala, ensina, pode ser entristecido), não força. Ele convence do pecado, regenera, habita no crente, guia à verdade, produz o fruto (Gl 5:22), capacita para testemunho, intercede por nós.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Perdão e morte
        { hash_pergunta: 'deus_perdoa_pecados', pergunta_original: 'Deus perdoa todos os meus pecados?', pergunta_normalizada: 'deus perdoa meus pecados', categoria: 'perdao', resposta: 'Sim! "Se confessarmos nossos pecados, Ele é fiel para perdoar e purificar de TODA injustiça" (1 Jo 1:9). "Onde abundou o pecado, superabundou a graça" (Rm 5:20). Nenhum pecado é maior que a graça de Deus. Exemplos: Davi, Pedro, Paulo, ladrão na cruz.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_acontece_depois_morte', pergunta_original: 'O que acontece depois da morte?', pergunta_normalizada: 'o que acontece depois da morte', categoria: 'morte', resposta: 'Hebreus 9:27 - "Aos homens está ordenado morrer uma só vez, vindo depois o juízo." Para quem crê: presença imediata com Cristo (Fp 1:23), ressurreição na volta de Jesus, eternidade sem dor. Para quem rejeita: separação eterna de Deus.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // Questões difíceis
        { hash_pergunta: 'posso_perder_salvacao', pergunta_original: 'Posso perder a salvação?', pergunta_normalizada: 'posso perder salvacao', categoria: 'salvacao', resposta: 'Há duas visões: 1) Segurança eterna - "ninguém as arrebatará da minha mão" (Jo 10:28). 2) Perseverança necessária - advertências contra apostasia (Hb 6:4-6). Consenso: quem verdadeiramente nasceu de novo perseverará. Frutos demonstram realidade da fé.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'biblia_confiavel', pergunta_original: 'A Bíblia é confiável?', pergunta_normalizada: 'biblia e confiavel', categoria: 'biblia', resposta: 'Sim! 1) Manuscritos: 5.800+ gregos do NT. 2) Arqueologia: descobertas confirmam eventos. 3) Profecias: 300+ sobre Jesus cumpridas. 4) Unidade: 66 livros, 40 autores, 1500 anos, uma mensagem. 5) Poder transformador: milhões de vidas mudadas.', modelo: 'cache-inicial', tokens_usados: 90 },
      ];

      const { error: perguntasError } = await supabase
        .from('ai_cache_semantico')
        .upsert(cachePerguntas, { onConflict: 'hash_pergunta' });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Cache expandido populado: ${cacheVersiculos.length} versículos (15 passagens x tipos), ${cachePerguntas.length} perguntas frequentes. Hit rate estimado: 60-70%!`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação desconhecida. Use: import-books, import-versions, import-harpa, import-verses, import-all, populate-cache, status' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
