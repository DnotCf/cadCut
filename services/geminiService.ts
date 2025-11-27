import { GoogleGenAI, Type } from "@google/genai";
import { ValidationResponse } from '../types';

export const validateWktWithGemini = async (wkt: string): Promise<ValidationResponse> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing. Skipping AI validation.");
    return {
        isValid: true,
        description: "API Key missing, skipping AI validation.",
        geometryType: "Unknown"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze the following WKT (Well-Known Text) string representing a geometry.
      1. Determine if it is syntactically valid WKT.
      2. Identify the geometry type (e.g., POLYGON, MULTIPOLYGON).
      3. Provide a very brief, 1-sentence description of the shape (e.g., "A triangle with coordinates...").
      
      WKT: "${wkt}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            geometryType: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["isValid", "geometryType", "description"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
        isValid: result.isValid ?? false,
        geometryType: result.geometryType ?? "Unknown",
        description: result.description ?? "Could not analyze geometry.",
    };

  } catch (error) {
    console.error("Gemini validation error:", error);
    // Fallback if AI fails, assume valid to let user try processing
    return {
      isValid: true,
      geometryType: "Unverified",
      description: "AI validation failed, proceeding with raw input.",
    };
  }
};