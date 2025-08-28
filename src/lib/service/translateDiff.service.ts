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

      // Find missing or untranslated keys
      const missingEntries = DeepDiffUtil.findMissingOrUntranslated(baseJson, targetJson);

      if (Object.keys(missingEntries).length === 0) {
        console.log(`[${filePath}]: No missing keys.`);
        continue;
      }

      // Translate all missing values
      const apiService = new TranslationApiService(config.apiKey, config.proxy, config.lang);
      const translated = await apiService.translateObject(missingEntries);

      // Merge existing with new
      const merged = DeepDiffUtil.deepMerge(targetJson, translated);

      await FileUtil.writeJson(filePath, merged);
      console.log(`[${filePath}]: Added ${Object.keys(missingEntries).length} missing keys.`);
    }
  }
}
