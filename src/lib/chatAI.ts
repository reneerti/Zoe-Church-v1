/**
 * Sistema de IA Emulada para Chat Bíblico
 * 
 * Fornece respostas inteligentes sem depender de APIs externas,
 * funcionando 100% offline com análise semântica de intenções.
 */

import { biblicalKnowledge } from './biblicalKnowledge';

// Mensagem de orientação pastoral
const PASTORAL_GUIDANCE = "\n\n💡 **Lembre-se:** Para questões mais profundas ou situações pessoais, é sempre importante conversar com seu pastor, pastora ou líder espiritual mais próximo. Eles poderão te orientar melhor e orar com você! 🙏";

export interface ChatContext {
    userId: string;
    recentVerses?: string[];
    favorites?: string[];
    lastReadBook?: string;
    lastReadChapter?: number;
}

export type IntentType =
    | 'greeting'
    | 'verse_search'
    | 'verse_explanation'
    | 'topic_question'
    | 'prayer_request'
    | 'devotional'
    | 'encouragement'
    | 'general';

// Banco de respostas categorizadas
const responses = {
    greeting: [
        "Olá! 👋 Paz do Senhor! Como posso ajudá-lo hoje?",
        "Seja bem-vindo(a)! 🙏 Em que posso auxiliá-lo em sua jornada espiritual?",
        "Oi! Que bom ter você aqui! Como posso te ajudar a se aproximar mais de Deus?",
    ],

    farewell: [
        "Que Deus abençoe você! 🙏 Estou aqui sempre que precisar.",
        "Fique com Deus! ✨ Volte sempre que quiser conversar.",
        "Até logo! Que o Senhor te guarde! 🌟",
    ],

    thanks: [
        "Por nada! Fico feliz em poder ajudar! 😊",
        "É sempre um prazer! Que Deus te abençoe! 🙏",
        "Estou aqui para isso! Glória a Deus! ✨",
    ],

    encouragement: [
        "Lembre-se de Filipenses 4:13 - 'Tudo posso naquele que me fortalece.' 💪",
        "Deus tem um propósito maravilhoso para sua vida! Continue firme na fé! 🌟",
        "Isaías 41:10 nos diz: 'Não temas, porque eu sou contigo.' Ele está com você! 🙏",
    ],

    unknown: [
        `Desculpe, não entendi bem sua pergunta. Posso te ajudar com:\n• Buscar versículos bíblicos\n• Explicar passagens\n• Falar sobre temas como fé, esperança, amor\n• Compartilhar palavras de encorajamento${PASTORAL_GUIDANCE}`,
        `Hmm, não tenho certeza sobre isso. Que tal perguntar de outra forma? Posso te ajudar com versículos, explicações bíblicas e palavras de encorajamento! 🙏${PASTORAL_GUIDANCE}`,
    ],
};

/**
 * Analisa a intenção da mensagem do usuário
 */
export function analyzeIntent(message: string): IntentType {
    const lower = message.toLowerCase().trim();

    // Saudações
    if (/^(oi|olá|ola|hey|bom dia|boa tarde|boa noite|e aí|eai)/i.test(lower)) {
        return 'greeting';
    }

    // Despedidas
    if (/(tchau|adeus|até logo|até mais|falou|flw)/i.test(lower)) {
        return 'greeting'; // Retorna saudação para responder com despedida
    }

    // Agradecimentos
    if (/(obrigad|valeu|agradeço|thanks)/i.test(lower)) {
        return 'greeting'; // Retorna saudação para responder com "de nada"
    }

    // Busca de versículos (referências específicas)
    if (/\b\d+:\d+|\bcapítulo\s+\d+|versículo|verso|passagem/i.test(lower)) {
        return 'verse_search';
    }

    // Pedido de explicação
    if (/(o que significa|explique|interprete|contexto|entender|compreender)/i.test(lower)) {
        return 'verse_explanation';
    }

    // Perguntas sobre temas (formato ampliado)
    if (/(o que.*diz sobre|fale sobre|me fale|o que a bíblia|segundo a bíblia|como.*crescer|como.*ter|como.*vencer|como posso|sobre|temas? sobre)/i.test(lower)) {
        return 'topic_question';
    }

    // Oração/Intercessão
    if (/(ore por|oração|interceder|preciso de oração|pray)/i.test(lower)) {
        return 'prayer_request';
    }

    // Pedido de encorajamento
    if (/(preciso|me ajude|estou|sinto|desanimad|trist|ansios|preocupad)/i.test(lower)) {
        return 'encouragement';
    }

    // Devocional
    if (/(devocional|meditação|reflexão|palavra do dia)/i.test(lower)) {
        return 'devotional';
    }

    return 'general';
}

