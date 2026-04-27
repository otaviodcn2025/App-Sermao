import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `Você é um assistente de redação homilética altamente qualificado. 
Sua função é ajudar pastores a estruturar sermões baseados em princípios de exegese bíblica, mantendo a fidelidade ao texto original.
Você deve ser capaz de:
1. Gerar esboços estruturados (Introdução, Exposição, Aplicação).
2. Fornecer contexto histórico e linguístico para versículos.
3. Sugerir ilustrações e aplicações práticas.
4. Expandir comentários teológicos.
Responda sempre em Português (Brasil) a menos que solicitado o contrário.`;

export async function generateSermonOutline(topic: string, baseText?: string) {
  const prompt = `Gere um esboço estruturado para um sermão sobre o tema "${topic}"${baseText ? ` baseado no texto bíblico: ${baseText}` : ''}. O esboço deve incluir:
  - Título Sugerido
  - Introdução (com gancho e frase de transição)
  - Pontos Principais da Exposição (com referências e breves explicações)
  - Aplicação Prática
  - Conclusão`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

export async function analyzeVerse(reference: string, text: string) {
  const prompt = `Analise o versículo ${reference}: "${text}".
  Forneça:
  1. Contexto Histórico: O que estava acontecendo na época?
  2. Contexto Linguístico: Significado de palavras-chave no original (Hebraico/Grego).
  3. Comentário Teológico: Qual a mensagem central?
  4. Sugestão de Aplicação: Como isso se aplica hoje?`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

export async function generateSlideDescriptions(sermonContent: string) {
  const prompt = `Com base no seguinte esboço de sermão, descreva visuais para 5-7 slides de apresentação. Para cada slide, forneça:
  - Título do Slide
  - Texto Principal
  - Sugestão de Imagem de Fundo (descrição para um gerador de imagens)
  
  Sermão:
  ${sermonContent}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}
