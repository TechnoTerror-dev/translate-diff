import type { ITranslateDiffConfig } from '../type/type.js';

export function isValidConfigUtil(config: unknown): config is ITranslateDiffConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as ITranslateDiffConfig;
  return (
    typeof c.main === 'string' &&
    Array.isArray(c.files) &&
    c.files.every((f) => typeof f === 'string') &&
    typeof c.lang === 'string' &&
    typeof c.apiKey === 'string' &&
    typeof c.proxy === 'string'
  );
}
