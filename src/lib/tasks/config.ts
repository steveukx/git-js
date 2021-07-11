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

function asConfigScope(scope: GitConfigScope | unknown): GitConfigScope {
   if (typeof scope === 'string' && GitConfigScope.hasOwnProperty(scope)) {
      return scope as GitConfigScope;
   }
   return GitConfigScope.local;
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

function listConfigTask(): StringTask<ConfigListSummary> {
   return {
      commands: ['config', '--list', '--show-origin', '--null'],
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
            addConfigTask(key, value, rest[0] === true, asConfigScope(rest[1])),
            trailingFunctionArgument(arguments),
         );
      },

      listConfig(this: SimpleGitApi) {
         return this._runTask(
            listConfigTask(),
            trailingFunctionArgument(arguments),
         );
      },
   };
}