/**
 * Extrai referências bíblicas da mensagem
 * Exemplo: "joão 3:16" -> { book: "joão", chapter: 3, verse: 16 }
 */
export function extractVerseReference(message: string): { book: string; chapter?: number; verse?: number } | null {
    const lower = message.toLowerCase();

    // Padrão: "livro capítulo:versículo" ou "livro capítulo"
    const match = lower.match(/(\w+)\s+(\d+)(?::(\d+))?/);

    if (match) {
        return {
            book: match[1],
            chapter: match[2] ? parseInt(match[2]) : undefined,
            verse: match[3] ? parseInt(match[3]) : undefined,
        };
    }

    return null;
}

/**
 * Identifica o tema principal da pergunta
 */
export function extractTopic(message: string): string | null {
    const lower = message.toLowerCase();

    // Variações de palavras-chave por tema
    const topicVariants: Record<string, string[]> = {
        'fé': ['fé', 'fe', 'crer', 'acreditar', 'confiar', 'crescer na fé', 'crescer na fe', 'crescimento espiritual'],
        'ansiedade': ['ansiedade', 'ansiedad', 'ansioso', 'preocupação', 'preocupar', 'medo', 'preocupado'],
        'amor': ['amor', 'amar', 'caridade', 'amado', 'amo'],
        'esperança': ['esperança', 'esperar', 'esperanca', 'esperançar'],
        'perdão': ['perdão', 'perdoar', 'perdao', 'perdoado'],
        'força': ['força', 'forca', 'fortalecer', 'vigor', 'fortalecido', 'forte'],
    };

    // Primeiro tenta variações de palavras-chave
    for (const [topic, keywords] of Object.entries(topicVariants)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return topic;
        }
    }

    // Depois tenta match exato com os tópicos disponíveis
    const topics = Object.keys(biblicalKnowledge.topics);
    for (const topic of topics) {
        if (lower.includes(topic)) {
            return topic;
        }
    }

    return null;
}

/**
 * Gera uma resposta baseada na intenção e contexto
 */
export async function generateResponse(
    message: string,
    context: ChatContext
): Promise<string> {
    const intent = analyzeIntent(message);
    const lower = message.toLowerCase();

    // Despedidas
    if (/(tchau|adeus|até logo|até mais|falou)/i.test(lower)) {
        return getRandomItem(responses.farewell);
    }

    // Agradecimentos
    if (/(obrigad|valeu|agradeço)/i.test(lower)) {
        return getRandomItem(responses.thanks);
    }

    switch (intent) {
        case 'greeting':
            return getRandomItem(responses.greeting);

        case 'verse_search':
            return handleVerseSearch(message, context);

        case 'verse_explanation':
            return handleVerseExplanation(message, context);

        case 'topic_question':
            return handleTopicQuestion(message);

        case 'prayer_request':
            return handlePrayerRequest(message);

        case 'encouragement':
            return handleEncouragement(message);

        case 'devotional':
            return handleDevotional();

        default:
            return getRandomItem(responses.unknown);
    }
}

/**
 * Processa busca de versículos
 */
function handleVerseSearch(message: string, context: ChatContext): string {
    const ref = extractVerseReference(message);

    if (!ref) {
        return "Por favor, me informe qual versículo você gostaria de ver. Por exemplo: 'João 3:16' ou 'Salmos 23'.";
    }

    // Verifica na base de conhecimento
    const verseKey = `${ref.book} ${ref.chapter}:${ref.verse || 1}`;
    const verse = biblicalKnowledge.popularVerses[verseKey.toLowerCase()];

    if (verse) {
        return `📖 **${verse.reference}**\n\n"${verse.text}"\n\n${verse.explanation}`;
    }

    // Se não encontrou, sugere usar a Bíblia do app
    return `Não tenho esse versículo memorizado ainda, mas você pode encontrá-lo facilmente na seção de Bíblia do aplicativo! 📖\n\nQue tal eu te ajudar com algum tema específico enquanto isso?`;
}

/**
 * Processa explicações de versículos
 */
function handleVerseExplanation(message: string, context: ChatContext): string {
    const ref = extractVerseReference(message);

    if (ref) {
        const verseKey = `${ref.book} ${ref.chapter}:${ref.verse || 1}`;
        const verse = biblicalKnowledge.popularVerses[verseKey.toLowerCase()];

        if (verse) {
            return `📖 **${verse.reference}**\n\n"${verse.text}"\n\n**Explicação:**\n${verse.explanation}\n\n**Contexto:**\n${verse.context || 'Este versículo faz parte de um ensinamento mais amplo sobre a vida cristã.'}`;
        }
    }

    // Sugestão baseada no último livro lido
    if (context.lastReadBook) {
        return `Vejo que você tem lido ${context.lastReadBook}! Esse é um livro maravilhoso. Você tem alguma passagem específica desse livro que gostaria que eu explicasse?`;
    }

    return "Qual versículo você gostaria que eu explicasse? Pode me dizer a referência completa, como 'João 3:16'. 📖";
}

