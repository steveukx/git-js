import { PushResult } from '../../../typings';
import { parsePushResult as parser } from '../parsers/parse-push';
import { StringTask } from '../types';
import { append, remove } from '../utils';

type PushRef = { remote?: string; branch?: string };

export function pushTagsTask(ref: PushRef = {}, customArgs: string[]): StringTask<PushResult> {
   append(customArgs, '--tags');
   return pushTask(ref, customArgs);
}

export function pushTask(ref: PushRef = {}, customArgs: string[]): StringTask<PushResult> {
   const commands = ['push', ...customArgs];
   if (ref.branch) {
      commands.splice(1, 0, ref.branch);
   }
   if (ref.remote) {
      commands.splice(1, 0, ref.remote);
   }

   remove(commands, '-v');
   append(commands, '--verbose');
   append(commands, '--porcelain');

   return {
      commands,
      format: 'utf-8',
      parser,
   };
}
