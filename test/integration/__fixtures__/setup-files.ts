import { SimpleGitTestContext } from './create-test-context';

export async function setUpFilesAdded(
   {git, files}: SimpleGitTestContext,
   fileNames: string[],
   addSelector: string | string[] = '.',
   message = 'Create files'
) {
   await files(...fileNames);
   await git.add(addSelector);
   await git.commit(message);
}
