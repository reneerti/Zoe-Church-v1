/**
 * Base de Conhecimento Bíblico
 * 
 * Contém versículos populares, temas, e explicações para o chat
 */

export interface VerseData {
    reference: string;
    text: string;
    explanation: string;
    context?: string;
}

export interface TopicData {
    title: string;
    introduction: string;
    verses: Array<{
        reference: string;
        text: string;
    }>;
    application?: string;
}

export const biblicalKnowledge = {
    // Versículos mais populares com explicações
    popularVerses: {
        "joão 3:16": {
            reference: "João 3:16",
            text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
            explanation: "Este é um dos versículos mais conhecidos da Bíblia. Ele resume o evangelho: o amor incondicional de Deus pela humanidade, demonstrado através do sacrifício de Jesus Cristo. A salvação é oferecida a todos através da fé.",
            context: "Jesus estava conversando com Nicodemos, um líder religioso, explicando sobre o novo nascimento espiritual.",
        },

        "salmos 23:1": {
            reference: "Salmos 23:1",
            text: "O Senhor é o meu pastor; nada me faltará.",
            explanation: "Davi compara Deus a um pastor que cuida de suas ovelhas. Esta metáfora expressa total confiança na provisão, proteção e cuidado de Deus.",
            context: "Escrito por Davi, provavelmente inspirado em suas experiências como pastor de ovelhas antes de se tornar rei.",
        },

        "filipenses 4:13": {
            reference: "Filipenses 4:13",
            text: "Tudo posso naquele que me fortalece.",
            explanation: "Paulo declara que a verdadeira força vem de Cristo. Este versículo não é uma promessa de sucesso em tudo, mas de capacitação divina para enfrentar qualquer circunstância.",
            context: "Paulo escreveu esta carta da prisão, demonstrando contentamento mesmo em situações difíceis.",
        },

        "provérbios 3:5": {
            reference: "Provérbios 3:5-6",
            text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
            explanation: "Um chamado à confiança total em Deus, reconhecendo nossa limitação humana. Quando buscamos a Deus em tudo, Ele dirige nossos caminhos.",
            context: "Parte de uma coleção de provérbios sobre sabedoria e vida piedosa.",
        },

        "jeremias 29:11": {
            reference: "Jeremias 29:11",
            text: "Porque eu sei os planos que tenho para vós, diz o Senhor; planos de paz e não de mal, para vos dar o fim que esperais.",
            explanation: "Deus tem propósitos bons para seu povo. Mesmo em meio ao exílio, Ele promete esperança e futuro.",
            context: "Dito aos israelitas exilados na Babilônia, encorajando-os a confiar nos planos de Deus.",
        },

        "romanos 8:28": {
            reference: "Romanos 8:28",
            text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
            explanation: "Deus trabalha em todas as circunstâncias da vida para o bem final daqueles que O amam. Isso não significa que tudo é bom, mas que Deus pode usar tudo para Sua glória.",
            context: "Paulo explica a obra do Espírito Santo na vida dos crentes.",
        },

        "isaías 41:10": {
            reference: "Isaías 41:10",
            text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.",
            explanation: "Uma promessa poderosa de que Deus está presente conosco, fortalecendo e sustentando em tempos de dificuldade.",
            context: "Deus consola Israel, prometendo livramento e força.",
        },

        "mateus 11:28": {
            reference: "Mateus 11:28",
            text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.",
            explanation: "Jesus convida aqueles que estão sobrecarregados a encontrarem descanso Nele. Ele oferece alívio para nossas cargas espirituais e emocionais.",
            context: "Jesus estava ensinando sobre o verdadeiro descanso que vem Dele, não das tradições religiosas pesadas.",
        },
    },

    // Temas bíblicos organizados
    topics: {
        "fé": {
            title: "Fé",
            introduction: "A fé é a confiança em Deus e em Suas promessas, mesmo quando não vemos. É o fundamento da vida cristã.",
            verses: [
                {
                    reference: "Hebreus 11:1",
                    text: "Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que se não veem.",
                },
                {
                    reference: "Marcos 11:22",
                    text: "Tende fé em Deus.",
                },
                {
                    reference: "Romanos 10:17",
                    text: "A fé vem pelo ouvir, e o ouvir pela palavra de Cristo.",
                },
            ],
            application: "Fortaleça sua fé lendo a Palavra diariamente e confiando nas promessas de Deus, mesmo quando as circunstâncias parecem contrárias.",
        },

        "ansiedade": {
            title: "Ansiedade e Preocupação",
            introduction: "A Bíblia nos ensina a lançar nossas ansiedades sobre Deus, confiando em Seu cuidado perfeito.",
            verses: [
                {
                    reference: "Filipenses 4:6-7",
                    text: "Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas as vossas petições, diante de Deus, pela oração e pela súplica, com ações de graças.",
                },
                {
                    reference: "1 Pedro 5:7",
                    text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
                },
                {
                    reference: "Mateus 6:34",
                    text: "Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo.",
                },
            ],
            application: "Quando sentir ansiedade, pare e ore. Entregue suas preocupações a Deus e confie que Ele cuida de você.",
        },

        "amor": {
            title: "Amor de Deus",
            introduction: "O amor de Deus é incondicional, eterno e sacrificial. Ele nos amou primeiro e nos chama a amar uns aos outros.",
            verses: [
                {
                    reference: "João 3:16",
                    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
                },
                {
                    reference: "1 João 4:8",
                    text: "Deus é amor.",
                },
                {
                    reference: "Romanos 8:38-39",
                    text: "Nada poderá nos separar do amor de Deus, que está em Cristo Jesus, nosso Senhor.",
                },
            ],
            application: "Descanse no amor incondicional de Deus e deixe esse amor transbordar em suas relações com outros.",
        },

        "esperança": {
            title: "Esperança",
            introduction: "A esperança cristã não é um desejo vago, mas uma confiança certa baseada nas promessas de Deus.",
            verses: [
                {
                    reference: "Romanos 15:13",
                    text: "O Deus de esperança vos encha de todo o gozo e paz em crença, para que abundeis em esperança.",
                },
                {
                    reference: "Jeremias 29:11",
                    text: "Eu sei os planos que tenho para vós, diz o Senhor; planos de paz e não de mal.",
                },
                {
                    reference: "Salmos 42:5",
                    text: "Espera em Deus, pois ainda o louvarei.",
                },
            ],
            application: "Mesmo nos momentos difíceis, mantenha seus olhos em Deus e confie em Suas promessas.",
        },

        "perdão": {
            title: "Perdão",
            introduction: "Deus nos perdoou completamente através de Cristo e nos chama a perdoar aos outros da mesma forma.",
            verses: [
                {
                    reference: "Efésios 4:32",
                    text: "Antes, sede uns para com os outros benignos, compassivos, perdoando-vos uns aos outros, como também Deus, em Cristo, vos perdoou.",
                },
                {
                    reference: "Colossenses 3:13",
                    text: "Suportai-vos uns aos outros, perdoai-vos mutuamente, caso alguém tenha motivo de queixa contra outrem.",
                },
                {
                    reference: "1 João 1:9",
                    text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados.",
                },
            ],
            application: "Libere-se do peso da amargura perdoando aqueles que te magoaram, assim como Deus te perdoou.",
        },

        "força": {
            title: "Força em Deus",
            introduction: "Nossa força verdadeira vem de Deus. Quando estamos fracos, Ele é forte em nós.",
            verses: [
                {
                    reference: "Filipenses 4:13",
                    text: "Tudo posso naquele que me fortalece.",
                },
                {
                    reference: "Isaías 40:31",
                    text: "Os que esperam no Senhor renovam as suas forças.",
                },
                {
                    reference: "2 Coríntios 12:9",
                    text: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.",
                },
            ],
            application: "Quando se sentir fraco, busque força em Deus através da oração e meditação na Palavra.",
        },
    },
};
