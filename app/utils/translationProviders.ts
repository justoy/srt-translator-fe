import axios from 'axios';

function createTranslationSystemInstruction(targetLanguage: string) {
  return `You are a translator. Translate the following subtitles to ${targetLanguage}.
Rules:
- Maintain the same tone and meaning
- Keep the [number] prefix for each line
- Translate only the text after the [number]
- Preserve line breaks
- Only respond with the translations, no explanations`;
}

function createTranslationMessages(text: string, targetLanguage: string) {
  return [
    {
      role: 'system',
      content: createTranslationSystemInstruction(targetLanguage),
    },
    {
      role: 'user',
      content: text,
    },
  ];
}

type TranslationProvider = {
  id: string;
  name: string;
  requiresApiKey: boolean;
  translate: (text: string, targetLang: string, apiKey: string) => Promise<string>;
};

// Reusable function to create providers
const createTranslationProvider = (
  id: string,
  name: string,
  apiUrl: string,
  model: string
): TranslationProvider => ({
  id,
  name,
  requiresApiKey: true,
  translate: async (text: string, targetLang: string, apiKey: string) => {
    const response = await axios.post(
      apiUrl,
      {
        model,
        messages: createTranslationMessages(text, targetLang),
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices?.[0]?.message?.content || text;
  },
});

const createGeminiTranslationProvider = (
  id: string,
  name: string,
  apiBaseUrl: string,
  model: string
): TranslationProvider => ({
  id,
  name,
  requiresApiKey: true,
  translate: async (text: string, targetLang: string, apiKey: string) => {
    const response = await axios.post(
      `${apiBaseUrl}/models/${model}:generateContent`,
      {
        systemInstruction: {
          parts: [{ text: createTranslationSystemInstruction(targetLang) }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
      },
      {
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const translatedText = response.data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join('\n');

    if (!translatedText) {
      throw new Error('Gemini response did not include translated text');
    }

    return translatedText;
  },
});

// Define providers using the reusable function
export const providers: TranslationProvider[] = [
  createTranslationProvider(
    'openai',
    'OpenAI',
    'https://api.openai.com/v1/chat/completions',
    'gpt-5.4-mini'
  ),
  createTranslationProvider(
    'deepseek',
    'DeepSeek',
    'https://api.deepseek.com/chat/completions',
    'deepseek-v4-flash'
  ),
  createGeminiTranslationProvider(
    'gemini',
    'Google Gemini',
    'https://generativelanguage.googleapis.com/v1beta',
    'gemini-3.1-flash-lite'
  ),
];

export const getProvider = (providerId: string): TranslationProvider | undefined => {
  return providers.find((p) => p.id === providerId);
};
