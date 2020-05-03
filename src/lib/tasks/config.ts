import { StringTask } from './task';
import { configListParser, ConfigListSummary } from '../responses/ConfigList';

export function addConfigTask (key: string, value: string, append = false): StringTask<string> {
   const commands: string[] = ['config', '--local'];

   if (append) {
      commands.push('--add');
   }

   commands.push(key, value);

   return {
      commands,
      format: 'utf-8',
      parser(text: string): string {
         return text;
      }
   }
}

export function listConfigTask (): StringTask<ConfigListSummary> {
   return {
      commands: ['config', '--list', '--show-origin', '--null'],
      format: 'utf-8',
      parser(text: string): any {
         return configListParser(text);
      },
   }
}
