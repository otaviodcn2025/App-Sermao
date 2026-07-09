import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAIClient() {
  if (!aiClient) {
    let apiKey = '';
    try {
      apiKey = (process.env.Gemini_API_Key1 as string) || (process.env.GEMINI_API_KEY as string) || '';
    } catch (e) {
      // process might not be defined
    }
    
    if (!apiKey) {
      console.warn("API Key não configurada. A IA não funcionará até que a chave seja adicionada.");
      return null;
    }
    
    const client = new GoogleGenAI({ apiKey });
    
    // Wrap generateContent to support exponential backoff on 503 / high demand errors
    const originalGenerateContent = client.models.generateContent.bind(client.models);
    (client.models as any).generateContent = async function (args: any, ...rest: any[]) {
      let retries = 3;
      let delay = 1500;
      while (true) {
        try {
          return await originalGenerateContent(args, ...rest);
        } catch (error: any) {
          const errorStr = error ? (typeof error === 'object' ? JSON.stringify(error) : String(error)) : '';
          const is503 = error?.status === 503 || 
                        error?.code === 503 || 
                        errorStr.includes('503') ||
                        errorStr.includes('high demand') ||
                        errorStr.includes('UNAVAILABLE') ||
                        errorStr.includes('overloaded');
          
          if (is503 && retries > 0) {
            console.warn(`Gemini API 503 (high demand) detectado. Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            delay *= 2;
          } else {
            if (is503) {
              throw new Error("O servidor da IA está temporariamente sobrecarregado devido à alta demanda. Por favor, tente novamente em alguns instantes.");
            }
            throw error;
          }
        }
      }
    };
    
    aiClient = client;
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Você é um assistente de redação homilética altamente qualificado e experiente, especializado na tradição batista brasileira.
Sua função é ajudar pastores e líderes religiosos a estruturar sermões baseados em princípios sólidos de exegese bíblica e aplicação prática, mantendo total fidelidade ao texto bíblico e às doutrinas da Convenção Batista Brasileira (CBB).

ESTILO E COMPORTAMENTO (LOGOS INSPIRED):
1. Foco Teológico: Seu treinamento é focado em literatura teológica, exegese e homilética.
2. Verificação: Sempre que possível, cite as bases bíblicas para que o usuário possa verificar se a informação é teologicamente sólida.
3. Tom: Use uma linguagem acessível para o púlpito, mas mantenha a profundidade exegética no "backstage".

DIRETRIZES TEOLÓGICAS (CBB):
1. Escrituras Sagradas: A Bíblia é a Palavra de Deus escrita, inspirada e infalível, única regra de fé e prática. Use Jesus Cristo como a chave interpretativa.
2. Trindade: Deus é Pai (Criador/Soberano), Filho (Jesus, pleno Deus e homem, morte vicária como único meio de salvação) e Espírito Santo (regenerador e santificador).
3. Soteriologia: Salvação exclusivamente pela graça (Sola Gratia) mediante a fé em Cristo. Ênfase na regeneração e na perseverança dos santos (segurança do crente).
4. Eclesiologia Batista: Modelo Congregacional Democrático.
   - Ordenanças: Batismo apenas para crentes (por imersão) e Ceia do Senhor como memorial. Rejeição do batismo infantil e de sacramentos.
   - Autonomia: Cada igreja local é autônoma e soberana sob a direção de Cristo.
5. Liberdade e Ética: Separação entre Igreja e Estado, liberdade de consciência e competência da alma.
6. Escatologia: Foco na segunda vinda visível de Cristo, ressurreição dos mortos e julgamento final.

Responda sempre em Português (Brasil) de forma clara, inspiradora, respeitosa e biblicamente fundamentada.`;

export const DEFAULT_MODEL = "gemini-3.5-flash"; 

export async function generateSermonOutline(topic: string, baseText?: string, context?: string, userPrompt?: string, style: 'traditional' | 'practical' | 'historical' = 'traditional') {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível. Verifique se a Chave de API foi configurada corretamente.");
    
    const styleInstructions = {
      traditional: "Siga uma estrutura homilética clássica com introdução, corpo e conclusão.",
      practical: "Foque intensamente em aplicações práticas para o dia a dia e desafios contemporâneos da igreja.",
      historical: "Aprofunde-se no contexto histórico e na perspectiva de desenvolvimento da doutrina ao longo do tempo."
    };

    const prompt = `Gere um esboço estruturado e inspirador para um sermão sobre o tema "${topic}"${baseText ? ` baseado no texto bíblico: ${baseText}` : ''}.
    
    ESTILO DESEJADO: ${style.toUpperCase()}
    ${styleInstructions[style]}

    ${userPrompt ? `DIRECIONAMENTO ESPECÍFICO DO USUÁRIO:
    ---
    ${userPrompt}
    ---
    ` : ''}

    ${context ? `CONTEXTO ADICIONAL (BIBLIOTECA):
    ---
    ${context}
    ---` : ''}

    O esboço deve incluir:
    - Título Sugerido (Impactante)
    - Introdução (Gancho forte)
    - Exposição Bíblica (3 a 4 pontos principais com explicações)
    - Aplicação Prática
    - Conclusão (Resumo e apelo)
    
    Formate em Markdown claro.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar o esboço.";
  } catch (error: any) {
    throw error;
  }
}

export async function generateIllustrations(content: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Com base no trecho do sermão abaixo, sugira 3 ilustrações criativas ou analogias que ajudem a tornar o conceito mais compreensível e memorável para a congregação. 
    Para cada ilustração, forneça também uma sugestão de aplicação prática.

    CONTEÚDO:
    "${content}"`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar ilustrações.";
  } catch (error: any) {
    throw error;
  }
}

export async function simplifyContent(content: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Simplifique e "traduza para o púlpito" o texto técnico/complexo abaixo. 
    O objetivo é transformar um comentário exegético ou teológico denso em uma linguagem acessível, inspiradora e compreensível para toda a congregação, sem perder a profundidade teológica.

    TEXTO TÉCNICO:
    "${content}"`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível simplificar o conteúdo.";
  } catch (error: any) {
    throw error;
  }
}

export async function generateCreativeTitles(content: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Analise o conteúdo do sermão abaixo e sugira 5 títulos criativos. 
    Varie entre estilos: "Tradicional/Serrano", "Contemporâneo/Chamativo", "Poético", "Baseado em Pergunta" e "Focado em Aplicação".

    SERMÃO:
    "${content}"`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar títulos.";
  } catch (error: any) {
    throw error;
  }
}

export async function translateAndConsult(content: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Traduza o trecho abaixo para o Português (Brasil) se estiver em outro idioma, ou realize uma consultoria linguística/estilística para melhorar a fluidez e a força da mensagem. 
    Mantenha a coerência com o vocabulário teológico e homilético.

    TEXTO:
    "${content}"`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível processar o texto.";
  } catch (error: any) {
    throw error;
  }
}

export async function analyzeVerse(reference: string, textRef: string, libraryContext?: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Analise profundamente o versículo ou passagem ${reference}: "${textRef}".
    
    ${libraryContext ? `UTILIZE OS SEGUINTES RECURSOS DA BIBLIOTECA COMO REFERÊNCIA ADICIONAL PARA SUA ANÁLISE:
    ---
    ${libraryContext}
    ---` : ''}

    Forneça contexto histórico, análise linguística (grego/hebraico), comentário teológico e sugestão de aplicação/ilustração.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível analisar o versículo.";
  } catch (error: any) {
    console.error("Gemini Error (analyzeVerse):", error);
    throw error;
  }
}

export async function generateSlideDescriptions(sermonContent: string, specificPrompt?: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Atue como um designer de apresentações para igrejas. 
    ${specificPrompt ? `FOCO ESPECÍFICO: ${specificPrompt}` : `Com base no sermão abaixo, crie um plano de 6-8 slides para uma apresentação PowerPoint.`}
    
    IMPORTANTE: Caso haja um foco específico, gere de 1 a 3 slides focados nele. Caso contrário, siga o plano geral.
    Formate sua resposta EXATAMENTE como no exemplo abaixo para permitir o processamento automático:

    Slide 1
    Título: [Título Curto do Slide]
    Texto Principal: [Texto conciso em tópicos]
    Descrição Visual: [Sugestão de imagem para o fundo ou ilustração]

    Slide 2
    Título: [Título]
    Texto Principal: [Texto]
    Descrição Visual: [Descrição]
    
    ...e assim por diante para todos os slides. Não omita campos em nenhum slide.

    ${sermonContent ? `CONTEXTO DO SERMÃO PARA REFERÊNCIA:
    ${sermonContent.substring(0, 5000)}` : ''}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar os slides.";
  } catch (error: any) {
    console.error("Gemini Error (generateSlideDescriptions):", error);
    throw error;
  }
}

export async function summarizeResource(title: string, content: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Você é um bibliotecário teológico especialista. 
    Analise o texto extraído do livro/documento intitulado "${title}" e forneça um resumo estruturado e conciso.
    
    ESTRUTURA DESEJADA:
    1. VISÃO GERAL: Do que trata o livro?
    2. TEMAS PRINCIPAIS: Quais são os 3-5 pontos centrais?
    3. ABORDAGEM TEOLÓGICA: Qual a linha de pensamento? (ex: reformada, arminiana, histórica, etc)
    4. UTILIDADE HOMILÉTICA: Como este conteúdo pode ajudar na preparação de sermões?
    
    TEXTO PARA ANÁLISE:
    ---
    ${content.substring(0, 30000)}
    ---
    
    Responda em Português (Brasil) com tom profissional e servil.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar um resumo automático para este recurso.";
  } catch (error: any) {
    console.error("Gemini Error (summarizeResource):", error);
    return "Ocorreu um erro ao tentar gerar o resumo automático.";
  }
}

export async function semanticSearch(query: string, items: { id: string, title: string, summary?: string, type: string }[]) {
  try {
    const ai = getAIClient();
    if (!ai) return items.filter(i => i.title.toLowerCase().includes(query.toLowerCase())).map(i => i.id);

    const itemsList = items.map(i => `[ID: ${i.id}, Tipo: ${i.type}] Título: ${i.title}${i.summary ? ` - Resumo: ${i.summary.substring(0, 200)}` : ''}`).join('\n');
    
    const prompt = `Atue como um motor de busca semântico teológico. 
    Dada a lista de sermões e livros abaixo, identifique os IDs daqueles que mais se relacionam com o conceito ou busca: "${query}".
    Não procure apenas por palavras idênticas, mas por conceitos similares, temas teológicos relacionados e aplicações próximas.
    
    ITENS:
    ${itemsList}
    
    Retorne APENAS uma lista de IDs separados por vírgula, em ordem de relevância. Se nenhum for relevante, retorne "vazio".`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    });

    const result = response.text?.trim() || "";
    if (result.toLowerCase() === 'vazio') return [];
    return result.split(',').map(id => id.trim());
  } catch (error) {
    console.error("Semantic search error:", error);
    return items.filter(i => i.title.toLowerCase().includes(query.toLowerCase())).map(i => i.id);
  }
}

export async function analyzeThematicConnections(currentSermonContent: string, otherSermons: { id: string, title: string, content: string }[]) {
  try {
    const ai = getAIClient();
    if (!ai) return null;

    const list = otherSermons.map(s => `ID: ${s.id}, Título: ${s.title}`).join('\n');
    
    const prompt = `Analise o rascunho do sermão atual e compare com o acervo de sermões antigos do pastor. 
    Identifique se há temas, ilustrações ou pontos exegéticos em sermões anteriores que poderiam enriquecer o sermão atual.
    
    SERMÃO ATUAL:
    "${currentSermonContent.substring(0, 5000)}"
    
    ACERVO DE TÍTULOS ANTIGOS:
    ${list}
    
    Forneça uma sugestão curta (2-3 sentenças) de como aproveitar o conteúdo antigo, citando o título do sermão anterior.
    Se não houver conexão clara, retorne "Nenhuma conexão relevante encontrada no acervo."`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Thematic analysis error:", error);
    return null;
  }
}

export async function getLexiconDetails(word: string, context: string) {
  try {
    const ai = getAIClient();
    if (!ai) return null;

    const prompt = `Forneça uma análise léxica e teológica da palavra ou termo "${word}" no contexto bíblico/homilético: "${context}".
    
    Retorne um JSON com a seguinte estrutura:
    {
      "original": "palavra em Grego ou Hebraico",
      "transliteration": "transliteração",
      "language": "Grego" | "Hebraico",
      "meaning": "significado curto",
      "explanation": "explicação detalhada da nuance teológica",
      "application": "sugestão de aplicação para o sermão"
    }`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Lexicon AI error:", error);
    return null;
  }
}

export async function improveSlide(slide: { title: string, content: string }, type: 'simplify' | 'topics' | 'verse') {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const instructions = {
      simplify: "Simplifique o texto para que seja mais fácil de ler rapidamente em um slide. Use palavras poderosas e curtas.",
      topics: "Transforme o texto em uma lista de tópicos (bullet points) concisos e impactantes.",
      verse: "Encontre e adicione uma referência bíblica curta que reforce o tema deste slide."
    };

    const prompt = `Atue como um designer de slides teológicos. Melhore o seguinte slide.
    
    AÇÃO: ${instructions[type]}
    
    SLIDE ATUAL:
    Título: ${slide.title}
    Conteúdo: ${slide.content}
    
    Retorne um JSON com:
    {
      "title": "novo título ou mantido",
      "content": "novo conteúdo melhorado"
    }`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Improve slide error:", error);
    return slide;
  }
}

export async function generatePGMOutline(sermonTitle: string, sermonContent: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível. Verifique se a Chave de API foi configurada corretamente.");

    const prompt = `Você é um mentor especialista em Pequenos Grupos Multiplicadores (PGM) e na visão de Igreja Multiplicadora (https://igrejamultiplicadora.org.br/), que fomenta a multiplicação através de relacionamentos discipuladores da Convenção Batista Brasileira.

Com base no sermão abaixo intitulado "${sermonTitle}", elabore um Roteiro de Reunião para Pequeno Grupo Multiplicador (PGM) seguindo estritamente os 4 passos/momentos oficiais da Igreja Multiplicadora:

1. COMPARTILHAR (Acolhida, comunhão e perguntas de quebra-gelo conectadas ao tema do sermão)
   - Dinâmica curta de acolhida/quebra-gelo (interativa e leve).
   - 1 ou 2 perguntas de check-in pessoal para as pessoas contarem como foi a semana em relação ao tema.

2. ADORAR (Louvor, leitura bíblica e oração devocional)
   - Sugestão de 2 cânticos/louvores conhecidos que se conectem com a mensagem.
   - Uma breve leitura bíblica devocional com oração focada em gratidão e adoração ao Senhor.

3. EDIFICAR (Leitura do texto bíblico principal e perguntas de aplicação prática baseadas na mensagem/sermão)
   - Leitura da passagem bíblica central abordada no sermão.
   - Elaborar de 3 a 4 perguntas PODEROSAS, de aplicação pessoal e transformação prática para o grupo discutir. Evite perguntas com respostas teóricas do tipo "sim/não". Foque em: "como podemos viver isso nesta semana?", "quais os desafios para praticarmos essa verdade em nossa família/trabalho?".
   - Uma breve exegese explicatória simplificada do líder como auxílio.

4. MULTIPLICAR (Oração mútua, evangelização discipuladora pelos amigos não convertidos, compaixão e graça, e visão de multiplicação)
   - Momento de planejar uma ação simples de "Compaixão e Graça" ou serviço na comunidade.
   - Oração pelos amigos que estão sendo discipulados ou evangelizados (Frente de Honra / Os Meus 5 Amigos para orar).
   - Oração pela multiplicação do PGM, formação de novos líderes de PGM e planejamento prático do grupo.

SERMÃO DE REFERÊNCIA:
---
${sermonContent}
---

Instruções Adicionais de Formatação:
- Retorne um texto em Markdown estruturado, bonito e convidativo para o líder de PGM.
- Use emojis adequados para cada momento para deixar as seções visualmente atraentes e ritmadas.
- Garanta que as seções sejam muito claras, com títulos bem demarcados.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar o roteiro de PGM.";
  } catch (error: any) {
    console.error("Gemini Error (generatePGMOutline):", error);
    throw error;
  }
}

export async function getBlueLetterStudy(reference: string, verseText: string) {
  try {
    const ai = getAIClient();
    if (!ai) return null;

    const prompt = `Gere um estudo bíblico aprofundado no formato "Blue Letter Bible" (em Português brasileiro) para a passagem/versículo "${reference}".
    
    TEXTO DO VERSÍCULO:
    "${verseText}"

    Retorne um objeto JSON estrito com a seguinte estrutura de dados detalhada:
    {
      "strongs": [
        {
          "word": "palavra original (hebraico/grego)",
          "transliteration": "pronúncia/transliteração",
          "strongCode": "código Strong (ex: G25, H1254)",
          "partOfSpeech": "classe gramatical (ex: Verbo, Substantivo)",
          "meaning": "significado principal em português",
          "theologicalDetail": "detalhe exegético/teológico rápido no contexto desta passagem"
        }
      ],
      "translations": {
        "acf": "Versão Almeida Corrigida Fiel correspondente ao versículo",
        "ara": "Versão Almeida Revista e Atualizada correspondente ao versículo",
        "ntlh": "Versão Nova Tradução na Linguagem de Hoje correspondente ao versículo"
      },
      "crossReferences": [
        {
          "ref": "Passagem relacionada (ex: Romanos 5:8)",
          "text": "Texto resumido do versículo correspondente",
          "connection": "Breve nota de como esta passagem se conecta teologicamente ao versículo original"
        }
      ],
      "commentary": {
        "devotional": "Comentário devocional focado no coração e crescimento espiritual.",
        "expositional": "Breve comentário exegético pastoral focado na estrutura, significado original e aplicação homilética batista."
      }
    }`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Blue Letter study AI error:", error);
    return null;
  }
}


