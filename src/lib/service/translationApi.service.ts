import fetch, { type RequestInit } from 'node-fetch';

export class TranslationApiService {
  private readonly apiKey: string;
  private readonly targetLang: string;

  constructor(apiKey: string, targetLang: string) {
    this.apiKey = apiKey;
    this.targetLang = targetLang;
  }

  // Recursively translates all values in a given object using Mistral AI API
  public async translateObject(obj: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = await this.translateText(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = await this.translateObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Calls the Mistral AI translation API, expects plain text in response
  private async translateText(text: string): Promise<string> {
    const prompt = `Переведи на язык "${this.targetLang}" без форматирования:\n${text}`;
    console.log(prompt, 'prompt');

    const requestBody = {
      model: 'mistral-small-latest',
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: 'Ты профессиональный переводчик. Переводи точно и лаконично.' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    };

    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    };

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', requestInit);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Mistral AI API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const answer = data.choices && data.choices[0]?.message?.content;
    if (!answer) {
      throw new Error('No translation received from Mistral AI API');
    }

    return answer.trim();
  }
}
