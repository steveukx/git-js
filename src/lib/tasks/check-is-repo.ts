import { StringTask } from './task';
import { ExitCodes, Maybe } from '../utils';

export enum CheckRepoActions {
   BARE = 'bare',
   IN_TREE = 'tree',
   IS_REPO_ROOT = 'root',
}

const onError: StringTask<boolean>['onError'] = (exitCode, stdErr, done, fail) => {
   if (exitCode === ExitCodes.UNCLEAN && isNotRepoMessage(stdErr)) {
      return done('false');
   }

   fail(stdErr);
}

const parser: StringTask<boolean>['parser'] = (text) => {
   return text.trim() === 'true';
}

export function checkIsRepoTask(action: Maybe<CheckRepoActions>): StringTask<boolean> {
   switch (action) {
      case CheckRepoActions.BARE:
         return checkIsBareRepoTask();
      case CheckRepoActions.IS_REPO_ROOT:
         return checkIsRepoRootTask();
   }

   const commands = ['rev-parse', '--is-inside-work-tree'];

   return {
      commands,
      format: 'utf-8',
      onError,
      parser,
   }
}


export function checkIsRepoRootTask(): StringTask<boolean> {
   const commands = ['rev-parse', '--git-dir'];

   return {
      commands,
      format: 'utf-8',
      onError,
      parser(path) {
         return /^\.(git)?$/.test(path.trim());
      },
   }
}


export function checkIsBareRepoTask(): StringTask<boolean> {
   const commands = ['rev-parse', '--is-bare-repository'];

   return {
      commands,
      format: 'utf-8',
      onError,
      parser,
   }
}


function isNotRepoMessage(message: string): boolean {
   return /(Not a git repository|Kein Git-Repository)/i.test(message);
}
