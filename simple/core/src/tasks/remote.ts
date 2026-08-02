import {
   parseGetRemotes,
   parseGetRemotesVerbose,
   type RemoteWithoutRefs,
   type RemoteWithRefs,
} from '../responses/GetRemoteSummary';
import type { StringTask } from '../types';
import { getTrailingOptions } from '../utils';
import { straightThroughStringTask } from './task';

export function addRemoteTask(
   remoteName: string,
   remoteRepo: string,
   customArgs: string[]
): StringTask<string> {
   return straightThroughStringTask(['remote', 'add', ...customArgs, remoteName, remoteRepo]);
}

export function getRemotesTask(verbose: true): StringTask<RemoteWithRefs[]>;
export function getRemotesTask(verbose: false): StringTask<RemoteWithoutRefs[]>;
export function getRemotesTask(
   verbose: boolean
): StringTask<RemoteWithRefs[] | RemoteWithoutRefs[]> {
   const commands = ['remote'];
   if (verbose) {
      commands.push('-v');
   }

   return {
      commands,
      format: 'utf-8',
      parser: verbose ? parseGetRemotesVerbose : parseGetRemotes,
   };
}

export function listRemotesTask(customArgs: string[]): StringTask<string> {
   const commands = [...customArgs];
   if (commands[0] !== 'ls-remote') {
      commands.unshift('ls-remote');
   }

   return straightThroughStringTask(commands);
}

export function remoteTask(customArgs: string[]): StringTask<string> {
   const commands = [...customArgs];
   if (commands[0] !== 'remote') {
      commands.unshift('remote');
   }

   return straightThroughStringTask(commands);
}

export function removeRemoteTask(remoteName: string): StringTask<string> {
   return straightThroughStringTask(['remote', 'remove', remoteName]);
}

export function addRemote(
   remoteName: string,
   remoteRepo: string,
   ...args: unknown[]
): StringTask<string> {
   return addRemoteTask(
      remoteName,
      remoteRepo,
      getTrailingOptions([remoteName, remoteRepo, ...args])
   );
}

export function removeRemote(remoteName: string): StringTask<string> {
   return removeRemoteTask(remoteName);
}

export function getRemotes(
   verbose?: boolean
): StringTask<RemoteWithoutRefs[]> | StringTask<RemoteWithRefs[]> {
   return verbose === true ? getRemotesTask(true) : getRemotesTask(false);
}

export function remote(...args: unknown[]): StringTask<string> {
   return remoteTask(getTrailingOptions(args));
}

export function listRemote(...args: unknown[]): StringTask<string> {
   return listRemotesTask(getTrailingOptions(args));
}
