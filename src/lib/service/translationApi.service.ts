import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { type RequestInit } from 'node-fetch';

export class TranslationApiService {
  private readonly apiKey: string;
  private readonly proxy: string;
  private readonly targetLang: string;

  constructor(apiKey: string, proxy: string, targetLang: string) {
    this.apiKey = apiKey;
    this.proxy = proxy;
    this.targetLang = targetLang;
  }

  // Recursively translates all values in a given object using OpenAI API
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

  // Calls the OpenAI translation API, expects plain text in response
  private async translateText(text: string): Promise<string> {
    const prompt = `Переведи на язык "${this.targetLang}" без форматирования:\n${text}`;
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Ты переводчик.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    };

    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      agent: this.proxy ? new HttpsProxyAgent(this.proxy) : undefined,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', requestInit);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = data.choices && data.choices[0]?.message?.content;
    if (!answer) {
      throw new Error('No translation received from OpenAI API');
    }

    return answer.trim();
  }
}
