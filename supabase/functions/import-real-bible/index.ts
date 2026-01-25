import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==========================================
// TEXTOS REAIS DA BÍBLIA NVI
// ==========================================
const realBibleTexts: Record<string, Record<number, { v: number; t: string }[]>> = {
  'Gn': {
    1: [
      { v: 1, t: "No princípio Deus criou os céus e a terra." },
      { v: 2, t: "Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas." },
      { v: 3, t: "Disse Deus: 'Haja luz', e houve luz." },
      { v: 4, t: "Deus viu que a luz era boa, e separou a luz das trevas." },
      { v: 5, t: "Deus chamou à luz Dia, e às trevas chamou Noite. Passaram-se a tarde e a manhã; esse foi o primeiro dia." },
      { v: 6, t: "Depois disse Deus: 'Haja entre as águas um firmamento que separe águas de águas'." },
      { v: 7, t: "Assim Deus fez o firmamento e separou as águas que ficaram abaixo do firmamento das que ficaram por cima. E assim foi." },
      { v: 8, t: "Ao firmamento Deus chamou Céu. Passaram-se a tarde e a manhã; esse foi o segundo dia." },
      { v: 9, t: "E disse Deus: 'Ajuntem-se num só lugar as águas que estão debaixo do céu, e apareça a parte seca'. E assim foi." },
      { v: 10, t: "À parte seca Deus chamou Terra, e às águas reunidas chamou Mares. E Deus viu que ficou bom." },
      { v: 11, t: "Então disse Deus: 'Cubra-se a terra de vegetação: plantas que deem sementes e árvores cujos frutos produzam sementes de acordo com as suas espécies'. E assim foi." },
      { v: 12, t: "A terra fez brotar a vegetação: plantas que dão sementes de acordo com as suas espécies, e árvores cujos frutos produzem sementes de acordo com as suas espécies. E Deus viu que ficou bom." },
      { v: 13, t: "Passaram-se a tarde e a manhã; esse foi o terceiro dia." },
      { v: 14, t: "Disse Deus: 'Haja luminares no firmamento do céu para separar o dia da noite. Sirvam eles de sinais para marcar estações, dias e anos," },
      { v: 15, t: "e sirvam de luminares no firmamento do céu para iluminar a terra'. E assim foi." },
      { v: 16, t: "Deus fez os dois grandes luminares: o maior para governar o dia e o menor para governar a noite; fez também as estrelas." },
      { v: 17, t: "Deus os colocou no firmamento do céu para iluminar a terra," },
      { v: 18, t: "governar o dia e a noite, e separar a luz das trevas. E Deus viu que ficou bom." },
      { v: 19, t: "Passaram-se a tarde e a manhã; esse foi o quarto dia." },
      { v: 20, t: "Disse também Deus: 'Encham-se as águas de seres vivos, e sobre a terra voem aves sob o firmamento do céu'." },
      { v: 21, t: "Assim Deus criou os grandes animais aquáticos e os demais seres vivos que povoam as águas, de acordo com as suas espécies; e todas as aves, de acordo com as suas espécies. E Deus viu que ficou bom." },
      { v: 22, t: "Deus os abençoou, dizendo: 'Sejam férteis e multipliquem-se! Encham as águas dos mares! E multipliquem-se as aves na terra'." },
      { v: 23, t: "Passaram-se a tarde e a manhã; esse foi o quinto dia." },
      { v: 24, t: "E disse Deus: 'Produza a terra seres vivos de acordo com as suas espécies: rebanhos domésticos, animais selvagens e os demais seres vivos da terra, cada um de acordo com a sua espécie'. E assim foi." },
      { v: 25, t: "Deus fez os animais selvagens de acordo com as suas espécies, os rebanhos domésticos de acordo com as suas espécies, e os demais seres vivos da terra de acordo com as suas espécies. E Deus viu que ficou bom." },
      { v: 26, t: "Então disse Deus: 'Façamos o homem à nossa imagem, conforme a nossa semelhança. Domine ele sobre os peixes do mar, sobre as aves do céu, sobre os animais domésticos, sobre toda a terra e sobre todos os animais que se arrastam pelo chão'." },
      { v: 27, t: "Criou Deus o homem à sua imagem, à imagem de Deus o criou; homem e mulher os criou." },
      { v: 28, t: "Deus os abençoou e lhes disse: 'Sejam férteis e multipliquem-se! Encham e subjuguem a terra! Dominem sobre os peixes do mar, sobre as aves do céu e sobre todos os animais que se movem pela terra'." },
      { v: 29, t: "Disse Deus: 'Eis que lhes dou todas as plantas que nascem em toda a terra e produzem sementes, e todas as árvores que dão frutos com sementes. Elas servirão de alimento para vocês." },
      { v: 30, t: "E dou todos os vegetais como alimento a tudo o que tem em si fôlego de vida: a todos os grandes animais da terra, a todas as aves do céu e a todas as criaturas que se movem rente ao chão'. E assim foi." },
      { v: 31, t: "Deus viu tudo o que havia feito, e tudo havia ficado muito bom. Passaram-se a tarde e a manhã; esse foi o sexto dia." },
    ],
    2: [
      { v: 1, t: "Assim foram concluídos os céus e a terra, e tudo o que neles há." },
      { v: 2, t: "No sétimo dia Deus já havia concluído a obra que realizara, e nesse dia descansou de toda a sua obra." },
      { v: 3, t: "Abençoou Deus o sétimo dia e o santificou, porque nele descansou de toda a obra que realizara na criação." },
      { v: 4, t: "Esta é a história das origens dos céus e da terra, no tempo em que foram criados: Quando o Senhor Deus fez a terra e os céus," },
      { v: 5, t: "ainda não tinha brotado nenhum arbusto do campo, e nenhuma planta do campo havia germinado, porque o Senhor Deus ainda não tinha feito chover sobre a terra, e também não havia homem para cultivar o solo." },
      { v: 6, t: "Todavia brotava água da terra e irrigava toda a superfície do solo." },
      { v: 7, t: "Então o Senhor Deus formou o homem do pó da terra e soprou em suas narinas o fôlego de vida, e o homem se tornou um ser vivente." },
      { v: 8, t: "Ora, o Senhor Deus tinha plantado um jardim no lado leste, no Éden; e ali colocou o homem que formara." },
      { v: 9, t: "O Senhor Deus fez brotar do solo todo tipo de árvores agradáveis aos olhos e boas para alimento. E no meio do jardim estavam a árvore da vida e a árvore do conhecimento do bem e do mal." },
      { v: 10, t: "Do Éden saía um rio que irrigava o jardim, e ali se dividia em quatro." },
      { v: 11, t: "O nome do primeiro é Pisom; ele percorre toda a terra de Havilá, onde existe ouro." },
      { v: 12, t: "O ouro daquela terra é puro; lá também existem o bdélio e a pedra de ônix." },
      { v: 13, t: "O nome do segundo rio é Giom; ele percorre toda a terra de Cuxe." },
      { v: 14, t: "O nome do terceiro rio é Tigre; ele corre ao lado leste da Assíria. E o quarto rio é o Eufrates." },
      { v: 15, t: "O Senhor Deus colocou o homem no jardim do Éden para cuidar dele e cultivá-lo." },
      { v: 16, t: "E o Senhor Deus ordenou ao homem: 'Coma livremente de qualquer árvore do jardim," },
      { v: 17, t: "mas não coma da árvore do conhecimento do bem e do mal, porque no dia em que dela comer, certamente você morrerá'." },
      { v: 18, t: "Então o Senhor Deus declarou: 'Não é bom que o homem esteja só; farei para ele alguém que o auxilie e lhe corresponda'." },
      { v: 19, t: "Depois que formou da terra todos os animais do campo e todas as aves do céu, o Senhor Deus os trouxe ao homem para ver como este lhes chamaria; e o nome que o homem desse a cada ser vivo, esse seria o seu nome." },
      { v: 20, t: "Assim o homem deu nomes a todos os rebanhos domésticos, às aves do céu e a todos os animais selvagens. Todavia não se encontrou para o homem alguém que o auxiliasse e lhe correspondesse." },
      { v: 21, t: "Então o Senhor Deus fez o homem cair em sono profundo e, enquanto este dormia, tirou-lhe uma das costelas, fechando o lugar com carne." },
      { v: 22, t: "Com a costela que havia tirado do homem, o Senhor Deus fez uma mulher e a levou até ele." },
      { v: 23, t: "Disse então o homem: 'Esta, sim, é osso dos meus ossos e carne da minha carne! Ela será chamada mulher, porque do homem foi tirada'." },
      { v: 24, t: "Por essa razão, o homem deixará pai e mãe e se unirá à sua mulher, e eles se tornarão uma só carne." },
      { v: 25, t: "O homem e sua mulher viviam nus, e não sentiam vergonha." },
    ],
    3: [
      { v: 1, t: "Ora, a serpente era o mais astuto de todos os animais selvagens que o Senhor Deus tinha feito. E ela perguntou à mulher: 'Foi isso mesmo que Deus disse: Vocês não devem comer de nenhuma árvore do jardim?'" },
      { v: 2, t: "Respondeu a mulher à serpente: 'Podemos comer do fruto das árvores do jardim," },
      { v: 3, t: "mas Deus disse: Não comam do fruto da árvore que está no meio do jardim, nem toquem nele; do contrário, vocês morrerão'." },
      { v: 4, t: "Disse a serpente à mulher: 'Certamente não morrerão!" },
      { v: 5, t: "Deus sabe que, no dia em que dele comerem, seus olhos se abrirão, e vocês, como Deus, serão conhecedores do bem e do mal'." },
      { v: 6, t: "Quando a mulher viu que a árvore parecia agradável ao paladar, era atraente aos olhos e, além disso, desejável para dela se obter discernimento, tomou do seu fruto, comeu-o e o deu a seu marido, que comeu também." },
      { v: 7, t: "Os olhos dos dois se abriram, e perceberam que estavam nus; então juntaram folhas de figueira para cobrir-se." },
      { v: 8, t: "Ouvindo o homem e sua mulher os passos do Senhor Deus que andava pelo jardim quando soprava a brisa do dia, esconderam-se da presença do Senhor Deus entre as árvores do jardim." },
      { v: 9, t: "Mas o Senhor Deus chamou o homem, perguntando: 'Onde está você?'" },
      { v: 10, t: "E ele respondeu: 'Ouvi teus passos no jardim e fiquei com medo, porque estava nu; por isso me escondi'." },
      { v: 11, t: "E Deus perguntou: 'Quem lhe disse que você estava nu? Você comeu da árvore da qual lhe proibi comer?'" },
      { v: 12, t: "Disse o homem: 'Foi a mulher que me deste por companheira que me deu do fruto da árvore, e eu comi'." },
      { v: 13, t: "O Senhor Deus perguntou então à mulher: 'O que foi que você fez?' Respondeu a mulher: 'A serpente me enganou, e eu comi'." },
      { v: 14, t: "Então o Senhor Deus disse à serpente: 'Já que você fez isso, maldita é você entre todos os rebanhos domésticos e entre todos os animais selvagens! Sobre o seu ventre você rastejará, e pó comerá todos os dias da sua vida." },
      { v: 15, t: "Porei inimizade entre você e a mulher, entre a sua descendência e o descendente dela; este lhe ferirá a cabeça, e você lhe ferirá o calcanhar'." },
      { v: 16, t: "À mulher, ele declarou: 'Multiplicarei grandemente o seu sofrimento na gravidez; com sofrimento você dará à luz filhos. Seu desejo será para o seu marido, e ele a dominará'." },
      { v: 17, t: "E ao homem declarou: 'Visto que você deu ouvidos à sua mulher e comeu da árvore da qual eu lhe ordenara que não comesse, maldita é a terra por sua causa; com sofrimento você se alimentará dela todos os dias da sua vida." },
      { v: 18, t: "Ela lhe dará espinhos e ervas daninhas, e você terá que alimentar-se das plantas do campo." },
      { v: 19, t: "Com o suor do seu rosto você comerá o seu pão, até que volte à terra, visto que dela foi tirado; porque você é pó e ao pó voltará'." },
      { v: 20, t: "Adão deu à sua mulher o nome de Eva, pois ela seria mãe de toda a humanidade." },
      { v: 21, t: "O Senhor Deus fez roupas de pele e com elas vestiu Adão e sua mulher." },
      { v: 22, t: "Então disse o Senhor Deus: 'Agora o homem se tornou como um de nós, conhecendo o bem e o mal. Não se deve, pois, permitir que ele tome também do fruto da árvore da vida e o coma, e viva para sempre'." },
      { v: 23, t: "Por isso o Senhor Deus o mandou embora do jardim do Éden para cultivar o solo do qual fora tirado." },
      { v: 24, t: "Depois de expulsar o homem, colocou a leste do jardim do Éden querubins e uma espada flamejante que se movia, guardando o caminho para a árvore da vida." },
    ],
  },
  'Jo': {
    1: [
      { v: 1, t: "No princípio era aquele que é a Palavra. Ele estava com Deus e era Deus." },
      { v: 2, t: "Ele estava com Deus no princípio." },
      { v: 3, t: "Todas as coisas foram feitas por intermédio dele; sem ele, nada do que existe teria sido feito." },
      { v: 4, t: "Nele estava a vida, e esta era a luz dos homens." },
      { v: 5, t: "A luz brilha nas trevas, e as trevas não a derrotaram." },
      { v: 6, t: "Surgiu um homem enviado por Deus, chamado João." },
      { v: 7, t: "Ele veio como testemunha, para testificar acerca da luz, a fim de que por meio dele todos os homens cressem." },
      { v: 8, t: "Ele próprio não era a luz, mas veio como testemunha da luz." },
      { v: 9, t: "Este era a verdadeira luz, que vindo ao mundo, ilumina todo homem." },
      { v: 10, t: "Aquele que é a Palavra estava no mundo, e o mundo foi feito por intermédio dele, mas o mundo não o reconheceu." },
      { v: 11, t: "Veio para o que era seu, mas os seus não o receberam." },
      { v: 12, t: "Contudo, aos que o receberam, aos que creram em seu nome, deu-lhes o direito de se tornarem filhos de Deus," },
      { v: 13, t: "os quais não nasceram por descendência natural, nem pela vontade da carne nem pela vontade de algum homem, mas nasceram de Deus." },
      { v: 14, t: "Aquele que é a Palavra tornou-se carne e viveu entre nós. Vimos a sua glória, glória como do Unigênito vindo do Pai, cheio de graça e de verdade." },
      { v: 15, t: "João deu testemunho dele. Ele exclamou: 'Este é aquele de quem eu falei: O que vem depois de mim é superior a mim, porque já existia antes de mim'." },
      { v: 16, t: "Todos recebemos da sua plenitude, graça sobre graça." },
      { v: 17, t: "Pois a lei foi dada por meio de Moisés; a graça e a verdade vieram por meio de Jesus Cristo." },
      { v: 18, t: "Ninguém jamais viu a Deus, mas o Deus Unigênito, que está junto do Pai, o tornou conhecido." },
      { v: 19, t: "Este foi o testemunho de João, quando os judeus de Jerusalém enviaram sacerdotes e levitas para lhe perguntarem quem ele era." },
      { v: 20, t: "Ele confessou e não negou, declarando abertamente: 'Não sou o Cristo'." },
      { v: 21, t: "Perguntaram-lhe: 'Então, quem é você? É Elias?' Ele disse: 'Não sou'. 'É o Profeta?' Ele respondeu: 'Não'." },
      { v: 22, t: "Finalmente disseram: 'Quem é você? Dê-nos uma resposta, para que a levemos àqueles que nos enviaram. Que diz você acerca de si próprio?'" },
      { v: 23, t: "João respondeu com as palavras do profeta Isaías: 'Eu sou a voz do que clama no deserto: Endireitem o caminho para o Senhor'." },
      { v: 24, t: "Alguns fariseus que haviam sido enviados" },
      { v: 25, t: "interrogaram-no: 'Então, por que você batiza, se não é o Cristo, nem Elias, nem o Profeta?'" },
      { v: 26, t: "Respondeu João: 'Eu batizo com água, mas entre vocês está alguém que vocês não conhecem." },
      { v: 27, t: "Ele é aquele que vem depois de mim, e não sou digno de desamarrar as correias das suas sandálias'." },
      { v: 28, t: "Isso aconteceu em Betânia, no outro lado do Jordão, onde João estava batizando." },
      { v: 29, t: "No dia seguinte, João viu Jesus aproximando-se e disse: 'Vejam! É o Cordeiro de Deus, que tira o pecado do mundo!" },
      { v: 30, t: "Este é aquele a quem eu me referia quando disse: Vem depois de mim um homem que é superior a mim, porque já existia antes de mim." },
      { v: 31, t: "Eu mesmo não o conhecia, mas por isso é que vim batizando com água: para que ele viesse a ser revelado a Israel'." },
      { v: 32, t: "Então João deu o seguinte testemunho: 'Eu vi o Espírito descer dos céus como pomba e permanecer sobre ele." },
      { v: 33, t: "Eu não o teria reconhecido, se aquele que me enviou para batizar com água não me tivesse dito: Aquele sobre quem você vir o Espírito descer e permanecer, esse é o que batiza com o Espírito Santo." },
      { v: 34, t: "Eu vi e testifico que este é o Filho de Deus'." },
      { v: 35, t: "No dia seguinte, João estava ali outra vez com dois dos seus discípulos." },
      { v: 36, t: "Quando viu Jesus passando, disse: 'Vejam! É o Cordeiro de Deus!'" },
      { v: 37, t: "Ouvindo-o dizer isso, os dois discípulos seguiram Jesus." },
      { v: 38, t: "Voltando-se, Jesus viu que o seguiam e perguntou: 'O que vocês querem?' Eles disseram: 'Rabi (que significa 'Mestre'), onde estás hospedado?'" },
      { v: 39, t: "'Venham', respondeu ele, 'e verão'. Então foram, viram onde ele estava hospedado e passaram com ele aquele dia. Era quase a hora décima." },
      { v: 40, t: "André, irmão de Simão Pedro, era um dos dois que tinham ouvido o que João dissera e haviam seguido Jesus." },
      { v: 41, t: "O primeiro que ele fez foi procurar seu irmão Simão e dizer-lhe: 'Achamos o Messias' (isto é, o Cristo)." },
      { v: 42, t: "E o levou a Jesus. Jesus olhou para ele e disse: 'Você é Simão, filho de João. Será chamado Cefas' (que traduzido é Pedro)." },
      { v: 43, t: "No dia seguinte, Jesus decidiu partir para a Galileia. Encontrou Filipe e lhe disse: 'Siga-me'." },
      { v: 44, t: "Filipe, como André e Pedro, era da cidade de Betsaida." },
      { v: 45, t: "Filipe encontrou Natanael e lhe disse: 'Achamos aquele sobre quem Moisés escreveu na Lei, e a respeito de quem os profetas também escreveram: Jesus de Nazaré, filho de José'." },
      { v: 46, t: "'Nazaré?! Pode vir alguma coisa boa de lá?', perguntou Natanael. Disse Filipe: 'Venha e veja'." },
      { v: 47, t: "Ao ver Natanael se aproximando, disse Jesus: 'Aí está um verdadeiro israelita, em quem não há falsidade'." },
      { v: 48, t: "Perguntou Natanael: 'De onde me conheces?' Jesus respondeu: 'Eu o vi quando você ainda estava debaixo da figueira, antes de Filipe o chamar'." },
      { v: 49, t: "Então Natanael declarou: 'Mestre, tu és o Filho de Deus, tu és o Rei de Israel!'" },
      { v: 50, t: "Jesus disse: 'Você crê porque eu disse que o vi debaixo da figueira. Você verá coisas maiores do que essa!'" },
      { v: 51, t: "E então acrescentou: 'Digo a verdade: Vocês verão o céu aberto e os anjos de Deus subindo e descendo sobre o Filho do homem'." },
    ],
    3: [
      { v: 16, t: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
    ],
  },
  'Sl': {
    23: [
      { v: 1, t: "O Senhor é o meu pastor; nada me faltará." },
      { v: 2, t: "Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;" },
      { v: 3, t: "refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome." },
      { v: 4, t: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal nenhum, porque tu estás comigo; o teu bordão e o teu cajado me consolam." },
      { v: 5, t: "Preparas-me uma mesa na presença dos meus adversários, unges-me a cabeça com óleo; o meu cálice transborda." },
      { v: 6, t: "Bondade e misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor para todo o sempre." },
    ],
    91: [
      { v: 1, t: "Aquele que habita no abrigo do Altíssimo e descansa à sombra do Todo-poderoso" },
      { v: 2, t: "pode dizer ao Senhor: 'Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio'." },
      { v: 3, t: "Ele o livrará do laço do caçador e do veneno mortal." },
      { v: 4, t: "Ele o cobrirá com as suas penas, e sob as suas asas você encontrará refúgio; a fidelidade dele será o seu escudo protetor." },
      { v: 5, t: "Você não temerá o pavor da noite nem a flecha que voa de dia," },
      { v: 6, t: "nem a peste que se move sorrateira nas trevas, nem a praga que devasta ao meio-dia." },
      { v: 7, t: "Mil poderão cair ao seu lado, dez mil à sua direita, mas nada o atingirá." },
      { v: 8, t: "Você simplesmente olhará, e verá o castigo dos ímpios." },
      { v: 9, t: "Se você fizer do Altíssimo o seu abrigo, do Senhor o seu refúgio," },
      { v: 10, t: "nenhum mal o atingirá, nenhuma desgraça chegará à sua tenda." },
      { v: 11, t: "Porque a seus anjos ele dará ordens a seu respeito, para que o protejam em todos os seus caminhos;" },
      { v: 12, t: "com as mãos eles o segurarão, para que você não tropece em alguma pedra." },
      { v: 13, t: "Você pisará o leão e a cobra; pisoteará o leão forte e a serpente." },
      { v: 14, t: "'Porque ele me ama, eu o resgatarei; eu o protegerei, pois conhece o meu nome." },
      { v: 15, t: "Ele clamará a mim, e eu lhe darei resposta; estarei com ele na adversidade, eu o livrarei e o honrarei." },
      { v: 16, t: "Vida longa eu lhe darei, e lhe mostrarei a minha salvação'." },
    ],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, version } = await req.json();
    const versionCode = version || 'NVI';

    // Get version ID
    const { data: versionData } = await supabase
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (!versionData) {
      return new Response(
        JSON.stringify({ success: false, message: `Versão ${versionCode} não encontrada` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get book IDs
    const { data: booksData } = await supabase
      .from('bible_books')
      .select('id, abbreviation');

    if (!booksData) {
      return new Response(
        JSON.stringify({ success: false, message: 'Livros não encontrados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const bookMap: Record<string, string> = {};
    booksData.forEach(book => {
      bookMap[book.abbreviation] = book.id;
    });

    // Import real verses
    if (action === 'import-real-verses') {
      let totalUpdated = 0;

      for (const [bookAbbr, chapters] of Object.entries(realBibleTexts)) {
        const bookId = bookMap[bookAbbr];
        if (!bookId) {
          console.log(`Livro ${bookAbbr} não encontrado`);
          continue;
        }

        for (const [chapterNum, verses] of Object.entries(chapters)) {
          const chapter = parseInt(chapterNum, 10);
          
          for (const verse of verses) {
            // Update existing verse with real text
            const { error } = await supabase
              .from('bible_verses')
              .update({ text: verse.t })
              .eq('book_id', bookId)
              .eq('version_id', versionData.id)
              .eq('chapter', chapter)
              .eq('verse', verse.v);

            if (error) {
              // Try to insert if doesn't exist
              await supabase
                .from('bible_verses')
                .insert({
                  book_id: bookId,
                  version_id: versionData.id,
                  chapter,
                  verse: verse.v,
                  text: verse.t
                });
            }
            totalUpdated++;
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${totalUpdated} versículos REAIS atualizados para ${versionCode}!`,
          books: Object.keys(realBibleTexts)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Ação não reconhecida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
