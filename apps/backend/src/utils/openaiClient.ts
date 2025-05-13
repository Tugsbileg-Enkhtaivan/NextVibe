import { OpenAI } from "openai";

let openaiInstance: OpenAI | null = null;

export const getOpenAIClient = () => {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      timeout: 30000,
    });
  }
  return openaiInstance;
};
