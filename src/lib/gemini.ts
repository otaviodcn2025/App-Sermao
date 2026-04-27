import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `Você é um assistente de redação homilética altamente qualificado e experiente. 
Sua função é ajudar pastores e líderes religiosos a estruturar sermões baseados em princípios sólidos de exegese bíblica e aplicação prática, mantendo total fidelidade ao texto bíblico.
Você deve ser capaz de:
1. Gerar esboços estruturados (Introdução, Exposição, Aplicação e Conclusão).
2. Fornecer contexto histórico, geográfico e linguístico para versículos bíblicos.
3. Sugerir ilustrações criativas e aplicações pertinentes ao cotidiano.
4. Expandir comentários teológicos e exegéticos.
5. Identificar temas centrais e subtemas em passagens bíblicas.

Responda sempre em Português (Brasil) progressivamente e de forma clara e inspiradora.`;

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function generateSermonOutline(topic: string, baseText?: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const prompt = `Gere um esboço estruturado e inspirador para um sermão sobre o tema "${topic}"${baseText ? ` baseado no texto bíblico: ${baseText}` : ''}. O esboço deve ser rico em conteúdo e incluir:
  - Título Sugerido (Impactante)
  - Introdução (Gancho inicial forte e frase de transição para o texto principal)
  - Exposição Bíblica (3 a 4 pontos principais, cada um com uma explicação teológica, uma conexão com o contexto original e uma verdade central)
  - Aplicação Prática (Como o ouvinte deve agir com base nesta mensagem)
  - Conclusão (Resumo e apelo final)
  
  Formate o texto de forma clara com títulos e separações.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

export async function analyzeVerse(reference: string, text: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const prompt = `Analise profundamente o versículo ou passagem ${reference}: "${text}".
  Forneça um estudo exegético completo contendo:
  1. Contexto Histórico e Geográfico: O que estava acontecendo quando isso foi escrito?
  2. Análise Linguística: Explique termos cruciais no grego ou hebraico originais que enriquecem o entendimento.
  3. Comentário Teológico: Qual a doutrina ou verdade eterna revelada aqui?
  4. Sugestão de Ilustração: Uma história ou analogia que ajude a explicar este versículo.
  5. Aplicação para a Igreja: Como o pastor pode pregar isso para a congregação hoje?`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

export async function generateSlideDescriptions(sermonContent: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const prompt = `Com base no seguinte conteúdo de sermão, crie um plano de 6 a 8 slides para uma apresentação visual. 
  Para cada slide, forneça:
  - Título do Slide: (Ex: Ponto 1: A Esperança no Sofrimento)
  - Texto para o Slide: (Frase curta e impactante para estar no slide)
  - Descrição Visual: (Uma descrição detalhada de uma imagem de fundo que combine com a mensagem do slide, ideal para um gerador de imagens IA)
  
  Conteúdo do Sermão:
  ${sermonContent}`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

