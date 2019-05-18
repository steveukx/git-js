import { Context } from '../interfaces/context';
import { ApiOptions } from '../interfaces/api-options';
import { optionsToCommandArray } from '../util/options';
import { RemoteResponse } from '../responses/remote.response';

export async function addRemote(context: Context, remoteName: string, remoteRepo: string) {

   return await context.exec(
      ['remote', 'add', remoteName, remoteRepo]
   );

}

export async function getRemotes(context: Context, verbose: boolean): Promise<RemoteResponse[]> {

   const command = ['remote'];
   if (verbose) {
      command.push('-v');
   }

   return RemoteResponse.parse(await context.exec(command), verbose);

}

export async function remote(context: Context, options: ApiOptions) {

   return await context.exec(
      ['remote', ...optionsToCommandArray(options)]
   );

}

export async function removeRemote(context: Context, remoteName: string) {

   return await context.exec(
      ['remote', 'remove', remoteName]
   );

}
