import { google } from "@ai-sdk/google";

// Get AI provider from environment variable
const provider = process.env.AI_PROVIDER || "google";

// Create model based on provider
export function getModel(modelName?: string) {
  switch (provider) {
    case "google":
      return google(modelName || "gemini-1.5-flash");
    // Add more providers here as needed
    // case "openai":
    //   return openai(modelName || "gpt-4o-mini");
    // case "anthropic":
    //   return anthropic(modelName || "claude-3-haiku");
    default:
      return google(modelName || "gemini-1.5-flash");
  }
}

// Default model instance
export const aiModel = getModel();
