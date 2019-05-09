import { Context } from '../interfaces/context';
import { InitResponse } from '../responses/init.response';

export async function init (context: Context, bare = false): Promise<InitResponse> {

   const args: string[] = ['init'];

   if (bare) {
      args.push('--bare');
   }

   return InitResponse.parse(await context.exec(args));
}
