const config = {
  main: 'locales/ru.json',
  files: ['locales/en.json', 'locales/pl.json'],
  lang: 'ru',
  apiKey: process.env.MISTRAL_API || '',
};

export default config;
