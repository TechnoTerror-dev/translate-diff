import type { ITranslateDiffConfig } from '../type/type.js';
import { DeepDiffUtil } from '../util/deepDiff.util.js';
import { FileUtil } from '../util/file.util.js';
import { TranslationApiService } from './translationApi.service.js';

export class TranslateDiffService {
  // Main interaction: finds and translates missing keys
  public async process(config: ITranslateDiffConfig): Promise<void> {
    const baseJson = await FileUtil.readJson(config.main);

    // Create API service instances for each language to avoid recreating them
    const apiServices = new Map<string, TranslationApiService>();

    // First, collect all languages to create API services
    const fileLanguages = new Map<string, string>();
    for (const filePath of config.files) {
      const language = this.extractLanguageFromFilename(filePath);
      fileLanguages.set(filePath, language);

      if (!apiServices.has(language)) {
        apiServices.set(language, new TranslationApiService(config.apiKey, language));
      }
    }

    // Process files and group translation requests by language
    const translationPromises: Array<
      Promise<{ filePath: string; translated: Record<string, string> }>
    > = [];

    for (const filePath of config.files) {
      const targetJson = await FileUtil.readJson(filePath);
      const language = fileLanguages.get(filePath)!;

      // Find missing or untranslated keys
      const missingEntries = DeepDiffUtil.findMissingOrUntranslated(baseJson, targetJson);

      if (Object.keys(missingEntries).length === 0) {
        console.log(`[${filePath}]: No missing keys.`);
        continue;
      }

      // Get API service for this language
      const apiService = apiServices.get(language)!;

      // Add translation promise to the batch with proper type casting
      translationPromises.push(
        apiService
          .translateObject(missingEntries)
          .then((translated) => ({
            filePath,
            translated: translated as Record<string, string>,
          }))
          .catch((error) => {
            console.error(`Translation failed for ${filePath}:`, error);
            throw error;
          }),
      );
    }

    // Wait for all translations to complete
    const translationResults = await Promise.all(translationPromises);

    // Apply translations to files
    for (const result of translationResults) {
      const { filePath, translated } = result;
      const targetJson = await FileUtil.readJson(filePath);
      const language = fileLanguages.get(filePath)!;

      // Merge existing with new
      const merged = DeepDiffUtil.deepMerge(targetJson, translated);

      await FileUtil.writeJson(filePath, merged);
      console.log(
        `[${filePath}]: Added ${Object.keys(translated).length} missing keys in language: ${language}`,
      );
    }
  }

  // Extract language code from filename
  private extractLanguageFromFilename(filePath: string): string {
    const filename = filePath.split('/').pop() || '';
    const languageCode = filename.replace('.json', '');

    if (!languageCode) {
      throw new Error(`Could not extract language from filename: ${filePath}`);
    }

    return languageCode;
  }
}
