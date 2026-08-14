import { pathspec } from '@simple-git/args-pathspec';

import type { OptionFlags, Options } from '../types';
import { append, filterString, filterType, getTrailingOptions } from '../utils';
import {
   configurationErrorTask,
   type EmptyTask,
   type StringTask,
   straightThroughStringTask,
} from './task';

export type CloneOptions = Options &
   OptionFlags<
      | '--bare'
      | '--dissociate'
      | '--mirror'
      | '--no-checkout'
      | '--no-remote-submodules'
      | '--no-shallow-submodules'
      | '--no-single-branch'
      | '--no-tags'
      | '--remote-submodules'
      | '--single-branch'
      | '--shallow-submodules'
      | '--verbose'
   > &
   OptionFlags<'--depth' | '-j' | '--jobs', number> &
   OptionFlags<
      | '--branch'
      | '--origin'
      | '--recurse-submodules'
      | '--separate-git-dir'
      | '--shallow-exclude'
      | '--shallow-since'
      | '--template',
      string
   >;

type CloneTaskBuilder = (
   repo: string | undefined,
   directory: string | undefined,
   customArgs: string[]
) => StringTask<string> | EmptyTask;

export const cloneTask: CloneTaskBuilder = (repo, directory, customArgs) => {
   const commands = ['clone', ...customArgs];

   filterString(repo) && commands.push(pathspec(repo));
   filterString(directory) && commands.push(pathspec(directory));

   return straightThroughStringTask(commands);
};

export const cloneMirrorTask: CloneTaskBuilder = (repo, directory, customArgs) => {
   append(customArgs, '--mirror');

   return cloneTask(repo, directory, customArgs);
};

function createCloneTask(
   api: 'clone' | 'mirror',
   task: CloneTaskBuilder,
   repoPath: unknown,
   args: unknown[]
) {
   if (!filterString(repoPath)) {
      return configurationErrorTask(`git.${api}() requires a string 'repoPath'`);
   }

   return task(
      repoPath,
      filterType(args[0], filterString),
      getTrailingOptions([repoPath, ...args])
   );
}

export function clone(repoPath: string, ...args: unknown[]): StringTask<string> | EmptyTask {
   return createCloneTask('clone', cloneTask, filterType(repoPath, filterString), args);
}

export function mirror(repoPath: string, ...args: unknown[]): StringTask<string> | EmptyTask {
   return createCloneTask('mirror', cloneMirrorTask, filterType(repoPath, filterString), args);
}
