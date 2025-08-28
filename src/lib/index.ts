import { Command } from 'commander';

export function runCli() {
  const program = new Command();
  program.description('Demo hello world CLI').action(() => {
    console.log('Hello World');
  });
  program.parse(process.argv);
}
