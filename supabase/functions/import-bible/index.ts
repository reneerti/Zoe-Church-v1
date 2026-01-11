import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==========================================
// HARPA CRISTÃ - HINOS COMPLETOS
// ==========================================
const harpaHinos = [
  { hymn_number: 1, title: "Chuvas de Graça", author: "D. W. Whittle", 
    lyrics: `Chuvas de graça, chuvas pedimos,
Chuvas que venham do amor de Jesus!
Gotas preciosas, nós esperamos,
Benditas chuvas derrama, Jesus!

Chuvas de graça que nos animem,
Chuvas benditas nos vem conceder!
Gotas preciosas de alegria e vida,
Graça divina nos vem trazer!

Chuvas de graça nos são tão caras,
Ondas de amor vem sobre nós!
Dá-nos consolo e paz tão raras,
Chuvas de bênçãos, ó bom Jesus!`,
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
Coroai! Coroai!

Convosco, em toda a eternidade,
Eu quero exaltar
O Salvador da humanidade,
Coroai! Coroai!`,
    chorus: null },

  { hymn_number: 3, title: "Que Segurança", author: "Fanny J. Crosby",
    lyrics: `Que segurança! Sou de Jesus!
Oh! que prenúncio de glória e luz!
Herdeiro salvo só por amor,
Eis-me nascido do sangue remidor!

Perfeita paz, sim, gozo imortal,
Tenho em Jesus, meu Rei celestial!
Nele, meu braço, minha visão,
Tenho a certeza da minha salvação!

Perfeita calma, gozo real!
Deus me protege do todo mal!
Anjos de luz, guiando-me vão
Até que eu chegue à celeste mansão!`,
    chorus: `Esta é a minha história:
Louvar ao meu Senhor,
Por todo o dia, e a todo o instante,
Gozar do Seu favor!` },

  { hymn_number: 4, title: "Ao Deus de Abraão Louvai", author: "Thomas Olivers",
    lyrics: `Ao Deus de Abraão louvai!
Dominador e Senhor!
Eterno o Seu amor será,
Antigo de dias é.
O grande "Eu Sou" será
Da terra a benção até
Que as gerações findas são!

Ao Deus de Abraão louvai!
Por quem o bem nos dá.
Por Quem ao pecador, enfim,
Eterna vida dá.
Jeová, Deus nosso é,
O Deus da Glória celestial,
Ao Deus de Abraão louvai!`,
    chorus: null },

  { hymn_number: 5, title: "Tu És Fiel, Senhor", author: "Thomas O. Chisholm",
    lyrics: `Tu és fiel, Senhor, ó Pai celeste,
Tuas promessas cumprirás fielmente!
Tu que jamais mudaste em teu amor,
És sempre fiel, Senhor!

Paz de perdão, constante Tua presença,
Força em minha fraqueza, sim, me dás!
És meu abrigo, e nunca me abandonas,
És sempre fiel, Senhor!

Dia após dia, vou achar diante
Bênçãos e mercês do Teu favor.
Guias meus passos, tudo me supres,
És sempre fiel, Senhor!`,
    chorus: `Grande é a Tua fidelidade!
Grande é a Tua fidelidade!
Cada manhã Teu amor me sustém;
Grande é a Tua fidelidade, ó Deus!` },

  { hymn_number: 6, title: "Tudo Entregarei", author: "Judson W. Van DeVenter",
    lyrics: `Tudo entregarei a Jesus,
Tudo entregarei!
Eu quero amá-Lo e servi-Lo,
Tudo a Ele entregarei!

Em Suas mãos me rendo agora,
Sinto o Seu amor divino.
Sua bênção me dá vitória,
Tudo a Ele entregarei!

Oh, que alegria eu agora tenho!
Cristo me salvou e me guardou!
Amo a Jesus que me redimiu,
Tudo a Ele entregarei!`,
    chorus: `Tudo entregarei, tudo entregarei,
Tudo a Ti, meu bendito Salvador,
Tudo entregarei!` },

  { hymn_number: 7, title: "Santo! Santo! Santo!", author: "Reginald Heber",
    lyrics: `Santo! Santo! Santo! Deus onipotente!
Cedo de manhã cantaremos Teu louvor!
Santo! Santo! Santo! Justo e compassivo!
Trino Deus bendito, que és puro amor!

Santo! Santo! Santo! Todos os remidos,
Juntamente com os anjos, vão Te adorar!
Ante Ti se prostram, de esplendor vestidos,
Que antes de existir o mundo reinavas sem par!

Santo! Santo! Santo! Te ocultam as trevas!
Olhos pecadores não contemplam Tua luz!
Tu somente és Santo! Sobre tudo elevas,
Perfeito em poder, amor e virtude, ó Jesus!

Santo! Santo! Santo! Deus onipotente!
Tuas obras louvam Teu nome com fervor!
Santo! Santo! Santo! Justo e compassivo!
Trino Deus bendito, que és puro amor!`,
    chorus: null },

  { hymn_number: 8, title: "Grandioso És Tu", author: "Carl G. Boberg",
    lyrics: `Senhor, meu Deus, quando eu maravilhado
Fico a pensar nas obras de Tuas mãos,
No firmamento, Teu poder revelado,
E Tua glória enchendo terra e céus.

Quando através dos bosques e florestas
Ouço os passarinhos a cantar,
Olhando as grandes cordilheiras festas,
A natureza alegre exaltam-Te sem par.

Quando afinal Jesus em glória
Vier buscar os servos e levar,
E aos céus subirmos, dando-Lhe a vitória,
Meu coração irá clamar.`,
    chorus: `Então minh'alma canta a Ti, Senhor:
Grandioso és Tu! Grandioso és Tu!
Então minh'alma canta a Ti, Senhor:
Grandioso és Tu! Grandioso és Tu!` },

  { hymn_number: 9, title: "Rude Cruz", author: "George Bennard",
    lyrics: `Rude cruz se fez estandarte
A um soldado destemido e tão fiel;
E o exército marcha avante
Vendo em frente a cruz de Emanuel!

Não me envergonhei da cruz vazia!
Nela Jesus minha alma redimiu!
Pela cruz tão sua tão fagueira,
Um dia, enfim, a glória Ele me abriu!

Levarei eu sempre a minha cruz
Até aos pés de meu Senhor!
Um dia então me dará Jesus
Uma coroa de esplendor!`,
    chorus: `Sim, eu me glorio sempre na cruz!
Nela Jesus morreu por mim!
Até que enfim eu possa estar
Com Jesus lá no céu, sem fim!` },

  { hymn_number: 10, title: "Mais Perto Quero Estar", author: "Sarah F. Adams",
    lyrics: `Mais perto quero estar, meu Deus, de Ti!
Mesmo que seja a dor que me leve a Ti.
Sempre hei de suplicar:
Mais perto quero estar, mais perto de Ti!

Vagando triste aqui, meu Deus, sem Ti,
Bem sei que mesmo assim estás aqui.
Sempre hei de suplicar:
Mais perto quero estar, mais perto de Ti!

Chegando do meu Deus bem perto enfim,
Subindo já ao céu, feliz sem fim.
Sempre hei de suplicar:
Mais perto quero estar, mais perto de Ti!`,
    chorus: null },

  { hymn_number: 11, title: "Castelo Forte", author: "Martinho Lutero",
    lyrics: `Castelo forte é o nosso Deus,
Espada e bom escudo;
Com seu poder defende os seus
Em todo transe agudo.
Com fúria pertinaz
Persegue Satanás,
Com sanha e com poder,
Pois quer nos destruir,
Mas há de sucumbir!

Se nos quisessem devorar
Demônios não contados,
Não nos podiam assustar,
Nem somos derrotados.
O príncipe do mal
Com seu plano infernal
Já condenado está;
Quem o condenará
É Cristo, e cairá!

Que nos venham oprimir,
A Deus nos entregamos!
A fé não podem destruir,
Por ela triunfamos!
A Palavra fica e é
De Deus a nossa fé!
O reino de Jesus
Que nos trouxe a luz,
É nosso! Aleluia!`,
    chorus: null },

  { hymn_number: 12, title: "Quão Bondoso Amigo", author: "Joseph Scriven",
    lyrics: `Quão bondoso amigo é Cristo!
Leva Ele os nossos fardos!
É consolo sem igual
Podermos tudo a Ele contar!
Aflitos e perdidos,
A Jesus devemos ir.
Se a oração não O buscamos,
Que grande perda hemos de sentir!

Em tentações, em lutas,
Em quaisquer dificuldades,
Não devemos esmorecer;
Buscamos sempre a Sua graça!
Haverá maior amparo
Que este grande amigo, enfim?
Jesus bem conhece as lutas,
E há de interceder por mim!

Ó que grande privilégio!
Ter em Cristo um grande amigo!
Ele leva as aflições
Dos seus remidos, protegidos!
Não desprezem tal amigo,
Certos de que Ele vos quer bem!
Buscai sempre a Sua graça,
Confiai só Nele, amém!`,
    chorus: null },

  { hymn_number: 13, title: "Maravilhosa Graça", author: "John Newton",
    lyrics: `Maravilhosa graça! Que doce é o som!
Que salvou um pecador como eu!
Eu estava perdido, mas fui achado,
Era cego, mas agora eu vejo!

Foi a graça que me ensinou a temer,
E a graça aliviou meus medos.
Quão preciosa a graça me pareceu
Na hora em que eu primeiro cri!

Por muitos perigos, armadilhas e laços
Eu já passei com segurança.
A graça me trouxe até aqui
E a graça me levará ao lar!`,
    chorus: null },

  { hymn_number: 14, title: "Há um Bálsamo em Gileade", author: "Traditional",
    lyrics: `Há um bálsamo em Gileade
Que cura o pecador.
Há um bálsamo em Gileade
Que restaura o coração.

Às vezes me sinto triste,
E penso que tudo acabou,
Mas então o Espírito Santo
Aviva minh'alma com amor.

Se você não pode pregar como Pedro,
Se não pode orar como Paulo,
Vá dizer o amor de Jesus,
Que morreu para salvar a todos.`,
    chorus: `Há um bálsamo em Gileade
Que cura o pecador.
Há um bálsamo em Gileade
Que restaura o coração.` },

  { hymn_number: 15, title: "A Mensagem Real", author: "E. E. Hewitt",
    lyrics: `Proclamai a mensagem real!
A história de amor sem igual!
Quão grandioso Emanuel,
Salvador Jesus!

Ide já! Sem tardar, ide já!
Proclamai a mensagem sem par!
A Jesus, Salvador,
Dai, dai louvor!

A mensagem celeste é de paz!
A mensagem que muito nos traz!
É Jesus o Senhor,
Nosso Deus Salvador!`,
    chorus: `Ide já! Sem tardar, ide já!
Proclamai a mensagem sem par!
A Jesus, Salvador,
Dai, dai louvor!` },

  { hymn_number: 16, title: "Vencendo Vem Jesus", author: "John H. Yates",
    lyrics: `Vencendo vem Jesus, o grande Rei!
Vencendo vem Jesus, ó glória!
Sim, vencendo vem Jesus, o grande Rei!
Ele vem coroado de glória!

Quando Cristo voltar, que alegria!
Para os seus vem buscar, ó glória!
Quando Cristo voltar, que alegria!
Sim, Ele vem coroado de glória!

Vamos todos cantar, aleluia!
Aleluia ao nosso Rei de glória!
Vamos todos cantar, aleluia!
Sim, Ele vem coroado de glória!`,
    chorus: `Vencendo vem Jesus, o grande Rei!
Vencendo vem Jesus, ó glória!
Sim, vencendo vem Jesus, o grande Rei!
Ele vem coroado de glória!` },

  { hymn_number: 17, title: "Eis o Estandarte", author: "James McGranahan",
    lyrics: `Eis o estandarte: a cruz de Cristo!
Vinde a Jesus, vinde a Jesus!
Nela há perdão e vida eterna,
Vinde a Jesus, vinde a Jesus!

Deixa o pecado! Vem a Jesus!
Ele te ama e te dá perdão!
Vem, pecador, a Jesus!
Recebe a paz e a salvação!

Vinde, vinde ao Salvador!
Ele vos quer bem, Ele é amor!
Vem, pecador, arrepende-te já!
Cristo te espera e te salvará!`,
    chorus: `Vinde a Jesus, vinde a Jesus!
Há vida só na cruz!
Vinde agora ao Salvador,
Vinde a Jesus, vinde a Jesus!` },

  { hymn_number: 18, title: "Firme nas Promessas", author: "R. Kelso Carter",
    lyrics: `Firme nas promessas do meu Rei!
Eternamente cantarei!
Glória seja a Deus nas alturas!
Firme nas promessas de Jesus!

Firme nas promessas de Jesus!
Tenho plena paz, divina luz!
Firme nas promessas do Senhor,
Confio sempre em meu Salvador!

Firme nas promessas que não vão falhar!
Quando a tempestade vem rugir,
Firme sobre a rocha eterna sempre hei de estar,
Firme nas promessas de Jesus!`,
    chorus: `Firme, firme! Firme nas promessas de Jesus!
Firme, firme! Firme nas promessas de Jesus!` },

  { hymn_number: 19, title: "Conta as Bênçãos", author: "Johnson Oatman Jr.",
    lyrics: `Quando por lutas te sentires tentado
A reclamar de tua sorte chorar,
Conta as bênçãos, uma por uma conta,
E surpreso tu vais ficar!

Quando pensares que te falta algo,
Quando não teres o que desejas ter,
Conta as bênçãos e tu vais lembrar
Quanto Jesus te quer bem!

Então, meu irmão, se te assaltam tristezas,
Olha para a cruz e não desfalecerás!
Conta as bênçãos e assim verás
Que Deus teu Pai as bênçãos dá!`,
    chorus: `Conta as bênçãos! Uma por uma conta!
Conta as bênçãos! Vê o que Deus fez!
Conta as bênçãos! Uma por uma conta!
Conta as muitas bênçãos, vê o que Deus fez!` },

  { hymn_number: 20, title: "Ao Contemplar a Cruz", author: "Isaac Watts",
    lyrics: `Ao contemplar a rude cruz
Em que morreu o Rei Jesus,
Grandezas são de nenhum valor
Em vista do Seu grande amor.

Ó Cristo, assim não consintas
Que eu me glorie salvo em Ti!
O que mais me encanta e atrai
É o sangue que por mim fluiu!

Se o mundo todo meu fosse,
Mui pequena oferta seria!
Amor tão grande, tão profundo,
Merece a vida, a alma minha!`,
    chorus: null },
];

// ==========================================
// BÍBLIA NVI - GÊNESIS CAPÍTULOS 1-3 (EXEMPLO)
// ==========================================
const bibliaGenesis = {
  livro: 'Gn',
  capitulos: [
    {
      capitulo: 1,
      versiculos: [
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
      ]
    },
    {
      capitulo: 2,
      versiculos: [
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
      ]
    },
    {
      capitulo: 3,
      versiculos: [
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
      ]
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, batch } = await req.json();

    // ==========================================
    // IMPORTAR HARPA CRISTÃ
    // ==========================================
    if (action === 'import-harpa') {
      const startIndex = (batch || 0) * 20;
      const endIndex = startIndex + 20;
      const hinosToImport = harpaHinos.slice(startIndex, endIndex);

      if (hinosToImport.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'Todos os hinos já foram importados!', total: harpaHinos.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check which hymns already exist
      const { data: existing } = await supabase
        .from('harpa_hymns')
        .select('hymn_number')
        .in('hymn_number', hinosToImport.map(h => h.hymn_number));

      const existingNumbers = (existing || []).map(h => h.hymn_number);
      const hymnsToInsert = hinosToImport.filter(h => !existingNumbers.includes(h.hymn_number));

      if (hymnsToInsert.length > 0) {
        const { error } = await supabase.from('harpa_hymns').insert(hymnsToInsert);
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${hymnsToInsert.length} hinos importados (${startIndex + 1} a ${startIndex + hinosToImport.length})!`,
          nextBatch: endIndex < harpaHinos.length ? batch + 1 : null,
          total: harpaHinos.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // IMPORTAR BÍBLIA (GÊNESIS)
    // ==========================================
    if (action === 'import-bible') {
      // Get NVI version
      const { data: nviVersion } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('code', 'NVI')
        .single();

      if (!nviVersion) {
        return new Response(
          JSON.stringify({ error: 'Versão NVI não encontrada. Execute import-versions primeiro.' }),
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
          JSON.stringify({ error: 'Livro de Gênesis não encontrado.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const capituloIndex = batch || 0;
      const capitulo = bibliaGenesis.capitulos[capituloIndex];

      if (!capitulo) {
        return new Response(
          JSON.stringify({ success: true, message: 'Todos os capítulos já foram importados!', total: bibliaGenesis.capitulos.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if verses already exist
      const { data: existing } = await supabase
        .from('bible_verses')
        .select('verse')
        .eq('book_id', genesis.id)
        .eq('version_id', nviVersion.id)
        .eq('chapter', capitulo.capitulo);

      const existingVerses = (existing || []).map(v => v.verse);
      const versesToInsert = capitulo.versiculos
        .filter(v => !existingVerses.includes(v.v))
        .map(v => ({
          book_id: genesis.id,
          version_id: nviVersion.id,
          chapter: capitulo.capitulo,
          verse: v.v,
          text: v.t,
        }));

      if (versesToInsert.length > 0) {
        const { error } = await supabase.from('bible_verses').insert(versesToInsert);
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Gênesis ${capitulo.capitulo}: ${versesToInsert.length} versículos importados!`,
          nextBatch: capituloIndex + 1 < bibliaGenesis.capitulos.length ? capituloIndex + 1 : null,
          total: bibliaGenesis.capitulos.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // STATUS
    // ==========================================
    if (action === 'status') {
      const { count: hymnsCount } = await supabase
        .from('harpa_hymns')
        .select('*', { count: 'exact', head: true });

      const { count: versesCount } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact', head: true });

      const { count: booksCount } = await supabase
        .from('bible_books')
        .select('*', { count: 'exact', head: true });

      return new Response(
        JSON.stringify({ 
          success: true,
          harpaHymns: hymnsCount || 0,
          bibleVerses: versesCount || 0,
          bibleBooks: booksCount || 0,
          harpaTotal: 640,
          bibleTotal: 31102, // Total de versículos na Bíblia
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação desconhecida. Use: import-harpa, import-bible, status' }),
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
