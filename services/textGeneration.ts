export interface TextGenerationConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface GeminiContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const callGoogleGemini = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText.substring(0, 200)}`);
  }

  const data: GeminiContentResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text.trim();
};

export const generateTextWithGemini = async (
  prompt: string,
  config: TextGenerationConfig
): Promise<string> => {
  const {
    apiKey,
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxTokens = 1024,
    systemPrompt = 'You are a concise creative writer. Provide clear, production-ready text.',
  } = config;

  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  return callGoogleGemini(apiKey, model, systemPrompt, prompt, temperature, maxTokens);
};
