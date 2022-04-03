import { SimpleGitTestContext } from './types';

export async function filesAdded(
   {files, git}: SimpleGitTestContext,
   fileNames: string[],
   addSelector: string | string[] = '.',
   message = 'Create files'
) {
   const add = Array.isArray(addSelector) ? addSelector : [addSelector];

   await files(...fileNames);
   await git.raw('add', ...add);
   await git.raw('commit', '-m', message);
}
