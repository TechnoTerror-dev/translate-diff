import { Command } from 'commander';
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
    .option('-p, --proxy <proxy>', 'HTTPS proxy URL')
    .option(
      '-c, --config <config>',
      'Path to config file. If options are set, they override config.',
    );

  program.action(async (options) => {
    let config: ITranslateDiffConfig | null = null;

    if (options.main && options.files && options.lang && options.apiKey && options.proxy) {
      config = {
        main: options.main,
        files: options.files,
        lang: options.lang,
        apiKey: options.apiKey,
        proxy: options.proxy,
      };
    } else if (options.config) {
      const configPath = path.resolve(process.cwd(), options.config);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const loadedConfig = require(configPath).default;
      if (!isValidConfigUtil(loadedConfig)) {
        console.error('Error: loaded config is invalid by type signature');
        process.exit(1);
      }
      config = loadedConfig;
    }

    if (!config || !isValidConfigUtil(config)) {
      console.error(
        'Error: insufficient or invalid parameters. Provide all required options (including proxy) or a valid config file.',
      );
      process.exit(1);
    }

    const service = new TranslateDiffService();
    await service.process(config);

    console.log('Translation diff processed successfully.');
  });
  await program.parseAsync(process.argv);
}

export type { ITranslateDiffConfig } from './type/type.js';
