import { SimpleGitTestContext } from './types';

export const GIT_USER_NAME = 'Simple Git Tests';
export const GIT_USER_EMAIL = 'tests@simple-git.dev';

export async function initRepo({git}: SimpleGitTestContext, name = GIT_USER_NAME, email = GIT_USER_EMAIL) {
   await git.raw('-c', 'init.defaultbranch=master', 'init');
   await git.raw('config', '--local', 'user.name', name);
   await git.raw('config', '--local', 'user.email', email);
}
