import { configurationErrorTask, EmptyTask, straightThroughStringTask } from './task';
import { OptionFlags, Options, StringTask } from '../types';
import { append, filterString } from '../utils';

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

function disallowedCommand(command: string) {
   return /^--upload-pack(=|$)/.test(command);
}

export function cloneTask(
   repo: string | undefined,
   directory: string | undefined,
   customArgs: string[]
): StringTask<string> | EmptyTask {
   const commands = ['clone', ...customArgs];

   filterString(repo) && commands.push(repo);
   filterString(directory) && commands.push(directory);

   const banned = commands.find(disallowedCommand);
   if (banned) {
      return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
   }

   return straightThroughStringTask(commands);
}

export function cloneMirrorTask(
   repo: string | undefined,
   directory: string | undefined,
   customArgs: string[]
) {
   append(customArgs, '--mirror');

   return cloneTask(repo, directory, customArgs);
}
