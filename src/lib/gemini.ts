import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
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
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Você é um assistente de redação homilética altamente qualificado e experiente, especializado na tradição batista brasileira.
Sua função é ajudar pastores e líderes religiosos a estruturar sermões baseados em princípios sólidos de exegese bíblica e aplicação prática, mantendo total fidelidade ao texto bíblico e às doutrinas da Convenção Batista Brasileira (CBB).

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

const DEFAULT_MODEL = "gemini-3-flash-preview"; 

export async function generateSermonOutline(topic: string, baseText?: string, context?: string, userPrompt?: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível. Verifique se a Chave de API foi configurada corretamente.");
    
    const prompt = `Gere um esboço estruturado e inspirador para um sermão sobre o tema "${topic}"${baseText ? ` baseado no texto bíblico: ${baseText}` : ''}.
    
    ${userPrompt ? `DIRECIONAMENTO ESPECÍFICO DO USUÁRIO (SIGA ESTAS INSTRUÇÕES):
    ---
    ${userPrompt}
    ---
    ` : ''}

    ${context ? `UTILIZE AS INFORMAÇÕES ABAIXO COMO REFERÊNCIA E CONTEXTO ADICIONAL (BANCO DE DADOS DO USUÁRIO):
    ---
    ${context}
    ---
    
    Tente manter o estilo das informações acima se elas forem sermões ou notas pessoais.` : ''}

    O esboço deve ser rico em conteúdo e incluir:
    - Título Sugerido (Impactante)
    - Introdução (Gancho forte)
    - Exposição Bíblica (3 a 4 pontos principais com explicações e verdades centrais)
    - Aplicação Prática (Como o ouvinte deve agir)
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
    console.error("Gemini Error (generateSermonOutline):", error);
    if (error?.message?.includes("404") || error?.message?.includes("not found")) {
      throw new Error(`Modelo '${DEFAULT_MODEL}' não encontrado. Por favor, verifique se sua API Key tem acesso a este modelo.`);
    }
    if (error?.message?.includes("API_KEY") || error?.message?.includes("key") || error?.message?.includes("authenticated")) {
      throw new Error("Erro na Chave de API. Por favor, verifique se a GEMINI_API_KEY ou Gemini_API_Key1 está configurada corretamente.");
    }
    if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("demand")) {
      throw new Error("O servidor de IA está com alta demanda ou você atingiu o limite de cota. Por favor, tente novamente em instantes.");
    }
    throw new Error(error?.message || "Erro desconhecido na geração do esboço.");
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
    if (error?.message?.includes("404") || error?.message?.includes("not found")) {
      throw new Error(`Modelo '${DEFAULT_MODEL}' não encontrado.`);
    }
    if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("demand")) {
      throw new Error("O servidor de IA está com alta demanda ou quota esgotada.");
    }
    throw new Error(error?.message || "Erro desconhecido na análise do versículo.");
  }
}

export async function generateSlideDescriptions(sermonContent: string) {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("IA não disponível.");

    const prompt = `Com base no sermão abaixo, crie um plano de 6-8 slides para uma apresentação PowerPoint. 
    
    IMPORTANTE: Formate sua resposta EXATAMENTE como no exemplo abaixo para permitir o processamento automático:

    Slide 1
    Título: [Título Curto do Slide]
    Texto Principal: [Texto conciso em tópicos]
    Descrição Visual: [Sugestão de imagem para o fundo ou ilustração]

    Slide 2
    Título: ...
    e assim por diante.

    Sermão:
    ${sermonContent}`;

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
    if (error?.message?.includes("404") || error?.message?.includes("not found")) {
      throw new Error(`Modelo '${DEFAULT_MODEL}' não encontrado.`);
    }
    if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("demand")) {
      throw new Error("O servidor de IA está com alta demanda ou quota esgotada.");
    }
    throw new Error(error?.message || "Erro desconhecido na geração de slides.");
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
