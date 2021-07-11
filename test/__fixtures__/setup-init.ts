import { SimpleGit } from '../../typings';
import { SimpleGitTestContext } from './create-test-context';

export const GIT_USER_NAME = 'Simple Git Tests';
export const GIT_USER_EMAIL = 'tests@simple-git.dev';

export async function setUpInit ({git}: SimpleGitTestContext) {
   await git.raw('-c', 'init.defaultbranch=master', 'init');
   await configureGitCommitter(git);
}

async function configureGitCommitter (git: SimpleGit, name = GIT_USER_NAME, email = GIT_USER_EMAIL) {
   await git.addConfig('user.name', name);
   await git.addConfig('user.email', email);
}
