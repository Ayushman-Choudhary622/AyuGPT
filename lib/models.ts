export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "gemini" | "groq" | "openrouter";
  providerLabel: string;
  free: boolean;
  description: string;
}

export const MODELS: AIModel[] = [
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    providerLabel: "OpenAI (Replit)",
    free: true,
    description: "Most capable general-purpose model",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    providerLabel: "OpenAI (Replit)",
    free: true,
    description: "Fast and efficient",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    providerLabel: "Google Gemini",
    free: true,
    description: "Google's latest fast model",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "gemini",
    providerLabel: "Google Gemini",
    free: true,
    description: "Multimodal, long context",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    providerLabel: "Groq",
    free: true,
    description: "Meta's Llama at lightning speed",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    provider: "groq",
    providerLabel: "Groq",
    free: true,
    description: "Ultra-fast Llama model",
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    providerLabel: "Groq",
    free: true,
    description: "Mixture of experts architecture",
  },
  {
    id: "openrouter/mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B",
    provider: "openrouter",
    providerLabel: "OpenRouter (Free)",
    free: true,
    description: "Free Mistral model via OpenRouter",
  },
  {
    id: "openrouter/meta-llama/llama-3.2-3b-instruct:free",
    name: "Llama 3.2 3B",
    provider: "openrouter",
    providerLabel: "OpenRouter (Free)",
    free: true,
    description: "Free Llama model via OpenRouter",
  },
  {
    id: "openrouter/google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    provider: "openrouter",
    providerLabel: "OpenRouter (Free)",
    free: true,
    description: "Google's Gemma, free tier",
  },
];

export const DEFAULT_MODEL = MODELS[0];

export const PROVIDER_COLORS: Record<AIModel["provider"], string> = {
  openai: "#10A37F",
  gemini: "#4285F4",
  groq: "#F55036",
  openrouter: "#8B5CF6",
};
