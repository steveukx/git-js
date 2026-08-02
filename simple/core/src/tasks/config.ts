import {
   type ConfigGetResult,
   type ConfigListSummary,
   configGetParser,
   configListParser,
} from '../responses/ConfigList';
import type { StringTask } from './task';

export enum GitConfigScope {
   system = 'system',
   global = 'global',
   local = 'local',
   worktree = 'worktree',
}

function asConfigScope<T extends GitConfigScope | undefined>(
   scope: GitConfigScope | unknown,
   fallback: T
): GitConfigScope | T {
   if (typeof scope === 'string' && Object.hasOwn(GitConfigScope, scope)) {
      return scope as GitConfigScope;
   }
   return fallback;
}

/**
 * Writes a key/value pair to git config - subject to the `allowConfigWrite`
 * allow-list the same as any other config write.
 */
export function addConfig(
   key: string,
   value: string,
   append = false,
   scope?: GitConfigScope | unknown
): StringTask<string> {
   const commands: string[] = ['config', `--${asConfigScope(scope, GitConfigScope.local)}`];

   if (append === true) {
      commands.push('--add');
   }

   commands.push(key, value);

   return {
      commands,
      format: 'utf-8',
      parser(text: string): string {
         return text;
      },
   };
}

export function getConfig(key: string, scope?: GitConfigScope): StringTask<ConfigGetResult> {
   const commands: string[] = ['config', '--null', '--show-origin', '--get-all', key];
   const configScope = asConfigScope(scope, undefined);

   if (configScope) {
      commands.splice(1, 0, `--${configScope}`);
   }

   return {
      commands,
      format: 'utf-8',
      parser(text) {
         return configGetParser(text, key);
      },
   };
}

export function listConfig(scope?: GitConfigScope): StringTask<ConfigListSummary> {
   const commands = ['config', '--list', '--show-origin', '--null'];
   const configScope = asConfigScope(scope, undefined);

   if (configScope) {
      commands.push(`--${configScope}`);
   }

   return {
      commands,
      format: 'utf-8',
      parser(text: string) {
         return configListParser(text);
      },
   };
}
