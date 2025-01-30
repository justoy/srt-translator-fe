import axios from 'axios';

function createTranslationMessages(text: string, targetLanguage: string) {
  return [
    {
      role: 'system',
      content: `You are a translator. Translate the following subtitles to ${targetLanguage}.
Rules:
- Maintain the same tone and meaning
- Keep the [number] prefix for each line
- Translate only the text after the [number]
- Preserve line breaks
- Only respond with the translations, no explanations`,
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

// Define providers using the reusable function
export const providers: TranslationProvider[] = [
  createTranslationProvider(
    'openai',
    'OpenAI',
    'https://api.openai.com/v1/chat/completions',
    'gpt-4o-mini'
  ),
  createTranslationProvider(
    'deepseek',
    'DeepSeek',
    'https://api.deepseek.com/chat/completions',
    'deepseek-chat'
  ),
];

export const getProvider = (providerId: string): TranslationProvider | undefined => {
  return providers.find((p) => p.id === providerId);
};
