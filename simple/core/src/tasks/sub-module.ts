import type { StringTask } from '../types';
import { getTrailingOptions } from '../utils';
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

export function subModule(...args: unknown[]): StringTask<string> {
   return subModuleTask(getTrailingOptions(args));
}

export function submoduleAdd(repo: string, path: string): StringTask<string> {
   return addSubModuleTask(repo, path);
}

export function submoduleInit(...args: unknown[]): StringTask<string> {
   return initSubModuleTask(getTrailingOptions(args, 1));
}

export function submoduleUpdate(...args: unknown[]): StringTask<string> {
   return updateSubModuleTask(getTrailingOptions(args, 1));
}
