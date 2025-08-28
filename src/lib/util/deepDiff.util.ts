// Finds keys present in source but missing or empty in target (recursively) and returns object with such keys
export class DeepDiffUtil {
  public static findMissingOrUntranslated(
    source: Record<string, unknown>,
    target: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      if (!(key in target)) {
        result[key] = value;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        const subDiff = DeepDiffUtil.findMissingOrUntranslated(
          value as Record<string, unknown>,
          target[key] as Record<string, unknown>,
        );
        if (Object.keys(subDiff).length > 0) {
          result[key] = subDiff;
        }
      } else if (
        typeof value === 'string' &&
        (typeof target[key] !== 'string' || target[key] === '')
      ) {
        // Untranslated or empty string
        result[key] = value;
      }
    }

    return result;
  }

  // Deeply merges new data into target (does not mutate, returns new object)
  public static deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (
        key in target &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        typeof value === 'object' &&
        value !== null
      ) {
        result[key] = DeepDiffUtil.deepMerge(
          target[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
