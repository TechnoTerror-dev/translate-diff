import type { ITranslateDiffConfig } from '../type/type.js';
import { DeepDiffUtil } from '../util/deepDiff.util.js';
import { FileUtil } from '../util/file.util.js';
import { TranslationApiService } from './translationApi.service.js';

export class TranslateDiffService {
  // Main interaction: finds and translates missing keys
  public async process(config: ITranslateDiffConfig): Promise<void> {
    const baseJson = await FileUtil.readJson(config.main);

    for (const filePath of config.files) {
      const targetJson = await FileUtil.readJson(filePath);

      // Extract language from filename (e.g., "en-US.json" -> "en-US")
      const language = this.extractLanguageFromFilename(filePath);

      // Find missing or untranslated keys
      const missingEntries = DeepDiffUtil.findMissingOrUntranslated(baseJson, targetJson);

      if (Object.keys(missingEntries).length === 0) {
        console.log(`[${filePath}]: No missing keys.`);
        continue;
      }

      // Translate missing values to the specific language
      const apiService = new TranslationApiService(config.apiKey, language);
      const translated = await apiService.translateObject(missingEntries);

      // Merge existing with new
      const merged = DeepDiffUtil.deepMerge(targetJson, translated);

      await FileUtil.writeJson(filePath, merged);
      console.log(
        `[${filePath}]: Added ${Object.keys(missingEntries).length} missing keys in language: ${language}`,
      );
    }
  }

  // Extract language code from filename
  private extractLanguageFromFilename(filePath: string): string {
    const filename = filePath.split('/').pop() || ''; // Get filename with extension
    const languageCode = filename.replace('.json', ''); // Remove .json extension

    if (!languageCode) {
      throw new Error(`Could not extract language from filename: ${filePath}`);
    }

    return languageCode;
  }
}
