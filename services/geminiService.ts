
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const generateFunQuestion = async (topic?: string): Promise<string> => {
  const prompt = topic
    ? `Generate one fun, engaging, and short game show question about: ${topic}. Keep it brief, under 15 words.`
    : `Generate one fun, surprising, or provocative game show question for a group of 5 friends. Keep it brief, under 15 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.95,
      }
    });

    return response.text?.trim() || "What is your biggest secret?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "What is your favorite memory of this group?";
  }
};
