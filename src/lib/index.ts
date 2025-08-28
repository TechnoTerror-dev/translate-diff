import { Command } from 'commander';
import { existsSync } from 'fs';
import * as path from 'path';
import { TranslateDiffService } from './service/translateDiff.service.js';
import type { ITranslateDiffConfig } from './type/type.js';
import { isValidConfigUtil } from './util/isValidConfig.util.js';

export async function runCli(): Promise<void> {
  const program = new Command();
  program
    .description('Translate missing keys in localization files')
    .option('-m, --main <main>', 'Path to main (base/etalon) locale file')
    .option('-f, --files <files...>', 'Paths to files to translate')
    .option('-l, --lang <lang>', 'Base language')
    .option('-k, --api-key <apiKey>', 'OpenAI API key')
    .option(
      '-c, --config <config>',
      'Path to config file. If not provided, will look for translate-diff.config.js in project root',
    );

  program.action(async (options) => {
    let config: ITranslateDiffConfig;

    // Попробуем найти конфиг файл автоматически
    let configPath: string;

    if (options.config) {
      // Если путь указан явно
      configPath = path.resolve(process.cwd(), options.config);
    } else {
      // Ищем стандартные имена конфиг файлов
      const possibleConfigNames = [
        'translate-diff.config.js',
        'translate-diff.config.mjs',
        'translate-diff.config.cjs',
        'translate-diff.config.json',
        '.translate-diff.js',
        '.translate-diff.mjs',
        '.translate-diff.cjs',
        '.translate-diff.json',
      ];

      configPath = '';
      for (const configName of possibleConfigNames) {
        const testPath = path.resolve(process.cwd(), configName);
        if (existsSync(testPath)) {
          configPath = testPath;
          break;
        }
      }

      if (!configPath) {
        console.error(
          'Error: No config file found. Please create a config file or specify with -c option.',
        );
        console.error('Expected config files:');
        possibleConfigNames.forEach((name) => console.error(`  - ${name}`));
        process.exit(1);
      }
    }

    console.log(`Using config: ${configPath}`);

    if (!existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }

    try {
      let configModule;
      if (configPath.endsWith('.json')) {
        // Для JSON файлов используем readFileSync
        const fs = await import('fs/promises');
        const jsonContent = await fs.readFile(configPath, 'utf-8');
        configModule = JSON.parse(jsonContent);
      } else {
        // Для JS файлов
        configModule = await import(configPath);
      }

      config = configModule.default || configModule;

      console.log('Loaded config:', config);

      if (!isValidConfigUtil(config)) {
        console.error('Invalid config structure');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      process.exit(1);
    }

    const service = new TranslateDiffService();
    await service.process(config);
    console.log('Translation completed successfully');
  });

  await program.parseAsync(process.argv);
}

export type { ITranslateDiffConfig } from './type/type.js';
