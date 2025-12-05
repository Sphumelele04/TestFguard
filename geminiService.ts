import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, GeminiModel } from "../types";

// Helper to get the API key safely
const getApiKey = () => process.env.API_KEY || '';

export const analyzeReceiptImage = async (base64Image: string, mimeType: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `
    Analyze this receipt image for a banking security app. 
    Extract the merchant name, total amount, date, list of items, and category.
    Also, perform a fraud analysis: does this look like a legitimate receipt or a fake/tempered one?
    Rate the suspicion level from 0 to 100.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.VISION,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            total: { type: Type.NUMBER },
            date: { type: Type.STRING },
            items: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            category: { type: Type.STRING },
            suspicionLevel: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["merchant", "total", "category", "suspicionLevel"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResponse;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const analyzeTransactionText = async (transactionDescription: string): Promise<{ riskScore: number, reason: string }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.TEXT,
      contents: `Analyze this transaction for fraud risk: "${transactionDescription}". Return JSON with riskScore (0-100) and reason.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No analysis generated");
  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    return { riskScore: 50, reason: "Analysis failed, defaulting to medium risk." };
  }
};