import { StringTask } from '../types';
import { straightThroughStringTask } from './task';

export function addSubModuleTask(repo: string, path: string): StringTask<string> {
   return subModuleTask(['add', repo, path]);
}

export function initSubModuleTask(customArgs: string[]): StringTask<string> {
   return subModuleTask(['init', ...customArgs]);
}

export function subModuleTask(customArgs: string[]): StringTask<string> {
   const commands = [...customArgs];
   if (commands[0] !== 'submodule') {
      commands.unshift('submodule');
   }

   return straightThroughStringTask(commands);
}

export function updateSubModuleTask(customArgs: string[]): StringTask<string> {
   return subModuleTask(['update', ...customArgs]);
}
