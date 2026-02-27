/**
 * AI Model Configuration
 * 
 * כל שמות המודלים במקום אחד!
 * אם גוגל משנים שמות - מעדכנים רק פה.
 * 
 * Last updated: 2026-02-27
 * Docs: https://ai.google.dev/models/gemini
 */

export const AI_MODELS = {
  // For text + vision tasks (receipt scanning, quote analysis, etc.)
  VISION_PRO: "gemini-3-pro-preview",
  
  // For fast text tasks (chat support, simple Q&A)
  TEXT_FAST: "gemini-3-flash-preview",
  
  // For image generation + all AI tasks (Nano Banana 2)
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
    description: "Gemini 3 Flash - fast for simple tasks"
  },
  [AI_MODELS.IMAGE_GEN]: {
    vision: true,
    text: true,
    imageGeneration: true,
    maxTokens: 65536,
    description: "Nano Banana 2 - 63% faster, double output tokens"
  },
} as const;
