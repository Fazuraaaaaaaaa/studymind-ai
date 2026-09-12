import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mengutamakan model Pro untuk hasil analisa dan output JSON yang jauh lebih cerdas & berkualitas.
export const CANDIDATE_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-pro-latest",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
];

export async function generateWithFallback(options: {
  contents: any[];
  config?: any;
}) {
  if (!ai) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed with:`, err.message || err);
      lastError = err;
      // Lanjut ke model berikutnya jika error
    }
  }

  throw lastError || new Error("Semua model AI sedang sibuk. Silakan coba beberapa saat lagi.");
}
