import { Context } from '../interfaces/context';
import { AddResponse } from '../responses';

/*
 * TODO:
 * This command currently passes the files through to the git binary
 * directly. A richer experience would be possible by first running a
 * 'dry-run' to see which files would be added by running
 *
 * ```
 * addFileRE = /^add\s['"](.+)['"]$/;
 *
 * testedFiles = (await context.exec(['add', '-n', '--ignore-missing', ...files]))
 *                .trim()
 *                .split('\n')
 *                .map(line => line.trim());
 *
 * addFiles = testedFiles
 *                .filter(line => addFileRE.test(line))
 *                .map(line => addFileRE.exec(line)[1]);
 *
 * failFiles = xand(files, testedFiles);
 *
 * //
 * return AddResponse.parse(
 *          await context.exec(['add', ...addedFiles],
 *          failFiles
 *        )
 */
export async function add (context: Context, files: string[]) {

   return AddResponse.parse(await context.exec(
      ['add', '-v', ...files]
   ));

}
