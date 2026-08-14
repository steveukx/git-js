import type {
   PushResultRemoteMessages,
   RemoteMessageResult,
} from '../parsers/parse-remote-messages';
import { filterString, filterType, getTrailingOptions } from '../utils';

export interface PushResultPushedItem {
   local: string;
   remote: string;

   readonly deleted: boolean;
   readonly tag: boolean;
   readonly branch: boolean;
   readonly new: boolean;
   readonly alreadyUpdated: boolean;
}

export interface PushResultBranchUpdate {
   head: {
      local: string;
      remote: string;
   };
   hash: {
      from: string;
      to: string;
   };
}

export interface PushDetail {
   repo?: string;
   ref?: {
      local: string;
   };
   pushed: PushResultPushedItem[];
   branch?: {
      local: string;
      remote: string;
      remoteName: string;
   };
   update?: PushResultBranchUpdate;
}

export interface PushResult extends PushDetail, RemoteMessageResult<PushResultRemoteMessages> {}

import { parsePushResult as parser } from '../parsers/parse-push';
import type { StringTask } from '../types';
import { append, remove } from '../utils';

type PushRef = { remote?: string; branch?: string };

export function pushTagsTask(
   ref: PushRef | undefined = {},
   customArgs: string[]
): StringTask<PushResult> {
   append(customArgs, '--tags');
   return pushTask(ref, customArgs);
}

export function pushTask(
   ref: PushRef | undefined = {},
   customArgs: string[]
): StringTask<PushResult> {
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

export function push(...args: unknown[]): StringTask<PushResult> {
   return pushTask(
      {
         remote: filterType(args[0], filterString),
         branch: filterType(args[1], filterString),
      },
      getTrailingOptions(args)
   );
}

export function pushTags(...args: unknown[]): StringTask<PushResult> {
   return pushTagsTask({ remote: filterType(args[0], filterString) }, getTrailingOptions(args));
}
