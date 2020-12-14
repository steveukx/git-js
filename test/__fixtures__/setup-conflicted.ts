import { SimpleGitTestContext } from './create-test-context';

export const FIRST_BRANCH = 'first';
export const SECOND_BRANCH = 'second';

export async function setUpConflicted ({git, file}: SimpleGitTestContext) {
   await git.raw('checkout', '-b', FIRST_BRANCH);

   await file('aaa.txt', 'Some\nFile content\nhere');
   await file('bbb.txt', Array(20).join('bbb\n'));

   await git.add(`*.txt`);
   await git.commit('first commit');
   await git.raw('checkout', '-b', SECOND_BRANCH, FIRST_BRANCH);

   await file('aaa.txt', 'Different\nFile content\nhere');
   await file('ccc.txt', 'Another file');

   await git.add(`*.txt`);
   await git.commit('second commit');
}

export async function createSingleConflict ({git, file}: SimpleGitTestContext) {
   await git.checkout(FIRST_BRANCH);
   await file('aaa.txt', 'Conflicting\nFile content\nhere');

   await git.add(`aaa.txt`);
   await git.commit('move first ahead of second');

   return SECOND_BRANCH;
}
