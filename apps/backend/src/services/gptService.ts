import { getOpenAIClient } from "../utils/openaiClient";

export const getGPTRecommendations = async (prompt: string) => {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return response.choices?.[0]?.message?.content || "";
};
