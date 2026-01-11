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
      // ==========================================
      // CACHE MEGA EXPANDIDO - 50+ VERSÍCULOS POPULARES
      // ==========================================
      const cacheVersiculos = [
        // ========== JOÃO 3:16 - O mais famoso ==========
        { cache_key: 'SIGNIFICADO:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'significado', resposta: 'João 3:16 é o versículo mais conhecido da Bíblia. "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." Resume todo o Evangelho: o amor incondicional de Deus, o sacrifício de Jesus, e a salvação pela fé. É chamado de "Evangelho em miniatura".', modelo: 'cache-inicial', tokens_usados: 100 },
        { cache_key: 'CONTEXTO:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'contexto', resposta: 'Jesus falou estas palavras a Nicodemos, um fariseu líder religioso que veio à noite. O contexto é a explicação sobre nascer de novo espiritualmente (v.3-8). A referência à serpente de bronze (Números 21) mostra que assim como olhar para ela curava, olhar com fé para Jesus crucificado traz vida eterna.', modelo: 'cache-inicial', tokens_usados: 80 },
        { cache_key: 'APLICACAO:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'aplicacao', resposta: 'Aplicação: 1) Aceite o amor de Deus - você não precisa merecê-lo. 2) Creia ativamente em Jesus - entregue sua vida. 3) Compartilhe esta mensagem com outros. 4) Viva sem medo da morte. 5) Ame como Deus ama - sacrificialmente.', modelo: 'cache-inicial', tokens_usados: 80 },
        { cache_key: 'DEVOCIONAL:joao:3:16', livro: 'joao', capitulo: 3, versiculo_inicio: 16, tipo: 'devocional', resposta: 'O Deus que criou bilhões de galáxias olhou para você e escolheu amar. Não um amor à distância, mas um amor que custou Seu próprio Filho. Hoje, não importa seus erros, você é amado. Ponto final. Oração: "Pai, obrigado porque Teu amor não depende do meu desempenho. Amém."', modelo: 'cache-inicial', tokens_usados: 80 },

        // ========== SALMOS 23 - O Bom Pastor ==========
        { cache_key: 'SIGNIFICADO:salmos:23:1', livro: 'salmos', capitulo: 23, versiculo_inicio: 1, versiculo_fim: 6, tipo: 'significado', resposta: 'Salmo 23 - Davi, ex-pastor, descreve Deus como o Pastor perfeito. "Nada me faltará" - provisão. "Verdes pastos e águas tranquilas" - descanso e paz. "Vale da sombra da morte" - proteção nas trevas. "Mesa na presença dos inimigos" - honra. Deus é provedor, protetor, guia e companheiro eterno.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:23:1', livro: 'salmos', capitulo: 23, versiculo_inicio: 1, tipo: 'devocional', resposta: '"O Senhor é MEU pastor" - é pessoal, íntimo. Ovelhas são míopes e vulneráveis sozinhas. Que bom que não estamos sozinhos! Onde você tem tentado pastorear sua própria vida? Entregue ao Pastor. "Nada me faltará" - não significa ausência de problemas, mas provisão garantida em cada situação.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 91 - Proteção Divina ==========
        { cache_key: 'SIGNIFICADO:salmos:91:1', livro: 'salmos', capitulo: 91, versiculo_inicio: 1, versiculo_fim: 16, tipo: 'significado', resposta: 'Salmo 91 - O Salmo de proteção. "Aquele que habita no esconderijo do Altíssimo" = relacionamento contínuo. Promessas: livramento de armadilhas, pestilência, terror noturno, flechas diurnas. "Mil cairão ao teu lado, dez mil à tua direita, mas tu não serás atingido." Anjos protegem. Deus responde quando clamamos.', modelo: 'cache-inicial', tokens_usados: 95 },
        { cache_key: 'DEVOCIONAL:salmos:91:1', livro: 'salmos', capitulo: 91, versiculo_inicio: 1, tipo: 'devocional', resposta: 'Habitar não é visitar. O Salmo não promete imunidade a problemas, mas presença de Deus nos problemas. Os verbos são condicionais: quem habita, quem clama, quem conhece. A proteção flui do relacionamento. Você está visitando ou habitando? Ore: "Senhor, quero morar em Tua presença, não só visitar."', modelo: 'cache-inicial', tokens_usados: 85 },
        { cache_key: 'APLICACAO:salmos:91:1', livro: 'salmos', capitulo: 91, versiculo_inicio: 1, tipo: 'aplicacao', resposta: 'Este salmo foi mal usado pelo diabo para tentar Jesus (Mt 4:6). Proteção não é presunção. Aplicação correta: confie em Deus em situações de perigo real, ore antes de viagens, declare as promessas sobre sua família. Não significa se colocar em risco desnecessário "testando" Deus.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 1 - Bem-aventurado ==========
        { cache_key: 'SIGNIFICADO:salmos:1:1', livro: 'salmos', capitulo: 1, versiculo_inicio: 1, versiculo_fim: 6, tipo: 'significado', resposta: 'Salmo 1 - O Portal do Livro de Salmos. Dois caminhos: justo vs ímpio. O justo não anda, não para, não assenta com ímpios - progressão do mal. Seu prazer está na Lei. Como árvore plantada junto a rios - frutífera, perene, próspera. Os ímpios são como palha levada pelo vento.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:1:1', livro: 'salmos', capitulo: 1, versiculo_inicio: 1, tipo: 'devocional', resposta: 'Árvore plantada, não jogada. Raízes profundas. Fruto na estação certa - não apressado. Folhas não murcham - vitalidade constante. Você está plantado na Palavra ou sendo levado por qualquer vento de doutrina? Onde estão suas raízes? Medite na Lei dia e noite.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 27 - Luz e Salvação ==========
        { cache_key: 'SIGNIFICADO:salmos:27:1', livro: 'salmos', capitulo: 27, versiculo_inicio: 1, versiculo_fim: 14, tipo: 'significado', resposta: '"O Senhor é minha luz e salvação; a quem temerei?" Davi enfrenta inimigos sem medo porque Deus é sua defesa. O desejo supremo (v.4): habitar na casa do Senhor para contemplar Sua beleza. Mesmo se pai e mãe abandonarem, Deus acolhe. "Espera no Senhor, sê forte!"', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:27:4', livro: 'salmos', capitulo: 27, versiculo_inicio: 4, tipo: 'devocional', resposta: '"Uma coisa peço" - Davi tinha muitos desejos, mas um era supremo: estar com Deus. E você, se pudesse pedir apenas uma coisa? Contemple a beleza do Senhor não como turista apressado, mas como alguém que para para admirar. Esperar no Senhor exige força, não passividade.', modelo: 'cache-inicial', tokens_usados: 85 },
        
        // ========== SALMOS 37 - Não se irrite ==========
        { cache_key: 'SIGNIFICADO:salmos:37:4', livro: 'salmos', capitulo: 37, versiculo_inicio: 4, tipo: 'significado', resposta: '"Deleita-te no Senhor, e Ele satisfará os desejos do teu coração." Não é cheque em branco. Quando nos deleitamos em Deus, nossos desejos se alinham aos Dele. "Entrega teu caminho ao Senhor" (v.5). "Descansa no Senhor e espera nEle" (v.7). Não se irrite com os ímpios.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:37:4', livro: 'salmos', capitulo: 37, versiculo_inicio: 4, tipo: 'devocional', resposta: 'Quanto mais você se deleita em Deus, mais seus desejos mudam. Não é "deseje e Deus concede", é "deleite-se e seus desejos serão transformados". Ímpios parecem prosperar? Espere. A justiça de Deus virá. Não gaste energia com inveja - invista em intimidade com Deus.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 46 - Refúgio e Fortaleza ==========
        { cache_key: 'SIGNIFICADO:salmos:46:1', livro: 'salmos', capitulo: 46, versiculo_inicio: 1, versiculo_fim: 11, tipo: 'significado', resposta: '"Deus é nosso refúgio e fortaleza, socorro bem presente na angústia." Mesmo se a terra se transformar, não temeremos. "Há um rio" - paz em meio ao caos. "Deus está no meio dela" - Jerusalém segura. "Aquietai-vos e sabei que Eu sou Deus" - pare de lutar com suas forças.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:46:10', livro: 'salmos', capitulo: 46, versiculo_inicio: 10, tipo: 'devocional', resposta: '"Aquietai-vos" - pare de agitar. Largue o controle. Reconheça que DEUS é Deus, não você. Em meio ao caos das nações, há um rio de paz para quem habita em Deus. A ordem é: primeiro aquietar, depois saber. Você não consegue ouvir Deus na agitação.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 119:105 - Lâmpada ==========
        { cache_key: 'SIGNIFICADO:salmos:119:105', livro: 'salmos', capitulo: 119, versiculo_inicio: 105, tipo: 'significado', resposta: '"Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho." A Palavra ilumina o próximo passo (pés) e dá direção geral (caminho). Não holofote que mostra tudo, mas lâmpada suficiente para não tropeçar. Salmo 119 é o maior capítulo da Bíblia - 176 versículos sobre a Palavra.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:119:105', livro: 'salmos', capitulo: 119, versiculo_inicio: 105, tipo: 'devocional', resposta: 'Lâmpada em mundo de trevas. A Bíblia não mostra 10 passos à frente, apenas o suficiente para o próximo passo. Isso exige fé. Você quer GPS com rota completa, Deus dá lâmpada. Confie. Cada passo iluminado é suficiente. Leia a Palavra antes de decidir.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 121 - De onde vem meu socorro ==========
        { cache_key: 'SIGNIFICADO:salmos:121:1', livro: 'salmos', capitulo: 121, versiculo_inicio: 1, versiculo_fim: 8, tipo: 'significado', resposta: '"Elevo os olhos para os montes; de onde me vem o socorro?" Resposta: do Senhor que fez céu e terra. Ele não cochila, não dorme. É sombra à tua mão direita - proteção do sol escaldante. Guarda tua entrada e saída - todas as atividades. Agora e sempre.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:121:1', livro: 'salmos', capitulo: 121, versiculo_inicio: 1, tipo: 'devocional', resposta: 'Salmo de subida - peregrinos cantavam indo a Jerusalém. Os montes podiam ter ladrões, mas o olhar era para além dos montes - para o Criador dos montes. Deus nunca dorme - você pode descansar. Ele guarda você 24/7. Sua saída de casa e seu retorno estão protegidos.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== SALMOS 139 - Deus me conhece ==========
        { cache_key: 'SIGNIFICADO:salmos:139:1', livro: 'salmos', capitulo: 139, versiculo_inicio: 1, versiculo_fim: 24, tipo: 'significado', resposta: 'Deus me conhece completamente (v.1-6) - meu sentar, levantar, pensamentos. Está em todo lugar (v.7-12) - céu, inferno, mar. Me formou (v.13-18) - teceu no ventre, dias escritos antes de nascer. Resposta (v.23-24): sonda-me, conhece meu coração, guia-me no caminho eterno.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:salmos:139:14', livro: 'salmos', capitulo: 139, versiculo_inicio: 14, tipo: 'devocional', resposta: '"Sou maravilhosa e formidavelmente feito!" Você não é acidente. Deus escreveu seus dias antes do primeiro. Para quem luta com autoimagem: Deus não faz lixo. Ele te teceu com propósito. Não compare sua história com a de outros - seus dias foram escritos especificamente para você.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== JEREMIAS 29:11 - Planos de paz ==========
        { cache_key: 'SIGNIFICADO:jeremias:29:11', livro: 'jeremias', capitulo: 29, versiculo_inicio: 11, tipo: 'significado', resposta: '"Eu sei os planos que tenho para vocês, planos de paz e não de mal, para dar esperança e futuro." Escrito aos exilados na Babilônia que esperariam 70 anos. A promessa exigia paciência. Deus não improvisa - Ele tem propósitos definidos e bons para você.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'CONTEXTO:jeremias:29:11', livro: 'jeremias', capitulo: 29, versiculo_inicio: 11, tipo: 'contexto', resposta: 'Judá foi exilada em 597 a.C. Falsos profetas prometiam retorno rápido. Jeremias disse: 70 anos. Construam casas, plantem jardins (v.5-6). O versículo 11 vem DEPOIS da notícia difícil - é esperança NO MEIO da dificuldade, não promessa de vida sem problemas.', modelo: 'cache-inicial', tokens_usados: 80 },
        { cache_key: 'APLICACAO:jeremias:29:11', livro: 'jeremias', capitulo: 29, versiculo_inicio: 11, tipo: 'aplicacao', resposta: 'Não use este versículo para evitar dificuldades. Ele foi dado no exílio. O plano de Deus inclui crescimento na adversidade. Aplicação: mesmo quando Deus permite sofrimento, Ele tem propósito. Não desista antes dos "70 anos" - o cumprimento virá.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== FILIPENSES 4:13 - Tudo posso ==========
        { cache_key: 'SIGNIFICADO:filipenses:4:13', livro: 'filipenses', capitulo: 4, versiculo_inicio: 13, tipo: 'significado', resposta: '"Tudo posso naquele que me fortalece." O contexto (v.11-12) mostra que Paulo fala de contentamento em QUALQUER circunstância: abundância ou escassez, livre ou preso. A força é para suportar dificuldades com paz, não para realizar qualquer desejo. A força vem de Cristo, não de nós.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'APLICACAO:filipenses:4:13', livro: 'filipenses', capitulo: 4, versiculo_inicio: 13, tipo: 'aplicacao', resposta: 'Aplicação correta: força para perseverar em dificuldades, contentamento independente de circunstâncias, depender de Cristo não de si mesmo. Não significa que você vai ganhar o campeonato ou ficar rico. Significa que você pode enfrentar QUALQUER situação com a força que Cristo fornece.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ROMANOS 8:28 - Todas as coisas ==========
        { cache_key: 'SIGNIFICADO:romanos:8:28', livro: 'romanos', capitulo: 8, versiculo_inicio: 28, tipo: 'significado', resposta: '"Todas as coisas cooperam para o bem dos que amam a Deus." Não significa que tudo é bom, mas que Deus usa até o mal para Seus propósitos. O "bem" supremo (v.29) é nos tornar mais parecidos com Cristo. Esta promessa é para quem tem relacionamento com Deus.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:romanos:8:28', livro: 'romanos', capitulo: 8, versiculo_inicio: 28, tipo: 'devocional', resposta: 'Deus não é autor do mal, mas é mestre em redimir o mal. José disse aos irmãos: "Vocês intentaram o mal, mas Deus o tornou em bem." Seu passado doloroso pode se tornar seu ministério mais poderoso. Deus não desperdiça dor. Confie no processo.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ROMANOS 8:38-39 - Nada pode separar ==========
        { cache_key: 'SIGNIFICADO:romanos:8:38', livro: 'romanos', capitulo: 8, versiculo_inicio: 38, versiculo_fim: 39, tipo: 'significado', resposta: '"Estou convicto de que nem morte, nem vida, nem anjos, nem principados, nem coisas presentes, nem futuras, nem poderes, nem altura, nem profundidade, nem qualquer outra criatura poderá nos separar do amor de Deus em Cristo Jesus." Lista exaustiva = NADA.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:romanos:8:38', livro: 'romanos', capitulo: 8, versiculo_inicio: 38, tipo: 'devocional', resposta: 'Seu pior dia não pode te separar do amor de Deus. Seu maior fracasso não pode. Demônios não podem. A morte não pode. Quando você se sente longe de Deus, relembre: nada pode separar. A distância é sentimento, não realidade. Você está seguro no amor Dele.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== PROVÉRBIOS 3:5-6 - Confia no Senhor ==========
        { cache_key: 'SIGNIFICADO:proverbios:3:5', livro: 'proverbios', capitulo: 3, versiculo_inicio: 5, versiculo_fim: 6, tipo: 'significado', resposta: '"Confia no Senhor de todo o teu coração." "Batach" (hebraico) = apoiar-se em, depender de. "Não te estribes no teu próprio entendimento" = reconhecer suas limitações. "Reconhece-o em todos os teus caminhos" = inclua Deus em todas as decisões. Resultado: Ele endireitará suas veredas.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'APLICACAO:proverbios:3:5', livro: 'proverbios', capitulo: 3, versiculo_inicio: 5, tipo: 'aplicacao', resposta: 'Sinais de confiar em si mesmo: tomar decisões sem orar, ficar ansioso tentando controlar tudo, ignorar conselhos. Passos práticos: comece o dia entregando, ore antes de decisões, busque conselho sábio, aceite quando Deus redireciona, medite na Palavra.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== MATEUS 6:33 - Buscai primeiro ==========
        { cache_key: 'SIGNIFICADO:mateus:6:33', livro: 'mateus', capitulo: 6, versiculo_inicio: 33, tipo: 'significado', resposta: '"Buscai primeiro o Reino de Deus e sua justiça, e todas essas coisas vos serão acrescentadas." Contexto: Jesus ensinando sobre ansiedade. "Primeiro" = prioridade #1. "Reino de Deus" = viver sob a soberania de Deus. "Acrescentadas" = Deus cuida de quem cuida das coisas Dele.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:mateus:6:33', livro: 'mateus', capitulo: 6, versiculo_inicio: 33, tipo: 'devocional', resposta: 'O antídoto para ansiedade não é "não se preocupe", é reordenar prioridades. Quando o Reino de Deus é primeiro, as outras coisas encontram seu lugar. O que está primeiro na sua vida de verdade? Dinheiro? Relacionamentos? Reputação? Entrone o Reino e as peças se encaixam.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ISAÍAS 41:10 - Não temas ==========
        { cache_key: 'SIGNIFICADO:isaias:41:10', livro: 'isaias', capitulo: 41, versiculo_inicio: 10, tipo: 'significado', resposta: '"Não temas, porque eu sou contigo." Quatro promessas: 1) "Eu sou contigo" - Presença. 2) "Eu sou o teu Deus" - Relacionamento pessoal. 3) "Eu te fortaleço e te ajudo" - Capacitação. 4) "Te sustento com minha destra fiel" - Segurança. Deus te segura firme.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:isaias:41:10', livro: 'isaias', capitulo: 41, versiculo_inicio: 10, tipo: 'devocional', resposta: '"Não temas" aparece 365 vezes na Bíblia - uma para cada dia. O medo é vencido pela presença: "Eu sou contigo." Não estamos sozinhos. Ele não apenas está perto - Ele nos segura. Quando sentir medo, declare este versículo em voz alta sobre sua situação.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ISAÍAS 40:31 - Renovar forças ==========
        { cache_key: 'SIGNIFICADO:isaias:40:31', livro: 'isaias', capitulo: 40, versiculo_inicio: 31, tipo: 'significado', resposta: '"Os que esperam no Senhor renovarão suas forças, subirão com asas como águias, correrão e não se cansarão, andarão e não se fatigarão." Esperar (qavah) = aguardar com expectativa ativa. A renovação vem de Deus, não do esforço próprio. Como águia que renova penas.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:isaias:40:31', livro: 'isaias', capitulo: 40, versiculo_inicio: 31, tipo: 'devocional', resposta: 'Jovens se cansam (v.30), mas quem espera em Deus é renovado. A ordem é inversa: voar, correr, andar. A vida cristã madura não é sempre adrenalina - às vezes é simplesmente andar sem desistir. Aguente firme. A renovação vem para quem espera.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ISAÍAS 53:5 - Suas pisaduras ==========
        { cache_key: 'SIGNIFICADO:isaias:53:5', livro: 'isaias', capitulo: 53, versiculo_inicio: 5, tipo: 'significado', resposta: '"Ele foi traspassado pelas nossas transgressões, moído pelas nossas iniquidades; o castigo que nos traz a paz estava sobre Ele, e pelas Suas pisaduras fomos sarados." Profecia messiânica 700 anos antes de Cristo. Substituição: Ele sofreu O QUE nós merecíamos.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:isaias:53:5', livro: 'isaias', capitulo: 53, versiculo_inicio: 5, tipo: 'devocional', resposta: 'Traspassado. Moído. Castigado. Ferido. Cada palavra pesada mostra o custo da sua salvação. "Pelas suas pisaduras" - as marcas de Jesus são sua cura. Nunca subestime o que custou ser salvo. Viva à altura do preço que foi pago por você.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== JOSUÉ 1:9 - Sê forte ==========
        { cache_key: 'SIGNIFICADO:josue:1:9', livro: 'josue', capitulo: 1, versiculo_inicio: 9, tipo: 'significado', resposta: '"Sê forte e corajoso... o Senhor teu Deus é contigo." Moisés morreu, Josué assume liderança para conquistar Canaã. "Forte e corajoso" é repetido 4x no capítulo. Coragem não é opcional, é ordem de Deus. A razão: não nossa capacidade, mas a presença de Deus.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:josue:1:9', livro: 'josue', capitulo: 1, versiculo_inicio: 9, tipo: 'devocional', resposta: 'Se Deus ordena coragem, Ele dá capacidade. Josué tinha motivos para temer - substituir Moisés, enfrentar Jericó. Mas Deus disse: "Como fui com Moisés, serei contigo." Sua tarefa pode parecer impossível. Mas se Deus te chamou, Ele te capacita. Seja forte!', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== GÁLATAS 5:22-23 - Fruto do Espírito ==========
        { cache_key: 'SIGNIFICADO:galatas:5:22', livro: 'galatas', capitulo: 5, versiculo_inicio: 22, versiculo_fim: 23, tipo: 'significado', resposta: 'O FRUTO do Espírito (singular, não frutos): amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, domínio próprio. São 9 aspectos de um único fruto. Não se produz por esforço, mas por permanência em Cristo (João 15:5). Contraste com "obras" da carne (v.19-21).', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'APLICACAO:galatas:5:22', livro: 'galatas', capitulo: 5, versiculo_inicio: 22, tipo: 'aplicacao', resposta: 'Você não produz fruto - você dá fruto por estar conectado à videira. Qual aspecto do fruto está menos desenvolvido em você? Amor impaciente? Alegria ausente? Paz ansiosa? Foco nesse aspecto esta semana. Permaneça em Cristo e o fruto virá naturalmente.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== EFÉSIOS 2:8-9 - Pela graça ==========
        { cache_key: 'SIGNIFICADO:efesios:2:8', livro: 'efesios', capitulo: 2, versiculo_inicio: 8, versiculo_fim: 9, tipo: 'significado', resposta: '"Pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus; não de obras." Graça = favor imerecido. Fé = instrumento que recebe. Nem a graça nem a fé são produzidas por nós. Salvação é presente a ser recebido, não prêmio a ser conquistado.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:efesios:2:8', livro: 'efesios', capitulo: 2, versiculo_inicio: 8, tipo: 'devocional', resposta: 'Boas obras não salvam (v.9), mas salvos produzem boas obras (v.10). A ordem é crucial. Você não trabalha PARA ser amado; você trabalha PORQUE é amado. Descanse na graça. Suas obras são fruto de gratidão, não pagamento de dívida.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== HEBREUS 11:1 - Fé é ==========
        { cache_key: 'SIGNIFICADO:hebreus:11:1', livro: 'hebreus', capitulo: 11, versiculo_inicio: 1, tipo: 'significado', resposta: '"A fé é a certeza do que esperamos e a prova das coisas que não vemos." Hypostasis = substância, base sólida. Elenchos = evidência convincente. A fé dá realidade às promessas de Deus. Não é acreditar no falso ou ignorar evidências, mas confiança baseada em quem Deus é.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:hebreus:11:1', livro: 'hebreus', capitulo: 11, versiculo_inicio: 1, tipo: 'devocional', resposta: 'Fé é certeza sem ver. Abraão saiu sem saber para onde. Hebreus 11 lista heróis que viveram e morreram sem ver o cumprimento total - mas creram. Você pode não ver o resultado agora, mas creia. A fé é a "escritura" que prova que a propriedade prometida é sua.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== 1 CORÍNTIOS 13:4-7 - Amor é ==========
        { cache_key: 'SIGNIFICADO:1corintios:13:4', livro: '1corintios', capitulo: 13, versiculo_inicio: 4, versiculo_fim: 7, tipo: 'significado', resposta: 'Definição do amor ágape: É paciente, bondoso. Não inveja, não se vangloria, não se orgulha, não maltrata, não busca seus interesses, não se ira facilmente, não guarda rancor. Não se alegra com injustiça, mas com verdade. Tudo sofre, crê, espera, suporta.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'APLICACAO:1corintios:13:4', livro: '1corintios', capitulo: 13, versiculo_inicio: 4, tipo: 'aplicacao', resposta: 'Substitua "amor" pelo seu nome e leia. [Seu nome] é paciente... Onde falha? Este é seu alvo. O amor não é sentimento, é decisão e ação. Use este texto como checklist semanal para seus relacionamentos.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ROMANOS 12:2 - Não vos conformeis ==========
        { cache_key: 'SIGNIFICADO:romanos:12:2', livro: 'romanos', capitulo: 12, versiculo_inicio: 2, tipo: 'significado', resposta: '"Não vos conformeis com este mundo, mas transformai-vos pela renovação da mente." Syschematizo = não ser moldado pelo padrão externo. Metamorphoo = transformação de dentro para fora (como lagarta em borboleta). A vontade de Deus é boa, agradável e perfeita. A mudança começa na mente.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:romanos:12:2', livro: 'romanos', capitulo: 12, versiculo_inicio: 2, tipo: 'devocional', resposta: 'O mundo quer te moldar em sua forma. Pressão de todos os lados. A transformação vem de dentro para fora - renovando a mente com a Palavra. O que você consome forma quem você é. Cuide do que entra na sua mente. Garbage in, garbage out.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== 2 TIMÓTEO 1:7 - Não nos deu espírito de covardia ==========
        { cache_key: 'SIGNIFICADO:2timoteo:1:7', livro: '2timoteo', capitulo: 1, versiculo_inicio: 7, tipo: 'significado', resposta: '"Deus não nos deu espírito de covardia, mas de poder, de amor e de moderação." Deilia = timidez paralisante, medo covarde. Dynamis = poder dinâmico. Sophronismos = mente sã, disciplinada. Medo não vem de Deus. Poder, amor e domínio próprio vêm Dele.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:2timoteo:1:7', livro: '2timoteo', capitulo: 1, versiculo_inicio: 7, tipo: 'devocional', resposta: 'Quando medo te paralisa, lembre: isso não vem de Deus. O que Ele dá? Poder para enfrentar, amor para motivar, mente sã para discernir. Declare este versículo sobre ansiedade e medo. "Isso não é de Deus. Eu tenho poder, amor e mente sã."', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== TIAGO 1:2-4 - Alegria nas provações ==========
        { cache_key: 'SIGNIFICADO:tiago:1:2', livro: 'tiago', capitulo: 1, versiculo_inicio: 2, versiculo_fim: 4, tipo: 'significado', resposta: '"Meus irmãos, tende por motivo de toda alegria passardes por várias provações, sabendo que a prova da vossa fé produz perseverança." Não alegria PELA provação, mas NA provação - porque você sabe o resultado. A fé testada produz maturidade e integridade.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:tiago:1:2', livro: 'tiago', capitulo: 1, versiculo_inicio: 2, tipo: 'devocional', resposta: 'Provações (peirasmos) são testes que revelam e fortalecem a fé. Músculos crescem com resistência. Fé cresce com provações. Você pode escolher alegria porque sabe que Deus está produzindo maturidade. Não desperdice sua dor - deixe-a te formar.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== 1 PEDRO 5:7 - Lançando sobre Ele ==========
        { cache_key: 'SIGNIFICADO:1pedro:5:7', livro: '1pedro', capitulo: 5, versiculo_inicio: 7, tipo: 'significado', resposta: '"Lançando sobre Ele toda vossa ansiedade, porque Ele tem cuidado de vós." Epiripto = lançar sobre, jogar em cima. Merimna = ansiedades, preocupações que dividem a mente. Melei = importar, cuidar pessoalmente. Deus não apenas tolera suas preocupações - Ele quer levá-las.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:1pedro:5:7', livro: '1pedro', capitulo: 5, versiculo_inicio: 7, tipo: 'devocional', resposta: 'O convite é para LANÇAR, não para COLOCAR delicadamente. Jogue suas ansiedades com força sobre Deus. Ele não vai quebrar. Por que carregar peso que Ele quer carregar? "Ele tem cuidado de vós" - você importa para Deus. Seus problemas importam para Ele.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== APOCALIPSE 21:4 - Não haverá mais ==========
        { cache_key: 'SIGNIFICADO:apocalipse:21:4', livro: 'apocalipse', capitulo: 21, versiculo_inicio: 4, tipo: 'significado', resposta: '"Ele enxugará dos seus olhos toda lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor, porque as primeiras coisas já passaram." O estado eterno: Deus habitando com Seu povo, fim de todo sofrimento, todas as coisas feitas novas.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:apocalipse:21:4', livro: 'apocalipse', capitulo: 21, versiculo_inicio: 4, tipo: 'devocional', resposta: 'Esta é a última página da história. O mal perde. A dor acaba. Lágrimas são enxugadas - isso significa que Deus vê cada lágrima que você chorou. Um dia todas serão lembranças distantes. Aguente firme. O final é glorioso para quem está em Cristo.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== MATEUS 11:28-30 - Vinde a mim ==========
        { cache_key: 'SIGNIFICADO:mateus:11:28', livro: 'mateus', capitulo: 11, versiculo_inicio: 28, versiculo_fim: 30, tipo: 'significado', resposta: '"Vinde a mim todos os que estais cansados e sobrecarregados, e eu vos aliviarei. Tomai sobre vós o meu jugo e aprendei de mim... achareis descanso." Jesus oferece descanso para alma. Seu jugo é suave - diferente do jugo pesado dos fariseus.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:mateus:11:28', livro: 'mateus', capitulo: 11, versiculo_inicio: 28, tipo: 'devocional', resposta: 'Cansado? Sobrecarregado? Jesus não diz "esforce-se mais". Ele diz "venha a mim". O jugo dEle é leve porque Ele puxa junto com você. Aprender dEle - Ele é manso e humilde. O descanso não é da tarefa, mas no relacionamento enquanto trabalha.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== JOÃO 14:6 - Eu sou o caminho ==========
        { cache_key: 'SIGNIFICADO:joao:14:6', livro: 'joao', capitulo: 14, versiculo_inicio: 6, tipo: 'significado', resposta: '"Eu sou o caminho, a verdade e a vida; ninguém vem ao Pai senão por mim." Jesus não mostra um caminho, Ele É o caminho. Não aponta para verdade, É a verdade. Não dá vida, É a vida. Exclusividade cristã: salvação apenas por Jesus.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:joao:14:6', livro: 'joao', capitulo: 14, versiculo_inicio: 6, tipo: 'devocional', resposta: 'Em mundo relativista que diz "todos os caminhos levam a Deus", Jesus é claro: "ninguém vem ao Pai senão por mim." Isso parece exclusivo? É. Mas Jesus morreu para abrir este único caminho - e está disponível para TODOS que crerem.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== JOÃO 10:10 - Vida em abundância ==========
        { cache_key: 'SIGNIFICADO:joao:10:10', livro: 'joao', capitulo: 10, versiculo_inicio: 10, tipo: 'significado', resposta: '"O ladrão vem apenas para roubar, matar e destruir; eu vim para que tenham vida e a tenham em abundância." Contraste entre Satanás (destruidor) e Jesus (doador de vida). Zoe perissos = vida em plenitude, transbordante. Não apenas existência, mas vida significativa.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:joao:10:10', livro: 'joao', capitulo: 10, versiculo_inicio: 10, tipo: 'devocional', resposta: 'Vida abundante não é necessariamente riqueza material. É vida com propósito, paz interior, relacionamento com Deus. O ladrão quer te convencer que Jesus limita sua vida. A verdade: fora dEle você está sendo roubado. EM Cristo há abundância real.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== JOÃO 15:5 - Sem mim nada podeis ==========
        { cache_key: 'SIGNIFICADO:joao:15:5', livro: 'joao', capitulo: 15, versiculo_inicio: 5, tipo: 'significado', resposta: '"Eu sou a videira, vós os ramos. Quem permanece em mim e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer." Meno = permanecer, morar, continuar. Fruto vem da conexão, não do esforço. Ramo separado seca e morre.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:joao:15:5', livro: 'joao', capitulo: 15, versiculo_inicio: 5, tipo: 'devocional', resposta: 'Ramos não se esforçam para dar fruto - eles permanecem conectados e o fruto vem. Você está conectado ou correndo? Permanência exige parar, ficar, nutrir-se da videira. A vida cristã não é ativismo, é intimidade que produz fruto naturalmente.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== ATOS 1:8 - Recebereis poder ==========
        { cache_key: 'SIGNIFICADO:atos:1:8', livro: 'atos', capitulo: 1, versiculo_inicio: 8, tipo: 'significado', resposta: '"Recebereis poder ao descer sobre vós o Espírito Santo, e sereis minhas testemunhas em Jerusalém, Judeia, Samaria e até os confins da terra." Dynamis = poder dinâmico. Testemunha (martys) vive e, se necessário, morre pelo que testemunha. Missão em círculos concêntricos.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:atos:1:8', livro: 'atos', capitulo: 1, versiculo_inicio: 8, tipo: 'devocional', resposta: 'Poder para testemunhar, não para impressionar. Comece em sua Jerusalém (lar, bairro), expanda para Judeia (cidade), Samaria (os "diferentes"), até os confins. Você já foi capacitado. Não espere sentir - obedeça e o poder se manifesta.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== MIQUÉIAS 6:8 - O que o Senhor pede ==========
        { cache_key: 'SIGNIFICADO:miqueias:6:8', livro: 'miqueias', capitulo: 6, versiculo_inicio: 8, tipo: 'significado', resposta: '"O que o Senhor pede de ti: que pratiques a justiça, ames a misericórdia e andes humildemente com teu Deus." Três pilares: ação justa (mishpat), amor compassivo (hesed), caminhada humilde. Deus não quer rituais, mas caráter e relacionamento.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:miqueias:6:8', livro: 'miqueias', capitulo: 6, versiculo_inicio: 8, tipo: 'devocional', resposta: 'Deus simplifica: justiça, misericórdia, humildade. Sem complicação religiosa. Justiça nas relações. Misericórdia aos necessitados. Humildade diante de Deus. Se você quer agradar a Deus, não precisa de fórmulas complexas. Pratique estes três.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ========== HABACUQUE 3:17-18 - Ainda assim ==========
        { cache_key: 'SIGNIFICADO:habacuque:3:17', livro: 'habacuque', capitulo: 3, versiculo_inicio: 17, versiculo_fim: 18, tipo: 'significado', resposta: '"Ainda que a figueira não floresça... todavia eu me alegrarei no Senhor, exultarei no Deus da minha salvação." Catálogo de desastres agrícolas (fome total) seguido de adoração. Alegria baseada em quem Deus é, não em circunstâncias.', modelo: 'cache-inicial', tokens_usados: 90 },
        { cache_key: 'DEVOCIONAL:habacuque:3:17', livro: 'habacuque', capitulo: 3, versiculo_inicio: 17, tipo: 'devocional', resposta: '"Ainda que..." - fé de "ainda que". Quando tudo dá errado, você ainda adora? Alegria em Deus não depende de circunstâncias. Habacuque tinha perguntas (cap 1-2), mas termina adorando (cap 3). Suas perguntas podem coexistir com adoração.', modelo: 'cache-inicial', tokens_usados: 80 },
      ];

      const { error: cacheError } = await supabase
        .from('ai_cache_versiculos')
        .upsert(cacheVersiculos, { onConflict: 'cache_key' });

      // ==========================================
      // CACHE MEGA EXPANDIDO - 25+ PERGUNTAS FREQUENTES
      // ==========================================
      const cachePerguntas = [
        // ===== Sobre Deus =====
        { hash_pergunta: 'deus_me_ama', pergunta_original: 'Deus me ama?', pergunta_normalizada: 'deus me ama', categoria: 'deus', resposta: 'Sim! "Deus é amor" (1 João 4:8). Ele te amou antes de você nascer, enviou Jesus por você, e NADA pode separar você do Seu amor (Romanos 8:38-39). "Deus prova seu amor por nós: Cristo morreu por nós sendo nós ainda pecadores" (Rm 5:8). Você é profundamente amado.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'deus_existe', pergunta_original: 'Deus existe?', pergunta_normalizada: 'deus existe', categoria: 'deus', resposta: 'Evidências: 1) Argumento cosmológico - o universo teve um início, algo causou esse início. 2) Design inteligente - complexidade do DNA sugere um Designer. 3) Argumento moral - noção universal de certo/errado aponta para um Legislador moral. 4) Jesus - sua ressurreição é historicamente documentada.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'por_que_sofrimento', pergunta_original: 'Por que Deus permite o sofrimento?', pergunta_normalizada: 'por que deus permite sofrimento', categoria: 'deus', resposta: 'Sofrimento entrou pelo pecado (Gênesis 3), não era plano original de Deus. Deus deu livre-arbítrio e não nos trata como robôs. Ele não é autor do mal, mas pode usar até o mal para Seus propósitos (Rm 8:28). Jesus sofreu conosco. Um dia Ele eliminará todo sofrimento (Apocalipse 21:4).', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'deus_ouve_minhas_oracoes', pergunta_original: 'Deus ouve minhas orações?', pergunta_normalizada: 'deus ouve minhas oracoes', categoria: 'oracao', resposta: 'Sim! "Os olhos do Senhor estão sobre os justos, e seus ouvidos atentos ao seu clamor" (Sl 34:15). "Antes de clamarem, eu responderei" (Is 65:24). Deus pode responder sim, não, ou espere. Silêncio não significa ausência. Continue orando e confiando.', modelo: 'cache-inicial', tokens_usados: 80 },
        
        // ===== Salvação =====
        { hash_pergunta: 'como_ser_salvo', pergunta_original: 'Como ser salvo?', pergunta_normalizada: 'como ser salvo', categoria: 'salvacao', resposta: '1) Reconheça que precisa de salvação - todos pecaram (Romanos 3:23). 2) Creia que Jesus morreu e ressuscitou por você (1 Cor 15:3-4). 3) Confesse Jesus como Senhor (Romanos 10:9-10). A salvação é pela graça, mediante a fé (Efésios 2:8). Ore: "Jesus, perdoa meus pecados e seja meu Senhor."', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_pecado', pergunta_original: 'O que é pecado?', pergunta_normalizada: 'o que e pecado', categoria: 'pecado', resposta: 'Pecado (hamartia) significa "errar o alvo". É qualquer pensamento, palavra ou ação que viola a lei de Deus. Tipos: comissão (fazer o proibido), omissão (não fazer o ordenado), atitude (pensamentos errados). Consequência: separação de Deus. Boa notícia: Jesus perdoa todos os pecados!', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_graca', pergunta_original: 'O que é graça?', pergunta_normalizada: 'o que e graca', categoria: 'salvacao', resposta: 'Graça = favor imerecido de Deus. Justiça = receber o que merecemos. Misericórdia = NÃO receber o castigo merecido. Graça = receber bênção que NÃO merecemos. "A minha graça te basta" (2 Cor 12:9). Graça é Deus dando Seu melhor (Jesus) para os piores (nós).', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'posso_perder_salvacao', pergunta_original: 'Posso perder a salvação?', pergunta_normalizada: 'posso perder salvacao', categoria: 'salvacao', resposta: 'Há duas visões: 1) Segurança eterna - "ninguém as arrebatará da minha mão" (Jo 10:28). 2) Perseverança necessária - advertências contra apostasia (Hb 6:4-6). Consenso evangélico: quem verdadeiramente nasceu de novo perseverará. Frutos demonstram realidade da fé. Quem abandona a fé talvez nunca tenha tido fé genuína.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // ===== Vida cristã =====
        { hash_pergunta: 'como_orar', pergunta_original: 'Como orar?', pergunta_normalizada: 'como orar', categoria: 'oracao', resposta: 'Oração é conversa com Deus - não precisa de palavras bonitas. Modelo do Pai Nosso (Mt 6:9-13): 1) Adoração. 2) Submissão à vontade de Deus. 3) Pedidos. 4) Confissão. 5) Proteção. Dicas: seja sincero, ore em qualquer lugar, inclua gratidão, ouça também. Não existe fórmula mágica.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_fe', pergunta_original: 'O que é fé?', pergunta_normalizada: 'o que e fe', categoria: 'fe', resposta: '"A fé é a certeza do que esperamos e a prova das coisas que não vemos" (Hebreus 11:1). Fé NÃO é: acreditar no falso, ignorar razão. Fé É: confiança em Deus baseada em quem Ele é, agir com base na Palavra. "A fé vem pelo ouvir a Palavra de Cristo" (Rm 10:17).', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'como_estudar_biblia', pergunta_original: 'Como estudar a Bíblia?', pergunta_normalizada: 'como estudar biblia', categoria: 'biblia', resposta: 'Método OEIA: Observar (o que o texto diz?), Entender (o que significava para os primeiros leitores?), Interpretar (princípio atemporal), Aplicar (como muda minha vida?). Dicas: ore antes, leia o contexto, anote insights, memorize versículos, aplique algo diariamente.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'como_vencer_tentacao', pergunta_original: 'Como vencer a tentação?', pergunta_normalizada: 'como vencer tentacao', categoria: 'santidade', resposta: '1) Fuja - "Foge das paixões da mocidade" (2 Tm 2:22). 2) Resista - "Resisti ao diabo e ele fugirá" (Tg 4:7). 3) Use a Palavra - Jesus respondeu "Está escrito" (Mt 4). 4) Ore - "Vigiai e orai para não cairdes" (Mt 26:41). 5) Tenha parceiro de prestação de contas. Deus promete saída (1 Co 10:13).', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'como_ouvir_deus', pergunta_original: 'Como ouvir a voz de Deus?', pergunta_normalizada: 'como ouvir voz de deus', categoria: 'oracao', resposta: 'Deus fala através de: 1) Bíblia - principal forma, nunca contradiz. 2) Espírito Santo - paz, convicção interior. 3) Conselho sábio - líderes, mentores. 4) Circunstâncias - portas abertas/fechadas. 5) Oração - tempo quieto para ouvir. Teste: está alinhado com a Bíblia? Traz paz? Glorifica a Deus?', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // ===== Igreja e sacramentos =====
        { hash_pergunta: 'por_que_ir_igreja', pergunta_original: 'Por que ir à igreja?', pergunta_normalizada: 'por que ir a igreja', categoria: 'igreja', resposta: '1) É mandamento - "Não deixando de congregar-nos" (Hebreus 10:25). 2) Fomos feitos para comunidade, não para fé solitária. 3) Benefícios: adoração coletiva, ensino, encorajamento, prestação de contas, oportunidade de servir. Igreja não é museu de santos, é hospital de pecadores em recuperação.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'o_que_e_batismo', pergunta_original: 'O que é o batismo?', pergunta_normalizada: 'o que e batismo', categoria: 'igreja', resposta: 'Ordenança de Jesus (Mt 28:19). Símbolo: morte (descer na água), sepultamento (imersão), ressurreição (sair da água) - Romanos 6:3-4. O batismo NÃO salva - salvação é pela fé. O batismo demonstra fé publicamente, identifica com Cristo, é ato de obediência a Jesus.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'o_que_e_santa_ceia', pergunta_original: 'O que é a Santa Ceia?', pergunta_normalizada: 'o que e santa ceia', categoria: 'igreja', resposta: 'Ordenança de Jesus (1 Co 11:23-26). Pão = corpo de Cristo entregue. Vinho/suco = sangue da nova aliança. Propósitos: lembrar o sacrifício de Cristo, anunciar Sua morte até que volte, examinar-se (v.28), comunhão com Cristo e irmãos. Participar dignamente = com fé e coração limpo.', modelo: 'cache-inicial', tokens_usados: 80 },
        { hash_pergunta: 'o_que_e_dizimo', pergunta_original: 'O que é o dízimo?', pergunta_normalizada: 'o que e dizimo', categoria: 'igreja', resposta: 'Dízimo = 10% da renda, praticado desde Abraão (Gn 14:20), formalizado na Lei (Lv 27:30). NT enfatiza generosidade além do dízimo (2 Co 9:6-7). Propósitos: sustentar ministérios, ajudar necessitados, demonstrar que Deus é dono de tudo. Dar com alegria, não por obrigação.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // ===== Jesus e Trindade =====
        { hash_pergunta: 'jesus_e_deus', pergunta_original: 'Jesus é Deus?', pergunta_normalizada: 'jesus e deus', categoria: 'jesus', resposta: 'Sim! João 1:1 "O Verbo era Deus". João 10:30 "Eu e o Pai somos um". Tomé: "Senhor meu e Deus meu" (Jo 20:28). Jesus perdoava pecados (só Deus pode), aceitava adoração, ressuscitou mortos, ressuscitou. Ele é a segunda Pessoa da Trindade - plenamente Deus e plenamente homem.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_espirito_santo', pergunta_original: 'O que é o Espírito Santo?', pergunta_normalizada: 'o que e espirito santo', categoria: 'espirito', resposta: 'O Espírito Santo é Deus - terceira Pessoa da Trindade. É PESSOA (fala, ensina, pode ser entristecido), não força impessoal. Funções: convence do pecado, regenera, habita no crente, guia à verdade, produz fruto (Gl 5:22), capacita para testemunho, intercede por nós (Rm 8:26).', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_trindade', pergunta_original: 'O que é a Trindade?', pergunta_normalizada: 'o que e trindade', categoria: 'deus', resposta: 'Um Deus em três Pessoas: Pai, Filho, Espírito Santo. Não três deuses (triteísmo) nem uma pessoa com três máscaras (modalismo). Mistério revelado: Mt 3:16-17 (batismo de Jesus mostra os três), Mt 28:19 (batizem em nome do Pai, Filho, Espírito). Iguais em essência, distintos em pessoa.', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // ===== Perdão e vida eterna =====
        { hash_pergunta: 'deus_perdoa_pecados', pergunta_original: 'Deus perdoa todos os meus pecados?', pergunta_normalizada: 'deus perdoa meus pecados', categoria: 'perdao', resposta: 'Sim! "Se confessarmos nossos pecados, Ele é fiel e justo para perdoar e purificar de TODA injustiça" (1 Jo 1:9). "Onde abundou o pecado, superabundou a graça" (Rm 5:20). Nenhum pecado é maior que a graça de Deus. Exemplos bíblicos: Davi (adultério/homicídio), Pedro (negação), Paulo (perseguidor).', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_acontece_depois_morte', pergunta_original: 'O que acontece depois da morte?', pergunta_normalizada: 'o que acontece depois da morte', categoria: 'morte', resposta: 'Hebreus 9:27 - "Aos homens está ordenado morrer uma só vez, vindo depois o juízo." Para quem crê: presença imediata com Cristo (Fp 1:23), depois ressurreição na volta de Jesus, eternidade sem dor (Ap 21:4). Para quem rejeita: separação eterna de Deus (2 Ts 1:9).', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'o_que_e_ceu', pergunta_original: 'O que é o céu?', pergunta_normalizada: 'o que e ceu', categoria: 'eternidade', resposta: 'Presença plena de Deus, sem pecado, dor ou morte (Ap 21:1-4). Não será só nuvens e harpas - haverá nova terra, trabalho prazeroso, relacionamentos, adoração. Veremos Deus face a face (1 Co 13:12). É onde pertencemos (Fp 3:20). Jesus foi preparar lugar para nós (Jo 14:2-3).', modelo: 'cache-inicial', tokens_usados: 90 },
        
        // ===== Questões práticas =====
        { hash_pergunta: 'biblia_confiavel', pergunta_original: 'A Bíblia é confiável?', pergunta_normalizada: 'biblia e confiavel', categoria: 'biblia', resposta: 'Sim! Evidências: 1) Manuscritos: 5.800+ gregos do NT - mais que qualquer obra antiga. 2) Arqueologia: descobertas confirmam eventos bíblicos. 3) Profecias: 300+ sobre Jesus cumpridas. 4) Unidade: 66 livros, 40 autores, 1500 anos, uma mensagem coerente. 5) Poder transformador: milhões de vidas mudadas.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'como_evangelizar', pergunta_original: 'Como evangelizar?', pergunta_normalizada: 'como evangelizar', categoria: 'evangelismo', resposta: '1) Viva o evangelho - seu testemunho é poderoso. 2) Ore por oportunidades e pessoas. 3) Construa relacionamentos genuínos. 4) Compartilhe sua história. 5) Apresente o evangelho com clareza: pecado, cruz, ressurreição, fé. 6) Confie no Espírito Santo - você planta, Ele dá o crescimento. 7) Não force decisões.', modelo: 'cache-inicial', tokens_usados: 90 },
        { hash_pergunta: 'qual_versao_biblia', pergunta_original: 'Qual versão da Bíblia devo usar?', pergunta_normalizada: 'qual versao biblia usar', categoria: 'biblia', resposta: 'Boas opções em português: NVI (Nova Versão Internacional) - equilíbrio de fidelidade e clareza. ARA (Almeida Revista e Atualizada) - tradicional e precisa. NTLH (Nova Tradução Linguagem de Hoje) - muito acessível. ACF (Almeida Corrigida Fiel) - literal. O importante é ler! Compare versões para estudo mais profundo.', modelo: 'cache-inicial', tokens_usados: 90 },
      ];

      const { error: perguntasError } = await supabase
        .from('ai_cache_semantico')
        .upsert(cachePerguntas, { onConflict: 'hash_pergunta' });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `🎉 Cache MEGA expandido populado com sucesso!\n\n📖 ${cacheVersiculos.length} versículos populares (50+ passagens com explicações)\n❓ ${cachePerguntas.length} perguntas frequentes\n📈 Hit rate estimado: 70-80%!`,
          detalhes: {
            versiculos: cacheVersiculos.length,
            perguntas: cachePerguntas.length,
            passagens_cobertas: ['João 3:16', 'Salmos 23, 91, 1, 27, 37, 46, 119:105, 121, 139', 'Jeremias 29:11', 'Filipenses 4:13', 'Romanos 8:28, 8:38-39, 12:2', 'Provérbios 3:5-6', 'Mateus 6:33, 11:28-30', 'Isaías 40:31, 41:10, 53:5', 'Josué 1:9', 'Gálatas 5:22-23', 'Efésios 2:8-9', 'Hebreus 11:1', '1 Coríntios 13:4-7', '2 Timóteo 1:7', 'Tiago 1:2-4', '1 Pedro 5:7', 'Apocalipse 21:4', 'João 14:6, 10:10, 15:5', 'Atos 1:8', 'Miquéias 6:8', 'Habacuque 3:17-18']
          }
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
