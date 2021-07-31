import { ConfigListSummary, SimpleGit } from '../../../typings';
import { configListParser } from '../responses/ConfigList';
import { SimpleGitApi } from '../simple-git-api';
import { StringTask } from '../types';
import { trailingFunctionArgument } from '../utils';

export enum GitConfigScope {
   system = 'system',
   global = 'global',
   local = 'local',
   worktree = 'worktree',
}

function asConfigScope<T extends GitConfigScope | undefined>(scope: GitConfigScope | unknown, fallback: T): GitConfigScope | T {
   if (typeof scope === 'string' && GitConfigScope.hasOwnProperty(scope)) {
      return scope as GitConfigScope;
   }
   return fallback;
}

function addConfigTask(key: string, value: string, append: boolean, scope: GitConfigScope): StringTask<string> {
   const commands: string[] = ['config', `--${scope}`];

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

function listConfigTask(scope?: GitConfigScope): StringTask<ConfigListSummary> {
   const commands = ['config', '--list', '--show-origin', '--null'];

   if (scope) {
      commands.push(`--${scope}`);
   }

   return {
      commands,
      format: 'utf-8',
      parser(text: string): any {
         return configListParser(text);
      },
   }
}

export default function (): Pick<SimpleGit, 'addConfig' | 'listConfig'> {
   return {
      addConfig(this: SimpleGitApi, key: string, value: string, ...rest: unknown[]) {
         return this._runTask(
            addConfigTask(key, value, rest[0] === true, asConfigScope(rest[1], GitConfigScope.local)),
            trailingFunctionArgument(arguments),
         );
      },

      listConfig(this: SimpleGitApi, ...rest: unknown[]) {
         return this._runTask(
            listConfigTask(asConfigScope(rest[0], undefined)),
            trailingFunctionArgument(arguments),
         );
      },
   };
}
