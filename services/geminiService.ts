import { GoogleGenAI } from "@google/genai";
import { Verb } from '../types';

let aiClient: GoogleGenAI | null = null;

// Initialize the client safely
try {
  if (process.env.API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini client", error);
}

export const generateVerbContext = async (verb: Verb): Promise<string | null> => {
  if (!aiClient) return null;

  try {
    const prompt = `Create a short, cool, and memorable sentence using the verb "${verb.infinitive}" in either Past Simple ("${verb.pastSimple}") or Past Participle ("${verb.pastParticiple}") form. 
    The sentence should be fun for a student. Mark the verb used in the sentence with asterisks like *${verb.pastSimple}*. 
    Keep it under 20 words.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating context:", error);
    return null;
  }
};

export const generateExplanation = async (verb: Verb, userPast: string, userParticiple: string): Promise<string | null> => {
  if (!aiClient) return null;
  
  try {
    const prompt = `A student incorrectly conjugated the verb "${verb.infinitive}". 
    They wrote Past: "${userPast}" and Participle: "${userParticiple}". 
    The correct forms are Past: "${verb.pastSimple}" and Participle: "${verb.pastParticiple}".
    Briefly explain the mistake or give a mnemonic to remember the correct form. Max 30 words. Tone: Encouraging coach.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
     console.error("Error generating explanation:", error);
     return null;
  }
}
