import { configurationErrorTask, EmptyTask, straightThroughStringTask } from './task';
import { OptionFlags, Options, StringTask } from '../types';
import { append, filterString, filterType, getTrailingOptions, trailingFunctionArgument } from '../utils';
import { pathspec } from '../args/pathspec';
import { SimpleGit } from '../../../typings';
import { SimpleGitApi } from '../simple-git-api';

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

type CloneTaskBuilder = (repo: string | undefined,
                         directory: string | undefined,
                         customArgs: string[]) => StringTask<string> | EmptyTask;

export const cloneTask: CloneTaskBuilder = (
   repo,
   directory,
   customArgs,
) => {
   const commands = ['clone', ...customArgs];

   filterString(repo) && commands.push(pathspec(repo));
   filterString(directory) && commands.push(pathspec(directory));

   return straightThroughStringTask(commands);
};

export const cloneMirrorTask: CloneTaskBuilder = (
   repo,
   directory,
   customArgs,
)=> {
   append(customArgs, '--mirror');

   return cloneTask(repo, directory, customArgs);
}

function createCloneTask(api: 'clone' | 'mirror', task: CloneTaskBuilder, repoPath: string | undefined, ...args: unknown[]) {
   if (!filterString(repoPath)) {
      return configurationErrorTask(`git.${api}() requires a string 'repoPath'`);
   }

   return task(repoPath, filterType(args[0], filterString), getTrailingOptions(arguments));
}


export default function(): Pick<SimpleGit, 'clone' | 'mirror'> {

   return {
      clone(this: SimpleGitApi, repo: string | unknown, ...rest: unknown[]) {
         return this._runTask(
            createCloneTask('clone', cloneTask, filterType(repo, filterString), ...rest),
            trailingFunctionArgument(arguments)
         );
      },
      mirror(this: SimpleGitApi, repo: string | unknown, ...rest: unknown[]) {
         return this._runTask(
            createCloneTask('mirror', cloneMirrorTask, filterType(repo, filterString), ...rest),
            trailingFunctionArgument(arguments)
         );
      }
   };
}
