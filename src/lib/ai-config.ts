/**
 * AI Model Configuration
 * 
 * כל שמות המודלים במקום אחד!
 * אם גוגל משנים שמות - מעדכנים רק פה.
 * 
 * Last updated: 2026-05-20
 * Docs: https://ai.google.dev/models/gemini
 */

export const AI_MODELS = {
  // Strongest model for complex reasoning when latency is less important.
  VISION_PRO: "gemini-3.1-pro-preview",
  
  // Best fast+strong default for text and vision analysis.
  TEXT_FAST: "gemini-3.5-flash",
  VISION_FAST: "gemini-3.5-flash",
  
  // For image generation tasks (Nano Banana 2)
  // Upgraded 2026-02-27: 63% faster than Nano Banana Pro!
  IMAGE_GEN: "gemini-3.1-flash-image-preview",
} as const;

// Base URL for Gemini API
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Helper to build full URL
export function getGeminiUrl(model: keyof typeof AI_MODELS): string {
  return `${GEMINI_BASE_URL}/${AI_MODELS[model]}:generateContent`;
}

// Model capabilities for reference
export const MODEL_CAPABILITIES = {
  [AI_MODELS.VISION_PRO]: {
    vision: true,
    text: true,
    maxTokens: 65536,
    description: "Gemini 3.1 Pro Preview - best for complex vision tasks"
  },
  [AI_MODELS.TEXT_FAST]: {
    vision: true,
    text: true,
    maxTokens: 65536,
    description: "Gemini 3.5 Flash - fastest strong default for text and vision analysis"
  },
  [AI_MODELS.IMAGE_GEN]: {
    vision: true,
    text: true,
    imageGeneration: true,
    maxTokens: 65536,
    description: "Nano Banana 2 - 63% faster, double output tokens"
  },
} as const;
