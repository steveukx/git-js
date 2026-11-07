import { SimpleGitTestContext } from '../create-test-context';

export async function setUpFilesAdded(
   { git, files }: Pick<SimpleGitTestContext, 'git' | 'files'>,
   fileNames: Array<[string, string] | string>,
   addSelector: string | string[] = '.',
   message = 'Create files'
) {
   await files(...fileNames);
   await git.add(addSelector);
   await git.commit(message);
}
