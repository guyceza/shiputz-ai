/**
 * AI Model Configuration
 * 
 * כל שמות המודלים במקום אחד!
 * אם גוגל משנים שמות - מעדכנים רק פה.
 * 
 * Last updated: 2026-02-23
 * Docs: https://ai.google.dev/models/gemini
 */

export const AI_MODELS = {
  // For text + vision tasks (receipt scanning, quote analysis, etc.)
  VISION_PRO: "gemini-2.5-pro",
  
  // For fast text tasks (chat support, simple Q&A)
  TEXT_FAST: "gemini-2.5-flash",
  
  // For image generation (visualize rooms)
  IMAGE_GEN: "gemini-2.0-flash",
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
    maxTokens: 8192,
    description: "Best for complex vision tasks"
  },
  [AI_MODELS.TEXT_FAST]: {
    vision: true,
    text: true,
    maxTokens: 8192,
    description: "Fast and cheap for simple tasks"
  },
  [AI_MODELS.IMAGE_GEN]: {
    vision: true,
    text: true,
    imageGeneration: true,
    maxTokens: 8192,
    description: "Experimental - can generate images"
  },
} as const;
