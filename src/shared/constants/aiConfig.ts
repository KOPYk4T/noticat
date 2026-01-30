export const GROQ_CONFIG = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  maxTokens: 150,
} as const;

export const GEMINI_CONFIG = {
  model: "gemini-2.0-flash-exp",
  temperature: 0.3,
  maxTokens: 150,
} as const;
