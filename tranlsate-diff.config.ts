import type { ITranslateDiffConfig } from './src/lib';

const config: ITranslateDiffConfig = {
  main: 'locales/ru.json',
  files: ['locales/en.json', 'locales/pl.json'],
  lang: 'ru',
  apiKey: process.env.OPENAI_API_KEY || '',
  proxy: process.env.HTTPS_PROXY || '',
};

export default config;
