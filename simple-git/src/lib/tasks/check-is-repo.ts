import { ExitCodes } from '../utils';
import { Maybe, StringTask } from '../types';

export enum CheckRepoActions {
   BARE = 'bare',
   IN_TREE = 'tree',
   IS_REPO_ROOT = 'root',
}

const onError: StringTask<boolean>['onError'] = ({ exitCode }, error, done, fail) => {
   if (exitCode === ExitCodes.UNCLEAN && isNotRepoMessage(error)) {
      return done(Buffer.from('false'));
   }

   fail(error);
};

const parser: StringTask<boolean>['parser'] = (text) => {
   return text.trim() === 'true';
};

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
   };
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
   };
}

export function checkIsBareRepoTask(): StringTask<boolean> {
   const commands = ['rev-parse', '--is-bare-repository'];

   return {
      commands,
      format: 'utf-8',
      onError,
      parser,
   };
}

function isNotRepoMessage(error: Error): boolean {
   return /(Not a git repository|Kein Git-Repository)/i.test(String(error));
}
