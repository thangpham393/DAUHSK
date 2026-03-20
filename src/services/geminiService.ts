import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface WordDetails {
  word: string;
  pinyin: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

export async function fetchWordDetails(word: string): Promise<WordDetails> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide details for the Chinese word: "${word}". Include pinyin, Vietnamese meaning, a common example sentence in Chinese, and its Vietnamese translation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          pinyin: { type: Type.STRING },
          meaning: { type: Type.STRING },
          example: { type: Type.STRING },
          exampleMeaning: { type: Type.STRING },
        },
        required: ["word", "pinyin", "meaning", "example", "exampleMeaning"],
      },
    },
  });

  try {
    const details = JSON.parse(response.text || '{}');
    return details;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Failed to fetch word details");
  }
}
