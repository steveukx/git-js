import { SimpleGitTestContext } from '../create-test-context';

export async function setUpIgnored({ git, file }: SimpleGitTestContext, paths: string[] = [], filename = '.gitignore') {
   await file(filename, paths.join('\n') + '\n');

   await git.add(filename);
   await git.commit(`setUpIgnored: ${filename}`);
}