/**
 * Processa perguntas sobre temas
 */
function handleTopicQuestion(message: string): string {
    const topic = extractTopic(message);

    if (topic && biblicalKnowledge.topics[topic]) {
        const topicData = biblicalKnowledge.topics[topic];
        let response = `🙏 **${topicData.title}**\n\n${topicData.introduction}\n\n**Versículos Relacionados:**\n`;

        topicData.verses.forEach(v => {
            response += `\n📖 **${v.reference}**: "${v.text}"`;
        });

        if (topicData.application) {
            response += `\n\n**Aplicação Prática:**\n${topicData.application}`;
        }

        return response;
    }

    // Se não encontrou o tema, sugere temas disponíveis
    const availableTopics = Object.keys(biblicalKnowledge.topics).slice(0, 5).join(', ');
    return `Posso te ajudar com vários temas bíblicos! Alguns exemplos são: ${availableTopics}.\n\nSobre qual deles você gostaria de saber mais?`;
}

/**
 * Processa pedidos de oração
 */
function handlePrayerRequest(message: string): string {
    return `🙏 Vou clamar ao Senhor por você!\n\n"Tudo quanto pedirdes em oração, crendo, recebereis." - Mateus 21:22\n\nLembre-se que Deus está sempre ouvindo suas orações. Continue perseverando na fé! ✨\n\nGostaria de compartilhar algo mais específico para que eu possa te encorajar com a Palavra?`;
}

/**
 * Processa pedidos de encorajamento
 */
function handleEncouragement(message: string): string {
    const lower = message.toLowerCase();

    // Identifica sentimentos específicos
    if (/ansios|preocup|medo/.test(lower)) {
        const topic = biblicalKnowledge.topics['ansiedade'];
        if (topic) {
            return `💙 Entendo que você está passando por um momento difícil.\n\n${topic.introduction}\n\n📖 ${topic.verses[0].reference}: "${topic.verses[0].text}"\n\nDeus está com você! 🙏${PASTORAL_GUIDANCE}`;
        }
    }

    if (/trist|desanim|dores?|sofr/.test(lower)) {
        return `💛 Sinto muito que você esteja passando por isso.\n\n"O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido." - Salmos 34:18\n\nEle conhece sua dor e está bem ao seu lado. Continue confiando! 🙏${PASTORAL_GUIDANCE}`;
    }

    // Encorajamento geral
    return getRandomItem(responses.encouragement);
}

/**
 * Gera devocional do dia
 */
function handleDevotional(): string {
    const devotionals = [
        {
            title: "Confiança em Deus",
            verse: "Provérbios 3:5-6",
            text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.",
            reflection: "Hoje, escolha confiar em Deus mesmo quando não entender os caminhos que Ele está te levando. Sua sabedoria supera todo entendimento humano.",
        },
        {
            title: "Força Renovada",
            verse: "Isaías 40:31",
            text: "Mas os que esperam no Senhor renovam as suas forças, sobem com asas como águias.",
            reflection: "Nas dificuldades, espere no Senhor. Ele promete renovar suas forças e te dar a capacidade de voar acima das circunstâncias.",
        },
        {
            title: "Paz de Deus",
            verse: "Filipenses 4:6-7",
            text: "Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas as vossas petições.",
            reflection: "Leve suas preocupações a Deus em oração. Sua paz, que excede todo entendimento, guardará seu coração.",
        },
    ];

    const devotional = getRandomItem(devotionals);

    return `📖 **Devocional: ${devotional.title}**\n\n**${devotional.verse}**\n"${devotional.text}"\n\n**Reflexão:**\n${devotional.reflection}\n\n🙏 Que essa palavra toque seu coração hoje!`;
}

/**
 * Utilitário para pegar item aleatório de array
 */
function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gera sugestões contextuais baseadas no histórico
 */
export function getContextualSuggestions(context: ChatContext): string[] {
    const suggestions = [
        "O que a Bíblia diz sobre fé?",
        "Me mostre um versículo de encorajamento",
        "Explique João 3:16",
        "Preciso de uma palavra de esperança",
    ];

    // Adiciona sugestão baseada no último livro lido
    if (context.lastReadBook && context.lastReadChapter) {
        suggestions.unshift(`Me fale sobre ${context.lastReadBook} capítulo ${context.lastReadChapter}`);
    }

    return suggestions;
}
